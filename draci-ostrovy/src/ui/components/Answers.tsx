import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChoiceOption } from '../../core/types';
import { formatNumber } from '../../core/czech';
import { sfx } from '../../core/sound';

// ---------------------------------------------------------------------------
// Výběr z možností

function Label({ text }: { text: string }) {
  const frac = text.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return (
      <span className="frac" aria-label={`${frac[1]} lomeno ${frac[2]}`}>
        <span>{frac[1]}</span>
        <span className="frac-line" />
        <span>{frac[2]}</span>
      </span>
    );
  }
  return <>{text}</>;
}

export function ChoiceAnswer({
  options,
  wrong,
  correctShown,
  disabled,
  onPick,
}: {
  options: ChoiceOption[];
  wrong: number[];
  correctShown: number | null;
  disabled: boolean;
  onPick: (index: number) => void;
}) {
  const long = options.some((o) => o.label.length > 18);
  // Samé obrázky (sudoku, matice, řady) chtějí větší písmo.
  const pictures = options.every((o) => !/[\p{L}\p{N}]/u.test(o.label));
  return (
    <div className={`choices${long && !pictures ? ' long' : ''}${options.length === 2 ? ' two' : ''}${pictures ? ' pictures' : ''}`}>
      {options.map((o, i) => {
        const isWrong = wrong.includes(i);
        const isOk = correctShown === i;
        return (
          <button
            key={i}
            className={`choice${isWrong ? ' wrong' : ''}${isOk ? ' ok' : ''}`}
            disabled={disabled || isWrong}
            onClick={() => {
              sfx.tap();
              onPick(i);
            }}
          >
            <Label text={o.label} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Číselná klávesnice

export function NumberPad({
  allowNegative,
  unit,
  disabled,
  resetKey,
  onSubmit,
}: {
  allowNegative?: boolean;
  unit?: string;
  disabled: boolean;
  resetKey: string;
  onSubmit: (value: number) => void;
}) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(''), [resetKey]);

  const press = (k: string) => {
    if (disabled) return;
    sfx.tap();
    if (k === '⌫') return setValue((v) => v.slice(0, -1));
    if (k === '±') return setValue((v) => (v.startsWith('−') ? v.slice(1) : `−${v}`));
    setValue((v) => (v.replace('−', '').length >= 7 ? v : v === '0' ? k : v + k));
  };
  const submit = () => {
    const digits = value.replace('−', '');
    if (!digits || disabled) return;
    onSubmit((value.startsWith('−') ? -1 : 1) * Number(digits));
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === '-' && allowNegative) press('±');
      else if (e.key === 'Enter') submitRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowNegative, disabled]);

  const shown = value ? (value.startsWith('−') ? '−' : '') + formatNumber(Number(value.replace('−', ''))) : '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowNegative ? '±' : '', '0', '⌫'];
  return (
    <div className="numpad">
      <div className={`numpad-display${value ? '' : ' empty'}`} aria-live="polite">
        {shown || '?'}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="numpad-keys">
        {keys.map((k, i) =>
          k ? (
            <button key={i} className={`key${k === '⌫' || k === '±' ? ' key-fn' : ''}`} onClick={() => press(k)} disabled={disabled} aria-label={k === '⌫' ? 'smazat' : k === '±' ? 'mínus' : k}>
              {k === '±' ? '−' : k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <button className="btn btn-primary numpad-go" onClick={submit} disabled={disabled || !value.replace('−', '')}>
        Hotovo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skládání slova z písmen

export function LettersAnswer({ letters, disabled, resetKey, onSubmit }: { letters: string[]; disabled: boolean; resetKey: string; onSubmit: (word: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => setPicked([]), [resetKey]);
  const word = picked.map((i) => letters[i]).join('');
  const full = picked.length === letters.length;
  return (
    <div className="letters">
      <div className="letter-slots">
        {letters.map((_, i) => (
          <button key={i} className={`slot${picked[i] !== undefined ? ' filled' : ''}`} disabled={disabled || picked[i] === undefined} onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}>
            {picked[i] !== undefined ? letters[picked[i]] : ''}
          </button>
        ))}
      </div>
      <div className="letter-tiles">
        {letters.map((l, i) => (
          <button
            key={i}
            className="tile"
            disabled={disabled || picked.includes(i)}
            onClick={() => {
              sfx.tap();
              setPicked((p) => [...p, i]);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" disabled={disabled || !full} onClick={() => onSubmit(word)}>
        Hotovo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Odhad na číselné ose

export function NumberLineAnswer({
  min,
  max,
  disabled,
  reveal,
  resetKey,
  onSubmit,
}: {
  min: number;
  max: number;
  disabled: boolean;
  reveal: number | null;
  resetKey: string;
  onSubmit: (value: number) => void;
}) {
  const [pos, setPos] = useState(0.5);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setPos(0.5), [resetKey]);
  const valueAt = (p: number) => Math.round(min + p * (max - min));
  const labels = useMemo(() => {
    const span = max - min;
    const step = span <= 20 ? 5 : span <= 100 ? 10 : 100;
    const out: number[] = [];
    for (let v = min; v <= max; v += step) out.push(v);
    return out;
  }, [min, max]);

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  return (
    <div className="nline">
      <div
        className="nline-track"
        ref={ref}
        onPointerDown={(e) => {
          if (disabled) return;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => {
          if (disabled || e.buttons === 0) return;
          move(e.clientX);
        }}
      >
        <div className="nline-bar" />
        {labels.map((v) => (
          <div key={v} className={`nline-tick${v === min || v === max || v === 0 ? ' major' : ''}`} style={{ left: `${((v - min) / (max - min)) * 100}%` }}>
            {(v === min || v === max || (max - min <= 100 ? v % 50 === 0 : v % 500 === 0) || v === 0) && <span>{formatNumber(v)}</span>}
          </div>
        ))}
        <div className="nline-marker" style={{ left: `${pos * 100}%` }} aria-hidden>
          <svg viewBox="0 0 40 52" width="40" height="52">
            <path d="M20,50 L8,30 A16,16 0 1 1 32,30 Z" fill="#ff8a1f" stroke="#2b2d42" strokeWidth="3" />
            <circle cx="20" cy="18" r="7" fill="#fff" />
          </svg>
        </div>
        {reveal !== null && (
          <div className="nline-reveal" style={{ left: `${((reveal - min) / (max - min)) * 100}%` }}>
            <span>{formatNumber(reveal)}</span>
          </div>
        )}
      </div>
      <input
        className="sr-only"
        type="range"
        min={min}
        max={max}
        value={valueAt(pos)}
        onChange={(e) => setPos((Number(e.target.value) - min) / (max - min))}
        aria-label="Poloha na ose"
      />
      <button className="btn btn-primary" disabled={disabled} onClick={() => onSubmit(valueAt(pos))}>
        Tady!
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Otevřená odpověď (příběh, nápady)

export function OpenAnswer({ countIdeas, minLength = 3, onSubmit }: { countIdeas?: boolean; minLength?: number; onSubmit: (text: string, ideas?: number) => void }) {
  const [text, setText] = useState('');
  const [ideas, setIdeas] = useState<string[]>(['', '', '']);
  if (countIdeas) {
    const filled = ideas.map((s) => s.trim()).filter(Boolean);
    return (
      <div className="open">
        {ideas.map((v, i) => (
          <input
            key={i}
            className="idea"
            value={v}
            placeholder={`Nápad ${i + 1}`}
            onChange={(e) => setIdeas((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
        <div className="open-actions">
          <button className="btn btn-ghost" onClick={() => setIdeas((xs) => [...xs, ''])}>
            + další nápad
          </button>
          <button className="btn btn-primary" disabled={filled.length === 0} onClick={() => onSubmit(filled.join(' • '), filled.length)}>
            Hotovo
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="open">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Piš sem… (nebo si nech pomoct s psaním)" />
      <div className="open-actions">
        <button className="btn btn-primary" disabled={text.trim().length < minLength} onClick={() => onSubmit(text.trim())}>
          Hotovo
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seřazení

export function OrderAnswer({ items, disabled, onSubmit }: { items: string[]; disabled: boolean; onSubmit: (order: string[]) => void }) {
  // Po chybném pokusu pořadí zůstane – stačí opravit, co nesedí.
  const [picked, setPicked] = useState<number[]>([]);
  const long = items.some((x) => x.length > 14);
  const full = picked.length === items.length;
  return (
    <div className={`order${long ? ' long' : ''}`}>
      <ol className="order-slots">
        {items.map((_, i) => (
          <li key={i}>
            <span className="order-num" aria-hidden>
              {i + 1}.
            </span>
            {picked[i] !== undefined ? (
              <button className="order-slot filled" disabled={disabled} onClick={() => setPicked((p) => p.filter((_, j) => j !== i))} aria-label={`${i + 1}. ${items[picked[i]]} – vrátit zpět`}>
                {items[picked[i]]}
              </button>
            ) : (
              <span className="order-slot" />
            )}
          </li>
        ))}
      </ol>
      <div className="order-tiles">
        {items.map((x, i) => (
          <button
            key={i}
            className="order-tile"
            disabled={disabled || picked.includes(i)}
            onClick={() => {
              sfx.tap();
              setPicked((p) => [...p, i]);
            }}
          >
            {x}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" disabled={disabled || !full} onClick={() => onSubmit(picked.map((i) => items[i]))}>
        Hotovo
      </button>
    </div>
  );
}
