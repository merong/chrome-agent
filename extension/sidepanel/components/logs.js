// sidepanel/components/logs.js
// 활동 로그 컴포넌트

class LogsComponent {
  constructor() {
    this.containerEl = document.getElementById('log-container');
    this.clearBtn = document.getElementById('btn-clear-logs');

    this.init();
  }

  init() {
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  }

  async load() {
    try {
      const logs = await Storage.getLogs();
      this.render(logs);
    } catch (e) {
      console.error('Failed to load logs:', e);
      this.render([]);
    }
  }

  render(logs) {
    this.containerEl.innerHTML = '';

    if (logs.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'log-empty';
      emptyEl.textContent = 'No logs yet';
      this.containerEl.appendChild(emptyEl);
      return;
    }

    logs.forEach(log => {
      const div = document.createElement('div');
      div.className = `log-entry ${log.type || ''}`;

      const time = this.formatTime(log.timestamp);
      div.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-type">[${log.type}]</span>
        <span class="log-message">${log.message}</span>
      `;

      this.containerEl.appendChild(div);
    });
  }

  addLog(log) {
    this.load(); // 다시 로드
  }

  async clear() {
    if (confirm('활동 로그를 삭제하시겠습니까?')) {
      await Storage.clearLogs();
      this.render([]);
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
