import { GameState } from './types';

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_quest', name: 'První blok', icon: '🧱', desc: 'Dokonči první výpravu', check: s => s.questsCompleted >= 1 },
  { id: 'streak5', name: 'Na vlně', icon: '🌊', desc: '5 správných v řadě', check: s => s.bestStreak >= 5 },
  { id: 'streak10', name: 'Neporazitelná', icon: '⚔️', desc: '10 správných v řadě', check: s => s.bestStreak >= 10 },
  { id: 'streak20', name: 'Legendární válečnice', icon: '👑', desc: '20 správných v řadě', check: s => s.bestStreak >= 20 },
  { id: 'level5', name: 'Zkušená stavitelka', icon: '🏗️', desc: 'Dosáhni úrovně 5', check: s => s.level >= 5 },
  { id: 'level10', name: 'Mistryně Minecraftu', icon: '⭐', desc: 'Dosáhni úrovně 10', check: s => s.level >= 10 },
  { id: 'level20', name: 'Ender hrdinka', icon: '🐉', desc: 'Dosáhni úrovně 20', check: s => s.level >= 20 },
  { id: 'quests10', name: 'Dobrodružka', icon: '🗺️', desc: 'Dokonči 10 výprav', check: s => s.questsCompleted >= 10 },
  { id: 'quests25', name: 'Průzkumnice', icon: '🧭', desc: 'Dokonči 25 výprav', check: s => s.questsCompleted >= 25 },
  { id: 'quests50', name: 'Mistryně světa', icon: '🌍', desc: 'Dokonči 50 výprav', check: s => s.questsCompleted >= 50 },
  { id: 'perfect5', name: 'Diamantová přesnost', icon: '💎', desc: '5 výprav bez chyby', check: s => s.perfectQuests >= 5 },
  { id: 'perfect15', name: 'Neomylná', icon: '🎯', desc: '15 výprav bez chyby', check: s => s.perfectQuests >= 15 },
  { id: 'effort100', name: 'Snaha se počítá!', icon: '💪', desc: '100 bodů za úsilí', check: s => s.totalEffortPoints >= 100 },
  { id: 'effort500', name: 'Vytrvalá bojovnice', icon: '🔥', desc: '500 bodů za úsilí', check: s => s.totalEffortPoints >= 500 },
  { id: 'emeralds50', name: 'Bohatá obchodnice', icon: '💰', desc: 'Nastřádej 50 smaragdů', check: s => s.emeralds >= 50 },
  { id: 'sessions10', name: 'Věrná hráčka', icon: '🎮', desc: 'Odehraj 10 her', check: s => s.sessionsPlayed >= 10 },
];
