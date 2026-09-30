import type { ReactNode } from 'react';
import { formatNumber as f } from '../../core/czech';
import type { Visual } from '../../core/types';

const INK = '#2b2d42';
const PAPER = '#fffdf6';
const ACCENT = '#ff8a1f';
const SEA = '#2f7fa8';

function Box({ x, y, w = 64, h = 52, value, ask, blank }: { x: number; y: number; w?: number; h?: number; value?: number | string | null; ask?: boolean; blank?: boolean }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="14" fill={ask ? '#fff2dc' : PAPER} stroke={ask ? ACCENT : INK} strokeWidth={ask ? 4 : 3} strokeDasharray={blank ? '6 6' : undefined} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize={String(value ?? '').length > 3 ? 22 : 28} fill={ask ? ACCENT : INK}>
        {ask ? '?' : blank ? '' : typeof value === 'number' ? f(value) : value}
      </text>
    </g>
  );
}

function Frame({ children, w, h, label }: { children: ReactNode; w: number; h: number; label: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="visual-svg" role="img" aria-label={label} style={{ maxWidth: w, width: '100%' }}>
      {children}
    </svg>
  );
}

export function ClockView({ h, m }: { h: number; m: number }) {
  const hourA = ((h % 12) + m / 60) * 30;
  const minA = m * 6;
  const hand = (angle: number, len: number) => {
    const r = (angle - 90) * (Math.PI / 180);
    return { x2: 100 + len * Math.cos(r), y2: 100 + len * Math.sin(r) };
  };
  return (
    <Frame w={200} h={200} label="Ručičkové hodiny">
      <circle cx="100" cy="100" r="92" fill={PAPER} stroke={INK} strokeWidth="6" />
      {Array.from({ length: 60 }, (_, i) => {
        const r = (i * 6 - 90) * (Math.PI / 180);
        const long = i % 5 === 0;
        return <line key={i} x1={100 + (long ? 74 : 80) * Math.cos(r)} y1={100 + (long ? 74 : 80) * Math.sin(r)} x2={100 + 86 * Math.cos(r)} y2={100 + 86 * Math.sin(r)} stroke={INK} strokeWidth={long ? 3 : 1.2} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const r = (n * 30 - 90) * (Math.PI / 180);
        return (
          <text key={n} x={100 + 60 * Math.cos(r)} y={101 + 60 * Math.sin(r)} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="18" fill={INK}>
            {n}
          </text>
        );
      })}
      <line x1="100" y1="100" {...hand(hourA, 42)} stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <line x1="100" y1="100" {...hand(minA, 70)} stroke={SEA} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill={ACCENT} />
    </Frame>
  );
}

function EggShape({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx="9" ry="12" fill="#fff4d6" stroke="#c9a15b" strokeWidth="2" />
      <ellipse cx={x - 3} cy={y - 4} rx="2.5" ry="4" fill="#fff" opacity="0.7" />
    </g>
  );
}

export function EggsView({ groups, perGroup, hidden }: { groups: number; perGroup: number; hidden?: boolean }) {
  const perRow = Math.min(5, groups);
  const rows = Math.ceil(groups / perRow);
  const nestW = 112;
  const nestH = 86;
  const w = perRow * nestW + 16;
  const h = rows * nestH + 12;
  return (
    <Frame w={w} h={h} label={`${groups} hnízd, v každém ${perGroup} vajec`}>
      {Array.from({ length: groups }, (_, g) => {
        const cx = 8 + (g % perRow) * nestW + nestW / 2;
        const cy = 8 + Math.floor(g / perRow) * nestH + nestH / 2;
        const cols = Math.min(5, perGroup);
        const eggRows = Math.ceil(perGroup / cols);
        return (
          <g key={g}>
            <ellipse cx={cx} cy={cy + 22} rx="50" ry="14" fill="#8c5a3c" />
            <ellipse cx={cx} cy={cy + 18} rx="44" ry="9" fill="#5b3a29" />
            {!hidden &&
              Array.from({ length: perGroup }, (_, e) => {
                const ex = cx - ((cols - 1) * 19) / 2 + (e % cols) * 19;
                const ey = cy + 8 - (eggRows - 1 - Math.floor(e / cols)) * 22;
                return <EggShape key={e} x={ex} y={ey} />;
              })}
          </g>
        );
      })}
    </Frame>
  );
}

