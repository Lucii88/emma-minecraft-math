import { useEffect, useState, type ReactNode } from 'react';
import type { Confidence } from '../../core/types';
import { hasCzechVoice, speak, stopSpeaking } from '../../core/speech';
import { useGame } from '../../core/game';

export function SpeakButton({ text, auto = false }: { text: string; auto?: boolean }) {
  const enabled = useGame((s) => s.profile.settings.voice);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (auto && enabled && hasCzechVoice()) {
      setSpeaking(true);
      speak(text, () => setSpeaking(false));
    }
    return () => stopSpeaking();
  }, [text, auto, enabled]);
  if (!enabled || !hasCzechVoice()) return null;
  return (
    <button
      className={`btn btn-round speak${speaking ? ' on' : ''}`}
      aria-label="Přečti mi to"
      title="Přečti mi to"
      onClick={() => {
        setSpeaking(true);
        speak(text, () => setSpeaking(false));
      }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5c1.2 1 1.8 2.2 1.8 3.5s-.6 2.5-1.8 3.5M18.5 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function ConfidencePicker({ onPick }: { onPick: (c: Confidence) => void }) {
  const opts: { c: Confidence; label: string; icon: string }[] = [
    { c: 'hadala', label: 'Hádala jsem', icon: '🥚' },
    { c: 'asi', label: 'Asi', icon: '🐣' },
    { c: 'jiste', label: 'Jistě', icon: '🐉' },
  ];
  return (
    <div className="confidence" role="group" aria-label="Jak jistá si jsi?">
      <div className="confidence-q">Jak jistá si jsi?</div>
      <div className="confidence-opts">
        {opts.map((o) => (
          <button key={o.c} className="btn confidence-btn" onClick={() => onPick(o.c)}>
            <span className="ci" aria-hidden>
              {o.icon}
            </span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Progress({ total, done }: { total: number; done: number }) {
  return (
    <div className="progress" aria-label={`Úloha ${Math.min(done + 1, total)} z ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot${i < done ? ' done' : i === done ? ' now' : ''}`} />
      ))}
    </div>
  );
}

export function Icon({ name, size = 26 }: { name: 'book' | 'scroll' | 'lock' | 'close' | 'back' | 'lamp' | 'map' | 'star' | 'gear'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (name) {
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12z" fill="currentColor" />
        </svg>
      );
    case 'scroll':
      return (
        <svg {...common}>
          <path d="M6 4h11a3 3 0 0 1 0 6h-1v8a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1V7a3 3 0 0 1-1-3z" fill="currentColor" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <path d="M7 10V8a5 5 0 0 1 10 0v2h1v10H6V10h1zm2 0h6V8a3 3 0 0 0-6 0v2z" fill="currentColor" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'back':
      return (
        <svg {...common}>
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'lamp':
      return (
        <svg {...common}>
          <path d="M9 18h6v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2zM12 2a7 7 0 0 1 4 12.7V16H8v-1.3A7 7 0 0 1 12 2z" fill="currentColor" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" fill="currentColor" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2z" fill="currentColor" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...common}>
          <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.4 5.2l1.6 1.2-2 3.4-1.9-.7a8 8 0 0 1-2 1.2L15.8 21h-4l-.3-2.2a8 8 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a8 8 0 0 1 0-2.4L5.6 9.4l2-3.4 1.9.7a8 8 0 0 1 2-1.2L11.8 3h4l.3 2.5a8 8 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a8 8 0 0 1 0 2.4z" fill="currentColor" />
        </svg>
      );
  }
}

export function Sparkles({ show, children }: { show: boolean; children?: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <div className="sparkles">
      {children}
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="spark" style={{ ['--i' as string]: i }} />
      ))}
    </div>
  );
}
