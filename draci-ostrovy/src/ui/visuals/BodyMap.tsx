// Mapa lidského těla: části těla (outside) a orgány (inside). Oblasti jsou
// klikací; stejné id může mít víc tvarů (obě ruce, obě kolena).

import type { ReactNode } from 'react';
import { BODY_REGIONS, type BodyRegion } from '../../core/types';

const SKIN = '#f6d5b8';
const SKIN_LINE = '#c98e6a';
const HAIR = '#6b4226';
const SHIRT = '#8ecae6';

interface Props {
  mode: 'outside' | 'inside';
  highlight?: BodyRegion;
  onTap?: (region: BodyRegion) => void;
  selected?: BodyRegion | null;
  correct?: BodyRegion | null;
  disabled?: boolean;
}

export function BodyMap({ mode, highlight, onTap, selected, correct, disabled }: Props) {
  const interactive = !!onTap && !disabled;

  const region = (id: BodyRegion, children: ReactNode) => {
    const isSel = selected === id;
    const isOk = correct === id;
    const isHi = highlight === id;
    return (
      <g
        key={id}
        className={`body-region${interactive ? ' tappable' : ''}${isSel ? ' selected' : ''}${isOk ? ' correct' : ''}${isHi ? ' highlight' : ''}`}
        onClick={interactive ? () => onTap!(id) : undefined}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? labelOf(id) : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && onTap!(id) : undefined}
      >
        {children}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 240 420" className="body-map" role="img" aria-label={mode === 'outside' ? 'Lidské tělo – části těla' : 'Lidské tělo – orgány'}>
      {/* silueta */}
      <g opacity={mode === 'inside' ? 0.55 : 1}>
        <path d="M84,112 L60,120 C48,124 42,136 40,150 L30,250 C28,262 44,266 48,254 L62,176 L66,250 L70,258 L74,380 C74,396 100,398 102,382 L110,264 L130,264 L138,382 C140,398 166,396 166,380 L170,258 L174,250 L178,176 L192,254 C196,266 212,262 210,250 L200,150 C198,136 192,124 180,120 L156,112 Z" fill={SKIN} stroke={SKIN_LINE} strokeWidth="3" strokeLinejoin="round" />
        {mode === 'outside' && <path d="M84,112 L156,112 L176,122 L174,200 L170,256 L70,256 L66,200 L64,122 Z" fill={SHIRT} opacity="0.55" />}
        <rect x="104" y="92" width="32" height="26" rx="8" fill={SKIN} stroke={SKIN_LINE} strokeWidth="3" />
        <ellipse cx="120" cy="58" rx="40" ry="44" fill={SKIN} stroke={SKIN_LINE} strokeWidth="3" />
        {mode === 'outside' && (
          <>
            <path d="M80,52 C80,22 100,12 120,12 C142,12 162,24 160,54 C150,40 134,32 118,34 C104,36 90,42 80,52 Z" fill={HAIR} />
            <circle cx="106" cy="58" r="4" fill="#2b2d42" />
            <circle cx="134" cy="58" r="4" fill="#2b2d42" />
            <path d="M108,78 Q120,86 132,78" fill="none" stroke="#9d4b3a" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </g>

      {mode === 'outside' && (
        <g>
          {region('hlava', <ellipse cx="120" cy="58" rx="40" ry="44" className="hit" />)}
          {region('krk', <rect x="102" y="94" width="36" height="24" rx="8" className="hit" />)}
          {region('hrudnik', <path d="M86,120 L154,120 L160,176 L80,176 Z" className="hit" />)}
          {region('bricho', <path d="M80,180 L160,180 L162,252 L78,252 Z" className="hit" />)}
          {region(
            'paze',
            <>
              <path d="M60,124 C50,128 46,140 44,152 L42,168 L58,172 L64,132 Z" className="hit" />
              <path d="M180,124 C190,128 194,140 196,152 L198,168 L182,172 L176,132 Z" className="hit" />
            </>,
          )}
          {region(
            'loket',
            <>
              <circle cx="50" cy="182" r="13" className="hit" />
              <circle cx="190" cy="182" r="13" className="hit" />
            </>,
          )}
          {region(
            'dlan',
            <>
              <circle cx="38" cy="252" r="15" className="hit" />
              <circle cx="202" cy="252" r="15" className="hit" />
            </>,
          )}
          {region(
            'noha',
            <>
              <path d="M72,262 L108,262 L106,300 L74,300 Z" className="hit" />
              <path d="M132,262 L168,262 L166,300 L134,300 Z" className="hit" />
              <path d="M74,334 L104,334 L102,370 L76,370 Z" className="hit" />
              <path d="M136,334 L166,334 L164,370 L138,370 Z" className="hit" />
            </>,
          )}
          {region(
            'koleno',
            <>
              <circle cx="89" cy="317" r="15" className="hit" />
              <circle cx="151" cy="317" r="15" className="hit" />
            </>,
          )}
          {region(
            'chodidlo',
            <>
              <ellipse cx="86" cy="388" rx="20" ry="11" className="hit" />
              <ellipse cx="154" cy="388" rx="20" ry="11" className="hit" />
            </>,
          )}
        </g>
      )}

      {mode === 'inside' && (
        <g>
          {region(
            'mozek',
            <g className="organ">
              <path d="M88,54 C84,34 104,24 120,28 C138,22 158,36 152,56 C160,66 150,80 136,76 C128,84 112,84 104,76 C90,80 80,66 88,54 Z" fill="#f4acb7" stroke="#b5656f" strokeWidth="3" />
              <path d="M104,42 Q112,50 106,58 M122,36 Q128,48 120,58 M138,44 Q146,52 138,62" fill="none" stroke="#b5656f" strokeWidth="2.5" strokeLinecap="round" />
            </g>,
          )}
          {region(
            'plice',
            <g className="organ">
              <path d="M104,122 C84,120 76,140 76,166 C76,184 90,190 104,184 Z" fill="#ffb4a2" stroke="#c9736a" strokeWidth="3" />
              <path d="M136,122 C156,120 164,140 164,166 C164,184 150,190 136,184 Z" fill="#ffb4a2" stroke="#c9736a" strokeWidth="3" />
            </g>,
          )}
          {region(
            'srdce',
            <g className="organ">
              <path d="M128,148 C128,138 140,136 142,146 C144,136 158,138 156,150 C154,162 142,168 138,176 C132,168 128,160 128,148 Z" fill="#e63946" stroke="#9d0208" strokeWidth="3" />
            </g>,
          )}
          {region(
            'jatra',
            <g className="organ">
              <path d="M78,192 C92,184 118,186 122,194 C120,206 100,212 84,210 C76,206 74,198 78,192 Z" fill="#9c6644" stroke="#6b4226" strokeWidth="3" />
            </g>,
          )}
          {region(
            'zaludek',
            <g className="organ">
              <path d="M128,186 C140,178 160,184 158,200 C156,214 140,220 128,212 C136,206 134,196 128,186 Z" fill="#f7b267" stroke="#c8741b" strokeWidth="3" />
            </g>,
          )}
          {region(
            'ledviny',
            <g className="organ">
              <path d="M76,214 C68,214 66,232 76,236 C84,238 84,228 80,224 C84,220 84,214 76,214 Z" fill="#b5838d" stroke="#6d4c55" strokeWidth="3" />
              <path d="M164,214 C172,214 174,232 164,236 C156,238 156,228 160,224 C156,220 156,214 164,214 Z" fill="#b5838d" stroke="#6d4c55" strokeWidth="3" />
            </g>,
          )}
          {region(
            'streva',
            <g className="organ">
              <path d="M92,220 C92,212 148,212 148,222 C150,234 140,238 136,244 C132,252 108,252 104,244 C98,238 90,232 92,220 Z" fill="#f9c6a8" stroke="#c98e6a" strokeWidth="3" />
              <path d="M100,224 Q110,232 120,224 Q130,216 140,226 M104,238 Q116,244 126,238" fill="none" stroke="#c98e6a" strokeWidth="2.5" />
            </g>,
          )}
          {region(
            'mechyr',
            <g className="organ">
              <ellipse cx="120" cy="258" rx="12" ry="9" fill="#ffe066" stroke="#c9a227" strokeWidth="3" />
            </g>,
          )}
        </g>
      )}
    </svg>
  );
}

export function labelOf(id: BodyRegion): string {
  const all = { ...BODY_REGIONS.outside, ...BODY_REGIONS.inside } as Record<string, string>;
  return all[id] ?? id;
}
