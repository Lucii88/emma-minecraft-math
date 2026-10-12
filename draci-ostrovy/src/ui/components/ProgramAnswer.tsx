// Program letu: hráčka skládá šipky, drak podle nich letí po mřížce. Po
// chybě program zůstane, aby ho mohla opravit (hledání chyby je polovina
// programování). Tři podoby: šipky po krocích, příkazy „→ ×3“ (stejné šipky
// za sebou se spojí, příkazů je omezeně) a blok „Opakuj n× (vzor)“.

import { useEffect, useRef, useState } from 'react';
import { ARROW, COMPASS_WORD, DELTA, MOVE_WORD, fly, repeatPattern, runsOf, sameCell, type Flight } from '../../core/grid';
import { sfx } from '../../core/sound';
import type { Cell, Move, Visual } from '../../core/types';
import type { DragonMood } from './Dragon';
import { GridView } from '../visuals/WorldVisuals';

type GridVisual = Extract<Visual, { type: 'grid' }>;

const STEP_MS = 420;
const FAST_STEP_MS = 260; // dlouhé lety (příkazy, opakování)
const PAD_ORDER: (Move | null)[] = [null, 'U', null, 'L', null, 'R', null, 'D', null];
const COMPASS_LETTER: Record<Move, string> = { U: 'S', R: 'V', D: 'J', L: 'Z' };

function whatHappened(f: Flight): string {
  const step = f.stoppedAt + 1;
  switch (f.end) {
    case 'rock':
      return `V ${step}. kroku drak narazil do skály.`;
    case 'gate':
      return `V ${step}. kroku drak narazil do zavřené brány – nejdřív musí sebrat klíč.`;
    case 'edge':
      return `V ${step}. kroku by drak vyletěl z mapy.`;
    case 'goal':
      return 'Drak doletěl do cíle, ale cestou nesebral všechna vajíčka.';
    default:
      return 'Drak doletěl jinam než do cíle.';
  }
}

