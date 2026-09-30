import { useMemo, useState } from 'react';
import { ISLANDS, SKILL_BY_ID } from '../../content';
import { useGame } from '../../core/game';
import { sfx } from '../../core/sound';
import type { BodyRegion, Confidence, Item } from '../../core/types';
import { capitalize, count, formatNumber } from '../../core/czech';
import { Dragon, type DragonMood } from '../components/Dragon';
import { ChoiceAnswer, LettersAnswer, NumberLineAnswer, NumberPad, OpenAnswer, OrderAnswer } from '../components/Answers';
import { ConfidencePicker, Icon, Progress, SpeakButton } from '../components/Bits';
import { ProgramAnswer } from '../components/ProgramAnswer';
import { renderMathVisual } from '../visuals/MathVisuals';
import { renderWorldVisual, visualSpeech } from '../visuals/WorldVisuals';
import { BodyMap, labelOf } from '../visuals/BodyMap';
import { arrows, shortestProgram } from '../../core/grid';
import { IslandArt } from './MapScreen';
import { useGx } from '../useGx';

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

const PRAISE_PLAIN = ['Přesně tak.', 'Správně.', 'Sedí to.', 'Ano, to je ono.'];
const PRAISE_HARD = ['Tohle byla těžká úloha – a {vyřešila|vyřešil} jsi ji.', 'Těžší úloha a {zvládla|zvládl} jsi ji. Klobouk dolů.'];
const PRAISE_RETRY = ['{Nevzdala|Nevzdal} ses – a vyšlo to.', 'Druhý pokus a je to tam.', '{Zkusila|Zkusil} jsi to jinak a povedlo se.'];
const PRAISE_HINT = ['Nápověda pomohla a zbytek jsi {zvládla sama|zvládl sám}.', 'S malou nápovědou jsi na to {přišla|přišel}.'];
const RETRY = ['Tohle ještě ne. Zkus to znovu.', 'Skoro! Zkus jinou cestu.', 'Hmm, ještě jednou – podívej se na nápovědu.'];

type Phase = 'answer' | 'confidence' | 'feedback' | 'solution' | 'open-done';

export function Play() {
  const run = useGame((s) => s.run);
  const choosing = useGame((s) => s.choosingIsland);
  const quit = useGame((s) => s.quitRun);
  if (!run) return null;
  const mission = run.missions[run.mIndex];

  return (
    <div className="screen play">
      <div className="topbar">
        <button className="btn btn-round btn-ghost" onClick={quit} aria-label="Zpět na mapu">
          <Icon name="close" />
        </button>
        <div className="mission-title">
          {run.day && <span className="mission-kicker">Mise {run.mIndex + 1} z {run.missions.length}</span>}
          <span>{choosing ? 'Kam poletíme?' : mission.title}</span>
        </div>
        <span className="spacer" />
        {!choosing && <Progress total={mission.count} done={run.iIndex} />}
      </div>
      {choosing ? <IslandPicker /> : run.item && <ItemView key={`${run.sessionId}-${run.mIndex}-${run.iIndex}`} item={run.item} />}
    </div>
  );
}

