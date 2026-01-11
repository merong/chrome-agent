// background/service-worker.js
let socket = null;
let keepAliveInterval = null;
let sessionId = null;

// 확장 프로그램 설치/업데이트 시 기본 설정 초기화
chrome.runtime.onInstalled.addListener(async (details) => {
  const defaults = {
    serverUrl: 'ws://localhost:8080/ws',
    autoConnect: false,
    commandHistory: []
  };

  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const merged = { ...defaults };
  Object.keys(existing).forEach(key => {
    if (existing[key] !== undefined) merged[key] = existing[key];
  });
  await chrome.storage.local.set(merged);
  console.log('Chrome Agent: Settings initialized', merged);
});

// 브라우저 시작 시 자동 연결
chrome.runtime.onStartup.addListener(async () => {
  const { autoConnect, serverUrl } = await chrome.storage.local.get(['autoConnect', 'serverUrl']);
  if (autoConnect && serverUrl) {
    console.log('Chrome Agent: Auto-connecting to', serverUrl);
    connectWebSocket(serverUrl);
  }
});

// 확장 아이콘 클릭 시 Side Panel 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONNECT_SERVER') {
    connectWebSocket(message.url);
    sendResponse({ status: 'connecting' });
  } else if (message.type === 'DISCONNECT_SERVER') {
    disconnectWebSocket();
    sendResponse({ status: 'disconnected' });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: socket !== null && socket.readyState === WebSocket.OPEN,
      sessionId: sessionId
    });
  } else if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get('commandHistory', (result) => {
      sendResponse({ history: result.commandHistory || [] });
    });
    return true; // 비동기 응답
  } else if (message.type === 'CLEAR_HISTORY') {
    chrome.storage.local.set({ commandHistory: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  return true;
});

function connectWebSocket(url) {
  if (socket) {
    socket.close();
  }

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'connected' });
      
      // Send CONNECT message
      const msg = {
        type: 'CONNECT',
        source: 'extension',
        target: 'server',
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(msg));

      // Keep Alive
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'HEARTBEAT' }));
        }
      }, 10000);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('Received:', msg);
      handleServerMessage(msg);
    };

    socket.onclose = () => {
      console.log('WebSocket Closed');
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'disconnected' });
      socket = null;
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error', error);
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'error' });
    };

  } catch (e) {
    console.error('Connection Failed', e);
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'error' });
  }
}

function disconnectWebSocket() {
  if (socket) {
    socket.close();
  }
}

function handleServerMessage(msg) {
  console.log('[MESSAGE] Received from server:', {
    type: msg.type,
    messageId: msg.messageId,
    requestId: msg.requestId,
    sessionId: msg.sessionId
  });

  if (msg.type === 'CONNECT_ACK') {
    sessionId = msg.sessionId;
    console.log('[CONNECT_ACK] Session established:', sessionId);
    notifySidePanel('SESSION_UPDATE', { sessionId });

  } else if (msg.type === 'COMMAND') {
    const command = msg.payload?.command;
    const params = msg.payload?.params;

    console.log('[COMMAND] Received:', {
      command,
      messageId: msg.messageId,
      requestId: msg.requestId,
      params: JSON.stringify(params)
    });

    // 명령 히스토리 저장
    saveCommandToHistory(msg);

    switch (command) {
      case 'EXTRACT_COOKIES':
        console.log('[COMMAND] Routing to: handleExtractCookies');
        handleExtractCookies(msg);
        break;
      case 'EXTRACT_DOM':
        console.log('[COMMAND] Routing to: handleContentScriptCommand (EXTRACT_DOM)');
        handleContentScriptCommand(msg);
        break;
      case 'EXTRACT_FORM':
        console.log('[COMMAND] Routing to: handleContentScriptCommand (EXTRACT_FORM)');
        handleContentScriptCommand(msg);
        break;
      case 'GET_PAGE_INFO':
        console.log('[COMMAND] Routing to: handleContentScriptCommand (GET_PAGE_INFO)');
        handleContentScriptCommand(msg);
        break;
      default:
        console.error('[COMMAND] Unknown command:', command);
        sendErrorResponse(msg, 'UNKNOWN_COMMAND', `Unknown command: ${command}`);
    }

  } else if (msg.type === 'STATUS') {
    console.log('[STATUS] Server status update:', msg.payload);
    notifySidePanel('SERVER_STATUS', msg.payload);

  } else if (msg.type === 'HEARTBEAT') {
    // Heartbeat 응답은 로깅하지 않음 (너무 빈번함)

  } else {
    console.warn('[MESSAGE] Unhandled message type:', msg.type);
  }
}

