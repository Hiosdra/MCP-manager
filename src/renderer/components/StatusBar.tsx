import { McpServer, DetectedClient } from '../../shared/types';

interface StatusBarProps {
  serverCount: number;
  clientCount: number;
  lastSyncTime: string | null;
}

export default function StatusBar({ serverCount, clientCount, lastSyncTime }: StatusBarProps) {
  return (
    <div className="status-bar flex items-center justify-between px-5 py-2 text-xs text-slate-500">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block pulse-soft" />
          <span className="text-slate-400">{serverCount}</span> server{serverCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block pulse-soft" />
          <span className="text-slate-400">{clientCount}</span> client{clientCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        {lastSyncTime
          ? <span className="text-slate-400">Last sync: {lastSyncTime}</span>
          : <span className="text-slate-600">No sync yet</span>
        }
      </div>
    </div>
  );
}
