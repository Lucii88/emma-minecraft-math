import { useEffect, useState } from 'react';
import { TRICKS, islandOf, missionsOf } from '../../content';
import { useGame, type Gain } from '../../core/game';
import { masteredLevels } from '../../core/model';
import { playableSkills, stateOf } from '../../core/planner';
import { sfx } from '../../core/sound';
import { Dragon } from '../components/Dragon';
import { Icon, Sparkles } from '../components/Bits';
import { IslandArt } from './MapScreen';
import { MissionCard, islandBookProgress } from './Book';
import { count } from '../../core/czech';
import { useGx } from '../useGx';

const ULOHA_ACC = ['úlohu', 'úlohy', 'úloh'] as const;

// ---------------------------------------------------------------------------
// Ostrov

export function IslandScreen() {
  const island = useGame((s) => s.island);
  const profile = useGame((s) => s.profile);
  const go = useGame((s) => s.go);
  const startSkill = useGame((s) => s.startSkill);
  if (!island) return null;
  const def = islandOf(island);
  const skills = playableSkills(profile, island);
  const friend = profile.species.includes(island);
  const missions = missionsOf(island);
  const pages = islandBookProgress(island, profile.best);

  return (
    <div className="screen island-screen">
      <div className="topbar">
        <button className="btn btn-round btn-ghost" onClick={() => go('map')} aria-label="Zpět na mapu">
          <Icon name="back" />
        </button>
        <h1>{def.name}</h1>
      </div>
      <div className="island-head card">
        <IslandArt id={island} size={180} />
        <div>
          <p className="lead">{def.tagline}</p>
          <p className="muted">
            {friend ? (
              <>
                Tvůj přítel tady: <strong>{def.species.name}</strong>. {def.species.description}
              </>
            ) : (
              <>Na ostrově žije {def.species.name}. Spřátelíte se po první misi.</>
            )}
          </p>
        </div>
      </div>
      <div className="skill-grid">
        {skills.map((s) => {
          const st = stateOf(profile, s.id);
          // Dítěti ukazujeme nejlepší dosažený stupeň – nikdy neklesá.
          const lv = Math.max(profile.best?.[s.id] ?? 0, st.n >= 3 ? masteredLevels(s, st).mid : 0);
          return (
            <div key={s.id} className="card skill-card">
              <div className="skill-name">{s.name}</div>
              {!s.open && (
                <div className="stars" aria-label={`Stupeň ${lv} ze 6`}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <span key={i} className={i < lv ? 'star on' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
              )}
              {s.open && <div className="muted small">Tvořivá úloha – bez správně a špatně</div>}
              <div className="skill-actions">
                <button className="btn btn-sea" onClick={() => startSkill(s.id)}>
                  {s.open ? 'Tvořit' : 'Procvičit'}
                </button>
                {!s.open && st.n >= 5 && (
                  <button className="btn btn-ghost storm" onClick={() => startSkill(s.id, true)} title="Bouřkový let: 2 schválně těžké úlohy">
                    ⚡ Bouřkový let
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {pages.total > 0 && (
        <button className="card book-hint" onClick={() => go('book')}>
          <span aria-hidden>📖</span> V Knize draků máš z tohoto ostrova {pages.open} z {pages.total} stránek.
        </button>
      )}
      {missions.length > 0 && (
        <>
          <h2 className="section-title">Společné mise s rodiči</h2>
          <div className="missions">
            {missions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Konec mise

function GainList({ gains }: { gains: Gain[] }) {
  if (!gains.length) return null;
  return (
    <ul className="gains">
      {gains.map((g, i) => (
        <li key={i} className={`gain gain-${g.kind}`}>
          <span className="gain-icon" aria-hidden>
            {g.kind === 'trick' ? '✨' : g.kind === 'level' ? '★' : g.kind === 'species' ? '🐉' : g.kind === 'card' ? '📖' : '⚡'}
          </span>
          {g.text}
        </li>
      ))}
    </ul>
  );
}

export function MissionEnd() {
  const t = useGx();
  const run = useGame((s) => s.run);
  const profile = useGame((s) => s.profile);
  const next = useGame((s) => s.continueRun);
  const [trickAnim, setTrickAnim] = useState<string>('');
  const trickGain = run?.missionGains.find((g) => g.kind === 'trick');
  const trick = TRICKS.find((t) => t.id === trickGain?.trickId);

  useEffect(() => {
    if (!trick) return;
    const t1 = setTimeout(() => {
      sfx.trick();
      setTrickAnim(trick.anim === 'fire' || trick.anim === 'smoke' ? 'trick-hop' : `trick-${trick.anim}`);
    }, 400);
    return () => clearTimeout(t1);
  }, [trick]);

  if (!run) return null;
  const mission = run.missions[run.mIndex];
  const results = run.results.slice(-mission.count);
  const firstTry = results.filter((r) => r.outcome === 'first').length;
  const persisted = results.filter((r) => r.outcome === 'later').length;
  const last = run.mIndex + 1 >= run.missions.length;

  let line = 'Mise splněna.';
  if (persisted >= 2) line = t(`Mise splněna. ${persisted}× jsi to {nevzdala|nevzdal} a {našla|našel} správnou cestu.`);
  else if (mission.kind === 'brave') line = t('{Pustila|Pustil} ses do schválně těžkých úloh. To chce odvahu.');
  else if (firstTry === results.length && results.length > 1) line = 'Mise splněna – všechno napoprvé. Příště můžeš zkusit Bouřkový let.';

  return (
    <div className="screen center mission-end">
      <Sparkles show={!!trick}>
        <div className={trickAnim} style={{ display: 'inline-block' }}>
          {profile.dragon && <Dragon look={profile.dragon} mood="happy" size={230} />}
        </div>
        {trick?.anim === 'fire' && trickAnim && <FireBurst color={trick.fire!} />}
      </Sparkles>
      <h1>{trick ? `Nový kousek: ${trick.name}!` : 'Hotovo!'}</h1>
      <p className="lead">{line}</p>
      <GainList gains={run.missionGains.filter((g) => g.kind !== 'trick')} />
      <button className="btn btn-primary btn-big" onClick={next} autoFocus>
        {last ? (run.day ? 'Dokončit let' : 'Zpět na mapu') : 'Další mise'}
      </button>
    </div>
  );
}

function FireBurst({ color }: { color: string }) {
  const colors = color === 'rainbow' ? ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'] : [color, '#fff3b0', color];
  return (
    <div className="fire-burst" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} style={{ background: colors[i % colors.length], ['--i' as string]: i }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Konec dne

export function DayEnd() {
  const t = useGx();
  const run = useGame((s) => s.run);
  const profile = useGame((s) => s.profile);
  const quit = useGame((s) => s.quitRun);
  const startSkill = useGame((s) => s.startSkill);
  if (!run) return null;
  const firstTry = run.results.filter((r) => r.outcome === 'first').length;
  const later = run.results.filter((r) => r.outcome === 'later').length;
  const growth = run.missions.find((m) => m.kind === 'growth');
  const braveSkill = growth?.skillIds[0];

  return (
    <div className="screen center day-end">
      {profile.dragon && <Dragon look={profile.dragon} mood="sleep" size={220} />}
      <h1>Dnešní let je u konce</h1>
      <p className="lead">
        {profile.dragonName || 'Tvůj drak'} spokojeně odpočívá. {t('{Vyřešila|Vyřešil}')} jsi {count(run.results.length, ULOHA_ACC)}
        {later > 0 ? `, z toho ${later} po opravě – i to se počítá` : ''}.
      </p>
      <div className="card journal-mini">
        <strong>Co dnes umím navíc:</strong>
        {run.gains.filter((g) => g.kind === 'level').length ? (
          <GainList gains={run.gains.filter((g) => g.kind === 'level')} />
        ) : (
          <p className="muted">{t('{Procvičila|Procvičil}')} jsi {count(firstTry + later, ULOHA_ACC)}. Nové stupně přijdou, když budeš dál zkoušet těžší věci.</p>
        )}
      </div>
      <div className="row-actions">
        {braveSkill && (profile.skills[braveSkill]?.n ?? 0) >= 5 && (
          <button className="btn btn-sea" onClick={() => startSkill(braveSkill, true)}>
            ⚡ Ještě Bouřkový let?
          </button>
        )}
        <button className="btn btn-primary btn-big" onClick={quit}>
          Zpět na ostrov
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deník

export function Journal() {
  const t = useGx();
  const profile = useGame((s) => s.profile);
  const go = useGame((s) => s.go);
  const entries = profile.journal.slice().reverse();
  return (
    <div className="screen journal">
      <div className="topbar">
        <button className="btn btn-round btn-ghost" onClick={() => go('map')} aria-label="Zpět">
          <Icon name="back" />
        </button>
        <h1>{t('Deník {jezdkyně|jezdce}')}</h1>
      </div>
      <p className="muted">{t('Tady je všechno, co už umíš a co jsi {zažila|zažil}. Srovnávej se jen {sama|sám} se sebou – s {tou, kterou jsi byla|tím, kterým jsi byl} včera.')}</p>
      <ol className="journal-list">
        {entries.map((e, i) => (
          <li key={i} className={`card journal-entry je-${e.kind}`}>
            <span className="je-date">{new Date(e.t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}</span>
            <span>{e.text}</span>
          </li>
        ))}
        {entries.length === 0 && <li className="muted">Zatím prázdný. První zápis přibude po prvním letu.</li>}
      </ol>
    </div>
  );
}