export function FractionView({ parts, filled, shape }: { parts: number; filled: number; shape: 'pie' | 'bar' }) {
  if (shape === 'bar') {
    const w = 300;
    const segW = w / parts;
    return (
      <Frame w={w + 20} h={100} label={`Čokoláda rozdělená na ${parts} dílů`}>
        {Array.from({ length: parts }, (_, i) => (
          <rect key={i} x={10 + i * segW} y={15} width={segW} height={70} fill={i < filled ? '#8d5524' : '#f3e3c3'} stroke={INK} strokeWidth="3" rx="4" />
        ))}
      </Frame>
    );
  }
  const r = 80;
  const c = 90;
  return (
    <Frame w={180} h={180} label={`Koláč rozdělený na ${parts} dílů`}>
      <circle cx={c} cy={c} r={r} fill="#f3e3c3" stroke={INK} strokeWidth="3" />
      {Array.from({ length: parts }, (_, i) => {
        const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`;
        return <path key={i} d={d} fill={i < filled ? ACCENT : '#f3e3c3'} stroke={INK} strokeWidth="3" strokeLinejoin="round" />;
      })}
    </Frame>
  );
}

/** Řada (čísla nebo obrázky). Dlaždice se na úzkém displeji zalomí, písmo
 *  se zmenší podle nejdelší položky (víc emoji v jednom políčku). */
export function SeriesView({ items }: { items: (number | string | null)[] }) {
  const longest = Math.max(1, ...items.map((v) => [...String(v ?? '')].length));
  const size = longest > 4 ? 'xs' : longest > 2 ? 'sm' : 'md';
  const pictures = items.some((v) => typeof v === 'string' && !/^[\d\s.,−-]+$/.test(v));
  return (
    <ol className={`vseries ${size}`} aria-label={pictures ? 'Řada obrázků' : 'Řada čísel'}>
      {items.map((v, i) => (
        <li key={i} className={v === null ? 'ask' : undefined}>
          {v === null ? '?' : typeof v === 'number' ? f(v) : v}
        </li>
      ))}
    </ol>
  );
}

export function TriangleView({ vertices, edges, ask }: { vertices: (number | null)[]; edges: (number | null)[]; ask: { part: 'vertex' | 'edge'; index: number } }) {
  const P = [
    { x: 170, y: 40 },
    { x: 50, y: 240 },
    { x: 290, y: 240 },
  ];
  const mid = (a: number, b: number) => ({ x: (P[a].x + P[b].x) / 2, y: (P[a].y + P[b].y) / 2 });
  const E = [mid(0, 1), mid(1, 2), mid(2, 0)];
  const offset = [
    { x: -38, y: -8 },
    { x: 0, y: 34 },
    { x: 38, y: -8 },
  ];
  return (
    <Frame w={340} h={300} label="Součtový trojúhelník">
      <polygon points={P.map((p) => `${p.x},${p.y}`).join(' ')} fill="#e8f4fa" stroke={SEA} strokeWidth="5" strokeLinejoin="round" />
      {E.map((e, i) => (
        <Box key={`e${i}`} x={e.x + offset[i].x} y={e.y + offset[i].y} w={66} h={46} value={edges[i]} ask={ask.part === 'edge' && ask.index === i} blank={edges[i] === null && !(ask.part === 'edge' && ask.index === i)} />
      ))}
      {P.map((p, i) => {
        const isAsk = ask.part === 'vertex' && ask.index === i;
        const v = vertices[i];
        return (
          <g key={`v${i}`}>
            <circle cx={p.x} cy={p.y} r="30" fill={isAsk ? '#fff2dc' : PAPER} stroke={isAsk ? ACCENT : INK} strokeWidth="4" strokeDasharray={v === null && !isAsk ? '6 6' : undefined} />
            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="26" fill={isAsk ? ACCENT : INK}>
              {isAsk ? '?' : v ?? ''}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

export function SnakeView({ values, ops, ask }: { values: (number | null)[]; ops: { op: '+' | '−'; n: number }[]; ask: number }) {
  const step = 124;
  const w = values.length * step;
  return (
    <Frame w={w} h={130} label="Početní had">
      <path d={`M${step / 2},70 ${values.map((_, i) => `L${step / 2 + i * step},70`).join(' ')}`} stroke="#80b918" strokeWidth="30" strokeLinecap="round" fill="none" />
      {ops.map((o, i) => (
        <g key={`o${i}`}>
          <rect x={step / 2 + i * step + 34} y={16} width={56} height={30} rx="10" fill="#fff" stroke={INK} strokeWidth="2" />
          <text x={step / 2 + i * step + 62} y={32} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="20" fill={INK}>
            {o.op} {o.n}
          </text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={step / 2 + i * step} cy={70} r="30" fill={i === ask ? '#fff2dc' : '#d9f0a3'} stroke={i === ask ? ACCENT : '#4f772d'} strokeWidth="4" strokeDasharray={v === null && i !== ask ? '6 6' : undefined} />
          <text x={step / 2 + i * step} y={71} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="24" fill={i === ask ? ACCENT : INK}>
            {i === ask ? '?' : v ?? ''}
          </text>
        </g>
      ))}
      {/* hlava hada */}
      <circle cx={step / 2 - 18} cy={58} r="4" fill={INK} />
      <path d={`M${step / 2 - 34},78 q-10,4 -14,0 q4,-2 0,-6`} stroke="#e63946" strokeWidth="3" fill="none" />
    </Frame>
  );
}

export function BusView({ start, stops, end }: { start: number | null; stops: { on: number; off: number }[]; end: number | null }) {
  const step = 118;
  const w = (stops.length + 2) * step;
  return (
    <Frame w={w} h={150} label="Dračí autobus">
      <path d={`M${step / 2},105 L${w - step / 2},105`} stroke={SEA} strokeWidth="6" strokeDasharray="10 10" />
      <g>
        <text x={step / 2} y={24} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill={INK}>začátek</text>
        <Box x={step / 2} y={62} w={70} value={start} ask={start === null} />
      </g>
      {stops.map((s, i) => {
        const x = step / 2 + (i + 1) * step;
        return (
          <g key={i}>
            <ellipse cx={x} cy={112} rx="44" ry="14" fill="#7fb347" stroke="#4f7f2a" strokeWidth="3" />
            <text x={x} y={24} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill={INK}>{i + 1}. ostrov</text>
            <text x={x} y={52} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="22" fill="#c1121f">− {s.off}</text>
            <text x={x} y={80} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="22" fill="#2a9d8f">+ {s.on}</text>
          </g>
        );
      })}
      <g>
        <text x={w - step / 2} y={24} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill={INK}>konec</text>
        <Box x={w - step / 2} y={62} w={70} value={end} ask={end === null} />
      </g>
    </Frame>
  );
}

function Token({ kind, x, y }: { kind: string; x: number; y: number }) {
  if (/^\d+$/.test(kind)) {
    return (
      <g>
        <path d={`M${x - 26},${y + 22} L${x - 20},${y - 14} L${x + 20},${y - 14} L${x + 26},${y + 22} Z`} fill="#6c757d" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x={x - 8} y={y - 22} width="16" height="10" rx="4" fill="#6c757d" stroke={INK} strokeWidth="2.5" />
        <text x={x} y={y + 6} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="17" fill="#fff">{kind} kg</text>
      </g>
    );
  }
  if (kind === 'vejce') return <ellipse cx={x} cy={y + 4} rx="14" ry="18" fill="#fff4d6" stroke="#c9a15b" strokeWidth="3" />;
  if (kind === 'sud')
    return (
      <g>
        <rect x={x - 15} y={y - 16} width="30" height="38" rx="9" fill="#a0522d" stroke={INK} strokeWidth="2.5" />
        <line x1={x - 15} y1={y - 4} x2={x + 15} y2={y - 4} stroke={INK} strokeWidth="2.5" />
        <line x1={x - 15} y1={y + 10} x2={x + 15} y2={y + 10} stroke={INK} strokeWidth="2.5" />
      </g>
    );
  if (kind === 'stit')
    return (
      <g>
        <circle cx={x} cy={y + 3} r="18" fill="#e63946" stroke={INK} strokeWidth="2.5" />
        <circle cx={x} cy={y + 3} r="6" fill="#ffd166" stroke={INK} strokeWidth="2" />
      </g>
    );
  return <path d={`M${x - 18},${y + 20} Q${x - 22},${y - 6} ${x - 4},${y - 14} Q${x + 18},${y - 18} ${x + 20},${y + 4} Q${x + 22},${y + 20} ${x - 18},${y + 20} Z`} fill="#adb5bd" stroke={INK} strokeWidth="2.5" />;
}

export function BalanceView({ left, right }: { left: string[]; right: string[] }) {
  const pan = (items: string[], cx: number) => {
    const n = items.length;
    const gap = 46;
    return items.map((t, i) => <Token key={i} kind={t} x={cx - ((n - 1) * gap) / 2 + i * gap} y={112} />);
  };
  const width = Math.max(420, (Math.max(left.length, right.length) * 46 + 40) * 2 + 60);
  const lx = width / 4;
  const rx = (width * 3) / 4;
  return (
    <Frame w={width} h={200} label="Váhy v rovnováze">
      <rect x={width / 2 - 8} y={40} width="16" height="140" rx="6" fill="#8c5a3c" />
      <path d={`M${width / 2 - 60},184 L${width / 2 + 60},184`} stroke="#5b3a29" strokeWidth="10" strokeLinecap="round" />
      <line x1={lx} y1={46} x2={rx} y2={46} stroke="#5b3a29" strokeWidth="8" strokeLinecap="round" />
      <circle cx={width / 2} cy={46} r="10" fill={ACCENT} stroke={INK} strokeWidth="3" />
      {[lx, rx].map((x) => (
        <g key={x}>
          <line x1={x} y1={46} x2={x - 60} y2={138} stroke={INK} strokeWidth="2" />
          <line x1={x} y1={46} x2={x + 60} y2={138} stroke={INK} strokeWidth="2" />
          <path d={`M${x - 76},138 Q${x},160 ${x + 76},138 Z`} fill="#ffd166" stroke={INK} strokeWidth="3" />
        </g>
      ))}
      {pan(left, lx)}
      {pan(right, rx)}
    </Frame>
  );
}

export function MagicView({ grid, ask, sum }: { grid: (number | null)[]; ask: number; sum?: number }) {
  return (
    <div className="magic-wrap">
      <Frame w={250} h={250} label="Magický čtverec">
        {grid.map((v, i) => (
          <Box key={i} x={45 + (i % 3) * 80} y={45 + Math.floor(i / 3) * 80} w={70} h={70} value={v} ask={i === ask} blank={v === null && i !== ask} />
        ))}
      </Frame>
      {sum !== undefined && <div className="magic-sum">součet: {sum}</div>}
    </div>
  );
}

export function NumberLineView({ min, max, ticks = [] }: { min: number; max: number; ticks?: number[] }) {
  const w = 560;
  const x = (v: number) => 30 + ((v - min) / (max - min)) * (w - 60);
  const step = max - min <= 40 ? (max - min <= 20 ? 1 : 5) : 10;
  const marks: number[] = [];
  for (let v = min; v <= max; v += step) marks.push(v);
  return (
    <Frame w={w} h={90} label="Číselná osa">
      <line x1={20} y1={40} x2={w - 20} y2={40} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      {marks.map((v) => (
        <g key={v}>
          <line x1={x(v)} y1={v % (step * 5) === 0 || v === 0 ? 28 : 33} x2={x(v)} y2={v % (step * 5) === 0 || v === 0 ? 52 : 47} stroke={INK} strokeWidth={v === 0 ? 4 : 2} />
          {(v % (step * 5) === 0 || v === min || v === max) && (
            <text x={x(v)} y={72} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="18" fill={INK}>
              {f(v)}
            </text>
          )}
        </g>
      ))}
      {ticks.map((t) => (
        <circle key={`t${t}`} cx={x(t)} cy={40} r="9" fill={ACCENT} stroke={INK} strokeWidth="2.5" />
      ))}
    </Frame>
  );
}

export function CoinsView({ values }: { values: number[] }) {
  let x = 10;
  const shapes = values.map((v, i) => {
    const note = v >= 100;
    const w = note ? 120 : 64;
    const el = note ? (
      <g key={i}>
        <rect x={x} y={20} width={112} height={62} rx="8" fill={v >= 1000 ? '#b392ac' : v >= 500 ? '#a3b18a' : v >= 200 ? '#dda15e' : '#8ecae6'} stroke={INK} strokeWidth="2.5" />
        <text x={x + 56} y={53} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="24" fill={INK}>{v} Kč</text>
      </g>
    ) : (
      <g key={i}>
        <circle cx={x + 30} cy={51} r={v >= 20 ? 29 : v >= 5 ? 26 : 22} fill={v === 20 || v === 50 ? '#e9c46a' : v === 10 ? '#d4a373' : '#ced4da'} stroke={INK} strokeWidth="2.5" />
        <circle cx={x + 30} cy={51} r={v >= 20 ? 22 : v >= 5 ? 19 : 16} fill="none" stroke={INK} strokeWidth="1.2" opacity="0.4" />
        <text x={x + 30} y={52} textAnchor="middle" dominantBaseline="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill={INK}>{v}</text>
      </g>
    );
    x += w;
    return el;
  });
  return (
    <Frame w={x + 10} h={100} label={`Mince a bankovky: ${values.join(', ')} korun`}>
      {shapes}
    </Frame>
  );
}

export function ReadingView({ title, text }: { title: string; text: string }) {
  return (
    <div className="reading">
      <h3>{title}</h3>
      {text.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function renderMathVisual(v: Visual): ReactNode | null {
  switch (v.type) {
    case 'clock':
      return <ClockView h={v.h} m={v.m} />;
    case 'eggs':
      return <EggsView groups={v.groups} perGroup={v.perGroup} hidden={v.hidden} />;
    case 'fraction':
      return <FractionView parts={v.parts} filled={v.filled} shape={v.shape} />;
    case 'series':
      return <SeriesView items={v.items} />;
    case 'triangle':
      return <TriangleView vertices={v.vertices} edges={v.edges} ask={v.ask} />;
    case 'snake':
      return <SnakeView values={v.values} ops={v.ops} ask={v.ask} />;
    case 'bus':
      return <BusView start={v.start} stops={v.stops} end={v.end} />;
    case 'balance':
      return <BalanceView left={v.left} right={v.right} />;
    case 'magic':
      return <MagicView grid={v.grid} ask={v.ask} sum={v.sum} />;
    case 'numberline':
      return <NumberLineView min={v.min} max={v.max} ticks={v.ticks} />;
    case 'coins':
      return <CoinsView values={v.values} />;
    case 'reading':
      return <ReadingView title={v.title} text={v.text} />;
    case 'big':
      return <div className="big-visual">{v.text}</div>;
    default:
      return null;
  }
}
