import { useGameStore } from '../../data/state';
import { Screen } from '../../data/types';

export function TopBar() {
  const { level, xp, xpToNext, emeralds, gold, setScreen, screen } = useGameStore();
  const pct = Math.min(100, (xp / xpToNext) * 100);

  const nav = (s: Screen) => () => setScreen(s);
  const isActive = (s: Screen) => screen === s ? 'active' : '';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-player pixel-text">⛏️ Emma</span>
        <span className="topbar-level pixel-text">Úroveň {level}</span>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
          <span className="xp-bar-text pixel-text">{xp} / {xpToNext}</span>
        </div>
      </div>
      <div className="topbar-currency">
        <span className="currency emerald">💎 {emeralds}</span>
        <span className="currency gold-c">🪙 {gold}</span>
      </div>
      <div className="topbar-nav">
        <button className={`nav-btn ${isActive('hub')}`} onClick={nav('hub')}>🏠 Svět</button>
        <button className={`nav-btn ${isActive('inventory')}`} onClick={nav('inventory')}>🎒 Batoh</button>
        <button className={`nav-btn ${isActive('shop')}`} onClick={nav('shop')}>🏪 Obchod</button>
      </div>
    </div>
  );
}
