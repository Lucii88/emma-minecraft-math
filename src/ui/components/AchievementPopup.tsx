import { useEffect, useState } from 'react';
import { useGameStore } from '../../data/state';
import { ACHIEVEMENTS } from '../../data/achievements';
import { playAchievement } from '../../engine/AudioEngine';

export function AchievementPopup() {
  const { popAchievement, pendingAchievements } = useGameStore();
  const [current, setCurrent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!current && pendingAchievements.length > 0) {
      const id = popAchievement();
      if (id) {
        setCurrent(id);
        setVisible(true);
        playAchievement();
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => setCurrent(null), 400);
        }, 3500);
      }
    }
  }, [pendingAchievements, current, popAchievement]);

  if (!current) return null;

  const ach = ACHIEVEMENTS.find(a => a.id === current);
  if (!ach) return null;

  return (
    <div className={`achievement-popup ${visible ? 'show' : ''}`}>
      <div className="ach-popup-icon">{ach.icon}</div>
      <div className="ach-popup-content">
        <div className="ach-popup-title pixel-text">🏆 Nový úspěch!</div>
        <div className="ach-popup-name pixel-text">{ach.name}</div>
        <div className="ach-popup-desc body-text">{ach.desc}</div>
      </div>
    </div>
  );
}
