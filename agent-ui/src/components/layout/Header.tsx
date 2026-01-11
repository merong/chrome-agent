import { useAppStore } from '@/stores/appStore';
import { StatusIndicator } from '@/components/common';

export function Header() {
  const serverStatus = useAppStore((state) => state.serverStatus);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <h1 className="text-lg font-semibold text-gray-900">
          Chrome Agent Commander
        </h1>
      </div>
      <StatusIndicator status={serverStatus} />
    </header>
  );
}
