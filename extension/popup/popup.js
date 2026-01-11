// popup/popup.js
// 간소화된 팝업 - Side Panel 열기

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const btnOpenPanel = document.getElementById('btn-open-panel');

  // 연결 상태 확인
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response?.connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected to server';
    } else {
      statusText.textContent = 'Not connected';
    }
  });

  // Side Panel 열기 버튼
  btnOpenPanel.addEventListener('click', async () => {
    try {
      // 현재 탭 정보 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.sidePanel.open({ tabId: tab.id });
        window.close(); // 팝업 닫기
      }
    } catch (e) {
      console.error('Failed to open side panel:', e);
    }
  });
});
