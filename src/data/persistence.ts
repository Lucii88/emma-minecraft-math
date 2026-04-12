import { GameState } from './types';

const STORAGE_KEY = 'emmaMathQuest';
const API_URL = '/api/save';

export function defaultState(): GameState {
  return {
    level: 1,
    xp: 0,
    xpToNext: 100,
    emeralds: 0,
    gold: 0,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    totalEffortPoints: 0,
    questsCompleted: 0,
    perfectQuests: 0,
    achievements: {},
    inventory: {},
    shopPurchases: {},
    worldProgress: {},
    dailyDate: null,
    dailyDone: false,
    hintsUsed: 0,
    sessionsPlayed: 0,
  };
}

export async function loadGameState(): Promise<GameState> {
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      if (data && data.level) return { ...defaultState(), ...data };
    }
  } catch { /* dev server not running, fall through */ }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data && data.level) return { ...defaultState(), ...data };
    }
  } catch { /* corrupted */ }

  return defaultState();
}

export async function saveGameState(state: GameState): Promise<void> {
  const json = JSON.stringify(state, null, 2);

  localStorage.setItem(STORAGE_KEY, json);

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
  } catch { /* dev server not running */ }
}

export function exportSave(state: GameState) {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `emma-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file: File): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve({ ...defaultState(), ...data });
      } catch { reject(new Error('Neplatný soubor')); }
    };
    reader.onerror = () => reject(new Error('Chyba čtení'));
    reader.readAsText(file);
  });
}
