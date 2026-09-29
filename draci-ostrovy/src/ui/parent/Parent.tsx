import { useEffect, useMemo, useState } from 'react';
import { ISLANDS } from '../../content';
import { useGame } from '../../core/game';
import { buildRadar, type Radar } from '../../core/radar';
import { levelLabel } from '../../core/planner';
import { exportAll, importAll, loadEvents, wipeAll } from '../../core/storage';
import { hasCzechVoice, voiceName } from '../../core/speech';
import type { AnswerEvent } from '../../core/types';
import { Icon } from '../components/Bits';
import { count, form } from '../../core/czech';

const ODPOVED = ['odpověď', 'odpovědi', 'odpovědí'] as const;
const DEN = ['den', 'dny', 'dní'] as const;

/** „2.–3. ročník“, „pod 1. ročníkem“ – rozpětí zvládnutých úrovní slovy. */
function rangeLabel(l: { low: number; mid: number; high: number }): string {
  if (l.high === 0) return 'zatím pod 1. ročníkem';
  const lo = l.low === 0 ? 'pod 1.' : `${l.low}.`;
  const main = l.mid > 0 ? levelLabel(l.mid) : 'pod 1. ročníkem';
  return l.low === l.high ? main : `${main} (rozpětí ${lo}–${l.high}. ročník)`;
}
import { DragonEditor } from '../screens/Hatch';

type Tab = 'radar' | 'ppp' | 'portfolio' | 'settings';

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const date = (t: number) => new Date(t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

export function Parent() {
  const go = useGame((s) => s.go);
  const profile = useGame((s) => s.profile);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('radar');
  const [events, setEvents] = useState<AnswerEvent[] | null>(null);

  useEffect(() => {
    if (unlocked) void loadEvents().then((e) => setEvents([...e]));
  }, [unlocked]);

  const radar = useMemo(() => (events ? buildRadar(profile, events) : null), [profile, events]);

  if (!unlocked) return <PinGate onOk={() => setUnlocked(true)} onBack={() => go('map')} />;

  return (
    <div className="screen parent">
      <div className="topbar no-print">
        <button className="btn btn-round btn-ghost" onClick={() => go('map')} aria-label="Zpět do hry">
          <Icon name="back" />
        </button>
        <h1>Pro rodiče</h1>
        <span className="spacer" />
        <nav className="tabs">
          {(
            [
              ['radar', 'Radar'],
              ['ppp', 'Trénink pro PPP'],
              ['portfolio', 'Portfolio'],
              ['settings', 'Nastavení'],
            ] as const
          ).map(([id, name]) => (
            <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              {name}
            </button>
          ))}
        </nav>
      </div>
      {!radar && <p>Načítám…</p>}
      {radar && tab === 'radar' && <RadarView radar={radar} />}
      {radar && tab === 'ppp' && <PppView radar={radar} />}
      {radar && tab === 'portfolio' && <Portfolio radar={radar} />}
      {tab === 'settings' && <SettingsView />}
    </div>
  );
}

function PinGate({ onOk, onBack }: { onOk: () => void; onBack: () => void }) {
  const pin = useGame((s) => s.profile.settings.pin);
  const update = useGame((s) => s.updateSettings);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const creating = !pin;
  return (
    <div className="screen center pin-gate">
      <div className="card pin-card">
        <h2>{creating ? 'Nastavte rodičovský PIN' : 'Jen pro rodiče'}</h2>
        <p className="muted small">
          {creating
            ? 'Čtyři číslice. Chrání rodičovský přehled před zvědavými dračími jezdkyněmi (není to zabezpečení proti útočníkům – data jsou jen v tomto zařízení).'
            : 'Zadejte PIN.'}
        </p>
        <input className="pin-input" inputMode="numeric" maxLength={4} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ''))} placeholder="PIN" autoFocus />
        {creating && <input className="pin-input" inputMode="numeric" maxLength={4} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ''))} placeholder="PIN znovu" />}
        {err && <p className="err">{err}</p>}
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={onBack}>
            Zpět do hry
          </button>
          <button
            className="btn btn-sea"
            onClick={() => {
              if (creating) {
                if (a.length !== 4 || a !== b) return setErr('PIN musí mít 4 číslice a obě pole se musí shodovat.');
                update({ pin: a });
                onOk();
              } else if (a === pin) onOk();
              else setErr('To není ono.');
            }}
          >
            Pokračovat
          </button>
        </div>
      </div>
    </div>
  );
}

