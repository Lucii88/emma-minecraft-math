import { useMemo, useState } from 'react';
import { SKILL_BY_ID, islandsFor } from '../../content';
import { useGame } from '../../core/game';
import { sfx } from '../../core/sound';
import type { BodyRegion, Confidence, Item, Move } from '../../core/types';
import { capitalize, count, formatNumber } from '../../core/czech';
import { Dragon, type DragonMood } from '../components/Dragon';
import { ChoiceAnswer, LettersAnswer, NumberLineAnswer, NumberPad, OpenAnswer, OrderAnswer, SpellAnswer, spellMatches } from '../components/Answers';
import { ConfidencePicker, Icon, Progress, SpeakButton } from '../components/Bits';
import { ProgramAnswer } from '../components/ProgramAnswer';
import { SwitchesAnswer, WiresAnswer } from '../components/CircuitAnswer';
import { solveSwitches, switchesOf } from '../../core/circuit';
import { SayAnswer } from '../components/SayAnswer';
import { caps } from '../../core/caps';
import { judgeSay, type SayVerdict, type SpeechResult } from '../../core/saymatch';
import { speakEnglish } from '../../core/speech';
import { EN_SORRY, EN_UNDERSTOOD } from '../../content/skola/hlas';
import { renderMathVisual } from '../visuals/MathVisuals';
import { renderWorldVisual, visualSpeech } from '../visuals/WorldVisuals';
import { EnglishSpeak, renderEnglishVisual } from '../visuals/EnglishVisuals';
import { BodyMap, labelOf } from '../visuals/BodyMap';
import { ARROW, arrows, runsOf, shortestProgram } from '../../core/grid';
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
      {choosing ? <IslandPicker /> : run.item && <ItemView key={`${run.sessionId}-${run.mIndex}-${run.iIndex}-${run.item.id}`} item={run.item} />}
    </div>
  );
}

