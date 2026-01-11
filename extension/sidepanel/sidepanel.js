// sidepanel/sidepanel.js
// Side Panel 메인 진입점

let tabController;
let connectionComponent;
let pageInfoComponent;
let historyComponent;
let settingsComponent;
let logsComponent;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Chrome Agent Side Panel loaded');

  // 컴포넌트 초기화
  tabController = new TabController();
  connectionComponent = new ConnectionComponent();
  pageInfoComponent = new PageInfoComponent();
  historyComponent = new HistoryComponent();
  settingsComponent = new SettingsComponent();
  logsComponent = new LogsComponent();

  // 초기 데이터 로드
  await historyComponent.load();
  await settingsComponent.load();
  await logsComponent.load();

  // Service Worker 메시지 리스너
  chrome.runtime.onMessage.addListener((message) => {
    handleServiceWorkerMessage(message);
  });
});

// Service Worker로부터 메시지 처리
function handleServiceWorkerMessage(message) {
  console.log('Side Panel received:', message);

  switch (message.type) {
    case 'STATUS_UPDATE':
      connectionComponent.updateStatus(message.status);
      Storage.addLog({ type: 'connection', message: `Status: ${message.status}` });
      logsComponent.load();
      break;

    case 'SESSION_UPDATE':
      connectionComponent.updateSessionId(message.sessionId);
      break;

    case 'COMMAND_RESULT':
      historyComponent.load();
      Storage.addLog({
        type: message.success ? 'success' : 'error',
        message: `${message.command}: ${message.success ? 'Success' : 'Failed'}`
      });
      logsComponent.load();
      break;

    case 'SERVER_STATUS':
      Storage.addLog({ type: 'server', message: JSON.stringify(message) });
      logsComponent.load();
      break;
  }
}