function IslandPicker() {
  const choose = useGame((s) => s.chooseIsland);
  return (
    <div className="center picker">
      <h2>Třetí mise je podle tebe. Kam poletíme?</h2>
      <div className="picker-grid">
        {ISLANDS.filter((i) => i.available).map((i) => (
          <button key={i.id} className="card picker-card" onClick={() => choose(i.id)}>
            <IslandArt id={i.id} size={120} />
            <strong>{i.name}</strong>
            <span className="muted">{i.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemView({ item }: { item: Item }) {
  const t = useGx();
  const run = useGame((s) => s.run)!;
  const profile = useGame((s) => s.profile);
  const useHint = useGame((s) => s.useHint);
  const registerAttempt = useGame((s) => s.registerAttempt);
  const completeItem = useGame((s) => s.completeItem);
  const skill = SKILL_BY_ID[item.skillId];
  const mission = run.missions[run.mIndex];

  const [phase, setPhase] = useState<Phase>('answer');
  const [attempts, setAttempts] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('');
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [pending, setPending] = useState<boolean | null>(null);
  const [mood, setMood] = useState<DragonMood>('think');
  const [outcome, setOutcome] = useState<'first' | 'later' | 'failed' | null>(null);
  const [tapSel, setTapSel] = useState<BodyRegion | null>(null);
  const [reveal, setReveal] = useState<number | null>(null);
  const [openPayload, setOpenPayload] = useState<{ text: string; ideas?: number } | null>(null);

  const every = profile.settings.confidenceEvery;
  const askConfidence = every > 0 && !skill.open && run.answered % every === every - 1;
  const hard = mission.kind === 'brave' || item.level > profile.grade + 1;

  const showHint = () => {
    if (hintsShown >= item.hints.length) return;
    sfx.hint();
    useHint();
    setHintsShown((h) => h + 1);
  };

  const evaluate = (correct: boolean, conf: Confidence | undefined) => {
    registerAttempt();
    const n = attempts + 1;
    setAttempts(n);
    if (correct) {
      const out = n === 1 && hintsShown === 0 ? 'first' : 'later';
      setOutcome(out);
      hard && out === 'first' ? sfx.hard() : sfx.correct();
      setMood('happy');
      let msg = out === 'first' ? (hard ? pick(PRAISE_HARD) : pick(PRAISE_PLAIN)) : n > 1 ? pick(PRAISE_RETRY) : pick(PRAISE_HINT);
      if (conf === 'hadala' && out === 'first') msg += ' {Věděla|Věděl} jsi víc, než sis {myslela|myslel}.';
      setMessage(t(msg));
      setPhase('feedback');
      return;
    }
    if (n < 3) {
      sfx.retry();
      setMood('oops');
      setMessage(conf === 'jiste' && n === 1 ? t('{Byla|Byl} sis {jistá|jistý}, a přesto to nevyšlo – takové chyby si mozek pamatuje nejlíp. Zkus to znovu.') : pick(RETRY));
      if (hintsShown < item.hints.length) {
        useHint();
        setHintsShown((h) => h + 1);
      }
      setPhase('answer');
      setTimeout(() => setMood('think'), 900);
      return;
    }
    setOutcome('failed');
    setMood('oops');
    setMessage('Tahle byla záludná. Podívej se, jak se řeší – chyby si mozek pamatuje nejlíp.');
    setPhase('solution');
  };

  const submit = (correct: boolean) => {
    if (attempts === 0 && askConfidence && !confidence) {
      setPending(correct);
      setPhase('confidence');
      return;
    }
    evaluate(correct, confidence);
  };

  const onConfidence = (c: Confidence) => {
    setConfidence(c);
    const correct = pending ?? false;
    setPending(null);
    evaluate(correct, c);
  };

  const finish = () => {
    if (openPayload) completeItem('open', openPayload);
    else completeItem(outcome ?? 'failed', { confidence });
  };

  const a = item.answer;
  const locked = phase !== 'answer';
  const visual = useMemo(() => {
    if (!item.visual) return null;
    if (item.visual.type === 'body') return null; // mapa těla se vykreslí v odpovědi
    if (a.kind === 'numberline' && item.visual.type === 'numberline') return null;
    if (a.kind === 'program') return null; // mřížka s letícím drakem je součástí odpovědi
    return renderMathVisual(item.visual) ?? renderWorldVisual(item.visual);
  }, [item, a.kind]);

  // Nejkratší let pro ukázku řešení (úlohy s programem).
  const solutionMoves = useMemo(() => {
    if (a.kind !== 'program' || item.visual?.type !== 'grid' || !item.visual.dragon || !item.visual.goal) return null;
    const g = item.visual;
    return shortestProgram({ cols: g.cols, rows: g.rows, dragon: g.dragon!, goal: g.goal!, rocks: g.rocks }, a.collect ?? []);
  }, [item, a]);

  const correctChoice = a.kind === 'choice' && (phase === 'feedback' || phase === 'solution') ? a.correct : null;
  const solutionText =
    a.kind === 'choice'
      ? a.options[a.correct].label
      : a.kind === 'number'
        ? `${formatNumber(a.correct)}${a.unit ? ` ${a.unit}` : ''}`
        : a.kind === 'letters'
          ? a.correct
          : a.kind === 'numberline'
            ? formatNumber(a.correct)
            : a.kind === 'tap'
              ? labelOf(a.correct as BodyRegion)
              : a.kind === 'program'
                ? `například ${arrows(solutionMoves ?? [])}`
                : a.kind === 'order'
                  ? a.correct.join(' → ')
                  : '';

  // Vysvětlení občas začíná samotnou odpovědí („Fakt. Lékaři…“) – po „Správně
  // je Fakt.“ by se opakovala.
  const explanation = (() => {
    const e = item.explanation.trim();
    const head = `${solutionText}.`;
    return solutionText && e.toLocaleLowerCase('cs').startsWith(head.toLocaleLowerCase('cs')) ? e.slice(head.length).trim() : e;
  })();

  const reading = item.visual?.type === 'reading';

  return (
    <div className={`item${reading ? ' with-reading' : ''}`}>
      <div className="card prompt-card">
        {reading && visual}
        <div className="prompt-row">
          <p className="prompt">{item.prompt}</p>
          <SpeakButton text={[item.visual?.type === 'reading' ? `${item.visual.title}. ${item.visual.text}` : '', item.speak ?? item.prompt, visualSpeech(item.visual)].filter(Boolean).join(' ')} />
        </div>
        {!reading && visual && <div className="visual">{visual}</div>}

        <div className="answer">
          {a.kind === 'choice' && <ChoiceAnswer options={a.options} wrong={wrong} correctShown={correctChoice} disabled={locked} onPick={(i) => {
            if (i !== a.correct) setWrong((w) => [...w, i]);
            submit(i === a.correct);
          }} />}
          {a.kind === 'number' && <NumberPad allowNegative={a.allowNegative} unit={a.unit} disabled={locked} resetKey={`${item.id}-${attempts}`} onSubmit={(v) => submit(v === a.correct)} />}
          {a.kind === 'letters' && <LettersAnswer letters={a.letters} disabled={locked} resetKey={`${item.id}-${attempts}`} onSubmit={(w) => submit(w === a.correct)} />}
          {a.kind === 'numberline' && (
            <NumberLineAnswer
              min={a.min}
              max={a.max}
              disabled={locked}
              reveal={phase === 'feedback' || phase === 'solution' ? a.correct : reveal}
              resetKey={item.id}
              onSubmit={(v) => {
                const ok = Math.abs(v - a.correct) <= a.tolerance;
                if (!ok) setReveal(null);
                submit(ok);
              }}
            />
          )}
          {a.kind === 'tap' && item.visual?.type === 'body' && (
            <BodyMap
              mode={item.visual.mode}
              highlight={item.visual.highlight}
              selected={tapSel}
              correct={phase === 'feedback' || phase === 'solution' ? (a.correct as BodyRegion) : null}
              disabled={locked}
              onTap={(r) => {
                setTapSel(r);
                submit(r === a.correct);
              }}
            />
          )}
          {a.kind === 'choice' && item.visual?.type === 'body' && <BodyMap mode={item.visual.mode} highlight={item.visual.highlight} />}
          {a.kind === 'program' && item.visual?.type === 'grid' && (
            <ProgramAnswer
              grid={item.visual}
              maxSteps={a.maxSteps}
              collect={a.collect ?? []}
              disabled={locked}
              solution={phase === 'solution' ? solutionMoves : null}
              onResult={submit}
            />
          )}
          {a.kind === 'order' && <OrderAnswer items={a.items} disabled={locked} onSubmit={(order) => submit(order.every((x, i) => x === a.correct[i]))} />}
          {a.kind === 'open' && phase === 'answer' && (
            <OpenAnswer
              countIdeas={a.countIdeas}
              minLength={a.minLength}
              onSubmit={(text, ideas) => {
                sfx.correct();
                setMood('happy');
                setOpenPayload({ text, ideas });
                setMessage(ideas && ideas > 1 ? `${capitalize(count(ideas, ['nápad', 'nápady', 'nápadů']))}! Každý se počítá – i ten nejpraštěnější.` : t('Díky! Tvůj text je uložený v Deníku {jezdkyně|jezdce}.'));
                setPhase('open-done');
              }}
            />
          )}
        </div>
      </div>

      <div className="helper-row">
        <div className="helper-dragon">
          {profile.dragon && <Dragon look={profile.dragon} mood={mood} size={110} />}
        </div>
        <div className="helper-talk">
          {phase === 'answer' && message && <div className="bubble oops-bubble">{message}</div>}
          {phase === 'answer' && hintsShown > 0 && (
            <div className="bubble hint-bubble">
              <Icon name="lamp" size={22} />
              <span>{item.hints[hintsShown - 1]}</span>
            </div>
          )}
          {phase === 'answer' && hintsShown < item.hints.length && (
            <button className="btn btn-ghost hint-btn" onClick={showHint}>
              <Icon name="lamp" size={22} /> Nápověda
            </button>
          )}
        </div>
      </div>

      {phase === 'confidence' && (
        <div className="sheet">
          <ConfidencePicker onPick={onConfidence} />
        </div>
      )}

      {(phase === 'feedback' || phase === 'solution' || phase === 'open-done') && (
        <div className={`sheet ${phase === 'solution' ? 'sheet-solution' : 'sheet-ok'}`} role="status">
          <p className="sheet-msg">{message}</p>
          {phase === 'solution' && (
            <p className="sheet-expl">
              Správně je <strong>{solutionText}</strong>. {explanation}
            </p>
          )}
          {phase === 'feedback' && item.explanation && (outcome !== 'first' || skill.showFact) && (
            <div className={`sheet-expl${skill.showFact ? ' sheet-fact' : ''}`}>
              {skill.showFact && (
                <span className="fact-label">
                  <span aria-hidden>💡</span> Zajímavost
                </span>
              )}
              <p>{explanation}</p>
              {skill.showFact && <SpeakButton text={explanation} />}
            </div>
          )}
          <button className="btn btn-primary btn-big" onClick={finish} autoFocus>
            {phase === 'solution' ? 'Rozumím' : 'Pokračovat'}
          </button>
        </div>
      )}
    </div>
  );
}
