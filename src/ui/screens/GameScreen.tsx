import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../../data/state';
import { TopBar } from '../components/TopBar';
import { PixelCanvas, particles } from '../../engine/PixelCanvas';
import { playCorrect, playWrong, playClick, playXPOrb, playFlip, playMatch } from '../../engine/AudioEngine';
import { getCorrectPraise, getEffortPraise, getStreakMessage } from '../../data/messages';
import { Question } from '../../data/types';
import { shuffle } from '../../game/questions/helpers';
import { computeActiveEffects, ActiveEffects } from '../../game/ItemEffects';
import { MontessoriVisual } from '../components/MontessoriVisual';

const MC_ITEMS = ['🧱', '⛏️', '🗡️', '🏹', '🛡️', '🍎', '🍖', '🐑', '🐄', '🐷', '💎', '🪙', '🏠', '🌾', '🔥', '🪓'];

export function GameScreen() {
  const store = useGameStore();
  const {
    currentWorld, currentQuest, questQuestions, currentQIdx,
    questErrors, questStartTime, streak, inventory,
    setCurrentQIdx, addQuestError, setQuestion,
    gainXP, gainCurrency, incrementStreak, resetStreak,
    incrementCorrect, incrementAttempts, addEffortPoints,
    completeQuest, setWorldProgress, completeDailyChallenge,
    checkAchievements, showToast, setScreen, useHint, save,
    useConsumable,
  } = store;

  const effects = useMemo<ActiveEffects>(() => computeActiveEffects(inventory), [inventory]);

  const [feedback, setFeedback] = useState<{ type: string; msg: string; sub?: string } | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [disabledOpts, setDisabledOpts] = useState(false);
  const [eliminatedOpts, setEliminatedOpts] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const [freeHintUsed, setFreeHintUsed] = useState(false);
  const [totemUsed, setTotemUsed] = useState(false);
  const [streakShieldUsed, setStreakShieldUsed] = useState(false);
  const [eliminateUsed, setEliminateUsed] = useState(false);

  // Memory game state
  const [memCards, setMemCards] = useState<string[]>([]);
  const [memFlipped, setMemFlipped] = useState<number[]>([]);
  const [memMatched, setMemMatched] = useState<Set<number>>(new Set());
  const [memMoves, setMemMoves] = useState(0);
  const [memLock, setMemLock] = useState(false);

  const q = questQuestions[currentQIdx] as Question | undefined;
  const theme = currentWorld?.theme || 'normal';

  const effectiveDifficulty = currentWorld?.difficulty || 1;
  const showMontessori = q?.montessori && (
    effectiveDifficulty <= 1 ||
    (effectiveDifficulty === 2 && hintVisible) ||
    effects.visualHint
  );

  useEffect(() => {
    setFeedback(null);
    setHintVisible(false);
    setInputVal('');
    setDisabledOpts(false);
    setEliminatedOpts(new Set());
    setEliminateUsed(false);

    if (q?.isSpecial && q.type === 'memory') {
      initMemory();
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentQIdx]);

  const initMemory = () => {
    const pairCount = 6;
    const items = shuffle(MC_ITEMS).slice(0, pairCount);
    const cards = shuffle([...items, ...items]);
    setMemCards(cards);
    setMemFlipped([]);
    setMemMatched(new Set());
    setMemMoves(0);
    setMemLock(false);
  };

  const eliminateWrongOptions = () => {
    if (!q?.options || eliminateUsed) return;
    setEliminateUsed(true);
    const correctAnswer = q.correctIdx !== undefined ? q.correctIdx : null;
    const wrongIdxs = q.options
      .map((opt, i) => {
        if (correctAnswer !== null) return i !== correctAnswer ? i : -1;
        return String(opt) !== String(q.answer) ? i : -1;
      })
      .filter(i => i !== -1);
    const toEliminate = shuffle(wrongIdxs).slice(0, effects.revealWrong);
    setEliminatedOpts(new Set(toEliminate));
  };

  const handleAnswer = (selected: number | string, optIdx?: number) => {
    if (!q) return;
    incrementAttempts();

    const isCorrect = q.correctIdx !== undefined
      ? optIdx === q.correctIdx
      : String(selected) === String(q.answer);

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    if (!q) return;
    playCorrect();
    setDisabledOpts(true);

    incrementStreak();
    incrementCorrect();
    const newQ = { ...q, _wasCorrect: true };
    setQuestion(currentQIdx, newQ);

    let xpGain = 10 + (streak + 1) * 2;
    if (effects.xpBoost > 0) xpGain = Math.round(xpGain * (1 + effects.xpBoost));
    gainXP(xpGain);
    gainCurrency(1, 'emeralds');
    if (streak + 1 >= 5) gainCurrency(1, 'emeralds');

    const praise = getCorrectPraise();
    const streakMsg = getStreakMessage(streak + 1);

    setFeedback({ type: 'success', msg: praise, sub: streakMsg || undefined });

    particles.emitCorrect(window.innerWidth / 2, window.innerHeight / 2 - 50);
    setTimeout(() => playXPOrb(), 200);

    save();
    setTimeout(() => {
      if (currentQIdx + 1 >= questQuestions.length) {
        finishQuest();
      } else {
        setCurrentQIdx(currentQIdx + 1);
      }
    }, 1600);
  };

  const handleWrongAnswer = () => {
    if (!q) return;

    if (effects.secondChance && !totemUsed) {
      setTotemUsed(true);
      playClick();
      setFeedback({ type: 'try-again', msg: '🗿 Totem tě zachránil!', sub: 'Zkus to znovu — tenhle pokus se nepočítá.' });
      setDisabledOpts(false);
      setInputVal('');
      return;
    }

    if (effects.streakShield && !streakShieldUsed && streak > 0) {
      setStreakShieldUsed(true);
    } else {
      resetStreak();
    }

    playWrong();
    addQuestError();
    addEffortPoints(2);

    const effort = getEffortPraise();
    particles.emitWrong(window.innerWidth / 2, window.innerHeight / 2);

    if (!q._secondTry) {
      setQuestion(currentQIdx, { ...q, _secondTry: true });
      setFeedback({ type: 'try-again', msg: effort, sub: '+2 body za úsilí 💪' });
      setDisabledOpts(false);
      setInputVal('');
    } else if (effects.extraTry && !q._thirdTry) {
      setQuestion(currentQIdx, { ...q, _thirdTry: true });
      setFeedback({ type: 'try-again', msg: '🦎 Axolotl ti dává extra šanci!', sub: effort });
      setDisabledOpts(false);
      setInputVal('');
    } else {
      setDisabledOpts(true);
      setFeedback({ type: 'fail', msg: `Správná odpověď: ${q.answer}`, sub: effort });
      gainXP(3);
      save();
      setTimeout(() => {
        if (currentQIdx + 1 >= questQuestions.length) {
          finishQuest();
        } else {
          setCurrentQIdx(currentQIdx + 1);
        }
      }, 2500);
    }
  };

  const handleInputSubmit = () => {
    const val = parseInt(inputVal);
    if (isNaN(val)) return;
    handleAnswer(val);
  };

  const handleHint = () => {
    if (!q?.hint) return;
    if (effects.freeHint && !freeHintUsed) {
      setFreeHintUsed(true);
      setHintVisible(true);
      return;
    }
    useHint();
    setHintVisible(true);
  };

  const handleSkipQuestion = () => {
    if (!useConsumable('ender_pearl')) return;
    setQuestion(currentQIdx, { ...q!, _skipped: true });
    showToast('🟣 Ender perla — otázka přeskočena!');
    setTimeout(() => {
      if (currentQIdx + 1 >= questQuestions.length) finishQuest();
      else setCurrentQIdx(currentQIdx + 1);
    }, 800);
  };

  const handleRetry = () => {
    setFeedback(null);
    setDisabledOpts(false);
    setInputVal('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Memory game
  const handleMemFlip = (idx: number) => {
    if (memLock || memMatched.has(idx) || memFlipped.includes(idx)) return;
    playFlip();

    const newFlipped = [...memFlipped, idx];
    setMemFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMemMoves(m => m + 1);
      setMemLock(true);

      const [a, b] = newFlipped;
      if (memCards[a] === memCards[b]) {
        playMatch();
        const newMatched = new Set(memMatched);
        newMatched.add(a);
        newMatched.add(b);
        setMemMatched(newMatched);
        setMemFlipped([]);
        setMemLock(false);

        if (newMatched.size === memCards.length) {
          setTimeout(() => {
            setQuestion(currentQIdx, { ...q!, _wasCorrect: true });
            const bonus = Math.max(0, 20 - (memMoves + 1));
            let xp = 15 + bonus;
            if (effects.xpBoost > 0) xp = Math.round(xp * (1 + effects.xpBoost));
            gainXP(xp);
            gainCurrency(2, 'emeralds');
            showToast(`🧠 Paměťová hra hotová!\n${memMoves + 1} tahů — bonus ${bonus} bodů!`);
            particles.emitCorrect(window.innerWidth / 2, window.innerHeight / 2);
            setTimeout(() => {
              if (currentQIdx + 1 >= questQuestions.length) finishQuest();
              else setCurrentQIdx(currentQIdx + 1);
            }, 1500);
          }, 500);
        }
      } else {
        setTimeout(() => {
          setMemFlipped([]);
          setMemLock(false);
        }, 700);
      }
    }
  };

  const finishQuest = () => {
    const totalQ = questQuestions.length;
    const correct = questQuestions.filter(qq => qq._wasCorrect).length;
    const perfect = store.questErrors === 0;
    const elapsed = Math.round((Date.now() - questStartTime) / 1000);

    completeQuest(perfect);
    if (currentWorld) setWorldProgress(currentWorld.id);

    let xpBonus = perfect ? 30 : correct >= totalQ * 0.7 ? 15 : 5;
    if (effects.xpBoost > 0) xpBonus = Math.round(xpBonus * (1 + effects.xpBoost));
    const emeraldBonus = (perfect ? 5 : correct >= totalQ * 0.7 ? 3 : 1) + effects.bonusEmeralds;
    const goldBonus = (elapsed < 60 ? 5 : elapsed < 120 ? 3 : 1) + effects.bonusGold;

    gainXP(xpBonus);
    gainCurrency(emeraldBonus, 'emeralds');
    gainCurrency(goldBonus, 'gold');

    if (currentWorld?.id === 'daily') completeDailyChallenge();

    if (currentWorld?.id === 'dragon') {
      gainCurrency(15, 'emeralds');
      gainCurrency(8, 'gold');
    }

    particles.emitLevelUp(window.innerWidth / 2, window.innerHeight / 3);
    checkAchievements();

    const bonusParts: string[] = [];
    if (effects.bonusEmeralds > 0) bonusParts.push(`💎+${effects.bonusEmeralds} maják`);
    if (effects.bonusGold > 0) bonusParts.push(`🪙+${effects.bonusGold} meč`);
    if (effects.xpBoost > 0) bonusParts.push(`✨+${Math.round(effects.xpBoost * 100)}% XP`);
    const bonusLine = bonusParts.length > 0 ? `\n🎒 ${bonusParts.join(' ')}` : '';

    showToast(
      `⚔️ Výprava dokončena!\n${correct}/${totalQ} správně${perfect ? ' ⭐ PERFEKTNÍ!' : ''}\n+${xpBonus} bodů  +${emeraldBonus}💎  +${goldBonus}🪙${bonusLine}`
    );

    setTimeout(() => setScreen('hub'), 4000);
  };

  if (!q) return null;

  return (
    <div className="screen game-screen">
      <PixelCanvas theme={theme} />
      <div className="screen-content">
        <TopBar />
        <div className="game-area">
          <div className="quest-banner pixel-text">⚔️ Výprava: {currentQuest}</div>

          {/* Progress dots */}
          <div className="progress-dots">
            {questQuestions.map((qq, i) => (
              <div
                key={i}
                className={`progress-dot ${
                  i < currentQIdx ? (qq._wasCorrect ? 'done' : 'wrong-dot') :
                  i === currentQIdx ? 'current' : ''
                }`}
              />
            ))}
          </div>

          {/* Memory Game */}
          {q.isSpecial && q.type === 'memory' ? (
            <div className="mc-panel question-box animate-slideUp">
              <div className="q-category body-text">{q.category}</div>
              <div className="q-text pixel-text">{q.text}</div>
              <div className="memory-grid">
                {memCards.map((card, i) => {
                  const isFlipped = memFlipped.includes(i) || memMatched.has(i);
                  const isMatched = memMatched.has(i);
                  return (
                    <div
                      key={i}
                      className={`mem-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                      onClick={() => handleMemFlip(i)}
                    >
                      <div className="mem-card-inner">
                        <div className="mem-card-front pixel-text">?</div>
                        <div className="mem-card-back">{card}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mem-moves body-text">Tahy: {memMoves}</div>
            </div>
          ) : (
            /* Regular Question */
            <div className="mc-panel question-box animate-slideUp">
              <div className="q-category body-text">{q.category}</div>

              {q.patternSeq && (
                <div className="pattern-display">
                  {q.patternSeq.map((v, i) => (
                    <div key={i} className={`pattern-slot ${v === '?' ? 'blank' : ''}`}>
                      {v}
                    </div>
                  ))}
                </div>
              )}

              {q.montessori && (showMontessori || feedback?.type === 'fail') && (
                <MontessoriVisual data={q.montessori} showAnswer={feedback?.type === 'fail'} />
              )}

              {q.visual && !q.patternSeq && !q.montessori && (
                <div className="q-visual">{q.visual}</div>
              )}

              <div className="q-text pixel-text">
                {q.text.split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>

              {/* Answer area */}
              <div className="answer-area">
                {q.inputMode === 'input' && q.type !== 'logic' ? (
                  <div className="input-answer">
                    <input
                      ref={inputRef}
                      className="mc-input"
                      type="number"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInputSubmit()}
                      placeholder="?"
                      disabled={disabledOpts}
                    />
                    <button
                      className="mc-btn"
                      onClick={handleInputSubmit}
                      disabled={disabledOpts || !inputVal}
                    >
                      Hotovo ✔️
                    </button>
                  </div>
                ) : (
                  <div className="answer-options">
                    {(q.options || []).map((opt, idx) => (
                      <button
                        key={idx}
                        className={`answer-option mc-btn mc-btn-stone ${eliminatedOpts.has(idx) ? 'eliminated' : ''}`}
                        onClick={() => { playClick(); handleAnswer(opt, idx); }}
                        disabled={disabledOpts || eliminatedOpts.has(idx)}
                      >
                        {eliminatedOpts.has(idx) ? '✕' : opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Item action buttons */}
              <div className="item-actions">
                {q.hint && !hintVisible && (
                  <button className="mc-btn mc-btn-purple hint-btn" onClick={handleHint}>
                    {effects.freeHint && !freeHintUsed ? '🐱 Kočka šeptá...' : '💡 Nápověda'}
                  </button>
                )}
                {effects.revealWrong > 0 && !eliminateUsed && q.options && q.inputMode !== 'input' && (
                  <button className="mc-btn mc-btn-stone hint-btn" onClick={eliminateWrongOptions}>
                    ⛏️ Škrtni špatné
                  </button>
                )}
                {(store.consumables?.ender_pearl || 0) > 0 && !disabledOpts && (
                  <button className="mc-btn mc-btn-stone hint-btn" onClick={handleSkipQuestion}>
                    🟣 Přeskočit
                  </button>
                )}
              </div>
              {hintVisible && q.hint && (
                <div className="hint-text body-text animate-slideUp">💡 {q.hint}</div>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`feedback-area animate-slideUp`}>
              <div className={`feedback-msg ${feedback.type}`}>{feedback.msg}</div>
              {feedback.sub && <div className={`feedback-sub ${feedback.type}`}>{feedback.sub}</div>}
              {feedback.type === 'try-again' && (
                <button className="mc-btn mc-btn-stone" onClick={handleRetry}>
                  🔄 Zkusit znovu
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
