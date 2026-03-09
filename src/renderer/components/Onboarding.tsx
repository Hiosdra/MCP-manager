import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'mcp-manager-onboarding-seen';

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShow(false);
  };

  return { showOnboarding: show, dismissOnboarding: dismiss };
}

const tips = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    title: 'Add Servers',
    description: 'Define your MCP servers once — command, args, env vars, and transport type.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'Import Existing Configs',
    description: 'Already have servers in Claude, Cursor, or other clients? Import them in one click.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Sync Everywhere',
    description: 'Push your server configs to all your AI clients at once — Claude, Cursor, Zed, and more.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Per-Client Control',
    description: 'Toggle exactly which clients receive which servers from the Integrations tab.',
  },
];

interface OnboardingProps {
  onDismiss: () => void;
}

export default function Onboarding({ onDismiss }: OnboardingProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to MCP Manager"
    >
      <div
        className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-onboarding-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-2 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Welcome to MCP Manager</h2>
          <p className="text-sm text-zinc-500 mt-1.5">
            One place to manage all your MCP servers across every AI client.
          </p>
        </div>

        <div className="px-5 py-4 space-y-1">
          {tips.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3.5 rounded-xl px-3 py-3 hover:bg-zinc-800/50 transition-colors">
              <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                {tip.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-medium text-zinc-200">{tip.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-7 pb-6 pt-2">
          <button
            onClick={onDismiss}
            autoFocus
            className="w-full py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
