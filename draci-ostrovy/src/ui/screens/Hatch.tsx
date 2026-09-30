import { useState, type ReactNode } from 'react';
import { useGame } from '../../core/game';
import { sfx } from '../../core/sound';
import type { DragonLook } from '../../core/storage';
import { BELLY_COLORS, BODY_COLORS, DEFAULT_LOOK, Dragon, EYE_COLORS, Egg, WING_COLORS } from '../components/Dragon';
import { Sparkles } from '../components/Bits';
import { useGx } from '../useGx';

export function DragonEditor({ look, onChange }: { look: DragonLook; onChange: (l: DragonLook) => void }) {
  const set = (patch: Partial<DragonLook>) => onChange({ ...look, ...patch });
  return (
    <div className="editor">
      <Row label="Barva těla">
        {BODY_COLORS.map((c) => (
          <Swatch key={c.id} color={c.id} active={look.body === c.id} label={c.name} onClick={() => set({ body: c.id })} />
        ))}
      </Row>
      <Row label="Bříško">
        {BELLY_COLORS.map((c) => (
          <Swatch key={c} color={c} active={look.belly === c} onClick={() => set({ belly: c })} />
        ))}
      </Row>
      <Row label="Křídla">
        {WING_COLORS.map((c) => (
          <Swatch key={c} color={c} active={look.wing === c} onClick={() => set({ wing: c })} />
        ))}
      </Row>
      <Row label="Oči">
        {EYE_COLORS.map((c) => (
          <Swatch key={c} color={c} active={look.eye === c} onClick={() => set({ eye: c })} />
        ))}
      </Row>
      <Row label="Rohy">
        {(
          [
            ['zahnute', 'zahnuté'],
            ['kratke', 'krátké'],
            ['zadne', 'žádné'],
          ] as const
        ).map(([id, name]) => (
          <button key={id} className={`chip${look.horns === id ? ' active' : ''}`} onClick={() => set({ horns: id })}>
            {name}
          </button>
        ))}
      </Row>
      <Row label="Vzor">
        {(
          [
            ['nic', 'bez vzoru'],
            ['hvezdy', 'hvězdičky'],
            ['skvrny', 'skvrnky'],
            ['pruhy', 'proužky'],
          ] as const
        ).map(([id, name]) => (
          <button key={id} className={`chip${look.pattern === id ? ' active' : ''}`} onClick={() => set({ pattern: id })}>
            {name}
          </button>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="editor-row">
      <span className="editor-label">{label}</span>
      <div className="editor-options">{children}</div>
    </div>
  );
}

function Swatch({ color, active, label, onClick }: { color: string; active: boolean; label?: string; onClick: () => void }) {
  return <button className={`swatch${active ? ' active' : ''}`} style={{ background: color }} onClick={onClick} aria-label={label ?? color} aria-pressed={active} />;
}

export function Hatch() {
  const t = useGx();
  const hatch = useGame((s) => s.hatch);
  const [step, setStep] = useState<'egg' | 'hatched' | 'look' | 'name'>('egg');
  const [cracks, setCracks] = useState(0);
  const [look, setLook] = useState<DragonLook>(DEFAULT_LOOK);
  const [name, setName] = useState('');

  const tapEgg = () => {
    const c = cracks + 1;
    setCracks(c);
    if (c >= 4) {
      sfx.hatch();
      setStep('hatched');
    } else sfx.tap();
  };

  return (
    <div className="screen hatch center">
      {step === 'egg' && (
        <>
          <h1>{t('Vítej, {jezdkyně|jezdče}!')}</h1>
          <p className="lead">Na tvém ostrově leží dračí vejce. Něco se v něm hýbe…</p>
          <button className="egg-btn" onClick={tapEgg} aria-label="Ťukni na vejce">
            <Egg look={look} cracks={cracks} size={220} wobble />
          </button>
          <p className="muted">{cracks === 0 ? 'Ťukni na vejce.' : cracks < 3 ? 'Ještě!' : 'Už to bude!'}</p>
        </>
      )}
      {step === 'hatched' && (
        <>
          <Sparkles show>
            <Dragon look={look} mood="happy" size={260} />
          </Sparkles>
          <h1>Vylíhl se dráček!</h1>
          <p className="lead">Bude se učit spolu s tebou. Co ty zvládneš, naučí se i on.</p>
          <button className="btn btn-primary btn-big" onClick={() => setStep('look')}>
            Jak bude vypadat?
          </button>
        </>
      )}
      {step === 'look' && (
        <div className="look-layout">
          <div className="look-preview">
            <Dragon look={look} size={260} />
          </div>
          <div className="card look-card">
            <h2>Vymysli si svého draka</h2>
            <DragonEditor look={look} onChange={setLook} />
            <button className="btn btn-primary btn-big" onClick={() => setStep('name')}>
              Hotovo
            </button>
          </div>
        </div>
      )}
      {step === 'name' && (
        <>
          <Dragon look={look} mood="happy" size={220} />
          <h1>Jak se bude jmenovat?</h1>
          <input className="name-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Jméno draka" autoFocus />
          <button className="btn btn-primary btn-big" disabled={!name.trim()} onClick={() => hatch(look, name)}>
            Poletíme!
          </button>
        </>
      )}
    </div>
  );
}
