// Dračí kousky: pohyb draka a efekt kolem něj. Každý kousek vypadá jinak –
// oheň šlehá z tlamy (duhový i s duhou), kouř dělá kroužky, smyčka nechává
// hvězdy, tanec mráčky. Změna `play` kousek přehraje znovu.

import type { CSSProperties, ReactNode } from 'react';
import type { Trick } from '../../content';
import type { DragonLook } from '../../core/storage';
import { Dragon } from './Dragon';

const BODY: Record<Trick['anim'], string> = {
  hop: 'hop2',
  fire: 'roar',
  smoke: 'puff',
  spin: 'spin',
  spin2: 'spin2',
  dive: 'dive',
  flip: 'flip',
  glide: 'glide',
  dance: 'dance',
  loop: 'loop',
  starloop: 'loop',
};

const RAINBOW = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

export function TrickShow({ look, trick, play, size, onReplay }: { look: DragonLook; trick: Trick | null; play: number; size: number; onReplay?: () => void }) {
  const active = !!trick && play > 0;
  const dragon = (
    <div key={`b${play}`} className={active ? `trick-body trick-${BODY[trick!.anim]}` : 'trick-body'}>
      <Dragon look={look} mood={active ? 'happy' : 'idle'} size={size} />
    </div>
  );
  return (
    <div className="trick-stage" style={{ width: size, height: size, fontSize: size / 10 }}>
      {active && <TrickEffect key={`e${play}`} trick={trick!} />}
      {onReplay ? (
        <button type="button" className="trick-replay" onClick={onReplay} aria-label="Ukázat kousek znovu">
          {dragon}
        </button>
      ) : (
        dragon
      )}
    </div>
  );
}

function Layer({ children, front = false }: { children: ReactNode; front?: boolean }) {
  return <div className={`fx${front ? ' fx-front' : ''}`} aria-hidden>{children}</div>;
}

function TrickEffect({ trick }: { trick: Trick }) {
  switch (trick.anim) {
    case 'fire': {
      const rainbow = trick.fire === 'rainbow';
      const colors = rainbow ? RAINBOW : [trick.fire ?? '#ffb703', '#fff3b0', trick.fire ?? '#ffb703', '#ff8a1f'];
      return (
        <>
          {rainbow && (
            <Layer>
              <svg className="fx-rainbow" viewBox="0 0 200 110">
                {RAINBOW.map((c, i) => (
                  <path key={c} d={`M${12 + i * 8},104 A${88 - i * 8},${88 - i * 8} 0 0 1 ${188 - i * 8},104`} stroke={c} />
                ))}
              </svg>
            </Layer>
          )}
          <Layer front>
            <span className="fx-glow" style={v({ '--c': colors[0] })} />
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="fx-flame"
                style={v({ '--c': colors[i % colors.length], '--i': i, '--a': `${-40 + ((i * 37) % 9) * 3.5}deg`, '--d': `${5.5 + ((i * 53) % 7) * 0.45}em` })}
              />
            ))}
          </Layer>
        </>
      );
    }
    case 'smoke':
      return (
        <Layer front>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="fx-ring" style={v({ '--i': i, '--x': `${(i % 2 ? 1 : -1) * (0.6 + i * 0.3)}em` })} />
          ))}
        </Layer>
      );
    case 'starloop':
      return (
        <Layer front>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="fx-star" style={v({ '--i': i, '--a': `${i * 30 + 180}deg` })} />
          ))}
        </Layer>
      );
    case 'dance':
      return (
        <Layer>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`fx-cloud${i % 2 ? ' rev' : ''}`} style={v({ '--i': i, '--y': `${1 + i * 2}em` })} />
          ))}
        </Layer>
      );
    case 'glide':
      return (
        <Layer front>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="fx-wind" style={v({ '--i': i, '--y': `${1.5 + i * 1.6}em` })} />
          ))}
        </Layer>
      );
    case 'dive':
      return (
        <Layer>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="fx-speed" style={v({ '--i': i, '--x': `${1.2 + i * 1.5}em` })} />
          ))}
        </Layer>
      );
    case 'spin':
    case 'spin2':
      return (
        <Layer>
          <span className={`fx-swirl${trick.anim === 'spin2' ? ' double' : ''}`} />
          <span className={`fx-swirl inner${trick.anim === 'spin2' ? ' double' : ''}`} />
        </Layer>
      );
    case 'flip':
    case 'loop':
    case 'hop':
    default:
      return (
        <Layer front>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="fx-dust" style={v({ '--i': i, '--x': `${(i - 1.5) * 1.6}em` })} />
          ))}
          {trick.anim !== 'hop' &&
            Array.from({ length: 8 }, (_, i) => <span key={`s${i}`} className="fx-spark" style={v({ '--i': i, '--a': `${i * 45}deg` })} />)}
        </Layer>
      );
  }
}
