import { useGameStore } from '../../data/state';
import { WORLDS } from '../../data/worlds';
import { TopBar } from '../components/TopBar';
import { PixelCanvas } from '../../engine/PixelCanvas';
import { playClick } from '../../engine/AudioEngine';
import { generateQuestQuestions } from '../../game/questions';
import { getEffectiveDifficulty, getQuestLength } from '../../game/DifficultyManager';
import { getWelcome } from '../../data/messages';
import { generateQuestion } from '../../game/questions';

export function HubScreen() {
  const store = useGameStore();
  const { level, worldProgress, dailyDone, startQuest, dailyDate, setState, inventory } = store;

  const hasDragonEgg = !!inventory?.dragon_egg;

  const today = new Date().toDateString();
  if (dailyDate !== today) {
    setState({ dailyDone: false, dailyDate: today });
  }

  const handleWorldClick = (w: typeof WORLDS[0]) => {
    playClick();
    const questIdx = (worldProgress[w.id]?.completed || 0) % w.quests.length;
    const quest = w.quests[questIdx];
    const diff = getEffectiveDifficulty(w.difficulty, level);
    const count = getQuestLength(diff);
    const questions = generateQuestQuestions(w.type, diff, count);
    startQuest(w, quest, questions);
  };

  const handleDaily = () => {
    if (dailyDone) return;
    playClick();
    const questions = [];
    for (let i = 0; i < 5; i++) {
      questions.push(generateQuestion('mixed', 2));
    }
    startQuest(
      { id: 'daily', name: 'Denní výzva', desc: '', icon: '⚡', type: 'mixed', difficulty: 2, unlockLevel: 1, quests: ['Endermannova záhada'], color: '#CC00FF', theme: 'end' },
      'Endermannova záhada',
      questions
    );
  };

  const handleDragonQuest = () => {
    playClick();
    const questions = [];
    for (let i = 0; i < 10; i++) {
      questions.push(generateQuestion('mixed', 3));
    }
    startQuest(
      { id: 'dragon', name: 'Dračí výprava', desc: '', icon: '🐉', type: 'mixed', difficulty: 3, unlockLevel: 1, quests: ['Dračí výprava'], color: '#FFD700', theme: 'end' },
      'Dračí výprava',
      questions
    );
  };

  return (
    <div className="screen hub-screen">
      <PixelCanvas theme="normal" />
      <div className="screen-content">
        <TopBar />
        <div className="hub-scroll">
          <h2 className="hub-welcome pixel-text">{getWelcome()}</h2>

          {!dailyDone && (
            <div className="daily-banner" onClick={handleDaily}>
              <div className="daily-title pixel-text">⚡ DENNÍ VÝZVA ⚡</div>
              <div className="daily-desc body-text">Vyřeš 5 záhad Endermana a získej extra diamanty!</div>
            </div>
          )}

          {hasDragonEgg && (
            <div className="daily-banner" onClick={handleDragonQuest} style={{ borderColor: '#FFD700' }}>
              <div className="daily-title pixel-text" style={{ color: '#FFD700' }}>🐉 DRAČÍ VÝPRAVA 🐉</div>
              <div className="daily-desc body-text">10 nejtěžších výzev! Odměna: 20💎 + 10🪙</div>
            </div>
          )}

          <div className="world-grid">
            {WORLDS.map(w => {
              const locked = level < w.unlockLevel;
              const progress = worldProgress[w.id]?.completed || 0;
              return (
                <div
                  key={w.id}
                  className={`world-card ${locked ? 'locked' : ''}`}
                  onClick={() => !locked && handleWorldClick(w)}
                  style={!locked ? { borderLeftColor: w.color } : undefined}
                >
                  <div className="world-icon">{w.icon}</div>
                  <div className="world-title pixel-text">{w.name}</div>
                  <div className="world-desc body-text">{w.desc}</div>
                  <div className="world-difficulty">
                    {[1, 2, 3].map(i => (
                      <span key={i} className={`diff-star ${i <= w.difficulty ? '' : 'empty'}`}>★</span>
                    ))}
                  </div>
                  <div className="world-progress body-text">Výprav: {progress}</div>
                  {locked && (
                    <div className="locked-overlay">
                      <span>🔒 Úroveň {w.unlockLevel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
