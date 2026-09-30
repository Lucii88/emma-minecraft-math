import type { CSSProperties } from 'react';
import type { DragonLook } from '../../core/storage';

export type DragonMood = 'idle' | 'happy' | 'think' | 'oops' | 'sleep';

// ---------------------------------------------------------------------------
// Barvy

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function shade(hex: string, dl: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(0.97, Math.max(0.04, l + dl)));
}

// ---------------------------------------------------------------------------
// Volby pro úpravu draka

export const BODY_COLORS = [
  { id: '#2b2d42', name: 'noční' },
  { id: '#1d3557', name: 'půlnoční modrá' },
  { id: '#2a9d8f', name: 'smaragdová' },
  { id: '#588157', name: 'lesní' },
  { id: '#e76f51', name: 'ohnivá' },
  { id: '#f4a261', name: 'slunečná' },
  { id: '#7b2cbf', name: 'fialová' },
  { id: '#ff8fab', name: 'růžová' },
  { id: '#dee2e6', name: 'sněhová' },
  { id: '#e9c46a', name: 'zlatá' },
];
export const BELLY_COLORS = ['#fefae0', '#ffd166', '#b7e4c7', '#e0c3fc', '#ffc8dd', '#bde0fe'];
export const WING_COLORS = ['#3d405b', '#264653', '#e63946', '#f4a261', '#9d4edd', '#06d6a0', '#ffafcc', '#adb5bd'];
export const EYE_COLORS = ['#80ed99', '#ffb703', '#4cc9f0', '#c77dff', '#ff595e', '#8d6e63'];

export const DEFAULT_LOOK: DragonLook = {
  body: '#1d3557',
  belly: '#bde0fe',
  wing: '#264653',
  eye: '#ffb703',
  horns: 'zahnute',
  pattern: 'hvezdy',
};

// ---------------------------------------------------------------------------

