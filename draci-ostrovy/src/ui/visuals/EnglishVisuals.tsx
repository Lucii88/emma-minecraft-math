// Školní ostrov: anglický poslech (britský hlas) a obrázky „kde to je“
// (in, on, under, next to).

import { useEffect, useState, type ReactNode } from 'react';
import { hasEnglishVoice, speakEnglish, stopSpeaking } from '../../core/speech';
import type { Visual } from '../../core/types';

function SpeakerIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16 8.5c1.2 1 1.8 2.2 1.8 3.5s-.6 2.5-1.8 3.5M18.5 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Tlačítko, které přečte anglický text. Na rozdíl od českého předčítání je
 *  vždy zapnuté – bez poslechu by anglické úlohy nešly hrát. `auto` = přečte
 *  se samo hned po zobrazení. */
export function EnglishSpeak({ text, auto = false, big = false, children }: { text: string; auto?: boolean; big?: boolean; children?: ReactNode }) {
  const [on, setOn] = useState(false);
  const play = () => {
    setOn(true);
    if (!speakEnglish(text, () => setOn(false))) setOn(false);
  };
  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(play, 350);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, auto]);
  if (!hasEnglishVoice()) return big ? <p className="muted small">V tomto zařízení chybí anglický hlas.</p> : null;
  return (
    <button
      type="button"
      className={big ? `btn btn-sea en-listen${on ? ' on' : ''}` : `btn btn-round speak en-speak${on ? ' on' : ''}`}
      onClick={play}
      aria-label="Poslechnout anglicky"
      title="Poslechnout anglicky"
    >
      <SpeakerIcon size={big ? 34 : 28} />
      {children}
    </button>
  );
}

function EnglishView({ say, text, pic, auto }: Extract<Visual, { type: 'english' }>) {
  return (
    <div className="en-wrap">
      {pic && (
        <div className="en-pic" aria-hidden>
          {pic}
        </div>
      )}
      {text ? (
        <div className="en-card">
          <p className="en-text" lang="en">
            {text}
          </p>
          <EnglishSpeak text={say} auto={auto} />
        </div>
      ) : (
        <div className="en-card">
          <EnglishSpeak text={say} auto={auto} big>
            <span>Poslechni si</span>
          </EnglishSpeak>
        </div>
      )}
    </div>
  );
}

/** Krabice (otevřená pro „in“, zavřená jinak) nebo lavice a věc u nich. */
/** Počet obrázků v textu (emoji může mít víc znaků: ✏️, 🧑‍🏫). */
function graphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) return [...new Intl.Segmenter().segment(text)].length;
  return [...text.replace(/[\u200d\ufe0f]/g, '')].length;
}

// Pozor: `ref` je v Reactu vyhrazené jméno vlastnosti, proto `target`.
function PlaceView({ thing, target, where }: { thing: string; target: 'box' | 'desk'; where: 'in' | 'on' | 'under' | 'next' }) {
  const ground = 132;
  // Víc věcí (🍎🍎) se musí vejít vedle krabice i do ní – menší písmo.
  const many = graphemes(thing) > 1;
  const emoji = (x: number, y: number, size = 40) => (
    <text x={x} y={y} fontSize={many ? Math.round(size * 0.72) : size} textAnchor="middle" dominantBaseline="central">
      {thing}
    </text>
  );
  const label = `${thing} – ${where === 'in' ? 'v' : where === 'on' ? 'na' : where === 'under' ? 'pod' : 'vedle'} ${target === 'box' ? 'krabici' : 'lavici'}`;
  if (target === 'box') {
    const open = where === 'in';
    return (
      <svg viewBox="0 0 260 150" className="place-scene" role="img" aria-label={label}>
        <line x1="10" y1={ground} x2="250" y2={ground} stroke="#c9b48a" strokeWidth="4" strokeLinecap="round" />
        {/* zadní okraj otevřené krabice */}
        {open && <path d="M86,70 L104,56 L176,56 L158,70 Z" fill="#a9713f" stroke="#6b4423" strokeWidth="3" />}
        {open && emoji(130, 62, 44)}
        {/* přední stěna */}
        <rect x="86" y="70" width="72" height={ground - 70} fill="#d4a373" stroke="#6b4423" strokeWidth="3" />
        <path d="M158,70 L176,56 L176,118 L158,132 Z" fill="#b5835a" stroke="#6b4423" strokeWidth="3" />
        {!open && <path d="M86,70 L104,56 L176,56 L158,70 Z" fill="#e0b98c" stroke="#6b4423" strokeWidth="3" />}
        {where === 'on' && emoji(130, 34, 44)}
        {where === 'next' && emoji(212, ground - 22, 44)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 260 150" className="place-scene" role="img" aria-label={label}>
      <line x1="10" y1={ground} x2="250" y2={ground} stroke="#c9b48a" strokeWidth="4" strokeLinecap="round" />
      <rect x="62" y="62" width="116" height="12" rx="3" fill="#a0522d" stroke="#5b3a29" strokeWidth="3" />
      <rect x="70" y="74" width="9" height={ground - 74} fill="#8c5a3c" stroke="#5b3a29" strokeWidth="2.5" />
      <rect x="161" y="74" width="9" height={ground - 74} fill="#8c5a3c" stroke="#5b3a29" strokeWidth="2.5" />
      {where === 'on' && emoji(120, 40, 42)}
      {where === 'under' && emoji(120, ground - 24, 42)}
      {where === 'next' && emoji(216, ground - 24, 42)}
    </svg>
  );
}

export function renderEnglishVisual(v: Visual): ReactNode | null {
  switch (v.type) {
    case 'english':
      return <EnglishView {...v} />;
    case 'place':
      return (
        <div className="en-wrap">
          {v.ask && (
            <div className="en-card">
              <p className="en-text" lang="en">
                {v.ask}
              </p>
              <EnglishSpeak text={v.ask} auto />
            </div>
          )}
          <PlaceView thing={v.thing} target={v.ref} where={v.where} />
        </div>
      );
    default:
      return null;
  }
}
