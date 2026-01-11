import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { MessageBubble } from './MessageBubble';

export function ChatArea() {
  const messages = useAppStore((state) => state.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6"
      role="log"
      aria-live="polite"
      aria-label="채팅 메시지"
    >
      {messages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <span className="text-6xl mb-4">👋</span>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Chrome Agent에 오신 것을 환영합니다!
      </h2>
      <p className="text-gray-600 max-w-md mb-6">
        자연어로 브라우저를 제어하고 웹페이지 데이터를 추출해보세요.
        <br />
        크롬 확장이 연결되면 명령을 입력할 수 있습니다.
      </p>
      <div className="flex flex-col gap-2 text-left">
        <p className="text-sm font-medium text-gray-700">예시 명령어:</p>
        <div className="flex flex-wrap gap-2">
          {[
            '쿠키 추출해줘',
            '페이지 정보 알려줘',
            '로그인 폼 정보 추출해줘',
            '상품 목록 가져와',
          ].map((example) => (
            <span
              key={example}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              "{example}"
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
