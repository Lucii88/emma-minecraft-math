import { create } from 'zustand';
import { GameState, Screen, WorldDef, Question } from './types';
import { defaultState, saveGameState, loadGameState } from './persistence';
import { ACHIEVEMENTS } from './achievements';

interface GameStore extends GameState {
  screen: Screen;
  currentWorld: WorldDef | null;
  currentQuest: string;
  questQuestions: Question[];
  currentQIdx: number;
  questErrors: number;
  questStartTime: number;
  toastMessage: string;
  toastVisible: boolean;
  pendingAchievements: string[];

  setScreen: (s: Screen) => void;
  loadSave: () => Promise<void>;
  save: () => Promise<void>;
  gainXP: (amount: number) => void;
  gainCurrency: (amount: number, type: 'emeralds' | 'gold') => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addEffortPoints: (pts: number) => void;
  incrementCorrect: () => void;
  incrementAttempts: () => void;
  completeQuest: (perfect: boolean) => void;
  incrementSession: () => void;
  setWorldProgress: (worldId: string) => void;
  completeDailyChallenge: () => void;
  purchaseItem: (itemId: string, price: number) => void;
  useHint: () => void;
  checkAchievements: () => string[];
  showToast: (msg: string) => void;
  hideToast: () => void;
  popAchievement: () => string | undefined;

  startQuest: (world: WorldDef, quest: string, questions: Question[]) => void;
  setCurrentQIdx: (idx: number) => void;
  addQuestError: () => void;
  setQuestion: (idx: number, q: Question) => void;
  resetGame: () => void;
  setState: (partial: Partial<GameState>) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultState(),
  screen: 'title',
  currentWorld: null,
  currentQuest: '',
  questQuestions: [],
  currentQIdx: 0,
  questErrors: 0,
  questStartTime: 0,
  toastMessage: '',
  toastVisible: false,
  pendingAchievements: [],

  setScreen: (screen) => set({ screen }),

  loadSave: async () => {
    const data = await loadGameState();
    set(data);
  },

  save: async () => {
    const s = get();
    const state: GameState = {
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
    };
    await saveGameState(state);
  },

  gainXP: (amount) => {
    const s = get();
    let xp = s.xp + amount;
    let level = s.level;
    let xpToNext = s.xpToNext;
    const leveled: boolean[] = [];

    while (xp >= xpToNext) {
      xp -= xpToNext;
      level++;
      xpToNext = Math.floor(xpToNext * 1.2);
      leveled.push(true);
    }

    set({ xp, level, xpToNext });
    if (leveled.length > 0) {
      get().showToast(`⬆️ NOVÁ ÚROVEŇ! Úroveň ${level}!`);
    }
    get().save();
  },

  gainCurrency: (amount, type) => {
    set(s => ({ [type]: s[type] + amount }));
    get().save();
  },

  incrementStreak: () => {
    set(s => ({
      streak: s.streak + 1,
      bestStreak: Math.max(s.bestStreak, s.streak + 1),
    }));
  },

  resetStreak: () => set({ streak: 0 }),

  addEffortPoints: (pts) => {
    set(s => ({ totalEffortPoints: s.totalEffortPoints + pts }));
  },

  incrementCorrect: () => {
    set(s => ({ totalCorrect: s.totalCorrect + 1 }));
  },

  incrementAttempts: () => {
    set(s => ({ totalAttempts: s.totalAttempts + 1 }));
  },

  completeQuest: (perfect) => {
    set(s => ({
      questsCompleted: s.questsCompleted + 1,
      perfectQuests: s.perfectQuests + (perfect ? 1 : 0),
    }));
    get().save();
  },

  incrementSession: () => {
    set(s => ({ sessionsPlayed: s.sessionsPlayed + 1 }));
    get().save();
  },

  setWorldProgress: (worldId) => {
    set(s => ({
      worldProgress: {
        ...s.worldProgress,
        [worldId]: { completed: (s.worldProgress[worldId]?.completed || 0) + 1 },
      },
    }));
  },

  completeDailyChallenge: () => {
    set({ dailyDone: true, dailyDate: new Date().toDateString() });
    get().save();
  },

  purchaseItem: (itemId, price) => {
    set(s => ({
      emeralds: s.emeralds - price,
      shopPurchases: { ...s.shopPurchases, [itemId]: true },
      inventory: { ...s.inventory, [itemId]: true },
    }));
    get().save();
  },

  useHint: () => {
    set(s => ({ hintsUsed: s.hintsUsed + 1 }));
  },

  checkAchievements: () => {
    const s = get();
    const newAch: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!s.achievements[a.id] && a.check(s)) {
        newAch.push(a.id);
      }
    }
    if (newAch.length > 0) {
      set(s => ({
        achievements: {
          ...s.achievements,
          ...Object.fromEntries(newAch.map(id => [id, true])),
        },
        pendingAchievements: [...s.pendingAchievements, ...newAch],
      }));
      get().save();
    }
    return newAch;
  },

  showToast: (msg) => {
    set({ toastMessage: msg, toastVisible: true });
    setTimeout(() => get().hideToast(), 3500);
  },

  hideToast: () => set({ toastVisible: false }),

  popAchievement: () => {
    const s = get();
    if (s.pendingAchievements.length === 0) return undefined;
    const [first, ...rest] = s.pendingAchievements;
    set({ pendingAchievements: rest });
    return first;
  },

  startQuest: (world, quest, questions) => {
    set({
      currentWorld: world,
      currentQuest: quest,
      questQuestions: questions,
      currentQIdx: 0,
      questErrors: 0,
      questStartTime: Date.now(),
      screen: 'game',
    });
  },

  setCurrentQIdx: (idx) => set({ currentQIdx: idx }),
  addQuestError: () => set(s => ({ questErrors: s.questErrors + 1 })),

  setQuestion: (idx, q) => {
    set(s => {
      const qs = [...s.questQuestions];
      qs[idx] = q;
      return { questQuestions: qs };
    });
  },

  resetGame: () => {
    set({ ...defaultState(), screen: 'title' });
    get().save();
  },

  setState: (partial) => set(partial),
}));
