// Ostrov blesků: odpovědi, které se zkouší proudem. Hráčka nejdřív
// naplánuje (přepne vypínače, otočí dílky drátu), pak pustí proud a vidí,
// co se rozsvítí. Po chybě zůstane nastavení, aby ho mohla opravit.

import { useEffect, useRef, useState } from 'react';
import { BULB_NAME, batteryShorted, bulbsOf, litBulbs, rotations, switchesOf, traceWires, type SwitchState } from '../../core/circuit';
import { sfx } from '../../core/sound';
import type { BulbColor, CircuitPart, Visual } from '../../core/types';
import { CircuitView, TILE, TileArt } from '../visuals/CircuitVisuals';

const SHOW_MS = 1500;

const sameSet = (a: readonly string[], b: readonly string[]) => [...a].sort().join() === [...b].sort().join();
const names = (bs: BulbColor[]) => {
  const n = bs.map((b) => BULB_NAME[b].nom);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} a ${n[n.length - 1]}`;
};

/** Co se stalo po puštění proudu, když to není správně. */
function switchesVerdict(net: CircuitPart, lit: BulbColor[], target: BulbColor[]): string {
  if (bulbsOf(net).length === 1) return 'Žárovka nesvítí – kruh je někde přerušený.';
  if (!lit.length) return 'Nesvítí nic – proud neoběhne kruh.';
  const extra = lit.filter((b) => !target.includes(b));
  const missing = target.filter((b) => !lit.includes(b));
  if (extra.length && !missing.length) return `Svítí i ${names(extra)}, ta má zůstat zhasnutá.`;
  if (missing.length && !extra.length) return `${names(missing).replace(/^./, (c) => c.toUpperCase())} ještě nesvítí.`;
  return `Svítí ${names(lit)}, ale má svítit ${names(target)}.`;
}

export function SwitchesAnswer({
  net,
  target,
  disabled,
  solution,
  onResult,
}: {
  net: CircuitPart;
  target: BulbColor[];
  disabled: boolean;
  /** Po třech pokusech: správné nastavení vypínačů (s puštěným proudem). */
  solution: SwitchState | null;
  onResult: (ok: boolean) => void;
}) {
  const initial = () => Object.fromEntries(switchesOf(net).map((s) => [s.id, s.on]));
  const [sw, setSw] = useState<SwitchState>(initial);
  const [powered, setPowered] = useState(false);
  const [status, setStatus] = useState('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const busy = disabled || powered;

  const toggle = (id: string) => {
    if (busy) return;
    sfx.tap();
    setStatus('');
    setSw((s) => ({ ...s, [id]: !s[id] }));
  };

  const run = () => {
    if (busy) return;
    const lit = litBulbs(net, sw);
    setPowered(true);
    setStatus('');
    sfx.whoosh();
    const ok = !batteryShorted(net, sw) && sameSet(lit, target);
    timer.current = window.setTimeout(() => {
      if (ok) {
        onResult(true);
        return;
      }
      setStatus(switchesVerdict(net, lit, target));
      timer.current = window.setTimeout(() => {
        setPowered(false);
        onResult(false);
      }, SHOW_MS);
    }, 700);
  };

  const shown = solution ?? sw;
  return (
    <div className="circuit-answer">
      <CircuitView net={net} sw={shown} powered={powered || !!solution} onToggle={busy || solution ? undefined : toggle} />
      <p className={`program-status${status ? ' on' : ''}`} role="status">
        {status}
      </p>
      <button className="btn btn-primary btn-big power-btn" disabled={busy || !!solution} onClick={run}>
        ⚡ Pusť proud
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skládačka drátů

type WiresVisual = Extract<Visual, { type: 'wires' }>;

const STEP_MS = 110;

function wiresVerdict(end: string, bulbs: number): string {
  if (end === 'short') return 'Zkrat! Proud oběhl kruh jen dráty, bez žárovky. Baterka by se zahřívala.';
  if (end === 'partial') return bulbs > 1 ? 'Svítí jen jedna žárovka – kruh musí vést přes obě.' : 'Žárovka nesvítí.';
  return 'Proud se zastavil – tady drát dál nevede.';
}

export function WiresAnswer({
  wires,
  disabled,
  solution,
  onResult,
}: {
  wires: WiresVisual;
  disabled: boolean;
  /** Po třech pokusech: správné otočení všech dílků. */
  solution: number[] | null;
  onResult: (ok: boolean) => void;
}) {
  // Kolikrát se dílek otočil (kvůli plynulému otáčení vždy po směru hodin).
  const [turns, setTurns] = useState<number[]>(() => wires.tiles.map((t) => t.rot));
  const [glow, setGlow] = useState(0);
  const [running, setRunning] = useState(false);
  const [breakAt, setBreakAt] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Ukázka řešení: dílky dotočit do správné polohy.
  useEffect(() => {
    if (!solution) return;
    setTurns((t) => t.map((x, i) => x + ((solution[i] - x) % 4 + 4) % 4));
  }, [solution]);

  const rots = turns.map((t) => t % 4);
  const busy = disabled || running || !!solution;
  const trace = traceWires(wires, rots);
  const shownPath = solution ? trace.path : trace.path.slice(0, glow);
  const litNow = solution || (running && glow >= trace.path.length) ? new Set(trace.end === 'ok' || trace.end === 'partial' ? trace.lit : []) : new Set<number>();

  const turn = (i: number) => {
    if (busy || wires.tiles[i].fixed || rotations(wires.tiles[i]) < 2) return;
    sfx.tap();
    setStatus('');
    setBreakAt(null);
    setTurns((t) => t.map((x, j) => (j === i ? x + 1 : x)));
  };

  const run = () => {
    if (busy) return;
    const tr = traceWires(wires, rots);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRunning(true);
    setStatus('');
    setBreakAt(null);
    setGlow(0);
    sfx.whoosh();
    tr.path.forEach((_, k) => timers.current.push(window.setTimeout(() => setGlow(k + 1), STEP_MS * (k + 1))));
    const done = STEP_MS * (tr.path.length + 1) + 300;
    timers.current.push(
      window.setTimeout(() => {
        if (tr.end === 'ok') {
          onResult(true);
          return;
        }
        if (tr.breakAt !== undefined) setBreakAt(tr.breakAt);
        setStatus(wiresVerdict(tr.end, wires.tiles.filter((t) => t.k === 'bulb').length));
        timers.current.push(
          window.setTimeout(() => {
            setRunning(false);
            setGlow(0);
            onResult(false);
          }, SHOW_MS),
        );
      }, done),
    );
  };

  return (
    <div className="circuit-answer">
      <div className="wires" style={{ gridTemplateColumns: `repeat(${wires.cols}, auto)` }} role="group" aria-label="Skládačka drátů">
        {wires.tiles.map((t, i) => {
          const turnable = !t.fixed && rotations(t) > 1;
          const live = shownPath.includes(i);
          return (
            <button
              key={i}
              className={`wire-tile${t.k === 'empty' ? ' empty' : ''}${t.fixed ? ' fixed' : ''}${breakAt === i ? ' broken' : ''}`}
              disabled={!turnable || busy}
              onClick={() => turn(i)}
              aria-label={t.k === 'battery' ? 'Baterka' : t.k === 'bulb' ? 'Žárovka' : t.k === 'empty' ? 'Prázdné políčko' : `${t.k === 'corner' ? 'Zahnutý' : 'Rovný'} drát, otočit`}
            >
              <svg width={TILE} height={TILE} viewBox={`0 0 ${TILE} ${TILE}`} aria-hidden>
                <g style={{ transform: `rotate(${turns[i] * 90}deg)`, transformOrigin: '50% 50%' }} className="tile-turn">
                  <TileArt tile={t} live={live} lit={litNow.has(i)} />
                </g>
              </svg>
            </button>
          );
        })}
      </div>
      <p className={`program-status${status ? ' on' : ''}`} role="status">
        {status}
      </p>
      <button className="btn btn-primary btn-big power-btn" disabled={busy} onClick={run}>
        ⚡ Pusť proud
      </button>
    </div>
  );
}
