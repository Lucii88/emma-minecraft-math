// Vizuály ostrovů druhé fáze: mřížka s drakem (mapy, program letu), karty,
// sloupcový graf, očíslovaný postup a tabulka (sudoku, matice, šifry).

import type { ReactNode } from 'react';
import { useGame } from '../../core/game';
import { DELTA, insideGrid, sameCell } from '../../core/grid';
import { formatNumber } from '../../core/czech';
import type { Cell, Move, Visual } from '../../core/types';
import { Dragon, type DragonMood } from '../components/Dragon';

type GridVisual = Extract<Visual, { type: 'grid' }>;

const INK = '#2b2d42';
const SEA = '#2f7fa8';
const CELL = 60;
const PAD = 6;

const center = (c: Cell) => ({ x: PAD + c.x * CELL + CELL / 2, y: PAD + c.y * CELL + CELL / 2 });

function Rock({ c }: { c: Cell }) {
  const { x, y } = center(c);
  return (
    <g>
      <path d={`M${x - 22},${y + 16} L${x - 16},${y - 8} L${x - 4},${y - 18} L${x + 12},${y - 12} L${x + 22},${y + 4} L${x + 20},${y + 16} Z`} fill="#8d8a82" stroke="#5c5a55" strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x - 10},${y - 8} L${x - 2},${y - 13} L${x + 8},${y - 9}`} fill="none" stroke="#b5b2aa" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Nest({ c }: { c: Cell }) {
  const { x, y } = center(c);
  return (
    <g>
      <ellipse cx={x} cy={y + 8} rx="24" ry="11" fill="#8c5a3c" stroke="#5b3a29" strokeWidth="3" />
      <ellipse cx={x} cy={y + 4} rx="17" ry="6" fill="#5b3a29" />
      <path d={`M${x - 22},${y + 6} q8,-6 16,0 M${x - 4},${y + 12} q8,-6 16,0 M${x + 6},${y + 5} q7,-5 14,1`} fill="none" stroke="#c08a5b" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function GridEgg({ c, gone }: { c: Cell; gone: boolean }) {
  const { x, y } = center(c);
  return (
    <g className={`grid-egg${gone ? ' gone' : ''}`}>
      <ellipse cx={x} cy={y + 2} rx="12" ry="16" fill="#fff4d6" stroke="#c9a15b" strokeWidth="2.5" />
      <circle cx={x + 4} cy={y + 6} r="2.5" fill="#e9c46a" />
      <circle cx={x - 4} cy={y - 2} r="2" fill="#e9c46a" />
      <ellipse cx={x - 4} cy={y - 6} rx="3" ry="5" fill="#fff" opacity="0.7" />
    </g>
  );
}

/** Nakreslený program: čára po políčkách, číslo kroku v políčku, kam krok
 *  vede, a ✖ tam, kde by drak narazil. Program se kreslí celý i přes skálu,
 *  aby bylo vidět, co měl drak v plánu; jen z mapy už čára nevede. */
function PathLine({ grid, path, tone }: { grid: GridVisual; path: Move[]; tone: 'bug' | 'solution' }) {
  if (!grid.dragon) return null;
  const color = tone === 'bug' ? '#7b2cbf' : '#2a9d8f';
  const rocks = new Set((grid.rocks ?? []).map((c) => `${c.x},${c.y}`));
  const pts = [center(grid.dragon)];
  const labels: { x: number; y: number; n: number }[] = [];
  const crashes: { x: number; y: number }[] = [];
  let pos = grid.dragon;
  for (let i = 0; i < path.length; i++) {
    const d = DELTA[path[i]];
    const next = { x: pos.x + d.x, y: pos.y + d.y };
    const from = center(pos);
    if (!insideGrid(grid, next)) {
      const edge = { x: from.x + (d.x * CELL) / 2, y: from.y + (d.y * CELL) / 2 };
      pts.push(edge);
      crashes.push(edge);
      break;
    }
    const to = center(next);
    pts.push(to);
    if (rocks.has(`${next.x},${next.y}`)) crashes.push(to);
    // Číslo kroku v políčku, kam krok vede (při návratu na stejné políčko
    // o kousek posunuté, ať se čísla nepřekrývají).
    const again = labels.filter((l) => l.x === to.x && l.y === to.y).length;
    labels.push({ x: to.x + again * 14 - (again ? 7 : 0), y: to.y - 16 + again * 4, n: i + 1 });
    pos = next;
  }
  return (
    <g className="grid-path" aria-hidden>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth="5" strokeDasharray={tone === 'bug' ? '10 8' : undefined} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {labels.map((l) => (
        <g key={l.n}>
          <circle cx={l.x} cy={l.y} r="11" fill="#fff" stroke={color} strokeWidth="2.5" />
          <text x={l.x} y={l.y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="13" fill={color}>
            {l.n}
          </text>
        </g>
      ))}
      {crashes.map((c, i) => (
        <CrashMark key={i} x={c.x} y={c.y + 8} />
      ))}
    </g>
  );
}

function CrashMark({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="900" fill="#e63946" stroke="#fff" strokeWidth="1.5" paintOrder="stroke">
      ✖
    </text>
  );
}

function Compass() {
  return (
    <svg className="compass" viewBox="0 0 80 80" width="72" height="72" role="img" aria-label="Světové strany: sever nahoře, jih dole, východ vpravo, západ vlevo">
      <circle cx="40" cy="40" r="22" fill="#fffdf6" stroke={INK} strokeWidth="2.5" />
      <path d="M40,20 L45,40 L40,60 L35,40 Z" fill={SEA} />
      <path d="M20,40 L40,35 L60,40 L40,45 Z" fill="#8d99ae" />
      <path d="M40,20 L45,40 L35,40 Z" fill="#e63946" />
      {[
        ['S', 40, 9],
        ['J', 40, 75],
        ['V', 73, 42],
        ['Z', 7, 42],
      ].map(([t, x, y]) => (
        <text key={t as string} x={x as number} y={y as number} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="15" fill={INK}>
          {t}
        </text>
      ))}
    </svg>
  );
}

export interface GridViewProps {
  grid: GridVisual;
  /** Kde drak právě je (při letu). Výchozí = start z mřížky. */
  dragonAt?: Cell;
  mood?: DragonMood;
  /** Indexy sebraných vajíček (zmizí). */
  collected?: number[];
  /** Cesta k nakreslení místo `grid.path` (řešení po třech pokusech). */
  solution?: Move[];
  /** Drak se otřese (náraz). */
  bump?: boolean;
  /** Políčko, do kterého drak při letu narazil (i mimo mapu) – ukáže se ✖. */
  crash?: Cell;
}

export function GridView({ grid, dragonAt, mood = 'idle', collected = [], solution, bump = false, crash }: GridViewProps) {
  const look = useGame((s) => s.profile.dragon);
  const w = grid.cols * CELL + PAD * 2;
  const h = grid.rows * CELL + PAD * 2;
  const pos = dragonAt ?? grid.dragon;
  const placeOnGoal = grid.goal ? grid.places?.find((p) => sameCell(p, grid.goal!)) : undefined;
  const label = [
    `Mapa ${grid.cols} krát ${grid.rows} políček.`,
    grid.dragon ? 'Je na ní tvůj drak.' : '',
    grid.goal ? (placeOnGoal ? `Cíl: ${placeOnGoal.name}.` : 'Cíl: hnízdo.') : '',
    grid.rocks?.length ? `Skály: ${grid.rocks.length}.` : '',
    grid.eggs?.length ? `Vajíčka k sebrání: ${grid.eggs.length}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid-wrap">
      <div className="grid-board" style={{ maxWidth: Math.min(w * 1.15, 560) }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="grid-svg" role="img" aria-label={label}>
          <rect x="0" y="0" width={w} height={h} rx="14" fill="#1d4e73" />
          {Array.from({ length: grid.rows }, (_, y) =>
            Array.from({ length: grid.cols }, (_, x) => (
              <rect key={`${x}-${y}`} x={PAD + x * CELL + 1} y={PAD + y * CELL + 1} width={CELL - 2} height={CELL - 2} rx="8" fill={(x + y) % 2 ? '#bfe6f5' : '#d4eff9'} />
            )),
          )}
          {grid.goal && !placeOnGoal && <Nest c={grid.goal} />}
          {grid.goal && placeOnGoal && <circle cx={center(grid.goal).x} cy={center(grid.goal).y} r="26" fill="#fff2dc" stroke="#ffb703" strokeWidth="4" strokeDasharray="7 5" />}
          {grid.rocks?.map((c, i) => <Rock key={i} c={c} />)}
          {grid.places?.map((p, i) => (
            <text key={i} x={center(p).x} y={center(p).y + 2} textAnchor="middle" dominantBaseline="middle" fontSize="32">
              {p.emoji}
            </text>
          ))}
          {grid.eggs?.map((c, i) => <GridEgg key={i} c={c} gone={collected.includes(i)} />)}
          {(solution ?? grid.path) && <PathLine grid={grid} path={solution ?? grid.path!} tone={solution ? 'solution' : 'bug'} />}
          {crash && pos && (
            <CrashMark
              x={(center(pos).x + center(crash).x) / 2}
              y={(center(pos).y + center(crash).y) / 2 + 8}
            />
          )}
        </svg>
        {pos && (
          <div
            className={`grid-dragon${bump ? ' bump' : ''}`}
            style={{ left: `${((PAD + pos.x * CELL + CELL / 2) / w) * 100}%`, top: `${((PAD + pos.y * CELL + CELL / 2) / h) * 100}%`, width: `${(CELL / w) * 118}%` }}
            aria-hidden
          >
            {look ? <Dragon look={look} mood={mood} size={120} /> : <span className="grid-dragon-emoji">🐉</span>}
          </div>
        )}
      </div>
      {(grid.compass || grid.places?.length) && (
        <div className="grid-side">
          {grid.compass && <Compass />}
          {grid.places && grid.places.length > 0 && (
            <ul className="grid-legend" aria-label="Legenda mapy">
              {grid.places.map((p, i) => (
                <li key={i}>
                  <span aria-hidden>{p.emoji}</span> {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Karty, graf, postup, tabulka

export function CardsView({ cards }: { cards: Extract<Visual, { type: 'cards' }>['cards'] }) {
  return (
    <div className={`vcards n${cards.length}`}>
      {cards.map((c, i) => (
        <div key={i} className={`vcard${c.mark ? ' mark' : ''}`}>
          <span className="vcard-emoji" aria-hidden>
            {c.emoji}
          </span>
          <strong className="vcard-title">{c.title}</strong>
          {c.lines?.map((l, j) => (
            <span key={j} className="vcard-line">
              {l}
            </span>
          ))}
          {c.tag && <span className="vcard-tag">{c.tag}</span>}
        </div>
      ))}
    </div>
  );
}

/** Pěkný krok osy: 1, 2, 5, 10, 20, 50… tak, aby vyšlo 3–6 čar. */
function niceStep(max: number): number {
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}

const BAR_COLORS = ['#2f7fa8', '#ff8a1f', '#2a9d8f', '#7b2cbf', '#e76f51', '#588157', '#e9c46a', '#1d3557'];

export function BarsView({ title, unit, bars }: Extract<Visual, { type: 'bars' }>) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const slot = 78;
  const left = 44;
  const chartH = 200;
  const base = 30 + chartH;
  const w = left + bars.length * slot + 12;
  const h = base + (bars.some((b) => b.emoji) ? 70 : 44);
  const y = (v: number) => base - (v / top) * chartH;
  const lines: number[] = [];
  for (let v = 0; v <= top; v += step) lines.push(v);
  return (
    <figure className="bars">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox={`0 0 ${w} ${h}`} className="visual-svg" style={{ maxWidth: w * 1.1, width: '100%' }} role="img" aria-label={`${title ?? 'Graf'}: ${bars.map((b) => `${b.label} ${b.value}${unit ? ` ${unit}` : ''}`).join(', ')}`}>
        {lines.map((v) => (
          <g key={v}>
            <line x1={left - 6} x2={w - 8} y1={y(v)} y2={y(v)} stroke="#d9d3c3" strokeWidth={v === 0 ? 3 : 1.5} />
            <text x={left - 10} y={y(v) + 1} textAnchor="end" dominantBaseline="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="14" fill="#5c6178">
              {formatNumber(v)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const x = left + i * slot + 12;
          const bw = slot - 24;
          return (
            <g key={b.label}>
              <rect x={x} y={y(b.value)} width={bw} height={Math.max(0, base - y(b.value))} rx="6" fill={BAR_COLORS[i % BAR_COLORS.length]} stroke={INK} strokeWidth="2" />
              <text x={x + bw / 2} y={y(b.value) - 10} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="18" fill={INK}>
                {formatNumber(b.value)}
              </text>
              {b.emoji && (
                <text x={x + bw / 2} y={base + 26} textAnchor="middle" dominantBaseline="middle" fontSize="24">
                  {b.emoji}
                </text>
              )}
              <text x={x + bw / 2} y={base + (b.emoji ? 56 : 24)} textAnchor="middle" dominantBaseline="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize={b.label.length > 8 ? 12 : 15} fill={INK}>
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      {unit && <p className="bars-unit">Jednotka: {unit}</p>}
    </figure>
  );
}

export function StepsView({ title, steps, highlight }: Extract<Visual, { type: 'steps' }>) {
  return (
    <div className="vsteps">
      {title && <h3>{title}</h3>}
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={i === highlight ? 'hl' : undefined}>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TableView({ cols, cells, ask, boxes, head }: Extract<Visual, { type: 'table' }>) {
  const rows = Math.ceil(cells.length / cols);
  // Velikost písma podle nejdelšího obsahu (počet znaků, emoji = 1–2).
  const longest = Math.max(1, ...cells.map((c) => [...String(c ?? '')].length));
  const size = longest > 6 ? 'xs' : longest > 3 ? 'sm' : `l${longest}`;
  const cellW = longest >= 3 ? 112 : 84;
  return (
    <div className={`vtable ${size}${boxes ? ' sudoku' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * cellW }} role="table" aria-label={`Tabulka ${cols} krát ${rows}`}>
      {cells.map((c, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const cls = ['vcell'];
        if (i === ask) cls.push('ask');
        else if (c === null) cls.push('empty');
        if (head === 'row' && y === 0) cls.push('head');
        if (boxes) {
          if (x % boxes[0] === 0 && x > 0) cls.push('bl');
          if (y % boxes[1] === 0 && y > 0) cls.push('bt');
        }
        return (
          <div key={i} className={cls.join(' ')} role="cell">
            {i === ask ? '?' : c === null ? '' : typeof c === 'number' ? formatNumber(c) : c}
          </div>
        );
      })}
    </div>
  );
}

export function renderWorldVisual(v: Visual): ReactNode | null {
  switch (v.type) {
    case 'grid':
      return <GridView grid={v} />;
    case 'cards':
      return <CardsView cards={v.cards} />;
    case 'bars':
      return <BarsView {...v} />;
    case 'steps':
      return <StepsView {...v} />;
    case 'table':
      return <TableView {...v} />;
    default:
      return null;
  }
}

/** Co z vizuálu přečíst nahlas (u karet, grafu a postupu je to podstatná
 *  část zadání). */
export function visualSpeech(v: Visual | undefined): string {
  if (!v) return '';
  switch (v.type) {
    case 'cards':
      return v.cards.map((c) => [c.title, ...(c.lines ?? []), c.tag ?? ''].filter(Boolean).join(', ')).join('. ') + '.';
    case 'bars':
      return `${v.title ? `${v.title}. ` : ''}${v.bars.map((b) => `${b.label}: ${b.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ')}.`;
    case 'steps':
      return `${v.title ? `${v.title}. ` : ''}${v.steps.map((s, i) => `${i + 1}. ${s}`).join(' ')}`;
    default:
      return '';
  }
}