function Advantage({ value }: { value: number }) {
  const label = value >= 2 ? 'výrazně nad ročníkem' : value >= 1 ? 'nad ročníkem' : value >= 0 ? 'zhruba na úrovni ročníku' : 'pod úrovní ročníku';
  return <span className={`adv adv-${value >= 1 ? 'up' : value >= 0 ? 'mid' : 'down'}`}>{label}</span>;
}

function RadarView({ radar }: { radar: Radar }) {
  const profile = useGame((s) => s.profile);
  return (
    <div className="radar">
      <div className="card note">
        <strong>Jak číst radar.</strong> Ukazuje signály, ne diagnózu – žádné IQ ani srovnání s jinými dětmi. Úrovně jsou vztažené k očekávaným výstupům RVP ZV (1.–5. ročník) a mají rozpětí podle toho, kolik odpovědí máme. Odhad se zpřesňuje zhruba po 10 odpovědích v dovednosti. Dítě tuto stránku nevidí.
      </div>

      <div className="stat-row">
        <div className="card stat"><b>{radar.totals.answers}</b><span>{form(radar.totals.answers, ODPOVED)}</span></div>
        <div className="card stat"><b>{radar.totals.sessions}</b><span>{form(radar.totals.sessions, ['let', 'lety', 'letů'])}</span></div>
        <div className="card stat"><b>{radar.totals.days}</b><span>{form(radar.totals.days, DEN)} hraní</span></div>
        <div className="card stat"><b>{radar.totals.minutes}</b><span>{form(radar.totals.minutes, ['minuta', 'minuty', 'minut'])} přemýšlení</span></div>
      </div>

      <h2 className="section-title">1. Schopnosti – co zvládá vzhledem k RVP</h2>
      <p className="muted small">Pruh ukazuje rozpětí stupňů, které zvládá s pravděpodobností aspoň 70 %; tečka je nejpravděpodobnější hodnota. Svislá čára = aktuální ročník ({profile.grade}.).</p>
      {radar.islands.map(({ island, skills }) => (
        <div key={island.id} className="card radar-island">
          <h3>{island.name}</h3>
          <table className="lv-table">
            <tbody>
              {skills.map((s) => (
                <tr key={s.skill.id}>
                  <td className="lv-name">
                    {s.skill.name}
                    {s.skill.testLike && <span className="tag" title="Formát podobný subtestu inteligence">testový formát</span>}
                  </td>
                  <td className="lv-bar-cell">
                    <div className="lv-bar">
                      {[1, 2, 3, 4, 5, 6].map((L) => (
                        <span key={L} className="lv-cell" />
                      ))}
                      <span className="lv-grade" style={{ left: `${((profile.grade - 0.5) / 6) * 100}%` }} />
                      {s.levels && s.levels.high > 0 && (
                        <span className="lv-range" style={{ left: `${(Math.max(0, s.levels.low - 1) / 6) * 100}%`, width: `${((s.levels.high - Math.max(0, s.levels.low - 1)) / 6) * 100}%` }} />
                      )}
                      {s.levels && s.levels.mid > 0 && <span className="lv-dot" style={{ left: `${((s.levels.mid - 0.5) / 6) * 100}%` }} />}
                    </div>
                  </td>
                  <td className="lv-text small">
                    {!s.levels ? (
                      <span className="muted">zatím nehrála</span>
                    ) : (
                      <>
                        {rangeLabel(s.levels)}
                        <span className="muted"> · {s.answers} odp. · napoprvé {pct(s.firstTryRate)}</span>
                        {s.answers < 10 && <span className="muted"> · málo dat</span>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {radar.abilities.length > 0 && (
        <div className="card">
          <h3>Relativní profil (silné stránky v rámci dítěte, ne srovnání s ostatními)</h3>
          <ul className="plain">
            {radar.abilities.map((a) => (
              <li key={a.ability}>
                <strong>{a.label}</strong> – <Advantage value={a.advantage} /> <span className="muted small">({a.skills} dovedn.)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="section-title">2. Potenciál učení</h2>
      <div className="card">
        <p>
          Úplně nové typy úloh: <b>{radar.potential.novelTasks}</b> · napoprvé správně <b>{pct(radar.potential.novelFirstTry)}</b> · průměrně nápověd na novou úlohu{' '}
          <b>{radar.potential.hintsPerNovel === null ? '–' : radar.potential.hintsPerNovel.toFixed(1)}</b>
        </p>
        <p className="muted small">Málo nápověd u neznámého typu úlohy je jeden z lepších signálů rychlého učení. Pořád jde o orientační údaj.</p>
      </div>

      <h2 className="section-title">3. Zaujetí úkolem a vytrvalost</h2>
      <div className="card">
        <p>
          Bouřkový let (dobrovolně těžší úlohy): <b>{radar.commitment.braveItems}</b> úloh, vyřešeno <b>{radar.commitment.braveSolved}</b>. Po chybě to nakonec vyřešila v{' '}
          <b>{pct(radar.commitment.solvedAfterError)}</b> případů ({radar.commitment.errorItems} úloh s chybou).
        </p>
      </div>

      <h2 className="section-title">4. Tvořivost</h2>
      <div className="card">
        <p>
          Tvořivých úloh: <b>{radar.creativity.openAnswers}</b> · průměrně nápadů: <b>{radar.creativity.avgIdeas === null ? '–' : radar.creativity.avgIdeas.toFixed(1)}</b>
        </p>
        {radar.creativity.samples.length > 0 && (
          <ul className="samples">
            {radar.creativity.samples.map((s, i) => (
              <li key={i}>
                <span className="muted small">{date(s.t)}</span> „{s.text}“
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Automatické hodnocení tvořivosti není pro české děti ověřené – berte jen jako ukázky.</p>
      </div>

      <h2 className="section-title">5. Sebedůvěra</h2>
      <div className="card">
        <p>
          Hodnocených odpovědí: <b>{radar.confidence.rated}</b>. Ze správných odpovědí označila „hádala jsem“: <b>{pct(radar.confidence.underconfidence)}</b>. Z chybných odpovědí označila „jistě“: <b>{pct(radar.confidence.overconfidence)}</b>.
          {radar.confidence.rated < 20 && <span className="muted"> Zatím málo dat – spolehlivější obrázek dá zhruba 20+ hodnocených odpovědí.</span>}
        </p>
        <table className="conf-table small">
          <thead>
            <tr>
              <th>Odpověď</th>
              <th>počet</th>
              <th>správně napoprvé</th>
            </tr>
          </thead>
          <tbody>
            {(['hadala', 'asi', 'jiste'] as const).map((k) => (
              <tr key={k}>
                <td>{k === 'hadala' ? 'Hádala jsem' : k === 'asi' ? 'Asi' : 'Jistě'}</td>
                <td>{radar.confidence.byChoice[k].n}</td>
                <td>{radar.confidence.byChoice[k].n ? pct(radar.confidence.byChoice[k].correct / radar.confidence.byChoice[k].n) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          Sedmileté děti se obvykle spíš přeceňují. Vysoký podíl „hádala jsem“ u správných odpovědí proto stojí za pozornost – je to vzorec podceňování, o kterém můžete mluvit i s psycholožkou.
        </p>
      </div>
    </div>
  );
}

function PppView({ radar }: { radar: Radar }) {
  const settings = useGame((s) => s.profile.settings);
  const update = useGame((s) => s.updateSettings);
  return (
    <div className="ppp">
      <div className="card note">
        <strong>Co dítě trénovalo.</strong> Podle vašeho rozhodnutí hra trénuje i úlohy, jejichž formát se podobá subtestům inteligence (např. řady nebo váhy). Takový trénink může výsledek v PPP zvednout zhruba o 3–5 bodů. Předejte proto tento přehled psycholožce – může zvolit jiné úlohy nebo výsledek vyložit s ohledem na něj.
      </div>
      <label className="field">
        Datum návštěvy PPP:{' '}
        <input type="date" value={settings.pppDate ?? ''} onChange={(e) => update({ pppDate: e.target.value })} />
      </label>
      <div className="card">
        {radar.testLike.length === 0 ? (
          <p className="muted">Zatím žádné úlohy testového formátu.</p>
        ) : (
          <table className="conf-table">
            <thead>
              <tr>
                <th>Formát</th>
                <th>úloh</th>
                <th>minut</th>
                <th>poprvé</th>
                <th>naposledy</th>
              </tr>
            </thead>
            <tbody>
              {radar.testLike.map((t) => (
                <tr key={t.format}>
                  <td>{t.label}</td>
                  <td>{t.count}</td>
                  <td>{t.minutes}</td>
                  <td>{date(t.first)}</td>
                  <td>{date(t.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card">
        <h3>Příprava na návštěvu (co funguje)</h3>
        <ul className="plain">
          <li>Řekněte dítěti: „Paní psycholožka má spoustu různých úkolů. Nejdřív budou lehké, pak čím dál těžší, až tak těžké, že je nevyřeší ani dospělí – to je schválně a stává se to každému. Když nevíš, můžeš tipnout. Nejsou to známky a nedá se to pokazit.“</li>
          <li>Nemluvte o „testu nadání“ a neslibujte odměnu za výsledek.</li>
          <li>Vyspaná, spíš dopolední termín, svačina.</li>
          <li>Psycholožce řekněte o sklonu podceňovat se a vzdávat těžké úlohy a požádejte o výklad po indexech.</li>
          <li>Vezměte portfolio (záložka Portfolio) a vyplněný školní dotazník.</li>
        </ul>
      </div>
    </div>
  );
}

function Portfolio({ radar }: { radar: Radar }) {
  const profile = useGame((s) => s.profile);
  const update = useGame((s) => s.updateSettings);
  const [notes, setNotes] = useState(profile.settings.notes ?? '');
  return (
    <div className="portfolio">
      <div className="no-print row-actions">
        <button className="btn btn-sea" onClick={() => window.print()}>
          Vytisknout / uložit jako PDF
        </button>
      </div>
      <div className="print-page card">
        <h2>Portfolio z hry Dračí ostrovy</h2>
        <p className="muted small">
          Vytištěno {date(Date.now())} · {count(radar.totals.answers, ODPOVED)} za {count(radar.totals.days, DEN)} · orientační údaje z domácí vzdělávací hry, nejde o standardizované měření.
        </p>
        <h3>Zvládnuté úrovně podle RVP ZV</h3>
        <table className="conf-table small">
          <thead>
            <tr>
              <th>Oblast</th>
              <th>Dovednost</th>
              <th>Zvládá (rozpětí)</th>
              <th>Výstupy RVP</th>
              <th>Odpovědí</th>
            </tr>
          </thead>
          <tbody>
            {radar.islands.flatMap(({ island, skills }) =>
              skills
                .filter((s) => s.levels)
                .map((s) => (
                  <tr key={s.skill.id}>
                    <td>{island.name}</td>
                    <td>{s.skill.name}</td>
                    <td>{rangeLabel(s.levels!)}</td>
                    <td>{(s.skill.rvp[(s.levels!.mid || s.skill.levels[0]) as 1] ?? []).join(', ')}</td>
                    <td>{s.answers}</td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
        {radar.testLike.length > 0 && (
          <>
            <h3>Trénované formáty podobné subtestům</h3>
            <p className="small">{radar.testLike.map((t) => `${t.label} (${t.count}×, ${date(t.first)}–${date(t.last)})`).join('; ')}</p>
          </>
        )}
        {radar.creativity.samples.length > 0 && (
          <>
            <h3>Ukázky vlastní tvorby</h3>
            <ul className="samples small">
              {radar.creativity.samples.map((s, i) => (
                <li key={i}>
                  {date(s.t)}: „{s.text}“
                </li>
              ))}
            </ul>
          </>
        )}
        <h3>Pozorování rodiče</h3>
        <textarea
          className="notes no-print"
          rows={8}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => update({ notes })}
          placeholder="Např. kdy začala číst a počítat, jaké klade otázky, co ji baví, jak reaguje na těžké úkoly, co říká škola…"
        />
        <div className="print-only notes-print">{notes || '—'}</div>
      </div>
    </div>
  );
}

function SettingsView() {
  const profile = useGame((s) => s.profile);
  const update = useGame((s) => s.updateSettings);
  const setGrade = useGame((s) => s.setGrade);
  const updateDragon = useGame((s) => s.updateDragon);
  const replace = useGame((s) => s.replaceProfile);
  const [look, setLook] = useState(profile.dragon);
  const [name, setName] = useState(profile.dragonName);
  const [msg, setMsg] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const s = profile.settings;

  const download = async () => {
    const json = await exportAll(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draci-ostrovy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings">
      <div className="card">
        <h3>Hra</h3>
        <label className="field">
          Ročník:{' '}
          <select value={profile.grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                {g}. třída
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <input type="checkbox" checked={s.sound} onChange={(e) => update({ sound: e.target.checked })} /> Zvuky
        </label>
        <label className="field">
          <input type="checkbox" checked={s.voice} onChange={(e) => update({ voice: e.target.checked })} /> Tlačítko „Přečti mi to“{' '}
          <span className="muted small">({hasCzechVoice() ? `hlas: ${voiceName()}` : 'v tomto prohlížeči chybí český hlas'})</span>
        </label>
        <label className="field">
          Misí v Dnešním letu:{' '}
          <select value={s.missions} onChange={(e) => update({ missions: Number(e.target.value) })}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Otázka „Jak jistá si jsi?“:{' '}
          <select value={s.confidenceEvery} onChange={(e) => update({ confidenceEvery: Number(e.target.value) })}>
            <option value={0}>vypnuto</option>
            <option value={3}>u každé 3. úlohy</option>
            <option value={5}>u každé 5. úlohy</option>
          </select>
        </label>
      </div>

      {look && (
        <div className="card">
          <h3>Drak</h3>
          <input className="name-input small-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          <DragonEditor look={look} onChange={setLook} />
          <button className="btn btn-sea" onClick={() => updateDragon(look, name)}>
            Uložit draka
          </button>
        </div>
      )}

      <div className="card">
        <h3>Data</h3>
        <p className="muted small">
          Vše je uložené jen v tomto zařízení (localStorage a IndexedDB). Nic se neodesílá. Zálohu si můžete stáhnout a nahrát do jiného zařízení.
        </p>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={download}>
            Stáhnout zálohu
          </button>
          <label className="btn btn-ghost">
            Nahrát zálohu
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  replace(await importAll(await file.text()));
                  setMsg('Záloha nahrána.');
                } catch {
                  setMsg('Soubor se nepodařilo načíst.');
                }
              }}
            />
          </label>
          {!confirmWipe && (
            <button className="btn btn-ghost danger" onClick={() => setConfirmWipe(true)}>
              Smazat vše
            </button>
          )}
        </div>
        {confirmWipe && (
          <div className="wipe-confirm">
            <p>Opravdu smazat všechna data hry v tomto zařízení? Nejde to vrátit.</p>
            <div className="row-actions">
              <button
                className="btn btn-ghost danger"
                onClick={async () => {
                  await wipeAll();
                  location.reload();
                }}
              >
                Ano, smazat
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmWipe(false)}>
                Nechat být
              </button>
            </div>
          </div>
        )}
        {msg && <p>{msg}</p>}
      </div>
      <div className="card">
        <h3>PIN</h3>
        <button className="btn btn-ghost" onClick={() => update({ pin: undefined })}>
          Zrušit PIN (při dalším vstupu nastavíte nový)
        </button>
      </div>
      <p className="muted small">Ostrovy světa, záhad, trhu a dílny přibudou v další fázi. Předčítání závisí na českém hlasu v zařízení.</p>
      <p className="muted small">Ostrovy: {ISLANDS.filter((i) => i.available).map((i) => i.name).join(', ')}.</p>
    </div>
  );
}