function handleExtractCookies(msg) {
  const params = msg.payload.params || {};
  const details = {};
  if (params.domain) details.domain = params.domain;

  console.log('[EXTRACT_COOKIES] Starting cookie extraction:', {
    domain: params.domain || '(all domains)',
    requestId: msg.requestId || msg.messageId
  });

  chrome.cookies.getAll(details, (cookies) => {
    if (chrome.runtime.lastError) {
      console.error('[EXTRACT_COOKIES] Chrome API error:', chrome.runtime.lastError);
      sendErrorResponse(msg, 'COOKIE_ERROR', chrome.runtime.lastError.message);
      return;
    }

    console.log('[EXTRACT_COOKIES] Cookies retrieved:', {
      count: cookies.length,
      domains: [...new Set(cookies.map(c => c.domain))].slice(0, 5)
    });

    const data = { cookies: cookies, count: cookies.length };
    sendSuccessResponse(msg, data);

    // Side Panel에 결과 알림
    notifySidePanel('COMMAND_RESULT', {
      requestId: msg.requestId || msg.messageId,
      command: 'EXTRACT_COOKIES',
      success: true,
      data: data
    });
  });
}

// Content Script로 명령 전달 (EXTRACT_DOM, EXTRACT_FORM, GET_PAGE_INFO)
function handleContentScriptCommand(msg) {
  const command = msg.payload?.command;
  const params = msg.payload?.params;

  console.log('[CONTENT_SCRIPT] Starting command execution:', {
    command,
    params: JSON.stringify(params),
    requestId: msg.requestId || msg.messageId
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('[CONTENT_SCRIPT] Tab query error:', chrome.runtime.lastError);
      sendErrorResponse(msg, 'TAB_QUERY_ERROR', chrome.runtime.lastError.message);
      return;
    }

    if (tabs.length === 0) {
      console.error('[CONTENT_SCRIPT] No active tab found');
      sendErrorResponse(msg, 'NO_ACTIVE_TAB', 'No active tab found');
      return;
    }

    const activeTab = tabs[0];
    console.log('[CONTENT_SCRIPT] Active tab found:', {
      tabId: activeTab.id,
      url: activeTab.url,
      title: activeTab.title?.substring(0, 50)
    });

    // Content Script로 메시지 전송
    console.log('[CONTENT_SCRIPT] Sending message to content script...');

    chrome.tabs.sendMessage(activeTab.id, {
      type: 'EXECUTE_COMMAND',
      command: msg.payload
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[CONTENT_SCRIPT] Communication error:', chrome.runtime.lastError);

        // Content script가 로드되지 않았을 수 있음
        if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
          sendErrorResponse(msg, 'CONTENT_SCRIPT_NOT_LOADED',
            'Content script not loaded. Please refresh the page.');
        } else {
          sendErrorResponse(msg, 'CONTENT_SCRIPT_ERROR', chrome.runtime.lastError.message);
        }
        return;
      }

      // 응답 검증
      if (!response) {
        console.error('[CONTENT_SCRIPT] Empty response from content script');
        sendErrorResponse(msg, 'EMPTY_RESPONSE', 'Content script returned empty response');
        return;
      }

      // 에러 응답 체크
      if (response.error) {
        console.error('[CONTENT_SCRIPT] Command execution error:', response);
        sendErrorResponse(msg, response.error, response.message || 'Command execution failed');
        return;
      }

      console.log('[CONTENT_SCRIPT] Command executed successfully:', {
        command,
        responseKeys: Object.keys(response)
      });

      sendSuccessResponse(msg, response);

      // Side Panel에 결과 알림
      notifySidePanel('COMMAND_RESULT', {
        requestId: msg.requestId || msg.messageId,
        command: command,
        success: true,
        data: response
      });
    });
  });
}

