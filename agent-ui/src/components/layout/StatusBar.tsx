import { useAppStore } from '@/stores/appStore';
import { clsx } from 'clsx';

export function StatusBar() {
  const serverStatus = useAppStore((state) => state.serverStatus);
  const extensionStatus = useAppStore((state) => state.extensionStatus);
  const responseTime = useAppStore((state) => state.responseTime);

  const serverConnected = serverStatus === 'connected';
  const extensionConnected = extensionStatus === 'connected';

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-b border-gray-200 text-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              serverConnected ? 'bg-emerald-500' : 'bg-gray-400'
            )}
          />
          <span className="text-gray-600">🔌 서버</span>
          <span
            className={clsx(
              serverConnected ? 'text-emerald-600' : 'text-gray-500'
            )}
          >
            {serverConnected ? '연결됨' : '연결 안됨'}
          </span>
        </div>

        <div className="w-px h-4 bg-gray-300" />

        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              extensionConnected ? 'bg-emerald-500' : 'bg-gray-400'
            )}
          />
          <span className="text-gray-600">🧩 크롬 확장</span>
          <span
            className={clsx(
              extensionConnected ? 'text-emerald-600' : 'text-gray-500'
            )}
          >
            {extensionStatus === 'connected'
              ? '연결됨'
              : extensionStatus === 'disconnected'
                ? '연결 끊김'
                : '대기 중'}
          </span>
        </div>
      </div>

      {responseTime !== null && (
        <div className="flex items-center gap-2 text-gray-500">
          <span>⏱️</span>
          <span>응답시간: {responseTime}ms</span>
        </div>
      )}
    </div>
  );
}
