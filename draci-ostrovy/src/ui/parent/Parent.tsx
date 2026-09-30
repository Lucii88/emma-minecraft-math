import { useEffect, useMemo, useState } from 'react';
import { ISLANDS, MISSIONS, missionsOf } from '../../content';
import { useGame } from '../../core/game';
import { gx, mapStrings, type Gender } from '../../core/gender';
import { buildRadar, type Radar } from '../../core/radar';
import { levelLabel } from '../../core/planner';
import { exportAll, importAll, loadEvents, wipeAll, type Profile } from '../../core/storage';
import { hasCzechVoice, voiceName } from '../../core/speech';
import type { AnswerEvent } from '../../core/types';
import { Icon } from '../components/Bits';
import { count, form } from '../../core/czech';
import { buildDemo } from '../../core/demo';
import { DragonEditor } from '../screens/Hatch';

const ODPOVED = ['odpověď', 'odpovědi', 'odpovědí'] as const;
const DEN = ['den', 'dny', 'dní'] as const;

/** „2.–3. ročník“, „pod 1. ročníkem“ – rozpětí zvládnutých úrovní slovy. */
function rangeLabel(l: { low: number; mid: number; high: number }): string {
  if (l.high === 0) return 'zatím pod 1. ročníkem';
  const lo = l.low === 0 ? 'pod 1.' : `${l.low}.`;
  const main = l.mid > 0 ? levelLabel(l.mid) : 'pod 1. ročníkem';
  return l.low === l.high ? main : `${main} (rozpětí ${lo}–${l.high}. ročník)`;
}

type Tab = 'radar' | 'testy' | 'mise' | 'portfolio' | 'settings';

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const date = (t: number) => new Date(t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

/** Co rodič právě prohlíží: své dítě, nebo ukázku se smyšleným dítětem. */
interface View {
  profile: Profile;
  radar: Radar;
  demo: boolean;
  /** Texty o dítěti ve správném rodě. */
  t: (text: string) => string;
}

export function Parent() {
  const go = useGame((s) => s.go);
  const profile = useGame((s) => s.profile);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('radar');
  const [events, setEvents] = useState<AnswerEvent[] | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (unlocked) void loadEvents().then((e) => setEvents([...e]));
  }, [unlocked]);

  const demoData = useMemo(() => (demo ? buildDemo() : null), [demo]);
  const shown = demoData?.profile ?? profile;
  const radar = useMemo(() => {
    if (demoData) return buildRadar(demoData.profile, demoData.events);
    return events ? buildRadar(profile, events) : null;
  }, [demoData, profile, events]);

  if (!unlocked) return <PinGate onOk={() => setUnlocked(true)} onBack={() => go('map')} />;

  const view: View | null = radar ? { profile: shown, radar, demo, t: (text) => gx(text, shown.gender) } : null;
  const tabs: [Tab, string][] = [
    ['radar', 'Jak na tom je'],
    ['testy', 'Testové úlohy'],
    ['mise', 'Společné mise'],
    ['portfolio', 'Portfolio'],
    ...(demo ? [] : ([['settings', 'Nastavení']] as [Tab, string][])),
  ];
  const openDemo = () => {
    setDemo(true);
    setTab('radar');
    window.scrollTo(0, 0);
  };

  return (
    <div className={`screen parent${demo ? ' demo' : ''}`}>
      <div className="topbar no-print">
        <button className="btn btn-round btn-ghost" onClick={() => go('map')} aria-label="Zpět do hry">
          <Icon name="back" />
        </button>
        <h1>Pro rodiče</h1>
        <span className="spacer" />
        <nav className="tabs">
          {tabs.map(([id, name]) => (
            <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              {name}
            </button>
          ))}
        </nav>
      </div>
      {demo ? (
        <div className="card demo-banner no-print">
          <p>
            <strong>Ukázka.</strong> Smyšlené dítě ({shown.name}, {shown.grade}. třída) a smyšlená data zhruba z měsíce hraní – takhle přehled vypadá, když se naplní. Nejsou to data vašeho dítěte.
          </p>
          <button className="btn btn-sea" onClick={() => setDemo(false)}>
            Zpět k {profile.name ? `přehledu: ${profile.name}` : 'mému dítěti'}
          </button>
        </div>
      ) : (
        view &&
        view.radar.totals.answers < 30 &&
        tab === 'radar' && (
          <div className="card demo-banner no-print">
            <p>Přehled se naplní po několika dnech hraní. Mezitím se můžete podívat, jak vypadá u smyšleného dítěte.</p>
            <button className="btn btn-sea" onClick={openDemo}>
              Ukázka přehledu
            </button>
          </div>
        )
      )}
      {!view && <p>Načítám…</p>}
      {view && tab === 'radar' && <RadarView view={view} />}
      {view && tab === 'testy' && <TestLikeView view={view} />}
      {view && tab === 'mise' && <MissionsView view={view} />}
      {view && tab === 'portfolio' && <Portfolio view={view} />}
      {!demo && tab === 'settings' && <SettingsView onDemo={openDemo} />}
    </div>
  );
}

