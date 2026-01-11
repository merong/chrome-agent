import { useState } from 'react';
import { clsx } from 'clsx';
import type { ChatMessage } from '@/types';
import { Spinner } from '@/components/common';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isAi = message.sender === 'ai';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async () => {
    if (message.data) {
      await navigator.clipboard.writeText(
        JSON.stringify(message.data, null, 2)
      );
    }
  };

  const hasData = message.data !== undefined && message.data !== null;

  return (
    <div
      className={clsx(
        'flex flex-col gap-1 max-w-[85%]',
        isUser ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Sender & Time */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {isUser ? <span>👤 사용자</span> : null}
        {isAi ? <span>🤖 AI 어시스턴트</span> : null}
        {isSystem ? <span>💬 시스템</span> : null}
        <span>{formatTime(message.timestamp)}</span>
      </div>

      {/* Message Bubble */}
      <div
        className={clsx(
          'px-4 py-3 rounded-xl',
          isUser && 'bg-indigo-600 text-white rounded-br-none',
          isAi && 'bg-gray-100 text-gray-900 rounded-bl-none',
          isSystem && 'bg-blue-50 text-gray-700 border border-blue-200'
        )}
      >
        {/* Content */}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Loading Status */}
        {message.status === 'processing' ? (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <Spinner size="sm" className="text-indigo-500" />
            <span className="text-sm text-gray-600">AI 처리 중...</span>
          </div>
        ) : null}

        {message.status === 'executing' ? (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <Spinner size="sm" className="text-indigo-500" />
            <span className="text-sm text-gray-600">
              크롬 확장에서 실행 중...
            </span>
          </div>
        ) : null}

        {/* Data Result */}
        {hasData ? (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <span>📋 결과 상세보기</span>
              <span>{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded ? (
              <div className="mt-2">
                <pre className="p-3 bg-gray-800 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-60">
                  {JSON.stringify(message.data, null, 2)}
                </pre>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    📋 JSON 복사
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
