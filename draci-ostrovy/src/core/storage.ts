// Ukládání: profil v localStorage (malý), záznam odpovědí v IndexedDB
// (roste). Všechno zůstává jen v tomto zařízení.

import { createStore, get, set, del } from 'idb-keyval';
import type { AnswerEvent, IslandId, SkillState } from './types';

export interface DragonLook {
  body: string;
  belly: string;
  wing: string;
  eye: string;
  horns: 'kratke' | 'zahnute' | 'zadne';
  pattern: 'nic' | 'skvrny' | 'pruhy' | 'hvezdy';
}

export interface JournalEntry {
  t: number;
  kind: 'level' | 'brave' | 'trick' | 'species' | 'first' | 'story';
  text: string;
}

export interface Settings {
  sound: boolean;
  voice: boolean;
  /** Počet misí v Dnešním letu. */
  missions: number;
  /** Ptát se „jak jistá si jsi?“ zhruba u každé n-té úlohy (0 = nikdy). */
  confidenceEvery: number;
  pin?: string;
  pppDate?: string;
  /** Poznámky rodiče do portfolia (jen v zařízení). */
  notes?: string;
}

export interface Profile {
  version: 1;
  createdAt: number;
  grade: number;
  dragon: DragonLook | null;
  dragonName: string;
  settings: Settings;
  skills: Record<string, SkillState>;
  tricks: string[];
  species: IslandId[];
  journal: JournalEntry[];
  /** Nedávné úlohy podle dovednosti (proti opakování). */
  recent: Record<string, string[]>;
  /** Nejvyšší dosažený stupeň v dovednosti (oslavujeme jen nové maximum). */
  best: Record<string, number>;
  sessions: number;
  totalAnswers: number;
}

const KEY = 'draci-ostrovy:v1';

export function defaultProfile(): Profile {
  return {
    version: 1,
    createdAt: Date.now(),
    grade: 2,
    dragon: null,
    dragonName: '',
    settings: { sound: true, voice: true, missions: 3, confidenceEvery: 3 },
    skills: {},
    tricks: [],
    species: [],
    journal: [],
    recent: {},
    best: {},
    sessions: 0,
    totalAnswers: 0,
  };
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const data = JSON.parse(raw) as Partial<Profile>;
    const base = defaultProfile();
    return { ...base, ...data, settings: { ...base.settings, ...(data.settings ?? {}) } };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* plné úložiště nebo soukromý režim – hra běží dál bez ukládání */
  }
}

// ---------------------------------------------------------------------------
// Záznam odpovědí

// Otevření databáze může selhat hned při startu (anonymní okno, zablokovaná
// data webu, vložený rámec) – hra pak běží dál jen bez záznamu odpovědí.
function openStore() {
  try {
    return typeof indexedDB !== 'undefined' ? createStore('draci-ostrovy', 'data') : null;
  } catch {
    return null;
  }
}
const store = openStore();
let cache: AnswerEvent[] | null = null;
let writing: Promise<void> = Promise.resolve();

export async function loadEvents(): Promise<AnswerEvent[]> {
  if (cache) return cache;
  if (!store) return (cache = []);
  try {
    cache = ((await get('events', store)) as AnswerEvent[] | undefined) ?? [];
  } catch {
    cache = [];
  }
  return cache;
}

export function appendEvent(e: AnswerEvent) {
  writing = writing.then(async () => {
    const events = await loadEvents();
    events.push(e);
    if (store) {
      try {
        await set('events', events, store);
      } catch {
        /* ignorujeme */
      }
    }
  });
  return writing;
}

export async function exportAll(profile: Profile): Promise<string> {
  const events = await loadEvents();
  return JSON.stringify({ exportedAt: new Date().toISOString(), profile, events }, null, 2);
}

export async function importAll(json: string): Promise<Profile> {
  const data = JSON.parse(json) as { profile: Profile; events: AnswerEvent[] };
  if (!data.profile || !Array.isArray(data.events)) throw new Error('Neplatný soubor');
  cache = data.events;
  if (store) {
    try {
      await set('events', data.events, store);
    } catch {
      /* záznam zůstane jen v paměti */
    }
  }
  saveProfile(data.profile);
  return data.profile;
}

export async function wipeAll() {
  cache = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nic */
  }
  if (store) {
    try {
      await del('events', store);
    } catch {
      /* nic */
    }
  }
}
