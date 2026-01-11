// sidepanel/utils/storage.js
// chrome.storage.local 래퍼

const Storage = {
  async get(keys) {
    return chrome.storage.local.get(keys);
  },

  async set(items) {
    return chrome.storage.local.set(items);
  },

  async getSettings() {
    return this.get(['serverUrl', 'autoConnect']);
  },

  async saveSettings(settings) {
    return this.set(settings);
  },

  async getHistory() {
    const { commandHistory = [] } = await this.get('commandHistory');
    return commandHistory;
  },

  async clearHistory() {
    return this.set({ commandHistory: [] });
  },

  // 로그 관련
  async getLogs() {
    const { activityLogs = [] } = await this.get('activityLogs');
    return activityLogs;
  },

  async addLog(log) {
    const { activityLogs = [] } = await this.get('activityLogs');
    const entry = {
      ...log,
      timestamp: Date.now()
    };
    // 최대 100개 유지
    const updated = [entry, ...activityLogs].slice(0, 100);
    return this.set({ activityLogs: updated });
  },

  async clearLogs() {
    return this.set({ activityLogs: [] });
  }
};
