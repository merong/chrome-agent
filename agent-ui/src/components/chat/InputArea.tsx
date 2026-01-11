import { useState, useCallback, type KeyboardEvent } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/appStore';
import { useWebSocket } from '@/hooks/useWebSocket';

const SUGGESTION_EXAMPLES = [
  '쿠키 추출해줘',
  '상품 목록 가져와',
  '폼 정보 확인',
  '페이지 정보',
];

export function InputArea() {
  const [input, setInput] = useState('');
  const { sendChat, isConnected } = useWebSocket();
  const serverStatus = useAppStore((state) => state.serverStatus);
  const extensionStatus = useAppStore((state) => state.extensionStatus);
  const currentExecution = useAppStore((state) => state.currentExecution);

  const isReady =
    serverStatus === 'connected' && extensionStatus === 'connected';
  const isProcessing =
    currentExecution === 'sending' ||
    currentExecution === 'processing' ||
    currentExecution === 'executing';

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isReady || isProcessing) return;

    sendChat(trimmed);
    setInput('');
  }, [input, isReady, isProcessing, sendChat]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Suggestion Bar */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">💡</span>
          <div className="flex gap-2 overflow-x-auto">
            {SUGGESTION_EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => handleSuggestionClick(example)}
                disabled={!isReady}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors',
                  isReady
                    ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-3 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !isConnected
              ? '서버 연결 중...'
              : extensionStatus !== 'connected'
                ? '크롬 확장 연결을 기다리는 중...'
                : '메시지를 입력하세요...'
          }
          disabled={!isReady || isProcessing}
          className={clsx(
            'flex-1 px-4 py-3 rounded-xl border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            isReady && !isProcessing
              ? 'bg-white border-gray-300 text-gray-900'
              : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isReady || isProcessing}
          className={clsx(
            'px-6 py-3 rounded-xl font-medium transition-colors',
            input.trim() && isReady && !isProcessing
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isProcessing ? '처리 중...' : '전송'}
        </button>
      </div>
    </div>
  );
}
