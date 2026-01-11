// sidepanel/components/tabs.js
// 탭 전환 컴포넌트

class TabController {
  constructor() {
    this.tabs = document.querySelectorAll('.tab-btn');
    this.panels = document.querySelectorAll('.tab-panel');
    this.init();
  }

  init() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  switchTab(tabId) {
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    this.panels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
  }

  getCurrentTab() {
    const activeTab = document.querySelector('.tab-btn.active');
    return activeTab ? activeTab.dataset.tab : 'main';
  }
}
