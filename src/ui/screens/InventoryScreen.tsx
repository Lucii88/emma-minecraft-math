import { useGameStore } from '../../data/state';
import { TopBar } from '../components/TopBar';
import { PixelCanvas } from '../../engine/PixelCanvas';
import { ACHIEVEMENTS } from '../../data/achievements';
import { SHOP_ITEMS } from '../../data/shopItems';
import { exportSave, importSave } from '../../data/persistence';

export function InventoryScreen() {
  const store = useGameStore();
  const {
    streak, bestStreak, totalCorrect, totalAttempts,
    questsCompleted, perfectQuests, totalEffortPoints,
    sessionsPlayed, hintsUsed, achievements, shopPurchases,
    setState, save,
  } = store;

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const handleExport = () => {
    const s = store;
    exportSave({
      level: s.level, xp: s.xp, xpToNext: s.xpToNext,
      emeralds: s.emeralds, gold: s.gold,
      streak: s.streak, bestStreak: s.bestStreak,
      totalCorrect: s.totalCorrect, totalAttempts: s.totalAttempts,
      totalEffortPoints: s.totalEffortPoints,
      questsCompleted: s.questsCompleted, perfectQuests: s.perfectQuests,
      achievements: s.achievements, inventory: s.inventory,
      shopPurchases: s.shopPurchases, worldProgress: s.worldProgress,
      dailyDate: s.dailyDate, dailyDone: s.dailyDone,
      hintsUsed: s.hintsUsed, sessionsPlayed: s.sessionsPlayed,
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = await importSave(file);
        setState(data);
        await save();
        store.showToast('✅ Uložená hra úspěšně nahrána!');
      } catch {
        store.showToast('❌ Chyba při importu!');
      }
    };
    input.click();
  };

  const purchased = Object.keys(shopPurchases);

  return (
    <div className="screen inventory-screen">
      <PixelCanvas theme="night" />
      <div className="screen-content">
        <TopBar />
        <div className="inv-scroll">
          {/* Streak */}
          <div className="inv-section">
            <h3 className="inv-title pixel-text">🔥 Série správných odpovědí</h3>
            <div className="streak-box mc-panel">
              <div className="streak-num pixel-text">{streak}</div>
              <div className="streak-label body-text">Aktuální série</div>
              <div className="streak-best body-text">Nejlepší: {bestStreak}</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="inv-section">
            <h3 className="inv-title pixel-text">🏆 Úspěchy ({Object.keys(achievements).length}/{ACHIEVEMENTS.length})</h3>
            <div className="achievements-grid">
              {ACHIEVEMENTS.map(a => {
                const unlocked = achievements[a.id];
                return (
                  <div key={a.id} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon">{a.icon}</div>
                    <div className="ach-name pixel-text">{a.name}</div>
                    <div className="ach-desc body-text">{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory */}
          <div className="inv-section">
            <h3 className="inv-title pixel-text">🎒 Inventář</h3>
            <div className="inv-slots">
              {Array.from({ length: 18 }).map((_, i) => {
                const item = purchased[i] ? SHOP_ITEMS.find(s => s.id === purchased[i]) : null;
                return (
                  <div key={i} className="inv-slot">
                    {item && <span className="inv-item-icon">{item.icon}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="inv-section">
            <h3 className="inv-title pixel-text">📊 Statistiky</h3>
            <div className="stats-panel mc-panel">
              <div className="stat-row"><span>Správně:</span><span>{totalCorrect} ✅</span></div>
              <div className="stat-row"><span>Pokusů celkem:</span><span>{totalAttempts}</span></div>
              <div className="stat-row"><span>Přesnost:</span><span>{accuracy}%</span></div>
              <div className="stat-row"><span>Výprav:</span><span>{questsCompleted}</span></div>
              <div className="stat-row"><span>Bezchybné:</span><span>{perfectQuests} ⭐</span></div>
              <div className="stat-row"><span>Body za úsilí:</span><span>{totalEffortPoints} 💪</span></div>
              <div className="stat-row"><span>Odehraných her:</span><span>{sessionsPlayed}</span></div>
              <div className="stat-row"><span>Použité nápovědy:</span><span>{hintsUsed}</span></div>
            </div>
          </div>

          {/* Save management */}
          <div className="inv-section save-section">
            <button className="mc-btn" onClick={handleExport}>💾 Uložit do souboru</button>
            <button className="mc-btn mc-btn-gold" onClick={handleImport}>📂 Načíst ze souboru</button>
          </div>
        </div>
      </div>
    </div>
  );
}