export function ProgramAnswer({
  grid,
  maxSteps,
  collect,
  maxBlocks,
  loop,
  disabled,
  solution,
  onResult,
}: {
  grid: GridVisual;
  maxSteps: number;
  collect: Cell[];
  /** Příkazy „krok × počet“: nejvýš tolik příkazů. */
  maxBlocks?: number;
  /** Blok Opakuj: vzor nejvýš maxPattern šipek, nejvýš maxRepeat opakování. */
  loop?: { maxPattern: number; maxRepeat: number };
  disabled: boolean;
  /** Po třech pokusech: nakreslit správnou cestu. */
  solution: Move[] | null;
  onResult: (ok: boolean) => void;
}) {
  const [steps, setSteps] = useState<Move[]>([]);
  const [times, setTimes] = useState(2);
  const [keyTaken, setKeyTaken] = useState(false);
  const [flying, setFlying] = useState(false);
  const [pos, setPos] = useState<Cell | undefined>();
  const [collected, setCollected] = useState<number[]>([]);
  const [mood, setMood] = useState<DragonMood>('idle');
  const [bump, setBump] = useState(false);
  const [crash, setCrash] = useState<Cell | undefined>();
  const [status, setStatus] = useState('');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const busy = disabled || flying;
  const word = grid.compass ? COMPASS_WORD : MOVE_WORD;
  // Šipky, které hráčka poskládala (u Opakuj je to vzor), a celý let.
  const program = loop ? repeatPattern(steps, times) : steps;
  const runs = runsOf(steps);
  const lastMove = steps[steps.length - 1];
  const canAdd = (m: Move) =>
    loop ? steps.length < loop.maxPattern : maxBlocks ? steps.length < maxSteps && (m === lastMove || runs.length < maxBlocks) : steps.length < maxSteps;

  const add = (m: Move) => {
    if (busy || !canAdd(m)) return;
    sfx.tap();
    setStatus('');
    setSteps((p) => [...p, m]);
  };
  const removeAt = (i: number) => {
    if (busy || i < 0) return;
    setStatus('');
    setSteps((p) => p.filter((_, j) => j !== i));
  };
  /** U příkazů: klepnutí na příkaz ubere jeden krok (poslední v příkazu). */
  const shrinkRun = (r: number) => {
    let end = 0;
    for (let i = 0; i <= r; i++) end += runs[i].times;
    removeAt(end - 1);
  };
  const changeTimes = (d: number) => {
    if (busy || !loop) return;
    sfx.tap();
    setStatus('');
    setTimes((t) => Math.min(loop.maxRepeat, Math.max(2, t + d)));
  };

  const run = () => {
    if (busy || program.length === 0 || !grid.dragon || !grid.goal) return;
    const f = fly({ cols: grid.cols, rows: grid.rows, dragon: grid.dragon, goal: grid.goal, rocks: grid.rocks, key: grid.key, gate: grid.gate }, program, collect);
    const stepMs = program.length > 14 ? FAST_STEP_MS : STEP_MS;
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setFlying(true);
    setStatus('');
    setCollected([]);
    setKeyTaken(f.keyAt === 0);
    setPos(grid.dragon);
    setMood('happy');
    sfx.whoosh();
    f.path.slice(1).forEach((cell, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setPos(cell);
          const seen = f.path.slice(0, i + 2);
          setCollected(collect.flatMap((egg, j) => (seen.some((c) => sameCell(c, egg)) ? [j] : [])));
          if (f.keyAt !== undefined && i + 1 >= f.keyAt) setKeyTaken(true);
        }, stepMs * (i + 1)),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        if (f.ok) {
          setFlying(false);
          onResult(true);
          return;
        }
        setMood('oops');
        if (f.end === 'rock' || f.end === 'edge' || f.end === 'gate') {
          const last = f.path[f.path.length - 1];
          const d = DELTA[program[f.stoppedAt]];
          setBump(true);
          setCrash({ x: last.x + d.x, y: last.y + d.y });
        }
        setStatus(whatHappened(f));
        timers.current.push(
          window.setTimeout(() => {
            setBump(false);
            setCrash(undefined);
            setPos(undefined);
            setCollected([]);
            setKeyTaken(false);
            setMood('idle');
            setFlying(false);
            onResult(false);
          }, 1300),
        );
      }, stepMs * f.path.length),
    );
  };

  // Klávesnice: šipky přidávají kroky, Backspace maže, Enter spouští let.
  const keysRef = useRef({ run, add, back: () => removeAt(steps.length - 1) });
  keysRef.current = { run, add, back: () => removeAt(steps.length - 1) };
  useEffect(() => {
    const keys: Record<string, Move> = { ArrowUp: 'U', ArrowRight: 'R', ArrowDown: 'D', ArrowLeft: 'L' };
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (keys[e.key]) {
        e.preventDefault();
        keysRef.current.add(keys[e.key]);
      } else if (e.key === 'Backspace') {
        keysRef.current.back();
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        keysRef.current.run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const strip = loop ? (
    <div className="program-loop" aria-label={`Opakuj ${times}krát: ${steps.map((m) => word[m]).join(', ') || 'zatím prázdný vzor'}`}>
      <div className="loop-head">
        <span className="loop-title">🔁 Opakuj</span>
        <button className="loop-btn" disabled={busy || times <= 2} onClick={() => changeTimes(-1)} aria-label="Méněkrát">
          −
        </button>
        <span className="loop-times">{times}×</span>
        <button className="loop-btn" disabled={busy || times >= loop.maxRepeat} onClick={() => changeTimes(1)} aria-label="Vícekrát">
          +
        </button>
      </div>
      <div className="program-strip loop-body">
        {Array.from({ length: loop.maxPattern }, (_, i) =>
          steps[i] ? (
            <button key={i} className="pstep" disabled={busy} onClick={() => removeAt(i)} aria-label={`${i + 1}. šipka vzoru ${word[steps[i]]} – smazat`}>
              {ARROW[steps[i]]}
            </button>
          ) : (
            <span key={i} className="pstep empty" aria-hidden />
          ),
        )}
      </div>
    </div>
  ) : maxBlocks ? (
    <div className="program-strip blocks" aria-label={`Program: ${runs.map((r) => `${r.times}krát ${word[r.move]}`).join(', ') || 'zatím prázdný'}`}>
      {Array.from({ length: maxBlocks }, (_, i) =>
        runs[i] ? (
          <button key={i} className="pstep pblock" disabled={busy} onClick={() => shrinkRun(i)} aria-label={`${i + 1}. příkaz: ${runs[i].times}krát ${word[runs[i].move]} – ubrat krok`}>
            {ARROW[runs[i].move]}
            <span className="ptimes">×{runs[i].times}</span>
          </button>
        ) : (
          <span key={i} className="pstep pblock empty" aria-hidden />
        ),
      )}
    </div>
  ) : (
    <div className="program-strip" aria-label={`Program: ${steps.map((m) => word[m]).join(', ') || 'zatím prázdný'}`}>
      {Array.from({ length: maxSteps }, (_, i) =>
        steps[i] ? (
          <button key={i} className="pstep" disabled={busy} onClick={() => removeAt(i)} aria-label={`${i + 1}. krok ${word[steps[i]]} – smazat`}>
            {ARROW[steps[i]]}
          </button>
        ) : (
          <span key={i} className="pstep empty" aria-hidden />
        ),
      )}
    </div>
  );
  const countText = loop
    ? `vzor ${steps.length} z ${loop.maxPattern} · let ${program.length} kroků`
    : maxBlocks
      ? `${runs.length} z ${maxBlocks} příkazů`
      : `${steps.length} z ${maxSteps} kroků`;

  return (
    <div className="program">
      <GridView grid={grid} dragonAt={solution ? undefined : pos} mood={mood} collected={collected} keyTaken={keyTaken} solution={solution ?? undefined} bump={bump} crash={crash} />
      <p className={`program-status${status ? ' on' : ''}`} role="status">
        {status}
      </p>
      {strip}
      <div className="program-controls">
        <div className="dpad">
          {PAD_ORDER.map((m, i) =>
            m ? (
              <button key={i} className="dkey" disabled={busy || !canAdd(m)} onClick={() => add(m)} aria-label={word[m]}>
                <span className="dkey-arrow">{ARROW[m]}</span>
                {grid.compass && <span className="dkey-letter">{COMPASS_LETTER[m]}</span>}
              </button>
            ) : i === 4 ? (
              <button key={i} className="dkey dkey-back" disabled={busy || steps.length === 0} onClick={() => removeAt(steps.length - 1)} aria-label="Smazat poslední krok">
                ⌫
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        <div className="program-go">
          <span className="program-count">{countText}</span>
          <button className="btn btn-primary btn-big" disabled={busy || program.length === 0} onClick={run}>
            Leť!
          </button>
        </div>
      </div>
    </div>
  );
}
