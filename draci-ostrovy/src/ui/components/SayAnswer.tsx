import { useEffect, useRef, useState } from 'react';
import { canRecord, checkSpeech, startRecording, type Recording } from '../../core/listen';
import type { SpeechResult } from '../../core/saymatch';
import { sfx } from '../../core/sound';
import { stopSpeaking } from '../../core/speech';

type State = 'idle' | 'recording' | 'checking';

/** Odpověď nahlas: klepnout, mluvit, nahrávka se sama zastaví po domluvení.
 *  `onResult` dostane přepis (nebo „nomatch“, když nic nezaznělo),
 *  `onMicError` se zavolá, když mikrofon nejde použít. */
export function SayAnswer({
  disabled,
  resetKey,
  refText,
  onResult,
  onMicError,
}: {
  disabled: boolean;
  resetKey: string;
  refText?: string;
  onResult: (result: SpeechResult) => void;
  onMicError: () => void;
}) {
  const [state, setState] = useState<State>('idle');
  const [level, setLevel] = useState(0);
  const rec = useRef<Recording | null>(null);
  const stopping = useRef(false);

  useEffect(() => {
    setState('idle');
    return () => {
      rec.current?.cancel();
      rec.current = null;
    };
  }, [resetKey]);

  const finish = async () => {
    const r = rec.current;
    if (!r || stopping.current) return;
    stopping.current = true;
    rec.current = null;
    setLevel(0);
    setState('checking');
    const wav = await r.stop();
    const result: SpeechResult = wav ? await checkSpeech(wav, refText) : { status: 'nomatch', text: '', lexical: '', scores: null, words: [] };
    stopping.current = false;
    setState('idle');
    onResult(result);
  };

  const start = async () => {
    if (disabled || state !== 'idle') return;
    if (!canRecord()) return onMicError();
    sfx.tap();
    stopSpeaking(); // hlas otázky by se nahrál taky
    stopping.current = false;
    try {
      rec.current = await startRecording({ onLevel: setLevel, onAutoStop: () => void finish() });
      setState('recording');
    } catch {
      setState('idle');
      onMicError();
    }
  };

  const busy = state === 'checking';
  return (
    <div className="say">
      <button
        type="button"
        className={`say-mic${state === 'recording' ? ' on' : ''}`}
        style={{ ['--level' as string]: String(level) }}
        onClick={state === 'recording' ? () => void finish() : () => void start()}
        disabled={disabled || busy}
        aria-label={state === 'recording' ? 'Domluveno' : 'Mluvit anglicky'}
      >
        <MicIcon />
      </button>
      <p className="say-label" aria-live="polite">
        {state === 'recording' ? 'Poslouchám… až domluvíš, klepni.' : busy ? 'Miss Ember přemýšlí…' : 'Klepni a odpověz nahlas anglicky.'}
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
