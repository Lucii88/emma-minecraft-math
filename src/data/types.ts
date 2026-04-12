export interface GameState {
  level: number;
  xp: number;
  xpToNext: number;
  emeralds: number;
  gold: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAttempts: number;
  totalEffortPoints: number;
  questsCompleted: number;
  perfectQuests: number;
  achievements: Record<string, boolean>;
  inventory: Record<string, boolean>;
  shopPurchases: Record<string, boolean>;
  worldProgress: Record<string, { completed: number }>;
  dailyDate: string | null;
  dailyDone: boolean;
  hintsUsed: number;
  sessionsPlayed: number;
}

export interface Question {
  type: string;
  category: string;
  text: string;
  answer: number | string;
  options?: (number | string)[];
  visual?: string;
  hint?: string;
  inputMode?: 'options' | 'input';
  patternSeq?: (number | string)[];
  isSpecial?: boolean;
  correctIdx?: number;
  hintUsed?: boolean;
  _wasCorrect?: boolean;
  _secondTry?: boolean;
}

export interface WorldDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: string;
  difficulty: number;
  unlockLevel: number;
  quests: string[];
  color: string;
  theme: string;
}

export type Screen = 'title' | 'hub' | 'game' | 'inventory' | 'shop';
