// Kniha draků: kousky a dračí druhy, karty znalostí (s opravenými stránkami),
// společné mise a vlastní výtvory. Kniha roste s tím, co hráčka zvládne.

import { useEffect, useState } from 'react';
import { CARDS, ISLANDS, MISSIONS, SKILL_BY_ID, TRICKS, cardsOf, missionsOf } from '../../content';
import { useGame } from '../../core/game';
import { mapStrings } from '../../core/gender';
import { sfx } from '../../core/sound';
import { loadEvents } from '../../core/storage';
import type { IslandId, JointMission, KnowledgeCard } from '../../core/types';
import { Dragon } from '../components/Dragon';
import { Icon, SpeakButton } from '../components/Bits';
import { IslandArt } from './MapScreen';
import { useGx } from '../useGx';

type Tab = 'draci' | 'znalosti' | 'mise' | 'vytvory';

const day = (t: number) => new Date(t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });

/** Karta je odemčená, když hráčka v dovednosti dosáhla její úrovně. */
export function isUnlocked(card: KnowledgeCard, best: Record<string, number>): boolean {
  return (best[card.skillId] ?? 0) >= card.level;
}

export function KnowledgePage({ card: raw, unlocked }: { card: KnowledgeCard; unlocked: boolean }) {
  const gender = useGame((s) => s.profile.gender);
  const card = mapStrings(raw, gender);
  const skill = SKILL_BY_ID[card.skillId];
  if (!unlocked) {
    const island = skill ? ISLANDS.find((i) => i.id === skill.island) : undefined;
    return (
      <article className="kpage locked">
        <span className="kpage-emoji" aria-hidden>
          ?
        </span>
        <p className="muted small">
          Odemkneš {island?.where}: {skill?.name} {'★'.repeat(card.level)}
        </p>
      </article>
    );
  }
  const speech = card.fix
    ? `${card.title}. Dřív se myslelo: ${card.fix.before} Jak se na to přišlo: ${card.fix.evidence} Dnes víme: ${card.text}`
    : `${card.title}. ${card.text}`;
  return (
    <article className={`kpage${card.fix ? ' fix' : ''}`}>
      <div className="kpage-head">
        <span className="kpage-emoji" aria-hidden>
          {card.emoji}
        </span>
        <h3>{card.title}</h3>
        <SpeakButton text={speech} />
      </div>
      {card.fix ? (
        <>
          <p className="kpage-before">
            <strong>Dřív se myslelo:</strong> {card.fix.before}
          </p>
          <p className="kpage-evidence">
            <strong>Jak se na to přišlo:</strong> {card.fix.evidence}
          </p>
          <p>
            <strong>Dnes víme:</strong> {card.text}
          </p>
          <span className="kpage-stamp">Opraveno podle důkazů</span>
        </>
      ) : (
        <p>{card.text}</p>
      )}
    </article>
  );
}

export function MissionCard({ mission: raw }: { mission: JointMission }) {
  const gender = useGame((s) => s.profile.gender);
  const mission = mapStrings(raw, gender);
  const done = useGame((s) => s.profile.missionsDone[mission.id]);
  const complete = useGame((s) => s.completeMission);
  return (
    <article className={`card mission-card${done ? ' done' : ''}`}>
      <span className="mission-emoji" aria-hidden>
        {mission.emoji}
      </span>
      <div className="mission-body">
        <div className="mission-head">
          <h3>{mission.title}</h3>
          <SpeakButton text={`${mission.title}. ${mission.text}`} />
        </div>
        <p>{mission.text}</p>
        <details className="mission-tip">
          <summary>Tip pro rodiče</summary>
          <p>{mission.parentTip}</p>
        </details>
      </div>
      {done ? (
        <span className="mission-done">✓ Splněno {day(done)}</span>
      ) : (
        <button
          className="btn btn-sea"
          onClick={() => {
            sfx.correct();
            complete(mission.id);
          }}
        >
          Máme splněno!
        </button>
      )}
    </article>
  );
}

