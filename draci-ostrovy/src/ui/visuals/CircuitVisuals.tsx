// Ostrov blesků: kresba obvodu (baterka vlevo, části za sebou zleva doprava,
// části vedle sebe pod sebou) a dílky skládačky drátů.
//
// Rozložení: každá součástka zabere jedno políčko a drát vede jeho středem.
// Za sebou se šířky sčítají, vedle sebe výšky; větve vedle sebe spojují
// svislé „kolejnice“ na krajích skupiny. Proud se vrací spodním drátem.

import type { ReactElement, ReactNode } from 'react';
import { BULB_FILL, BULB_NAME, THINGS, bulbsOf, litBulbs, netSize, switchesOf, tileLinks, type SwitchState } from '../../core/circuit';
import type { CircuitPart, Visual, WireTile } from '../../core/types';

const U = 64;
const INK = '#343a40';
const WIRE = '#495057';
const COPPER = '#e8590c';

/** Jedna žárovka: barevný okraj, vlákno; svítící září, prasklá má přetržené vlákno. */
function Bulb({ x, y, color, lit, broken }: { x: number; y: number; color: string; lit: boolean; broken?: boolean }) {
  return (
    <g>
      {lit && <circle cx={x} cy={y} r="27" fill={color} opacity="0.35" className="bulb-glow" />}
      {lit &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={x} y1={y - 22} x2={x} y2={y - 29} stroke={color} strokeWidth="3" strokeLinecap="round" transform={`rotate(${a} ${x} ${y})`} />
        ))}
      <circle cx={x} cy={y} r="16" fill={lit ? color : '#f8f9fa'} stroke={color} strokeWidth="4" />
      {broken ? (
        <>
          <path d={`M${x - 9},${y + 4} l4,-7 l3,5`} fill="none" stroke="#868e96" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${x + 3},${y - 3} l3,5 l3,-7`} fill="none" stroke="#868e96" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${x + 4},${y - 15} l-3,6 l4,3 l-3,5`} fill="none" stroke="#868e96" strokeWidth="1.5" />
        </>
      ) : (
        <path d={`M${x - 9},${y + 4} l4,-7 l4,7 l4,-7 l4,7`} fill="none" stroke={lit ? '#fff' : '#868e96'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

interface DrawCtx {
  sw?: SwitchState;
  lit: Set<string>;
  powered: boolean;
  onToggle?: (id: string) => void;
}

const line = (x1: number, y1: number, x2: number, y2: number, key: string) => (
  <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={WIRE} strokeWidth="4" strokeLinecap="round" />
);

/** Nakreslí část obvodu s levým horním rohem v políčku (gx, gy). */
function draw(p: CircuitPart, gx: number, gy: number, ctx: DrawCtx, key: string): ReactElement[] {
  const x0 = gx * U;
  const x1 = (gx + 1) * U;
  const cx = (gx + 0.5) * U;
  const cy = (gy + 0.5) * U;
  switch (p.t) {
    case 'wire':
      return [line(x0, cy, x1, cy, key)];
    case 'gap':
      return [
        line(x0, cy, cx - 16, cy, `${key}a`),
        line(cx + 16, cy, x1, cy, `${key}b`),
        <circle key={`${key}c`} cx={cx - 16} cy={cy} r="5" fill={WIRE} />,
        <circle key={`${key}d`} cx={cx + 16} cy={cy} r="5" fill={WIRE} />,
      ];
    case 'thing': {
      const t = THINGS[p.thing];
      return [
        line(x0, cy, cx - 17, cy, `${key}a`),
        line(cx + 17, cy, x1, cy, `${key}b`),
        <rect key={`${key}r`} x={cx - 19} y={cy - 19} width="38" height="38" rx="9" fill="#fff9db" stroke="#fab005" strokeWidth="2.5" />,
        <text key={`${key}t`} x={cx} y={cy + 9} textAnchor="middle" fontSize="25">
          {t?.emoji ?? '?'}
        </text>,
      ];
    }
    case 'bulb':
      return [
        line(x0, cy, cx - 16, cy, `${key}a`),
        line(cx + 16, cy, x1, cy, `${key}b`),
        <Bulb key={`${key}l`} x={cx} y={cy} color={BULB_FILL[p.id]} lit={ctx.powered && ctx.lit.has(p.id)} broken={p.broken} />,
      ];
    case 'switch': {
      const on = ctx.sw?.[p.id] ?? p.on;
      const toggle = ctx.onToggle;
      return [
        <g
          key={key}
          className={`circuit-switch${toggle ? ' live' : ''}${on ? ' on' : ''}`}
          {...(toggle
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-label': `Vypínač ${p.id}, ${on ? 'zapnutý' : 'vypnutý'}`,
                'aria-pressed': on,
                onClick: () => toggle(p.id),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(p.id);
                  }
                },
              }
            : {})}
        >
          {toggle && <rect x={x0 + 4} y={cy - 30} width={U - 8} height="48" rx="10" className="switch-hit" />}
          {line(x0, cy, cx - 14, cy, `${key}a`)}
          {line(cx + 14, cy, x1, cy, `${key}b`)}
          <circle cx={cx - 14} cy={cy} r="4.5" fill={INK} />
          <circle cx={cx + 14} cy={cy} r="4.5" fill={INK} />
          <line x1={cx - 14} y1={cy} x2={on ? cx + 14 : cx + 9} y2={on ? cy : cy - 17} stroke={on ? '#2b8a3e' : '#c92a2a'} strokeWidth="5" strokeLinecap="round" />
          <text x={cx} y={cy + 24} textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="15" fill={INK}>
            {p.id}
          </text>
        </g>,
      ];
    }
    case 'series': {
      const out: ReactElement[] = [];
      let x = gx;
      p.parts.forEach((c, i) => {
        out.push(...draw(c, x, gy, ctx, `${key}.${i}`));
        x += netSize(c).w;
      });
      return out;
    }
    case 'parallel': {
      const out: ReactElement[] = [];
      const w = netSize(p).w;
      let y = gy;
      const rows: number[] = [];
      p.parts.forEach((c, i) => {
        const s = netSize(c);
        out.push(...draw(c, gx, y, ctx, `${key}.${i}`));
        // Kratší větev dotáhnout drátem až ke kolejnici.
        if (s.w < w) out.push(line((gx + s.w) * U, (y + 0.5) * U, (gx + w) * U, (y + 0.5) * U, `${key}.${i}x`));
        rows.push(y + 0.5);
        y += s.h;
      });
      out.push(line(x0, rows[0] * U, x0, rows[rows.length - 1] * U, `${key}L`));
      out.push(line((gx + w) * U, rows[0] * U, (gx + w) * U, rows[rows.length - 1] * U, `${key}R`));
      return out;
    }
  }
}

