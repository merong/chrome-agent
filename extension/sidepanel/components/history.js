// sidepanel/components/history.js
// 명령 히스토리 컴포넌트

class HistoryComponent {
  constructor() {
    this.listEl = document.getElementById('history-list');
    this.countEl = document.getElementById('history-count');
    this.clearBtn = document.getElementById('btn-clear-history');

    this.init();
  }

  init() {
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  }

  async load() {
    try {
      const response = await Messaging.getHistory();
      this.render(response.history || []);
    } catch (e) {
      console.error('Failed to load history:', e);
      this.render([]);
    }
  }

  render(history) {
    this.listEl.innerHTML = '';
    this.countEl.textContent = `(${history.length})`;

    if (history.length === 0) {
      const emptyEl = document.createElement('li');
      emptyEl.className = 'history-empty';
      emptyEl.textContent = 'No commands yet';
      this.listEl.appendChild(emptyEl);
      return;
    }

    history.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const time = this.formatTime(entry.timestamp);
      const statusIcon = entry.result?.success ? '✓' : (entry.result?.success === false ? '✗' : '⏳');
      const statusClass = entry.result?.success ? 'success' : (entry.result?.success === false ? 'error' : 'pending');

      li.innerHTML = `
        <div class="history-header">
          <span class="command">${entry.command}</span>
          <span class="status-icon ${statusClass}">${statusIcon}</span>
        </div>
        <div class="history-meta">
          <span class="time">${time}</span>
          ${entry.params ? `<span class="params">${this.formatParams(entry.params)}</span>` : ''}
        </div>
      `;

      this.listEl.appendChild(li);
    });
  }

  addEntry(entry) {
    this.load(); // 단순히 다시 로드
  }

  async clear() {
    if (confirm('명령 히스토리를 삭제하시겠습니까?')) {
      await Messaging.clearHistory();
      this.render([]);
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  }

  formatParams(params) {
    if (!params) return '';
    const str = JSON.stringify(params);
    return str.length > 30 ? str.substring(0, 27) + '...' : str;
  }
}
