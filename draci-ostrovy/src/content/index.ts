// Registr ostrovů, dovedností, dračích kousků a druhů.

import type { IslandDef, IslandId, JointMission, KnowledgeCard, SkillDef } from '../core/types';

interface IslandModule {
  skills: SkillDef[];
  /** Karty znalostí do Knihy draků. */
  cards?: KnowledgeCard[];
  /** Společné mise s rodičem. */
  missions?: JointMission[];
}

// Každý ostrov má složku s index.ts, který exportuje `skills` (a případně
// `cards` a `missions`). Registr je načte automaticky – nový ostrov stačí
// přidat jako složku.
const modules = import.meta.glob<IslandModule>('./*/index.ts', { eager: true });
const moduleOf = (id: IslandId): IslandModule | undefined => modules[`./${id}/index.ts`];
const skillsFor = (id: IslandId): SkillDef[] => moduleOf(id)?.skills ?? [];

export const ISLANDS: IslandDef[] = [
  {
    id: 'cisla',
    name: 'Ostrov čísel',
    where: 'na Ostrově čísel',
    from: 'z Ostrova čísel',
    tagline: 'Počty, dračí autobus a mozkolamy',
    species: { name: 'Počtář ohnivý', description: 'Umí spočítat jiskry ve vlastním ohni. Když něco vyřeší, rozzáří se mu šupiny.' },
    available: true,
  },
  {
    id: 'slova',
    name: 'Ostrov slov',
    where: 'na Ostrově slov',
    from: 'z Ostrova slov',
    tagline: 'Příběhy, hádanky a kouzla písmen',
    species: { name: 'Runovka šeptavá', description: 'Kouřem píše do vzduchu písmena. Miluje hádanky, rýmy a dlouhé příběhy u ohně.' },
    available: true,
  },
  {
    id: 'telo',
    name: 'Ostrov těla',
    where: 'na Ostrově těla',
    from: 'z Ostrova těla',
    tagline: 'Jak funguje tělo – moje i dračí',
    species: { name: 'Tepák srdcový', description: 'Šupiny na hrudi mu blikají v rytmu srdce. Ví, jak se starat o zdraví.' },
    available: true,
  },
  {
    id: 'svet',
    name: 'Ostrov světa',
    where: 'na Ostrově světa',
    from: 'z Ostrova světa',
    tagline: 'Příroda, mapy a hvězdy',
    species: { name: 'Mapovec větrný', description: 'Létá tak vysoko, že vidí celou zemi jako mapu.' },
    available: true,
  },
  {
    id: 'zahady',
    name: 'Ostrov záhad',
    where: 'na Ostrově záhad',
    from: 'z Ostrova záhad',
    tagline: 'Logika a otázka „Jak to víme?“',
    species: { name: 'Hádankář mlžný', description: 'Schovává se v mlze a na každou odpověď se zeptá: „A jak to víš?“' },
    available: true,
  },
  {
    id: 'trh',
    name: 'Vikingský trh',
    where: 'na Vikingském trhu',
    from: 'z Vikingského trhu',
    tagline: 'Peníze, spoření a chytrá rozhodnutí',
    species: { name: 'Šupinka obchodní', description: 'Sbírá lesklé mince, ale ví, že nejcennější je dobrý nápad.' },
    available: true,
  },
  {
    id: 'dilna',
    name: 'Vynálezecká dílna',
    where: 've Vynálezecké dílně',
    from: 'z Vynálezecké dílny',
    tagline: 'Postupy, roboti a stroje, které se učí',
    species: { name: 'Ozubenec', description: 'Napůl drak, napůl stroj. Rád se nechá opravovat.' },
    available: true,
  },
];

// Ostrov je dostupný, jen pokud má obsah (bez dovedností zůstává v mlze).
for (const island of ISLANDS) island.available = island.available && skillsFor(island.id).length > 0;

export const SKILLS: SkillDef[] = ISLANDS.flatMap((i) => skillsFor(i.id));

export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const skillsOf = (island: IslandId) => SKILLS.filter((s) => s.island === island);

export const islandOf = (id: IslandId) => ISLANDS.find((i) => i.id === id)!;

const AVAILABLE = ISLANDS.filter((i) => i.available);

/** Karty znalostí dostupných ostrovů (v pořadí ostrovů). */
export const CARDS: KnowledgeCard[] = AVAILABLE.flatMap((i) => moduleOf(i.id)?.cards ?? []);

/** Společné mise dostupných ostrovů. */
export const MISSIONS: JointMission[] = AVAILABLE.flatMap((i) => moduleOf(i.id)?.missions ?? []);

export const cardsOf = (island: IslandId) => CARDS.filter((c) => SKILL_BY_ID[c.skillId]?.island === island);

export const missionsOf = (island: IslandId) => MISSIONS.filter((m) => m.island === island);

export interface Trick {
  id: string;
  name: string;
  anim: 'loop' | 'spin' | 'dive' | 'hop' | 'fire' | 'smoke' | 'flip' | 'glide';
  fire?: string; // barva ohně
}

/** Kousky, které se drak postupně naučí (v tomto pořadí). */
export const TRICKS: Trick[] = [
  { id: 'poskok', name: 'Radostný poskok', anim: 'hop' },
  { id: 'jiskra', name: 'První jiskra', anim: 'fire', fire: '#ffb703' },
  { id: 'vyvrtka', name: 'Vývrtka', anim: 'spin' },
  { id: 'krouzky', name: 'Kouřové kroužky', anim: 'smoke' },
  { id: 'strmhlav', name: 'Střemhlavý let', anim: 'dive' },
  { id: 'modry', name: 'Modrý oheň', anim: 'fire', fire: '#4cc9f0' },
  { id: 'salto', name: 'Salto', anim: 'flip' },
  { id: 'klouzani', name: 'Klouzání po větru', anim: 'glide' },
  { id: 'smycka', name: 'Velká smyčka', anim: 'loop' },
  { id: 'zeleny', name: 'Zelený oheň', anim: 'fire', fire: '#80ed99' },
  { id: 'dvojita', name: 'Dvojitá vývrtka', anim: 'spin' },
  { id: 'fialovy', name: 'Fialový oheň', anim: 'fire', fire: '#c77dff' },
  { id: 'tanec', name: 'Tanec v oblacích', anim: 'glide' },
  { id: 'zlaty', name: 'Zlatý oheň', anim: 'fire', fire: '#ffd60a' },
  { id: 'hvezdna', name: 'Hvězdná smyčka', anim: 'loop' },
  { id: 'duhovy', name: 'Duhový oheň', anim: 'fire', fire: 'rainbow' },
];