function DragonsTab() {
  const profile = useGame((s) => s.profile);
  const [playing, setPlaying] = useState<string | null>(null);
  const anim = TRICKS.find((t) => t.id === playing)?.anim;
  return (
    <>
      <h2 className="section-title">Kousky, které umí {profile.dragonName || 'tvůj drak'}</h2>
      <div className="trick-row">
        <div className={anim ? `trick-${anim === 'fire' || anim === 'smoke' ? 'hop' : anim}` : ''} key={playing ?? 'none'}>
          {profile.dragon && <Dragon look={profile.dragon} size={160} mood={playing ? 'happy' : 'idle'} />}
        </div>
        <div className="tricks">
          {TRICKS.map((t) => {
            const has = profile.tricks.includes(t.id);
            return (
              <button key={t.id} className={`chip trick-chip${has ? ' active' : ' locked'}`} disabled={!has} onClick={() => setPlaying(t.id)}>
                {has ? t.name : '?'}
              </button>
            );
          })}
        </div>
      </div>
      <h2 className="section-title">Dračí druhy ze souostroví</h2>
      <div className="species-grid">
        {ISLANDS.map((i) => {
          const has = profile.species.includes(i.id);
          return (
            <div key={i.id} className={`card species-card${has ? '' : ' locked'}`}>
              <IslandArt id={i.id} size={110} locked={!has} />
              <strong>{has ? i.species.name : '???'}</strong>
              <span className="muted small">{has ? i.species.description : i.available ? `Žije ${i.where}.` : 'Ostrov je zatím v mlze.'}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function KnowledgeTab() {
  const best = useGame((s) => s.profile.best);
  const islands = ISLANDS.filter((i) => i.available && cardsOf(i.id).length > 0);
  return (
    <>
      <p className="muted">
        Každá stránka se odemkne, když zvládneš další stupeň na ostrově. Některé stránky jsou <strong>opravené</strong>: lidé si dřív mysleli něco jiného, ale důkazy ukázaly pravdu.
      </p>
      {islands.map((island) => {
        const cards = cardsOf(island.id);
        const open = cards.filter((c) => isUnlocked(c, best));
        const locked = cards.filter((c) => !isUnlocked(c, best));
        return (
          <section key={island.id} className="book-section">
            <h2 className="section-title">
              {island.name} <span className="muted small">{open.length} z {cards.length}</span>
            </h2>
            {open.length > 0 && (
              <div className="kpages">
                {open.map((c) => (
                  <KnowledgePage key={c.id} card={c} unlocked />
                ))}
              </div>
            )}
            {locked.length > 0 && <NextPages island={island.id} locked={locked} best={best} />}
          </section>
        );
      })}
    </>
  );
}

/** Zamčené stránky ostrova v jednom řádku: kolik jich zbývá a které
 *  dovednosti je odemknou nejdřív (nejmenší chybějící stupeň). */
function NextPages({ island, locked, best }: { island: IslandId; locked: KnowledgeCard[]; best: Record<string, number> }) {
  const where = ISLANDS.find((i) => i.id === island)?.where ?? '';
  const nearest = new Map<string, number>();
  for (const c of locked) {
    const prev = nearest.get(c.skillId);
    if (prev === undefined || c.level < prev) nearest.set(c.skillId, c.level);
  }
  const next = [...nearest.entries()]
    .sort((a, b) => a[1] - (best[a[0]] ?? 0) - (b[1] - (best[b[0]] ?? 0)) || a[1] - b[1])
    .slice(0, 3);
  return (
    <div className="kpages-locked">
      <span className="kpages-lock" aria-hidden>
        🔒
      </span>
      <p>
        Ještě {locked.length} {locked.length === 1 ? 'stránka čeká' : locked.length < 5 ? 'stránky čekají' : 'stránek čeká'} {where}. Nejblíž máš:{' '}
        {next.map(([skillId, level], i) => (
          <span key={skillId}>
            {i > 0 && ', '}
            <strong>{SKILL_BY_ID[skillId]?.name}</strong> {'★'.repeat(level)}
          </span>
        ))}
        .
      </p>
    </div>
  );
}

function MissionsTab() {
  const islands = ISLANDS.filter((i) => i.available && missionsOf(i.id).length > 0);
  return (
    <>
      <p className="muted">Úkoly do opravdového světa – s mámou, s tátou nebo s někým, kdo tě má rád. Až misi splníte, odškrtni ji.</p>
      {islands.map((island) => (
        <section key={island.id} className="book-section">
          <h2 className="section-title">{island.name}</h2>
          <div className="missions">
            {missionsOf(island.id).map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function CreationsTab() {
  const t = useGx();
  const profile = useGame((s) => s.profile);
  const [texts, setTexts] = useState<{ t: number; text: string; skill: string }[] | null>(null);
  useEffect(() => {
    void loadEvents().then((events) =>
      setTexts(
        events
          .filter((e) => e.outcome === 'open' && e.text)
          .map((e) => ({ t: e.t, text: e.text!, skill: SKILL_BY_ID[e.skillId]?.name ?? '' }))
          .reverse(),
      ),
    );
  }, []);
  return (
    <>
      <div className="card creation-dragon">
        {profile.dragon && <Dragon look={profile.dragon} size={150} mood="happy" />}
        <div>
          <h2>{profile.dragonName || 'Tvůj drak'}</h2>
          <p className="muted">{t('Draka jsi {navrhla sama|navrhl sám} – barvy, vzor i rohy. Tohle je tvůj první vynález.')}</p>
        </div>
      </div>
      <h2 className="section-title">Moje příběhy a nápady</h2>
      {texts === null && <p className="muted">Načítám…</p>}
      {texts?.length === 0 && <p className="muted">Zatím tu nic není. Příběhy a nápady přibudou z tvořivých úloh.</p>}
      <ol className="creations">
        {texts?.map((x, i) => (
          <li key={i} className="card creation">
            <span className="je-date">
              {day(x.t)} · {x.skill}
            </span>
            <p>{x.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function Book() {
  const go = useGame((s) => s.go);
  const best = useGame((s) => s.profile.best);
  const done = useGame((s) => s.profile.missionsDone);
  const [tab, setTab] = useState<Tab>('znalosti');
  const openCards = CARDS.filter((c) => isUnlocked(c, best)).length;
  const doneMissions = MISSIONS.filter((m) => done[m.id]).length;
  const tabs: [Tab, string][] = [
    ['znalosti', `Znalosti ${openCards}/${CARDS.length}`],
    ['draci', 'Draci a kousky'],
    ['mise', `Společné mise ${doneMissions}/${MISSIONS.length}`],
    ['vytvory', 'Moje výtvory'],
  ];
  return (
    <div className="screen book">
      <div className="topbar">
        <button className="btn btn-round btn-ghost" onClick={() => go('map')} aria-label="Zpět">
          <Icon name="back" />
        </button>
        <h1>Kniha draků</h1>
      </div>
      <nav className="book-tabs">
        {tabs.map(([id, name]) => (
          <button key={id} className={`chip${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            {name}
          </button>
        ))}
      </nav>
      {tab === 'znalosti' && <KnowledgeTab />}
      {tab === 'draci' && <DragonsTab />}
      {tab === 'mise' && <MissionsTab />}
      {tab === 'vytvory' && <CreationsTab />}
    </div>
  );
}

/** Kolik stránek z ostrova je odemčených (pro obrazovku ostrova). */
export function islandBookProgress(island: IslandId, best: Record<string, number>) {
  const cards = cardsOf(island);
  return { open: cards.filter((c) => isUnlocked(c, best)).length, total: cards.length };
}
