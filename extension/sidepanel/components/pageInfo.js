// sidepanel/components/pageInfo.js
// 현재 페이지 정보 표시 컴포넌트

class PageInfoComponent {
  constructor() {
    this.urlEl = document.getElementById('page-url');
    this.titleEl = document.getElementById('page-title');
    this.cookieEl = document.getElementById('cookie-count');
    this.formEl = document.getElementById('form-count');
    this.refreshBtn = document.getElementById('btn-refresh');

    this.init();
  }

  init() {
    this.refreshBtn.addEventListener('click', () => this.refresh());

    // 탭 변경 감지
    chrome.tabs.onActivated.addListener(() => this.refresh());
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === 'complete') this.refresh();
    });

    // 초기 로드
    this.refresh();
  }

  async refresh() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        this.showNoTab();
        return;
      }

      // URL 및 타이틀
      this.urlEl.textContent = this.truncateUrl(tab.url);
      this.urlEl.title = tab.url;
      if (this.titleEl) {
        this.titleEl.textContent = tab.title || '-';
      }

      // 쿠키 수
      try {
        const url = new URL(tab.url);
        const cookies = await chrome.cookies.getAll({ domain: url.hostname });
        this.cookieEl.textContent = cookies.length;
      } catch {
        this.cookieEl.textContent = '-';
      }

      // 폼 수 (Content Script 통해)
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FORM_COUNT' });
        this.formEl.textContent = response?.count ?? '-';
      } catch {
        this.formEl.textContent = '-';
      }
    } catch (e) {
      console.error('Failed to refresh page info:', e);
      this.showError();
    }
  }

  truncateUrl(url) {
    if (!url) return '-';
    if (url.length > 50) {
      return url.substring(0, 47) + '...';
    }
    return url;
  }

  showNoTab() {
    this.urlEl.textContent = 'No active tab';
    if (this.titleEl) this.titleEl.textContent = '-';
    this.cookieEl.textContent = '-';
    this.formEl.textContent = '-';
  }

  showError() {
    this.urlEl.textContent = 'Error loading info';
    if (this.titleEl) this.titleEl.textContent = '-';
    this.cookieEl.textContent = '-';
    this.formEl.textContent = '-';
  }
}