// 성공 응답 전송
function sendSuccessResponse(originalMsg, data) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[RESPONSE] WebSocket not connected, cannot send response');
    return;
  }

  // 서버가 보낸 requestId 사용 (원래 CHAT 요청의 ID)
  // 없으면 messageId를 폴백으로 사용
  const requestId = originalMsg.requestId || originalMsg.messageId;

  console.log('[RESPONSE] Sending success response:', {
    requestId,
    command: originalMsg.payload?.command,
    dataKeys: Object.keys(data || {})
  });

  const response = {
    messageId: crypto.randomUUID(),
    type: 'RESPONSE',
    source: 'extension',
    target: 'agent',
    requestId: requestId,
    timestamp: new Date().toISOString(),
    payload: {
      success: true,
      data: data
    }
  };
  socket.send(JSON.stringify(response));

  console.log('[RESPONSE] Success response sent');

  // 히스토리에 결과 업데이트
  updateHistoryResult(originalMsg.messageId, { success: true, data });
}

// 에러 응답 전송
function sendErrorResponse(originalMsg, code, errorMessage) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[RESPONSE] WebSocket not connected, cannot send error response');
    return;
  }

  // 서버가 보낸 requestId 사용 (원래 CHAT 요청의 ID)
  const requestId = originalMsg.requestId || originalMsg.messageId;

  console.error('[RESPONSE] Sending error response:', {
    requestId,
    command: originalMsg.payload?.command,
    errorCode: code,
    errorMessage
  });

  const response = {
    messageId: crypto.randomUUID(),
    type: 'RESPONSE',
    source: 'extension',
    target: 'agent',
    requestId: requestId,
    timestamp: new Date().toISOString(),
    payload: {
      success: false,
      error: { code, message: errorMessage }
    }
  };
  socket.send(JSON.stringify(response));

  console.log('[RESPONSE] Error response sent');

  // Side Panel에 에러 알림
  notifySidePanel('COMMAND_RESULT', {
    requestId: requestId,
    command: originalMsg.payload?.command,
    success: false,
    error: { code, message: errorMessage }
  });

  // 히스토리에 결과 업데이트
  updateHistoryResult(originalMsg.messageId, { success: false, error: { code, message: errorMessage } });
}

// Side Panel에 메시지 전송
function notifySidePanel(type, data) {
  chrome.runtime.sendMessage({ type, ...data }).catch(() => {
    // Side Panel이 열려있지 않으면 무시
  });
}

// 명령 히스토리 저장
async function saveCommandToHistory(msg) {
  try {
    const { commandHistory = [] } = await chrome.storage.local.get('commandHistory');
    const entry = {
      id: msg.messageId,
      command: msg.payload?.command,
      params: msg.payload?.params,
      timestamp: Date.now(),
      result: null
    };

    // 최근 50개 유지
    const updated = [entry, ...commandHistory].slice(0, 50);
    await chrome.storage.local.set({ commandHistory: updated });
  } catch (e) {
    console.error('Chrome Agent: Failed to save command history:', e);
  }
}

// 히스토리 결과 업데이트
async function updateHistoryResult(messageId, result) {
  try {
    const { commandHistory = [] } = await chrome.storage.local.get('commandHistory');
    const updated = commandHistory.map(entry => {
      if (entry.id === messageId) {
        return { ...entry, result };
      }
      return entry;
    });
    await chrome.storage.local.set({ commandHistory: updated });
  } catch (e) {
    console.error('Chrome Agent: Failed to update history result:', e);
  }
}
