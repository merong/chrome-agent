// sidepanel/utils/messaging.js
// Service Worker 통신 헬퍼

const Messaging = {
  send(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },

  connect(url) {
    return this.send({ type: 'CONNECT_SERVER', url });
  },

  disconnect() {
    return this.send({ type: 'DISCONNECT_SERVER' });
  },

  getStatus() {
    return this.send({ type: 'GET_STATUS' });
  },

  getHistory() {
    return this.send({ type: 'GET_HISTORY' });
  },

  clearHistory() {
    return this.send({ type: 'CLEAR_HISTORY' });
  }
};