function PinGate({ onOk, onBack }: { onOk: () => void; onBack: () => void }) {
  const pin = useGame((s) => s.device.pin);
  const setPin = useGame((s) => s.setPin);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false);
  const [answer, setAnswer] = useState('');
  // Otázka pro dospělé: dvojmístné krát jednomístné číslo.
  const [q] = useState(() => ({ x: 13 + Math.floor(Math.random() * 80), y: 3 + Math.floor(Math.random() * 7) }));
  const creating = !pin;

  if (forgot && !creating) {
    return (
      <div className="screen center pin-gate">
        <div className="card pin-card">
          <h2>Zapomenutý PIN</h2>
          <p className="muted small">Otázka pro dospělé. Když odpovíte, nastavíte si nový PIN – data dítěte zůstanou.</p>
          <p className="pin-question">
            Kolik je {q.x} × {q.y}?
          </p>
          <input className="pin-input" inputMode="numeric" maxLength={4} value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))} autoFocus />
          {err && <p className="err">{err}</p>}
          <div className="row-actions">
            <button className="btn btn-ghost" onClick={() => setForgot(false)}>
              Zpět
            </button>
            <button
              className="btn btn-sea"
              onClick={() => {
                if (Number(answer) !== q.x * q.y) return setErr('To nesedí.');
                setErr('');
                setPin(undefined);
                setForgot(false);
              }}
            >
              Ověřit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen center pin-gate">
      <div className="card pin-card">
        <h2>{creating ? 'Nastavte rodičovský PIN' : 'Jen pro rodiče'}</h2>
        <p className="muted small">
          {creating
            ? 'Čtyři číslice. Chrání rodičovský přehled před zvědavými dračími jezdci (není to zabezpečení proti útočníkům – data jsou jen v tomto zařízení).'
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
                setPin(a);
                onOk();
              } else if (a === pin) onOk();
              else setErr('To není ono.');
            }}
          >
            Pokračovat
          </button>
        </div>
        {!creating && (
          <button
            className="btn btn-ghost btn-small forgot"
            onClick={() => {
              setErr('');
              setForgot(true);
            }}
          >
            Zapomněli jste PIN?
          </button>
        )}
      </div>
    </div>
  );
}

function Advantage({ value }: { value: number }) {
  const label = value >= 2 ? 'výrazně nad ročníkem' : value >= 1 ? 'nad ročníkem' : value >= 0 ? 'zhruba na úrovni ročníku' : 'pod úrovní ročníku';
  return <span className={`adv adv-${value >= 1 ? 'up' : value >= 0 ? 'mid' : 'down'}`}>{label}</span>;
}

