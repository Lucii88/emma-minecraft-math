import type { ReactElement } from 'react';
import { ISLANDS } from '../../content';
import { useGame } from '../../core/game';
import type { IslandId } from '../../core/types';
import { Dragon } from '../components/Dragon';
import { Icon } from '../components/Bits';

/** Malá ilustrace ostrova (pro mapu i výběr). */
export function IslandArt({ id, size = 140, locked = false }: { id: IslandId; size?: number; locked?: boolean }) {
  const deco: Record<IslandId, ReactElement> = {
    cisla: (
      <g>
        <path d="M58,58 L70,30 L82,58 Z" fill="#8d8a82" stroke="#5c5a55" strokeWidth="3" />
        <text x="70" y="52" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="16" fill="#fff">7</text>
        <circle cx="104" cy="56" r="10" fill="#ffb703" stroke="#b77b00" strokeWidth="3" />
        <text x="104" y="61" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="13" fill="#7a4d00">+</text>
      </g>
    ),
    slova: (
      <g>
        <rect x="56" y="36" width="36" height="28" rx="4" fill="#fbf4e4" stroke="#8c5a3c" strokeWidth="3" />
        <path d="M62,44 H86 M62,50 H82 M62,56 H84" stroke="#8c5a3c" strokeWidth="2.5" />
        <path d="M100,64 C100,44 110,36 118,34 C114,44 114,54 116,64 Z" fill="#6aa84f" stroke="#38761d" strokeWidth="3" />
      </g>
    ),
    telo: (
      <g>
        <path d="M78,62 C62,52 58,38 70,32 C78,28 84,34 86,40 C88,34 94,28 102,32 C114,38 110,52 94,62 L86,68 Z" fill="#e63946" stroke="#9d0208" strokeWidth="3" />
      </g>
    ),
    svet: (
      <g>
        <circle cx="86" cy="46" r="18" fill="#4cc9f0" stroke="#1d4e73" strokeWidth="3" />
        <path d="M76,38 C84,40 82,48 90,50 C96,52 96,44 100,42" fill="none" stroke="#7fb347" strokeWidth="5" strokeLinecap="round" />
      </g>
    ),
    zahady: (
      <g>
        <text x="86" y="62" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="40" fill="#7b2cbf">?</text>
      </g>
    ),
    trh: (
      <g>
        <path d="M60,62 V42 L86,30 L112,42 V62 Z" fill="#e76f51" stroke="#8c5a3c" strokeWidth="3" />
        <circle cx="86" cy="50" r="7" fill="#ffd166" stroke="#b77b00" strokeWidth="2.5" />
      </g>
    ),
    dilna: (
      <g>
        <circle cx="86" cy="46" r="16" fill="#adb5bd" stroke="#495057" strokeWidth="3" />
        <circle cx="86" cy="46" r="6" fill="#495057" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x="83" y="26" width="6" height="8" fill="#495057" transform={`rotate(${a} 86 46)`} />
        ))}
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 172 110" width={size} height={(size * 110) / 172} aria-hidden className={locked ? 'island-art locked' : 'island-art'}>
      <ellipse cx="86" cy="86" rx="80" ry="20" fill="#7cc4e4" opacity="0.6" />
      <path d="M14,82 C18,58 44,50 86,50 C128,50 156,58 158,82 C150,96 22,96 14,82 Z" fill="#f3dcae" />
      <path d="M26,76 C30,60 52,54 86,54 C120,54 142,60 146,76 C132,84 40,84 26,76 Z" fill="#7fb347" />
      <g transform="translate(0,6)">{deco[id]}</g>
      {locked && <path d="M6,70 C10,40 50,30 86,34 C130,30 166,44 166,72 C150,98 20,98 6,70 Z" fill="#fff" opacity="0.72" />}
    </svg>
  );
}

const POS: Record<IslandId, { x: number; y: number }> = {
  cisla: { x: 18, y: 16 },
  slova: { x: 50, y: 7 },
  telo: { x: 82, y: 16 },
  zahady: { x: 10, y: 44 },
  trh: { x: 33, y: 34 },
  dilna: { x: 67, y: 34 },
  svet: { x: 90, y: 44 },
};

export function MapScreen() {
  const profile = useGame((s) => s.profile);
  const go = useGame((s) => s.go);
  const startDay = useGame((s) => s.startDay);

  return (
    <div className="map-screen">
      <div className="sea" aria-hidden>
        <div className="waves" />
      </div>

      <div className="map-top topbar">
        <h1 className="logo">Dračí ostrovy</h1>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => go('atlas')}>
          <Icon name="book" /> Dračí atlas
        </button>
        <button className="btn btn-ghost" onClick={() => go('journal')}>
          <Icon name="scroll" /> Deník
        </button>
        <button className="btn btn-round btn-ghost parent-btn" onClick={() => go('parent')} aria-label="Pro rodiče">
          <Icon name="lock" size={22} />
        </button>
      </div>

      <div className="island-layer">
        {ISLANDS.map((i) => (
          <button
            key={i.id}
            className={`map-island${i.available ? '' : ' locked'}${profile.species.includes(i.id) ? ' friend' : ''}`}
            style={{ ['--x' as string]: `${POS[i.id].x}%`, ['--y' as string]: `${POS[i.id].y}%` }}
            disabled={!i.available}
            onClick={() => go('island', i.id)}
            aria-label={i.available ? i.name : `${i.name} – brzy`}
          >
            <IslandArt id={i.id} size={150} locked={!i.available} />
            <span className="island-name">{i.name}</span>
            {!i.available && <span className="island-soon">v mlze – brzy</span>}
          </button>
        ))}
      </div>

      <div className="home">
        <div className="home-island" aria-hidden>
          <svg viewBox="0 0 300 120" width="100%" height="100%">
            <ellipse cx="150" cy="96" rx="146" ry="22" fill="#7cc4e4" opacity="0.6" />
            <path d="M10,92 C20,56 70,44 150,44 C230,44 282,56 290,92 C270,112 30,112 10,92 Z" fill="#f3dcae" />
            <path d="M28,84 C38,62 80,52 150,52 C220,52 262,62 272,84 C240,96 60,96 28,84 Z" fill="#7fb347" />
            <path d="M200,64 L200,34 L230,20 L260,34 L260,64 Z" fill="#8c5a3c" stroke="#5b3a29" strokeWidth="4" />
            <path d="M192,36 L230,14 L268,36" fill="none" stroke="#5b3a29" strokeWidth="8" strokeLinecap="round" />
            <rect x="222" y="44" width="16" height="20" fill="#5b3a29" />
          </svg>
        </div>
        {profile.dragon && (
          <div className="home-dragon">
            <Dragon look={profile.dragon} size={170} title={profile.dragonName} />
          </div>
        )}
      </div>

      <div className="map-bottom">
        <div className="map-greeting card">
          <strong>{profile.dragonName || 'Tvůj drak'}</strong> {profile.sessions === 0 ? 'se těší na první let!' : 'je připravený na další let.'}
        </div>
        <button className="btn btn-primary btn-big day-btn" onClick={startDay}>
          Dnešní let
        </button>
      </div>
    </div>
  );
}
