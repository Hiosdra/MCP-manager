import { McpServer, DetectedClient } from '../../shared/types';

interface StatusBarProps {
  serverCount: number;
  clientCount: number;
  lastSyncTime: string | null;
}

export default function StatusBar({ serverCount, clientCount, lastSyncTime }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 text-xs text-zinc-600 border-t border-zinc-800/60">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-zinc-400">{serverCount}</span> server{serverCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-zinc-400">{clientCount}</span> client{clientCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        {lastSyncTime
          ? <span className="text-zinc-500">Last sync: {lastSyncTime}</span>
          : <span className="text-zinc-700">No sync yet</span>
        }
      </div>
    </div>
  );
}