/** Obvod s baterkou. `powered` = proud je puštěný (žárovky se rozsvítí). */
export function CircuitView({
  net,
  label,
  sw,
  powered = false,
  onToggle,
}: {
  net: CircuitPart;
  label?: string;
  sw?: SwitchState;
  powered?: boolean;
  onToggle?: (id: string) => void;
}) {
  const { w, h } = netSize(net);
  const lit = new Set<string>(powered ? litBulbs(net, sw) : []);
  const bottom = (h + 0.35) * U;
  const left = -0.6 * U;
  const top = 0.5 * U;
  const battMid = (top + bottom) / 2;
  const width = (w + 0.6) * U + 20;
  const height = bottom + 14;
  const bulbs = bulbsOf(net);
  const sws = switchesOf(net);
  const desc = `Obvod s baterkou: ${bulbs.length === 1 ? 'žárovka' : `žárovky ${bulbs.map((b) => BULB_NAME[b].nom).join(', ')}`}${sws.length ? `, vypínače ${sws.map((s) => s.id).join(', ')}` : ''}.`;
  return (
    <figure className="circuit">
      {label && <figcaption className="circuit-label">{label}</figcaption>}
      <svg viewBox={`${left - 10} -4 ${width} ${height}`} width={Math.min(width * (w <= 3 ? 1.5 : 1.3), 520)} role="img" aria-label={desc} className="circuit-svg">
        {/* Baterka a zpáteční drát */}
        {line(left, top, 0, top, 'bt')}
        {line(left, top, left, battMid - 24, 'bl1')}
        {line(left, battMid + 24, left, bottom, 'bl2')}
        {line(left, bottom, w * U, bottom, 'bb')}
        {line(w * U, top, w * U, bottom, 'br')}
        <rect x={left - 13} y={battMid - 24} width="26" height="48" rx="5" fill={INK} />
        <rect x={left - 13} y={battMid - 24} width="26" height="14" rx="5" fill={COPPER} />
        <text x={left + 20} y={battMid - 12} fontFamily="Baloo 2" fontWeight="800" fontSize="16" fill={COPPER}>
          +
        </text>
        <text x={left + 20} y={battMid + 22} fontFamily="Baloo 2" fontWeight="800" fontSize="18" fill={INK}>
          −
        </text>
        {draw(net, 0, 0, { sw, lit, powered, onToggle }, 'n')}
      </svg>
    </figure>
  );
}

/** Vizuál úlohy: jeden obvod, nebo víc vedle sebe s popisky A, B, C. */
export function CircuitsVisual({ v }: { v: Extract<Visual, { type: 'circuit' }> }) {
  return (
    <div className={`circuits${v.nets.length > 1 ? ' several' : ''}`}>
      {v.nets.map((net, i) => (
        <CircuitView key={i} net={net} label={v.labels?.[i]} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skládačka drátů

export const TILE = 62;

/** Konec drátu u okraje dílku ve směru d (0 nahoru, 1 doprava…). */
const edge = (d: number, c: number) => [c + [0, 1, 0, -1][d] * (TILE / 2), c + [-1, 0, 1, 0][d] * (TILE / 2)];

/** Dílek nakreslený v otočení 0 (otáčí ho CSS), aby se točil plynule. */
export function TileArt({ tile, live, lit }: { tile: WireTile; live: boolean; lit: boolean }): ReactNode {
  const c = TILE / 2;
  const base = { ...tile, rot: 0 };
  const links = tileLinks(base);
  const core = live ? '#ffd43b' : COPPER;
  const wires = links.map((d) => {
    const [x, y] = edge(d, c);
    return (
      <g key={d}>
        <line x1={c} y1={c} x2={x} y2={y} stroke={WIRE} strokeWidth="11" strokeLinecap="round" />
        <line x1={c} y1={c} x2={x} y2={y} stroke={core} strokeWidth="4" strokeLinecap="round" className={live ? 'wire-live' : undefined} />
      </g>
    );
  });
  return (
    <>
      {wires}
      {tile.k === 'battery' && (
        <g>
          <rect x={c - 13} y={c - 20} width="26" height="40" rx="5" fill={INK} />
          <rect x={c - 13} y={c - 20} width="26" height="12" rx="5" fill={COPPER} />
          <text x={c} y={c + 8} textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="17" fill="#fff">
            +
          </text>
        </g>
      )}
      {tile.k === 'bulb' && <Bulb x={c} y={c} color={BULB_FILL.y} lit={lit} />}
    </>
  );
}
