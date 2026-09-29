// Program letu: hráčka skládá šipky, drak podle nich letí po mřížce. Po
// chybě program zůstane, aby ho mohla opravit (hledání chyby je polovina
// programování).

import { useEffect, useRef, useState } from 'react';
import { ARROW, COMPASS_WORD, DELTA, MOVE_WORD, fly, sameCell, type Flight } from '../../core/grid';
import { sfx } from '../../core/sound';
import type { Cell, Move, Visual } from '../../core/types';
import type { DragonMood } from './Dragon';
import { GridView } from '../visuals/WorldVisuals';

type GridVisual = Extract<Visual, { type: 'grid' }>;

const STEP_MS = 420;
const PAD_ORDER: (Move | null)[] = [null, 'U', null, 'L', null, 'R', null, 'D', null];
const COMPASS_LETTER: Record<Move, string> = { U: 'S', R: 'V', D: 'J', L: 'Z' };

function whatHappened(f: Flight): string {
  const step = f.stoppedAt + 1;
  switch (f.end) {
    case 'rock':
      return `V ${step}. kroku drak narazil do skály.`;
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
  disabled,
  solution,
  onResult,
}: {
  grid: GridVisual;
  maxSteps: number;
  collect: Cell[];
  disabled: boolean;
  /** Po třech pokusech: nakreslit správnou cestu. */
  solution: Move[] | null;
  onResult: (ok: boolean) => void;
}) {
  const [program, setProgram] = useState<Move[]>([]);
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
  const full = program.length >= maxSteps;
  const word = grid.compass ? COMPASS_WORD : MOVE_WORD;

  const add = (m: Move) => {
    if (busy || full) return;
    sfx.tap();
    setStatus('');
    setProgram((p) => [...p, m]);
  };
  const removeAt = (i: number) => {
    if (busy || i < 0) return;
    setStatus('');
    setProgram((p) => p.filter((_, j) => j !== i));
  };

  const run = () => {
    if (busy || program.length === 0 || !grid.dragon || !grid.goal) return;
    const f = fly({ cols: grid.cols, rows: grid.rows, dragon: grid.dragon, goal: grid.goal, rocks: grid.rocks }, program, collect);
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setFlying(true);
    setStatus('');
    setCollected([]);
    setPos(grid.dragon);
    setMood('happy');
    sfx.whoosh();
    f.path.slice(1).forEach((cell, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setPos(cell);
          const seen = f.path.slice(0, i + 2);
          setCollected(collect.flatMap((egg, j) => (seen.some((c) => sameCell(c, egg)) ? [j] : [])));
        }, STEP_MS * (i + 1)),
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
        if (f.end === 'rock' || f.end === 'edge') {
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
            setMood('idle');
            setFlying(false);
            onResult(false);
          }, 1300),
        );
      }, STEP_MS * f.path.length),
    );
  };

  // Klávesnice: šipky přidávají kroky, Backspace maže, Enter spouští let.
  const keysRef = useRef({ run, add, back: () => removeAt(program.length - 1) });
  keysRef.current = { run, add, back: () => removeAt(program.length - 1) };
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

  return (
    <div className="program">
      <GridView grid={grid} dragonAt={solution ? undefined : pos} mood={mood} collected={collected} solution={solution ?? undefined} bump={bump} crash={crash} />
      <p className={`program-status${status ? ' on' : ''}`} role="status">
        {status}
      </p>
      <div className="program-strip" aria-label={`Program: ${program.map((m) => word[m]).join(', ') || 'zatím prázdný'}`}>
        {Array.from({ length: maxSteps }, (_, i) =>
          program[i] ? (
            <button key={i} className="pstep" disabled={busy} onClick={() => removeAt(i)} aria-label={`${i + 1}. krok ${word[program[i]]} – smazat`}>
              {ARROW[program[i]]}
            </button>
          ) : (
            <span key={i} className="pstep empty" aria-hidden />
          ),
        )}
      </div>
      <div className="program-controls">
        <div className="dpad">
          {PAD_ORDER.map((m, i) =>
            m ? (
              <button key={i} className="dkey" disabled={busy || full} onClick={() => add(m)} aria-label={word[m]}>
                <span className="dkey-arrow">{ARROW[m]}</span>
                {grid.compass && <span className="dkey-letter">{COMPASS_LETTER[m]}</span>}
              </button>
            ) : i === 4 ? (
              <button key={i} className="dkey dkey-back" disabled={busy || program.length === 0} onClick={() => removeAt(program.length - 1)} aria-label="Smazat poslední krok">
                ⌫
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        <div className="program-go">
          <span className="program-count">
            {program.length} z {maxSteps} kroků
          </span>
          <button className="btn btn-primary btn-big" disabled={busy || program.length === 0} onClick={run}>
            Leť!
          </button>
        </div>
      </div>
    </div>
  );
}
