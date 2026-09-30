// Hráči na zařízení: úvodní nastavení (vyplní rodič) a výběr „Kdo hraje?“.

import { useState } from 'react';
import { useGame } from '../../core/game';
import type { Gender } from '../../core/gender';
import { loadProfile } from '../../core/storage';
import { Dragon, Egg, DEFAULT_LOOK } from '../components/Dragon';

/** Nový hráč. U prvního hráče na zařízení si rodič zároveň nastaví PIN. */
export function Setup() {
  const device = useGame((s) => s.device);
  const createPlayer = useGame((s) => s.createPlayer);
  const go = useGame((s) => s.go);
  const first = device.players.length === 0;
  const needPin = !device.pin;
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [grade, setGrade] = useState(2);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) return setErr('Napište jméno dítěte.');
    if (!gender) return setErr('Vyberte, jestli hraje holka, nebo kluk – podle toho ho hra oslovuje.');
    if (needPin && (pin.length !== 4 || pin !== pin2)) return setErr('PIN musí mít 4 číslice a obě pole se musí shodovat.');
    createPlayer({ name, gender, grade, ...(needPin ? { pin } : {}) });
  };

  return (
    <div className="screen setup">
      <div className="card setup-card">
        <Egg look={DEFAULT_LOOK} cracks={0} size={88} />
        <h1>{first ? 'Vítejte na Dračích ostrovech' : 'Nový hráč'}</h1>
        <p className="muted">
          {first
            ? 'Tuhle stránku vyplní rodič. Pak předáte zařízení dítěti a to si vylíhne vlastního draka.'
            : 'Každý hráč má vlastního draka, vlastní postup i vlastní přehled pro rodiče.'}
        </p>

        <label className="field-block">
          <span>Jméno dítěte</span>
          <input className="name-input small-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>

        <div className="field-block">
          <span>Hru oslovovat jako</span>
          <div className="gender-pick" role="group" aria-label="Holka, nebo kluk">
            {(
              [
                ['f', 'Holku', 'zvládla jsi'],
                ['m', 'Kluka', 'zvládl jsi'],
              ] as const
            ).map(([g, label, example]) => (
              <button key={g} className={`chip gender-chip${gender === g ? ' active' : ''}`} aria-pressed={gender === g} onClick={() => setGender(g)}>
                {label} <span className="muted small">„{example}“</span>
              </button>
            ))}
          </div>
        </div>

        <label className="field-block">
          <span>Třída</span>
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                {g}. třída
              </option>
            ))}
          </select>
          <span className="muted small">Podle ní hra začne. Dál se přizpůsobí sama – tomu, co dítě opravdu zvládá.</span>
        </label>

        {needPin && (
          <div className="field-block">
            <span>Rodičovský PIN</span>
            <div className="pin-row">
              <input className="pin-input" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 číslice" />
              <input className="pin-input" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} placeholder="znovu" />
            </div>
            <span className="muted small">Otevře přehled „Pro rodiče“ – co dítě zvládá a jak se učí. Dítěti ho neříkejte.</span>
          </div>
        )}

        {err && <p className="err">{err}</p>}
        <div className="row-actions">
          {!first && (
            <button className="btn btn-ghost" onClick={() => go('players')}>
              Zpět
            </button>
          )}
          <button className="btn btn-primary btn-big" onClick={submit}>
            Vylíhnout draka
          </button>
        </div>
        {first && <p className="muted small privacy">Nic se neodesílá ani neukládá na server. Postup, drak i přehled zůstávají jen v tomto zařízení.</p>}
      </div>
    </div>
  );
}

/** Kdo hraje? Každý hráč se svým drakem. */
export function Players() {
  const device = useGame((s) => s.device);
  const playerId = useGame((s) => s.playerId);
  const profile = useGame((s) => s.profile);
  const switchPlayer = useGame((s) => s.switchPlayer);
  const go = useGame((s) => s.go);
  // Profil právě hrajícího hráče bereme ze stavu (může být novější než uložený).
  const players = device.players.map((id) => ({ id, p: id === playerId ? profile : loadProfile(id) }));
  return (
    <div className="screen players center">
      <h1>Kdo hraje?</h1>
      <div className="player-grid">
        {players.map(({ id, p }, i) => (
          <button key={id} className={`card player-card${id === playerId ? ' current' : ''}`} onClick={() => switchPlayer(id)}>
            {p.dragon ? <Dragon look={p.dragon} size={120} mood="happy" /> : <Egg look={DEFAULT_LOOK} cracks={0} size={96} />}
            <strong>{p.name || p.dragonName || `Hráč ${i + 1}`}</strong>
            {p.dragonName && p.name && <span className="muted small">a {p.dragonName}</span>}
          </button>
        ))}
        <button className="card player-card add" onClick={() => go('setup')}>
          <span className="add-plus" aria-hidden>
            +
          </span>
          <strong>Přidat hráče</strong>
        </button>
      </div>
    </div>
  );
}
