import { GameState } from './types';

const STORAGE_KEY = 'emmaMathQuest';
const SUPABASE_URL = 'https://tkjgznrhxcdcxybxmjsj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramd6bnJoeGNkY3h5YnhtanNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzQwMDAsImV4cCI6MjA5MTU1MDAwMH0.BRuZkKvwGdhpxmoh354P5vU2BOZkYcDs_EkgOhXvXuk';
const SAVE_ID = 'emma';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

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
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/game_saves?id=eq.${SAVE_ID}&select=state`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } },
    );
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0 && rows[0].state?.level) {
        const cloud = { ...defaultState(), ...rows[0].state };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
        return cloud;
      }
    }
  } catch { /* offline, fall through to localStorage */ }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data && data.level) return { ...defaultState(), ...data };
    }
  } catch { /* corrupted */ }

  return defaultState();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function saveGameState(state: GameState): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => syncToCloud(state), 1000);
}

async function syncToCloud(state: GameState): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/game_saves`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: SAVE_ID, state, updated_at: new Date().toISOString() }),
    });
  } catch { /* offline — data safe in localStorage */ }
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