function IslandPicker() {
  const choose = useGame((s) => s.chooseIsland);
  const settings = useGame((s) => s.profile.settings);
  return (
    <div className="center picker">
      <h2>Třetí mise je podle tebe. Kam poletíme?</h2>
      <div className="picker-grid">
        {islandsFor(settings).filter((i) => i.available).map((i) => (
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
  const swapItem = useGame((s) => s.swapItem);
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
  const [said, setSaid] = useState<SayVerdict | null>(null);
  const [sayTrouble, setSayTrouble] = useState(0);
  // Mluvení se mnou: odpověď nahlas hodnotí rodič, mikrofon se nepoužije.
  const parentJudges = !!profile.settings.parentSpeaking;

  const every = profile.settings.confidenceEvery;
  // U mluvení Miss Ember výsledek prozradí hned, otázka na jistotu by nedávala smysl.
  const askConfidence = every > 0 && !skill.open && item.answer.kind !== 'say' && run.answered % every === every - 1;
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

  // Mluvení: chyba spojení ani ticho se nepočítají jako pokus.
  const onSay = (result: SpeechResult) => {
    if (a.kind !== 'say') return;
    if (result.status !== 'ok') {
      setSaid(null);
      setMood('think');
      if (result.status === 'error') setSayTrouble((n) => n + 1);
      setMessage(result.status === 'error' ? 'Miss Ember tě teď neslyší – spojení vypadlo. Zkus to ještě jednou.' : 'Miss Ember tě neslyšela. Mluv nahlas a blíž k tabletu.');
      return;
    }
    const verdict = judgeSay(result, a);
    setSaid(verdict);
    speakEnglish(pick(verdict.ok ? EN_UNDERSTOOD : EN_SORRY));
    submit(verdict.ok);
  };
  const onMicError = () => {
    setSayTrouble(2);
    setMessage('Mikrofon teď nejde použít. Požádej rodiče, ať ho hře povolí v nastavení tabletu.');
  };
  const withoutSpeech = () => {
    caps.speech = false;
    swapItem();
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
    if (a.kind === 'switches' || a.kind === 'wires') return null; // obvod se ovládá v odpovědi
    return renderMathVisual(item.visual) ?? renderWorldVisual(item.visual) ?? renderEnglishVisual(item.visual);
  }, [item, a.kind]);

  // Nejkratší let pro ukázku řešení (úlohy s programem).
  const solutionMoves = useMemo(() => {
    if (a.kind !== 'program' || item.visual?.type !== 'grid' || !item.visual.dragon || !item.visual.goal) return null;
    const g = item.visual;
    if (a.solution) return a.solution;
    return shortestProgram({ cols: g.cols, rows: g.rows, dragon: g.dragon!, goal: g.goal!, rocks: g.rocks, key: g.key, gate: g.gate }, a.collect ?? []);
  }, [item, a]);

  // Správné nastavení vypínačů pro ukázku řešení.
  const solvedSwitches = useMemo(() => {
    if (a.kind !== 'switches' || item.visual?.type !== 'circuit') return null;
    return solveSwitches(item.visual.nets[0], a.target);
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
                ? programText(a, solutionMoves ?? [])
                : a.kind === 'order'
                  ? a.correct.join(' → ')
                  : a.kind === 'spell'
                    ? a.correct
                    : a.kind === 'say'
                      ? a.model
                      : a.kind === 'switches'
                        ? switchesText(item, solvedSwitches)
                        : a.kind === 'wires'
                          ? 'takhle'
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
              maxBlocks={a.maxBlocks}
              loop={a.loop}
              collect={a.collect ?? []}
              disabled={locked}
              solution={phase === 'solution' ? solutionMoves : null}
              onResult={submit}
            />
          )}
          {a.kind === 'switches' && item.visual?.type === 'circuit' && (
            <SwitchesAnswer net={item.visual.nets[0]} target={a.target} disabled={locked} solution={phase === 'solution' ? solvedSwitches : null} onResult={submit} />
          )}
          {a.kind === 'wires' && item.visual?.type === 'wires' && (
            <WiresAnswer wires={item.visual} disabled={locked} solution={phase === 'solution' ? a.solution : null} onResult={submit} />
          )}
          {a.kind === 'order' && <OrderAnswer items={a.items} disabled={locked} onSubmit={(order) => submit(order.every((x, i) => x === a.correct[i]))} />}
          {a.kind === 'spell' && (
            <SpellAnswer disabled={locked} resetKey={`${item.id}-${attempts}`} pattern={a.correct} onSubmit={(w) => submit(spellMatches(w, a.correct, a.accept))} />
          )}
          {a.kind === 'say' && parentJudges && (
            <ParentJudge disabled={locked} explanation={item.explanation} onJudge={submit} />
          )}
          {a.kind === 'say' && !parentJudges && (
            <>
              {said && phase === 'answer' && <HeardNote verdict={said} />}
              <SayAnswer disabled={locked} resetKey={`${item.id}-${attempts}`} refText={a.ref} onResult={onSay} onMicError={onMicError} />
              {sayTrouble >= 2 && phase === 'answer' && (
                <button className="btn btn-ghost" onClick={withoutSpeech}>
                  Pokračovat bez mluvení
                </button>
              )}
            </>
          )}
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
          {said && a.kind === 'say' && <HeardNote verdict={said} />}
          {item.sayAfter && (phase === 'feedback' || phase === 'solution') && (
            <div className="sheet-en">
              {/* Po mluvení s mikrofonem hlas právě řekl „I understood you“ – vzor se pak pustí sám jen u řešení. */}
              <EnglishSpeak text={item.sayAfter} auto={a.kind !== 'say' || parentJudges || phase === 'solution'} big>
                <span lang="en">{item.sayAfter}</span>
              </EnglishSpeak>
            </div>
          )}
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

/** Co Miss Ember slyšela a případná rada k typické chybě. */
function HeardNote({ verdict }: { verdict: SayVerdict }) {
  const t = useGx();
  return (
    <div className={`heard${verdict.ok ? ' ok' : ''}`}>
      <span className="heard-who">Miss Ember slyšela:</span>{' '}
      <span lang="en" className="heard-text">„{verdict.heard || '…'}“</span>
      {verdict.tip && <p className="heard-tip">{t(verdict.tip)}</p>}
      {!verdict.tip && verdict.unclear.length > 0 && (
        <p className="heard-tip">
          Zkus zřetelněji: <span lang="en">{verdict.unclear.join(', ')}</span>
        </p>
      )}
    </div>
  );
}

/** Mluvení se mnou: dítě odpoví nahlas rodiči a ten klepne, jestli to řeklo
 *  dobře. Správná odpověď je pro rodiče schovaná, aby ji dítě nepřečetlo. */
function ParentJudge({ disabled, explanation, onJudge }: { disabled: boolean; explanation: string; onJudge: (ok: boolean) => void }) {
  const t = useGx();
  return (
    <div className="judge">
      <p className="say-label">Rodič klepne, jestli to bylo dobře.</p>
      <div className="judge-buttons">
        <button className="btn btn-primary" onClick={() => onJudge(true)} disabled={disabled}>
          ✓ {t('{Řekla|Řekl} to dobře')}
        </button>
        <button className="btn btn-ghost" onClick={() => onJudge(false)} disabled={disabled}>
          Ještě ne
        </button>
      </div>
      <details className="judge-peek">
        <summary>Pro rodiče: správná odpověď</summary>
        <p>{explanation}</p>
      </details>
    </div>
  );
}

/** Nastavení vypínačů slovy (stejně začíná vysvětlení, aby se neopakovalo). */
function switchesText(item: Item, solved: Record<string, boolean> | null): string {
  if (!solved || item.visual?.type !== 'circuit') return '';
  const ids = switchesOf(item.visual.nets[0]).map((x) => x.id);
  const on = ids.filter((id) => solved[id]);
  const off = ids.filter((id) => !solved[id]);
  return `${on.length ? `zapnuté: ${on.join(', ')}` : 'všechno vypnuté'}${on.length && off.length ? `, vypnuté: ${off.join(', ')}` : ''}`;
}

/** Řešení letu slovy pro list s řešením: šipky, příkazy „→ ×3“, nebo Opakuj. */
function programText(a: Extract<Item['answer'], { kind: 'program' }>, moves: Move[]): string {
  if (a.loop) {
    for (let len = 1; len <= a.loop.maxPattern; len++) {
      if (moves.length % len) continue;
      const pattern = moves.slice(0, len);
      if (moves.every((m, i) => m === pattern[i % len])) return `Opakuj ${moves.length / len}× (${arrows(pattern)})`;
    }
  }
  if (a.maxBlocks) return runsOf(moves).map((r) => `${ARROW[r.move]} ×${r.times}`).join(', ');
  return `například ${arrows(moves)}`;
}
