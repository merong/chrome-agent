// sidepanel/components/connection.js
// 연결 상태 관리 컴포넌트

class ConnectionComponent {
  constructor() {
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    this.sessionIdEl = document.getElementById('session-id');
    this.serverUrlInput = document.getElementById('server-url');
    this.btnConnect = document.getElementById('btn-connect');
    this.btnDisconnect = document.getElementById('btn-disconnect');

    this.init();
  }

  async init() {
    // 저장된 서버 URL 불러오기
    const { serverUrl } = await Storage.getSettings();
    if (serverUrl) {
      this.serverUrlInput.value = serverUrl;
    }

    // 현재 연결 상태 확인
    const status = await Messaging.getStatus();
    this.updateStatus(status.connected ? 'connected' : 'disconnected');
    if (status.sessionId) {
      this.updateSessionId(status.sessionId);
    }

    // 이벤트 리스너
    this.btnConnect.addEventListener('click', () => this.connect());
    this.btnDisconnect.addEventListener('click', () => this.disconnect());
  }

  async connect() {
    const url = this.serverUrlInput.value.trim();
    if (!url) {
      alert('서버 URL을 입력해주세요.');
      return;
    }

    this.updateStatus('connecting');
    await Storage.addLog({ type: 'connection', message: `Connecting to ${url}...` });

    try {
      await Messaging.connect(url);
      // 서버 URL 저장
      await Storage.saveSettings({ serverUrl: url });
    } catch (e) {
      this.updateStatus('error');
      await Storage.addLog({ type: 'error', message: `Connection failed: ${e.message}` });
    }
  }

  async disconnect() {
    await Messaging.disconnect();
    await Storage.addLog({ type: 'connection', message: 'Disconnected' });
  }

  updateStatus(status) {
    this.statusDot.className = 'status-dot';

    switch (status) {
      case 'connected':
        this.statusDot.classList.add('connected');
        this.statusText.textContent = 'Connected';
        this.btnConnect.disabled = true;
        this.btnDisconnect.disabled = false;
        break;
      case 'connecting':
        this.statusDot.classList.add('connecting');
        this.statusText.textContent = 'Connecting...';
        this.btnConnect.disabled = true;
        this.btnDisconnect.disabled = true;
        break;
      case 'disconnected':
        this.statusText.textContent = 'Disconnected';
        this.btnConnect.disabled = false;
        this.btnDisconnect.disabled = true;
        this.updateSessionId(null);
        break;
      case 'error':
        this.statusDot.classList.add('error');
        this.statusText.textContent = 'Error';
        this.btnConnect.disabled = false;
        this.btnDisconnect.disabled = true;
        break;
    }
  }

  updateSessionId(sessionId) {
    if (this.sessionIdEl) {
      this.sessionIdEl.textContent = sessionId ? sessionId.substring(0, 8) + '...' : '-';
    }
  }
}
