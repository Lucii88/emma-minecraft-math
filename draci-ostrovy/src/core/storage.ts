// Ukládání: profily hráčů v localStorage (malé), záznam odpovědí v IndexedDB
// (roste). Všechno zůstává jen v tomto zařízení.
//
// Na jednom zařízení může hrát víc dětí. Seznam hráčů a rodičovský PIN jsou
// v záznamu zařízení; každý hráč má vlastní profil a záznam odpovědí. Hráč
// ze starší verze (jeden profil na zařízení) zůstává pod původními klíči.

import { createStore, get, set, del } from 'idb-keyval';
import type { Gender } from './gender';
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
  kind: 'level' | 'brave' | 'trick' | 'species' | 'first' | 'story' | 'card' | 'mission';
  text: string;
}

export interface Settings {
  sound: boolean;
  voice: boolean;
  /** Počet misí v Dnešním letu. */
  missions: number;
  /** Ptát se „jak jistá si jsi?“ zhruba u každé n-té úlohy (0 = nikdy). */
  confidenceEvery: number;
  /** Vynechat úlohy podobné testům (když dítě čeká vyšetření). */
  skipTestLike?: boolean;
  /** Starší verze: PIN byl v profilu. Teď je v záznamu zařízení. */
  pin?: string;
  /** Datum vyšetření (nepovinné). */
  pppDate?: string;
  /** Poznámky rodiče do portfolia (jen v zařízení). */
  notes?: string;
}

export interface Profile {
  version: 1;
  createdAt: number;
  /** Jméno hráče (jen v tomto zařízení). */
  name: string;
  /** Oslovení: holka, nebo kluk. Starší profily byly psané pro holku. */
  gender: Gender;
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
  /** Nejvyšší dosažený stupeň v dovednosti (oslavujeme jen nové maximum).
   *  Podle něj se odemykají i karty v Knize draků. */
  best: Record<string, number>;
  /** Splněné společné mise s rodičem: id mise → kdy. */
  missionsDone: Record<string, number>;
  sessions: number;
  totalAnswers: number;
}

const KEY = 'draci-ostrovy:v1';
const DEVICE_KEY = 'draci-ostrovy:zarizeni';
/** Hráč ze starší verze: profil a záznam pod původními klíči. */
export const MAIN_PLAYER = 'hlavni';

const profileKey = (id: string) => (id === MAIN_PLAYER ? KEY : `${KEY}:${id}`);
const eventsKey = (id: string) => (id === MAIN_PLAYER ? 'events' : `events:${id}`);

export function defaultProfile(): Profile {
  return {
    version: 1,
    createdAt: Date.now(),
    name: '',
    gender: 'f',
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
    missionsDone: {},
    sessions: 0,
    totalAnswers: 0,
  };
}

/** Doplní chybějící pole ze starší verze profilu (nebo ze zálohy). */
export function normalizeProfile(data: Partial<Profile>): Profile {
  const base = defaultProfile();
  const gender = data.gender === 'm' ? 'm' : 'f';
  return { ...base, ...data, name: data.name ?? '', gender, settings: { ...base.settings, ...(data.settings ?? {}) } };
}

// ---------------------------------------------------------------------------
// Zařízení: hráči a rodičovský PIN

export interface Device {
  /** Id hráčů v pořadí, v jakém přibyli. */
  players: string[];
  /** Kdo hrál naposledy. */
  active: string | null;
  /** Rodičovský PIN (4 číslice). */
  pin?: string;
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* plné úložiště nebo soukromý režim – hra běží dál bez ukládání */
  }
}

export function loadDevice(): Device {
  const saved = read(DEVICE_KEY) as Partial<Device> | null;
  if (saved && Array.isArray(saved.players)) {
    const players = saved.players.filter((id): id is string => typeof id === 'string');
    const active = typeof saved.active === 'string' && players.includes(saved.active) ? saved.active : (players[0] ?? null);
    return { players, active, ...(typeof saved.pin === 'string' ? { pin: saved.pin } : {}) };
  }
  // Zařízení ze starší verze: jeden hráč a PIN v jeho profilu.
  const legacy = read(KEY) as Partial<Profile> | null;
  if (legacy) {
    const device: Device = { players: [MAIN_PLAYER], active: MAIN_PLAYER, ...(legacy.settings?.pin ? { pin: legacy.settings.pin } : {}) };
    saveDevice(device);
    return device;
  }
  return { players: [], active: null };
}

export function saveDevice(d: Device) {
  write(DEVICE_KEY, d);
}

export const newPlayerId = () => `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function loadProfile(id: string): Profile {
  const data = read(profileKey(id)) as Partial<Profile> | null;
  return data ? normalizeProfile(data) : defaultProfile();
}

export function saveProfile(id: string, p: Profile) {
  write(profileKey(id), p);
}

// ---------------------------------------------------------------------------
// Záznam odpovědí (po hráčích)

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
const caches = new Map<string, AnswerEvent[]>();
let active = MAIN_PLAYER;
let writing: Promise<void> = Promise.resolve();

/** Čí záznam odpovědí se čte a zapisuje. */
export function setActivePlayer(id: string) {
  active = id;
}

async function eventsOf(id: string): Promise<AnswerEvent[]> {
  const cached = caches.get(id);
  if (cached) return cached;
  let events: AnswerEvent[] = [];
  if (store) {
    try {
      events = ((await get(eventsKey(id), store)) as AnswerEvent[] | undefined) ?? [];
    } catch {
      events = [];
    }
  }
  caches.set(id, events);
  return events;
}

export function loadEvents(): Promise<AnswerEvent[]> {
  return eventsOf(active);
}

export function appendEvent(e: AnswerEvent) {
  const id = active;
  writing = writing.then(async () => {
    const events = await eventsOf(id);
    events.push(e);
    if (store) {
      try {
        await set(eventsKey(id), events, store);
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

/** Nahraje zálohu do právě hrajícího hráče. Jméno a oslovení ze zálohy
 *  platí jen tehdy, když je záloha má (starší zálohy je nemají). */
export async function importAll(json: string, current: Profile): Promise<Profile> {
  const data = JSON.parse(json) as { profile: Partial<Profile>; events: AnswerEvent[] };
  if (!data.profile || !Array.isArray(data.events)) throw new Error('Neplatný soubor');
  const id = active;
  await writing;
  caches.set(id, data.events);
  if (store) {
    try {
      await set(eventsKey(id), data.events, store);
    } catch {
      /* záznam zůstane jen v paměti */
    }
  }
  const profile = normalizeProfile({
    ...data.profile,
    name: data.profile.name || current.name,
    gender: data.profile.gender ?? current.gender,
  });
  saveProfile(id, profile);
  return profile;
}

/** Smaže profil a záznam jednoho hráče. */
export async function removePlayerData(id: string) {
  await writing;
  caches.delete(id);
  try {
    localStorage.removeItem(profileKey(id));
  } catch {
    /* nic */
  }
  if (store) {
    try {
      await del(eventsKey(id), store);
    } catch {
      /* nic */
    }
  }
}

/** Smaže všechno: všechny hráče i záznam zařízení. */
export async function wipeAll() {
  const device = loadDevice();
  for (const id of new Set([...device.players, MAIN_PLAYER])) await removePlayerData(id);
  try {
    localStorage.removeItem(DEVICE_KEY);
  } catch {
    /* nic */
  }
}
