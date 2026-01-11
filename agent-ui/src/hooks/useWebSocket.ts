import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import type {
  WSMessage,
  ConnectAckPayload,
  StatusPayload,
  ResponsePayload,
  ErrorPayload,
} from '@/types';

const SERVER_URL = 'ws://localhost:8080/ws';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 3;
const HEARTBEAT_INTERVAL = 10000;

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const pendingRequestsRef = useRef<Map<string, { timestamp: number }>>(
    new Map()
  );

  const {
    setServerStatus,
    setExtensionStatus,
    setSessionId,
    setResponseTime,
    addMessage,
    updateMessageStatus,
    addToast,
    setCurrentExecution,
  } = useAppStore();

  const generateMessageId = () => crypto.randomUUID();

  const sendMessage = useCallback((message: WSMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = window.setInterval(() => {
      const heartbeat: WSMessage = {
        messageId: generateMessageId(),
        type: 'HEARTBEAT',
        source: 'agent',
        target: 'server',
      };
      sendMessage(heartbeat);
    }, HEARTBEAT_INTERVAL);
  }, [sendMessage]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'CONNECT_ACK': {
            const payload = message.payload as unknown as ConnectAckPayload;
            setSessionId(payload.sessionId);
            setServerStatus('connected');
            reconnectAttemptsRef.current = 0;
            startHeartbeat();
            addToast({
              type: 'success',
              message: '서버에 연결되었습니다',
            });
            break;
          }

          case 'STATUS': {
            const payload = message.payload as unknown as StatusPayload;
            if (payload.status === 'paired') {
              setExtensionStatus('connected');
              addToast({
                type: 'success',
                message: '크롬 확장이 연결되었습니다',
              });
            } else if (payload.status === 'peer_disconnected') {
              setExtensionStatus('disconnected');
              addToast({
                type: 'warning',
                message: '크롬 확장 연결이 끊어졌습니다',
              });
            } else if (payload.status === 'peer_reconnected') {
              setExtensionStatus('connected');
              addToast({
                type: 'info',
                message: '크롬 확장이 재연결되었습니다',
              });
            }
            break;
          }

          case 'RESPONSE': {
            const payload = message.payload as unknown as ResponsePayload;
            const requestId = message.requestId;

            // Calculate response time
            if (requestId && pendingRequestsRef.current.has(requestId)) {
              const startTime =
                pendingRequestsRef.current.get(requestId)!.timestamp;
              const responseTime = Date.now() - startTime;
              setResponseTime(responseTime);
              pendingRequestsRef.current.delete(requestId);
            }

            setCurrentExecution('idle');

            if (payload.success) {
              // Add AI response message
              const resultText = formatResult(payload.data);
              addMessage('ai', resultText, payload.data);
            } else {
              // Add error message
              addMessage(
                'ai',
                `오류가 발생했습니다: ${payload.error || '알 수 없는 오류'}`,
                { error: payload.errorCode }
              );
            }
            break;
          }

          case 'ERROR': {
            const payload = message.payload as unknown as ErrorPayload;
            setCurrentExecution('error');
            addToast({
              type: 'error',
              message: payload.message,
            });

            // Update pending message status if requestId exists
            if (payload.requestId) {
              updateMessageStatus(payload.requestId, 'error');
              pendingRequestsRef.current.delete(payload.requestId);
            }
            break;
          }

          case 'HEARTBEAT':
            // Server heartbeat response, no action needed
            break;
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    },
    [
      setSessionId,
      setServerStatus,
      setExtensionStatus,
      setResponseTime,
      setCurrentExecution,
      addMessage,
      updateMessageStatus,
      addToast,
      startHeartbeat,
    ]
  );

  const connect = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setServerStatus('connecting');

    try {
      const socket = new WebSocket(SERVER_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        // Send CONNECT message
        const connectMsg: WSMessage = {
          messageId: generateMessageId(),
          type: 'CONNECT',
          source: 'agent',
          target: 'server',
        };
        sendMessage(connectMsg);
      };

      socket.onmessage = handleMessage;

      socket.onclose = (event) => {
        stopHeartbeat();
        setServerStatus('disconnected');
        setExtensionStatus('unknown');
        setSessionId(null);

        // Auto reconnect
        if (
          !event.wasClean &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          setServerStatus('reconnecting');
          reconnectAttemptsRef.current++;
          setTimeout(connect, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          addToast({
            type: 'error',
            message: '서버 연결에 실패했습니다. 재시도 횟수를 초과했습니다.',
          });
        }
      };

      socket.onerror = () => {
        setServerStatus('error');
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setServerStatus('error');
    }
  }, [
    setServerStatus,
    setExtensionStatus,
    setSessionId,
    sendMessage,
    handleMessage,
    stopHeartbeat,
    addToast,
  ]);

  const disconnect = useCallback(() => {
    stopHeartbeat();
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setServerStatus('disconnected');
    setExtensionStatus('unknown');
    setSessionId(null);
  }, [setServerStatus, setExtensionStatus, setSessionId, stopHeartbeat]);

  const sendChat = useCallback(
    (text: string) => {
      const messageId = generateMessageId();

      // Track request for response time calculation
      pendingRequestsRef.current.set(messageId, { timestamp: Date.now() });

      // Add user message to chat
      addMessage('user', text);

      // Set execution status
      setCurrentExecution('sending');

      // Send CHAT message to server
      const chatMsg: WSMessage = {
        messageId,
        type: 'CHAT',
        source: 'agent',
        target: 'server',
        payload: {
          text,
        },
      };

      const sent = sendMessage(chatMsg);

      if (sent) {
        setCurrentExecution('processing');
      } else {
        setCurrentExecution('error');
        addToast({
          type: 'error',
          message: '메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.',
        });
      }

      return sent;
    },
    [addMessage, setCurrentExecution, sendMessage, addToast]
  );

  // Auto connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    sendChat,
    isConnected: useAppStore((state) => state.serverStatus === 'connected'),
  };
}

// Helper function to format result data
function formatResult(data: unknown): string {
  if (!data) return '결과가 없습니다.';

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    // Handle cookies result
    if ('cookies' in obj && Array.isArray(obj.cookies)) {
      return `${obj.cookies.length}개의 쿠키를 추출했습니다.`;
    }

    // Handle DOM result
    if ('elements' in obj && Array.isArray(obj.elements)) {
      return `${obj.elements.length}개의 요소를 추출했습니다.`;
    }

    // Handle Form result
    if ('form' in obj && 'fields' in obj) {
      const fields = obj.fields as unknown[];
      return `Form 정보를 추출했습니다. (필드 ${fields.length}개)`;
    }

    // Handle Page info result
    if ('url' in obj && 'title' in obj) {
      return `페이지 정보를 가져왔습니다: ${obj.title}`;
    }
  }

  return '결과를 가져왔습니다.';
}