const mirror = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${240 - Number(x)},${y}`);

const WING_L = 'M104,148 C86,122 60,102 24,94 C36,110 38,124 32,138 C48,132 58,136 62,150 C72,142 84,146 90,160 Z';
const WING_L_BONES = 'M104,148 C86,122 60,102 24,94 M54,118 C50,128 54,138 62,150 M70,128 C72,138 80,148 90,160';
const FIN_L = 'M66,84 C54,74 44,66 36,64 C42,74 44,84 52,94 Z';
const HORN_SHORT_L = 'M86,52 L90,28 L102,48 Z';
const HORN_CURVED_L = 'M84,56 C74,40 78,24 94,16 C90,30 94,42 102,50 Z';

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} />;
}

interface Props {
  look: DragonLook;
  mood?: DragonMood;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function Dragon({ look, mood = 'idle', size = 220, className = '', style, title }: Props) {
  const body = look.body;
  const line = shade(body, -0.16);
  const belly = look.belly;
  const bellyLine = shade(belly, -0.18);
  const wing = look.wing;
  const wingLine = shade(wing, -0.15);
  const snout = shade(body, 0.12);
  const horn = shade(belly, -0.05);
  const patternColor = hexToHsl(body)[2] < 0.45 ? shade(body, 0.22) : shade(body, -0.14);
  const sleeping = mood === 'sleep';

  return (
    <svg
      className={`dragon ${mood} ${className}`}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      style={style}
      role="img"
      aria-label={title ?? 'Drak'}
    >
      <ellipse cx="120" cy="228" rx="72" ry="9" fill="rgba(29,78,115,0.18)" />
      <g className="d-all">
        {/* ocas */}
        <g className="d-tail">
          <path d="M150,198 C180,214 214,206 220,178 C223,164 216,154 208,154 C212,164 211,178 200,188 C186,199 166,198 154,188 Z" fill={body} stroke={line} strokeWidth="3" strokeLinejoin="round" />
          <path d="M206,156 L210,132 L226,150 L214,160 Z" fill={wing} stroke={wingLine} strokeWidth="3" strokeLinejoin="round" />
        </g>
        {/* křídla */}
        <g className="d-wing-l">
          <path d={WING_L} fill={wing} stroke={wingLine} strokeWidth="3" strokeLinejoin="round" />
          <path d={WING_L_BONES} fill="none" stroke={wingLine} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="d-wing-r">
          <path d={mirror(WING_L)} fill={wing} stroke={wingLine} strokeWidth="3" strokeLinejoin="round" />
          <path d={mirror(WING_L_BONES)} fill="none" stroke={wingLine} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="d-body-group">
          {/* tělo */}
          <path d="M120,112 C150,112 168,140 168,172 C168,204 147,218 120,218 C93,218 72,204 72,172 C72,140 90,112 120,112 Z" fill={body} stroke={line} strokeWidth="3" />
          <ellipse cx="120" cy="178" rx="29" ry="36" fill={belly} stroke={bellyLine} strokeWidth="2" />
          {[160, 172, 184, 196].map((y) => (
            <path key={y} d={`M${98 + Math.abs(y - 178) * 0.35},${y} Q120,${y + 6} ${142 - Math.abs(y - 178) * 0.35},${y}`} fill="none" stroke={bellyLine} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          ))}
          {look.pattern === 'skvrny' && (
            <g fill={patternColor}>
              <circle cx="84" cy="150" r="6" />
              <circle cx="158" cy="146" r="5" />
              <circle cx="160" cy="178" r="4" />
              <circle cx="80" cy="182" r="4.5" />
            </g>
          )}
          {look.pattern === 'pruhy' && (
            <g fill="none" stroke={patternColor} strokeWidth="4" strokeLinecap="round">
              <path d="M78,150 Q86,146 90,152" />
              <path d="M76,168 Q84,164 88,170" />
              <path d="M162,150 Q154,146 150,152" />
              <path d="M164,168 Q156,164 152,170" />
            </g>
          )}
          {look.pattern === 'hvezdy' && (
            <g>
              <Star x={84} y={152} r={6} fill={patternColor} />
              <Star x={158} y={160} r={5} fill={patternColor} />
              <Star x={80} y={186} r={4} fill={patternColor} />
            </g>
          )}
          {/* nohy a ruce */}
          <g fill={body} stroke={line} strokeWidth="3">
            <ellipse cx="96" cy="214" rx="17" ry="10" />
            <ellipse cx="144" cy="214" rx="17" ry="10" />
          </g>
          <g fill={horn}>
            {[86, 96, 106, 134, 144, 154].map((x) => (
              <circle key={x} cx={x} cy="220" r="3.2" />
            ))}
          </g>
          <path d="M84,160 C76,170 80,182 92,180" fill={body} stroke={line} strokeWidth="3" strokeLinecap="round" />
          <path d="M156,160 C164,170 160,182 148,180" fill={body} stroke={line} strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* hlava */}
        <g className="d-head">
          <path d={FIN_L} fill={wing} stroke={wingLine} strokeWidth="3" strokeLinejoin="round" />
          <path d={mirror(FIN_L)} fill={wing} stroke={wingLine} strokeWidth="3" strokeLinejoin="round" />
          {look.horns === 'kratke' && (
            <g fill={horn} stroke={shade(horn, -0.2)} strokeWidth="2.5" strokeLinejoin="round">
              <path d={HORN_SHORT_L} />
              <path d={mirror(HORN_SHORT_L)} />
            </g>
          )}
          {look.horns === 'zahnute' && (
            <g fill={horn} stroke={shade(horn, -0.2)} strokeWidth="2.5" strokeLinejoin="round">
              <path d={HORN_CURVED_L} />
              <path d={mirror(HORN_CURVED_L)} />
            </g>
          )}
          <path d="M111,44 L116,30 L120,40 L124,30 L129,44 Z" fill={wing} stroke={wingLine} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M120,40 C160,40 181,62 181,92 C181,122 155,137 120,137 C85,137 59,122 59,92 C59,62 80,40 120,40 Z" fill={body} stroke={line} strokeWidth="3" />
          {look.pattern === 'skvrny' && (
            <g fill={patternColor}>
              <circle cx="80" cy="68" r="6" />
              <circle cx="162" cy="72" r="4.5" />
              <circle cx="150" cy="56" r="3.5" />
            </g>
          )}
          {look.pattern === 'pruhy' && (
            <g fill="none" stroke={patternColor} strokeWidth="4" strokeLinecap="round">
              <path d="M104,50 Q108,58 104,64" />
              <path d="M120,48 L120,60" />
              <path d="M136,50 Q132,58 136,64" />
            </g>
          )}
          {look.pattern === 'hvezdy' && (
            <g>
              <Star x={78} y={70} r={5.5} fill={patternColor} />
              <Star x={164} y={66} r={4.5} fill={patternColor} />
            </g>
          )}
          <ellipse cx="120" cy="112" rx="31" ry="19" fill={snout} />
          <ellipse cx="110" cy="106" rx="3.2" ry="2.4" fill={line} />
          <ellipse cx="130" cy="106" rx="3.2" ry="2.4" fill={line} />
          <path d={mood === 'oops' ? 'M108,122 Q120,118 132,122' : 'M104,118 Q120,132 136,118'} fill="none" stroke={line} strokeWidth="3.2" strokeLinecap="round" />
          <ellipse cx="80" cy="108" rx="9" ry="5" fill="#ff8fab" opacity="0.45" />
          <ellipse cx="160" cy="108" rx="9" ry="5" fill="#ff8fab" opacity="0.45" />
          {/* oči */}
          {[96, 144].map((x) => (
            <g key={x}>
              {sleeping ? (
                <path d={`M${x - 12},88 Q${x},96 ${x + 12},88`} fill="none" stroke={line} strokeWidth="3.5" strokeLinecap="round" />
              ) : (
                <>
                  <ellipse cx={x} cy="86" rx="15" ry="17" fill="#fff" />
                  <circle cx={x + 1} cy="88" r="12" fill={look.eye} />
                  <circle cx={x + 1} cy="89" r="7.5" fill="#1b1b2f" />
                  <circle cx={x + 5} cy="83" r="4" fill="#fff" />
                  <circle cx={x - 3} cy="93" r="2" fill="#fff" opacity="0.85" />
                  <ellipse className="d-lid" cx={x} cy="86" rx="16.5" ry="18.5" fill={body} />
                </>
              )}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export function Egg({ look, cracks, size = 200, wobble = false }: { look: DragonLook; cracks: number; size?: number; wobble?: boolean }) {
  const base = shade(look.body, 0.35);
  const spot = shade(look.body, 0.15);
  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} className={wobble ? 'egg wobble' : 'egg'} role="img" aria-label="Dračí vejce">
      <ellipse cx="100" cy="208" rx="60" ry="9" fill="rgba(29,78,115,0.18)" />
      <path d="M100,14 C150,14 176,96 176,138 C176,184 142,206 100,206 C58,206 24,184 24,138 C24,96 50,14 100,14 Z" fill={base} stroke={shade(base, -0.25)} strokeWidth="4" />
      <g fill={spot} opacity="0.8">
        <ellipse cx="70" cy="80" rx="12" ry="9" />
        <ellipse cx="128" cy="60" rx="9" ry="7" />
        <ellipse cx="140" cy="130" rx="14" ry="10" />
        <ellipse cx="72" cy="160" rx="10" ry="8" />
      </g>
      <ellipse cx="72" cy="56" rx="10" ry="18" fill="#fff" opacity="0.45" transform="rotate(-20 72 56)" />
      {cracks >= 1 && <path d="M60,110 L78,98 L88,116 L104,100" fill="none" stroke={shade(base, -0.45)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      {cracks >= 2 && <path d="M104,100 L118,120 L132,104 L146,118" fill="none" stroke={shade(base, -0.45)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      {cracks >= 3 && <path d="M88,116 L96,138 L110,128 M132,104 L128,86" fill="none" stroke={shade(base, -0.45)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
