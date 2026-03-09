import { McpServer, DetectedClient } from '../../shared/types';

interface StatusBarProps {
  serverCount: number;
  clientCount: number;
  lastSyncTime: string | null;
}

export default function StatusBar({ serverCount, clientCount, lastSyncTime }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          {serverCount} server{serverCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          {clientCount} client{clientCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        {lastSyncTime
          ? <span>Last sync: {lastSyncTime}</span>
          : <span className="text-gray-500">No sync yet</span>
        }
      </div>
    </div>
  );
}
