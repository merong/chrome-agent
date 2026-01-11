// sidepanel/components/settings.js
// 설정 관리 컴포넌트

class SettingsComponent {
  constructor() {
    this.urlInput = document.getElementById('settings-url');
    this.autoConnectCheckbox = document.getElementById('settings-autoconnect');
    this.saveBtn = document.getElementById('btn-save-settings');
    this.toast = document.getElementById('toast');

    this.init();
  }

  init() {
    this.saveBtn.addEventListener('click', () => this.save());
  }

  async load() {
    try {
      const { serverUrl, autoConnect } = await Storage.getSettings();
      this.urlInput.value = serverUrl || 'ws://localhost:8080/ws';
      this.autoConnectCheckbox.checked = autoConnect || false;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  async save() {
    const serverUrl = this.urlInput.value.trim();
    const autoConnect = this.autoConnectCheckbox.checked;

    if (!serverUrl) {
      this.showToast('서버 URL을 입력해주세요.', 'error');
      return;
    }

    // URL 형식 검증
    if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
      this.showToast('올바른 WebSocket URL을 입력해주세요. (ws:// 또는 wss://)', 'error');
      return;
    }

    try {
      await Storage.saveSettings({ serverUrl, autoConnect });
      await Storage.addLog({ type: 'settings', message: 'Settings saved' });
      this.showToast('설정이 저장되었습니다.', 'success');

      // 메인 탭의 서버 URL도 업데이트
      const mainUrlInput = document.getElementById('server-url');
      if (mainUrlInput) {
        mainUrlInput.value = serverUrl;
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      this.showToast('설정 저장 실패', 'error');
    }
  }

  showToast(message, type = 'info') {
    if (!this.toast) return;

    this.toast.textContent = message;
    this.toast.className = `toast show ${type}`;

    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }
}