function RadarView({ view: { profile, radar, t } }: { view: View }) {
  return (
    <div className="radar">
      <div className="card note">
        <strong>Jak číst přehled.</strong> Ukazuje signály, ne diagnózu – žádné IQ ani srovnání s jinými dětmi. Úrovně jsou vztažené k očekávaným výstupům RVP ZV (1.–5. ročník) a mají rozpětí podle toho, kolik odpovědí máme. Odhad se zpřesňuje zhruba po 10 odpovědích v dovednosti. Dítě tuto stránku nevidí.
      </div>

      <div className="stat-row">
        <div className="card stat"><b>{radar.totals.answers}</b><span>{form(radar.totals.answers, ODPOVED)}</span></div>
        <div className="card stat"><b>{radar.totals.sessions}</b><span>{form(radar.totals.sessions, ['let', 'lety', 'letů'])}</span></div>
        <div className="card stat"><b>{radar.totals.days}</b><span>{form(radar.totals.days, DEN)} hraní</span></div>
        <div className="card stat"><b>{radar.totals.minutes}</b><span>{form(radar.totals.minutes, ['minuta', 'minuty', 'minut'])} přemýšlení</span></div>
      </div>

      <h2 className="section-title">1. Co zvládá vzhledem k ročníku</h2>
      <p className="muted small">Pruh ukazuje rozpětí stupňů, které zvládá s pravděpodobností aspoň 70 %; tečka je nejpravděpodobnější hodnota. Svislá čára = aktuální ročník ({profile.grade}.). Stupně odpovídají očekávaným výstupům RVP ZV.</p>
      {radar.islands.map(({ island, skills }) => (
        <div key={island.id} className="card radar-island">
          <h3>{island.name}</h3>
          <table className="lv-table">
            <tbody>
              {skills.map((s) => (
                <tr key={s.skill.id}>
                  <td className="lv-name">
                    {s.skill.name}
                    {s.skill.testLike && <span className="tag" title="Formát podobný úlohám psychologických testů">testový formát</span>}
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
                      <span className="muted">{t('zatím {nehrála|nehrál}')}</span>
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
          <h3>Silné stránky (v rámci dítěte, ne srovnání s ostatními)</h3>
          <ul className="plain">
            {radar.abilities.map((a) => (
              <li key={a.ability}>
                <strong>{a.label}</strong> – <Advantage value={a.advantage} /> <span className="muted small">({a.skills} dovedn.)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="section-title">2. Jak rychle se učí</h2>
      <div className="card">
        <p>
          Úplně nové typy úloh: <b>{radar.potential.novelTasks}</b> · napoprvé správně <b>{pct(radar.potential.novelFirstTry)}</b> · průměrně nápověd na novou úlohu{' '}
          <b>{radar.potential.hintsPerNovel === null ? '–' : radar.potential.hintsPerNovel.toFixed(1)}</b>
        </p>
        <p className="muted small">Málo nápověd u neznámého typu úlohy je jeden z lepších signálů rychlého učení. Pořád jde o orientační údaj.</p>
      </div>

      <h2 className="section-title">3. Vytrvalost</h2>
      <div className="card">
        <p>
          Bouřkový let (dobrovolně těžší úlohy): <b>{radar.commitment.braveItems}</b> úloh, vyřešeno <b>{radar.commitment.braveSolved}</b>. {t('Po chybě to nakonec {vyřešila|vyřešil}')} v{' '}
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
          Hodnocených odpovědí: <b>{radar.confidence.rated}</b>. {t('Ze správných odpovědí {označila|označil} „{hádala|hádal} jsem“')}: <b>{pct(radar.confidence.underconfidence)}</b>.{' '}
          {t('Z chybných odpovědí {označila|označil} „jistě“')}: <b>{pct(radar.confidence.overconfidence)}</b>.
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
                <td>{k === 'hadala' ? t('{Hádala|Hádal} jsem') : k === 'asi' ? 'Asi' : 'Jistě'}</td>
                <td>{radar.confidence.byChoice[k].n}</td>
                <td>{radar.confidence.byChoice[k].n ? pct(radar.confidence.byChoice[k].correct / radar.confidence.byChoice[k].n) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          {t(
            'Děti v tomhle věku se obvykle spíš přeceňují. Vysoký podíl „{hádala|hádal} jsem“ u správných odpovědí proto stojí za pozornost – je to vzorec podceňování, o kterém stojí za to s dítětem mluvit (a případně i s učitelem nebo psychologem).',
          )}
        </p>
      </div>
    </div>
  );
}

function TestLikeView({ view: { profile, radar, demo } }: { view: View }) {
  const update = useGame((s) => s.updateSettings);
  const settings = profile.settings;
  return (
    <div className="ppp">
      <div className="card note">
        <strong>Úlohy podobné testům.</strong> Některé hlavolamy mají stejný formát jako úlohy psychologických testů (třeba obrázkové řady, matice, analogie nebo obecné znalosti). Pro běžné hraní jsou v pořádku – rozvíjejí úvahu. Krátce před vyšetřením (například v pedagogicko-psychologické poradně) ale může jejich trénink výsledek zvednout zhruba o 3–5 bodů. Proto tu je přehled, co a kdy dítě trénovalo, a možnost tyto úlohy vynechat.
      </div>
      {!demo && (
        <div className="card">
          <label className="field">
            <input type="checkbox" checked={!!settings.skipTestLike} onChange={(e) => update({ skipTestLike: e.target.checked })} /> Vynechat úlohy podobné testům
          </label>
          <label className="field">
            Datum vyšetření (nepovinné):{' '}
            <input type="date" value={settings.pppDate ?? ''} onChange={(e) => update({ pppDate: e.target.value })} />
          </label>
        </div>
      )}
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
        <h3>Když dítě čeká vyšetření (co funguje)</h3>
        <ul className="plain">
          <li>Řekněte dítěti: „Budeš dostávat různé úkoly. Nejdřív budou lehké, pak čím dál těžší, až tak těžké, že je nevyřeší ani dospělí – to je schválně a stává se to každému. Když nevíš, můžeš tipnout. Nejsou to známky a nedá se to pokazit.“</li>
          <li>Nemluvte o „testu nadání“ a neslibujte odměnu za výsledek.</li>
          <li>Vyspané dítě, spíš dopolední termín, svačina.</li>
          <li>Pokud se dítě podceňuje nebo těžké úlohy vzdává, řekněte to psychologovi a požádejte o výklad po indexech.</li>
          <li>Vezměte portfolio (záložka Portfolio) a tento přehled trénovaných úloh.</li>
        </ul>
      </div>
    </div>
  );
}

function MissionsView({ view: { profile, demo, t } }: { view: View }) {
  const undo = useGame((s) => s.undoMission);
  const done = profile.missionsDone;
  const islands = ISLANDS.filter((i) => i.available && missionsOf(i.id).length > 0);
  return (
    <div className="parent-missions">
      <p className="lead">
        Úkoly do skutečného světa na 10–20 minut. Nejde o doučování: hrajte si, ptejte se a chvalte postup (
        {t('„{zkusila|zkusil} jsi to jinak“')}), ne talent. Dítě si splněnou misi odškrtne samo v Knize draků nebo na ostrově.
      </p>
      {islands.map((island) => (
        <section key={island.id}>
          <h2 className="section-title">{island.name}</h2>
          <div className="pm-list">
            {missionsOf(island.id).map((raw) => {
              const m = mapStrings(raw, profile.gender);
              return (
                <article key={m.id} className={`card pm${done[m.id] ? ' done' : ''}`}>
                  <h3>
                    <span aria-hidden>{m.emoji}</span> {m.title}
                    <span className="muted small"> · od {levelLabel(m.level)}</span>
                  </h3>
                  <p>
                    <strong>Pro dítě:</strong> {m.text}
                  </p>
                  <p>
                    <strong>Tip:</strong> {m.parentTip}
                  </p>
                  {done[m.id] ? (
                    <p className="small">
                      ✓ Splněno {date(done[m.id])}{' '}
                      {!demo && (
                        <button className="btn btn-ghost btn-small" onClick={() => undo(m.id)}>
                          Zrušit odškrtnutí
                        </button>
                      )}
                    </p>
                  ) : (
                    <p className="muted small">Zatím nesplněno.</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Portfolio({ view: { profile, radar, demo, t } }: { view: View }) {
  const update = useGame((s) => s.updateSettings);
  const [notes, setNotes] = useState(profile.settings.notes ?? '');
  useEffect(() => setNotes(profile.settings.notes ?? ''), [profile]);
  const missions = MISSIONS.filter((m) => profile.missionsDone[m.id]).map((m) => mapStrings(m, profile.gender));
  return (
    <div className="portfolio">
      <div className="no-print row-actions">
        <button className="btn btn-sea" onClick={() => window.print()}>
          Vytisknout / uložit jako PDF
        </button>
      </div>
      <div className="print-page card">
        <h2>Portfolio z hry Dračí ostrovy{profile.name ? ` – ${profile.name}` : ''}</h2>
        <p className="muted small">
          {demo ? 'Ukázka se smyšleným dítětem · ' : ''}Vytištěno {date(Date.now())} · {count(radar.totals.answers, ODPOVED)} za {count(radar.totals.days, DEN)} · orientační údaje z domácí vzdělávací hry, nejde o standardizované měření.
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
            <h3>Trénované úlohy podobné testům</h3>
            <p className="small">{radar.testLike.map((x) => `${x.label} (${x.count}×, ${date(x.first)}–${date(x.last)})`).join('; ')}</p>
          </>
        )}
        {missions.length > 0 && (
          <>
            <h3>Splněné společné mise s rodičem</h3>
            <p className="small">{missions.map((m) => `${m.title} (${date(profile.missionsDone[m.id])})`).join('; ')}</p>
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
          readOnly={demo}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => !demo && update({ notes })}
          placeholder={t('Např. kdy {začala|začal} číst a počítat, jaké klade otázky, co {ji|ho} baví, jak reaguje na těžké úkoly, co říká škola…')}
        />
        <div className="print-only notes-print">{notes || '—'}</div>
      </div>
    </div>
  );
}

function SettingsView({ onDemo }: { onDemo: () => void }) {
  const profile = useGame((s) => s.profile);
  const device = useGame((s) => s.device);
  const playerId = useGame((s) => s.playerId);
  const update = useGame((s) => s.updateSettings);
  const setGrade = useGame((s) => s.setGrade);
  const updateDragon = useGame((s) => s.updateDragon);
  const updatePlayer = useGame((s) => s.updatePlayer);
  const removePlayer = useGame((s) => s.removePlayer);
  const setPin = useGame((s) => s.setPin);
  const replace = useGame((s) => s.replaceProfile);
  const go = useGame((s) => s.go);
  const [look, setLook] = useState(profile.dragon);
  const [name, setName] = useState(profile.dragonName);
  const [playerName, setPlayerName] = useState(profile.name);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState<'player' | 'all' | null>(null);
  const s = profile.settings;
  const t = (text: string) => gx(text, profile.gender);
  const who = profile.name || 'tohoto hráče';

  const download = async () => {
    const json = await exportAll(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draci-ostrovy-${profile.name ? `${profile.name.toLocaleLowerCase('cs')}-` : ''}${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings">
      <div className="card">
        <h3>Hráč</h3>
        <label className="field">
          Jméno:{' '}
          <input className="name-input small-input" value={playerName} maxLength={20} onChange={(e) => setPlayerName(e.target.value)} onBlur={() => updatePlayer({ name: playerName })} />
        </label>
        <div className="field">
          Oslovovat jako:
          {(
            [
              ['f', 'holku'],
              ['m', 'kluka'],
            ] as [Gender, string][]
          ).map(([g, label]) => (
            <button key={g} className={`chip${profile.gender === g ? ' active' : ''}`} aria-pressed={profile.gender === g} onClick={() => updatePlayer({ gender: g })}>
              {label}
            </button>
          ))}
        </div>
        <label className="field">
          Třída:{' '}
          <select value={profile.grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                {g}. třída
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Na tomto zařízení {device.players.length === 1 ? 'hraje 1 hráč' : `hrají ${device.players.length} hráči`}.{' '}
          <button className="btn btn-ghost btn-small" onClick={() => go('setup')}>
            Přidat dalšího hráče
          </button>{' '}
          {device.players.length > 1 && (
            <button className="btn btn-ghost btn-small" onClick={() => go('players')}>
              Přepnout hráče
            </button>
          )}
        </p>
      </div>

      <div className="card">
        <h3>Hra</h3>
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
          {t('Otázka „Jak {jistá|jistý} si jsi?“')}:{' '}
          <select value={s.confidenceEvery} onChange={(e) => update({ confidenceEvery: Number(e.target.value) })}>
            <option value={0}>vypnuto</option>
            <option value={3}>u každé 3. úlohy</option>
            <option value={5}>u každé 5. úlohy</option>
          </select>
        </label>
        <label className="field">
          <input type="checkbox" checked={!!s.skipTestLike} onChange={(e) => update({ skipTestLike: e.target.checked })} /> Vynechat úlohy podobné testům{' '}
          <span className="muted small">(viz záložka Testové úlohy)</span>
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
          Vše je uložené jen v tomto zařízení (localStorage a IndexedDB). Nic se neodesílá. Zálohu hráče si můžete stáhnout a nahrát do jiného zařízení.
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
                  replace(await importAll(await file.text(), profile));
                  setMsg('Záloha nahrána.');
                } catch {
                  setMsg('Soubor se nepodařilo načíst.');
                }
              }}
            />
          </label>
          {!confirm && (
            <>
              <button className="btn btn-ghost danger" onClick={() => setConfirm('player')}>
                Smazat hráče
              </button>
              <button className="btn btn-ghost danger" onClick={() => setConfirm('all')}>
                Smazat vše
              </button>
            </>
          )}
        </div>
        {confirm && (
          <div className="wipe-confirm">
            <p>
              {confirm === 'player'
                ? `Opravdu smazat ${who === 'tohoto hráče' ? who : `hráče ${who}`} – draka, postup i přehled? Nejde to vrátit.`
                : 'Opravdu smazat všechna data hry v tomto zařízení (všechny hráče i PIN)? Nejde to vrátit.'}
            </p>
            <div className="row-actions">
              <button
                className="btn btn-ghost danger"
                onClick={async () => {
                  if (confirm === 'player' && playerId) {
                    await removePlayer(playerId);
                    setConfirm(null);
                    return;
                  }
                  await wipeAll();
                  location.reload();
                }}
              >
                Ano, smazat
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                Nechat být
              </button>
            </div>
          </div>
        )}
        {msg && <p>{msg}</p>}
      </div>

      <div className="card">
        <h3>PIN a ukázka</h3>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={() => setPin(undefined)}>
            Zrušit PIN (při dalším vstupu nastavíte nový)
          </button>
          <button className="btn btn-ghost" onClick={onDemo}>
            Ukázka přehledu se smyšleným dítětem
          </button>
        </div>
      </div>
      <p className="muted small">Předčítání závisí na českém hlasu v zařízení.</p>
    </div>
  );
}
