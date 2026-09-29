// Datový model hry. Obsah (generátory úloh) a jádro (adaptivní model,
// plánovač, radar) spolu mluví jen přes tyto typy.

import type { Rng } from './rng';

export type IslandId = 'cisla' | 'slova' | 'telo' | 'svet' | 'zahady' | 'trh' | 'dilna';

/** L1–L5 = očekávání RVP pro 1.–5. ročník, L6 = nad rámec 1. stupně. */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

/** Zjednodušené značení typu myšlení (inspirováno modelem CHC). Slouží jen
 *  k relativnímu profilu silných stránek v radaru, ne k normám. */
export type AbilityTag =
  | 'pocetni'      // kvantitativní uvažování, počty
  | 'slovni'       // jazyk, slovní zásoba, porozumění textu
  | 'prostorove'   // tvary, prostor, vizuální uvažování
  | 'usuzovani'    // logika, vzorce, řešení nových problémů
  | 'pamet'        // krátkodobá a pracovní paměť
  | 'znalosti'     // věcné znalosti o světě
  | 'tvorivost';   // otevřené úlohy, vlastní nápady

/** Formáty podobné subtestům inteligence. Hra je podle rozhodnutí rodiče
 *  trénuje, ale každé procvičení zapisuje, aby rodič mohl psycholožce
 *  přesně říct, co dítě dělalo. */
export type TestLikeFormat =
  | 'ciselne-rady'
  | 'obrazkove-rady'
  | 'matice'
  | 'analogie'
  | 'vahy'
  | 'skladani-tvaru'
  | 'co-nepatri'
  | 'podobnosti'
  | 'definice-slov'
  | 'protiklady'
  | 'pametove-rady'
  | 'sifry'
  | 'vedomosti';

export const TEST_LIKE_LABELS: Record<TestLikeFormat, string> = {
  'ciselne-rady': 'Doplňování číselných řad',
  'obrazkove-rady': 'Doplňování obrázkových řad',
  matice: 'Matice (doplň chybějící políčko)',
  analogie: 'Analogie (A je k B jako C je k ?)',
  vahy: 'Váhy a rovnice s obrázky',
  'skladani-tvaru': 'Skládání a otáčení tvarů',
  'co-nepatri': '„Co sem nepatří“ a třídění do skupin',
  podobnosti: '„V čem se podobá…“',
  'definice-slov': 'Vysvětlování významu slov',
  protiklady: 'Protiklady a synonyma',
  'pametove-rady': 'Zapamatování řad čísel nebo obrázků',
  sifry: 'Šifry a převod symbolů',
  vedomosti: 'Vědomostní otázky',
};

// ---------------------------------------------------------------------------
// Mapa těla

export const BODY_REGIONS = {
  outside: {
    hlava: 'hlava',
    krk: 'krk',
    hrudnik: 'hrudník',
    bricho: 'břicho',
    paze: 'paže',
    loket: 'loket',
    dlan: 'dlaň',
    koleno: 'koleno',
    noha: 'noha',
    chodidlo: 'chodidlo',
  },
  inside: {
    mozek: 'mozek',
    srdce: 'srdce',
    plice: 'plíce',
    zaludek: 'žaludek',
    jatra: 'játra',
    streva: 'střeva',
    ledviny: 'ledviny',
    mechyr: 'močový měchýř',
  },
} as const;

export type BodyRegion =
  | keyof (typeof BODY_REGIONS)['outside']
  | keyof (typeof BODY_REGIONS)['inside'];

// ---------------------------------------------------------------------------
// Úloha

export interface ChoiceOption {
  /** Text na tlačítku (krátký). */
  label: string;
  /** Co přečíst nahlas, pokud se liší od label (např. u emoji). */
  speak?: string;
}

// ---------------------------------------------------------------------------
// Mřížka (Vynálezecká dílna, mapy)

/** Krok letu po mřížce: nahoru, dolů, doleva, doprava. Na mapě je sever
 *  nahoře, takže U = na sever, D = na jih, L = na západ, R = na východ. */
export type Move = 'U' | 'D' | 'L' | 'R';

/** Políčko mřížky: x zleva od 0, y shora od 0. */
export interface Cell {
  x: number;
  y: number;
}

export type AnswerSpec =
  /** Výběr z 2–4 možností, právě jedna správná. */
  | { kind: 'choice'; options: ChoiceOption[]; correct: number }
  /** Číselná odpověď zadaná na obrazovkové klávesnici. */
  | { kind: 'number'; correct: number; allowNegative?: boolean; unit?: string }
  /** Klepnutí na oblast obrázku (např. orgán na mapě těla). */
  | { kind: 'tap'; correct: string }
  /** Skládání slova z písmenek (přesmyčky). `letters` jsou už zamíchaná. */
  | { kind: 'letters'; letters: string[]; correct: string }
  /** Umístění na číselné ose (odhad), tolerance v jednotkách osy. */
  | { kind: 'numberline'; min: number; max: number; correct: number; tolerance: number }
  /** Otevřená odpověď bez správně/špatně (tvořivé úlohy, příběhy). */
  | { kind: 'open'; minLength?: number; countIdeas?: boolean }
  /** Program letu: dítě skládá šipky a drak podle nich letí po mřížce
   *  (vizuál 'grid'). Správně je KAŽDÝ program, který doletí do cíle, cestou
   *  nenarazí na skálu ani nevyletí z mapy, sebere všechna `collect` a má
   *  nejvýš `maxSteps` kroků. */
  | { kind: 'program'; maxSteps: number; collect?: Cell[] }
  /** Seřazení: dítě klepe na položky ve správném pořadí. `items` jsou už
   *  zamíchané, `correct` je správné pořadí týchž (navzájem různých) položek. */
  | { kind: 'order'; items: string[]; correct: string[] };

export type Visual =
  | { type: 'clock'; h: number; m: number }
  | { type: 'eggs'; groups: number; perGroup: number; hidden?: boolean }
  | { type: 'fraction'; parts: number; filled: number; shape: 'pie' | 'bar' }
  | { type: 'series'; items: (number | string | null)[] }
  /** Součtový trojúhelník: vrcholy a součty na stranách [ab, bc, ca]. null =
   *  prázdné pole, `ask` = pole s otazníkem. */
  | { type: 'triangle'; vertices: (number | null)[]; edges: (number | null)[]; ask: { part: 'vertex' | 'edge'; index: number } }
  /** Had: hodnoty a operace mezi nimi (values.length = ops.length + 1).
   *  null = skrytá hodnota, `ask` = index hodnoty s otazníkem. */
  | { type: 'snake'; values: (number | null)[]; ops: { op: '+' | '−'; n: number }[]; ask: number }
  /** Dračí autobus: kolik jezdců nastoupilo a vystoupilo na zastávkách. */
  | { type: 'bus'; start: number | null; stops: { on: number; off: number }[]; end: number | null }
  /** Váhy v rovnováze. Žeton je číslo („5“ = závaží) nebo název předmětu
   *  ('vejce' | 'sud' | 'stit' | 'kamen'). */
  | { type: 'balance'; left: string[]; right: string[] }
  /** Magický čtverec 3 × 3 (řádky za sebou). */
  | { type: 'magic'; grid: (number | null)[]; ask: number; sum?: number }
  | { type: 'numberline'; min: number; max: number; ticks?: number[] }
  | { type: 'coins'; values: number[] }
  /** Mapa těla. `outside` = části těla, `inside` = orgány. Id oblastí viz
   *  BODY_REGIONS. `highlight` zvýrazní oblast (u otázek „co je tohle?“). */
  | { type: 'body'; mode: 'outside' | 'inside'; highlight?: BodyRegion }
  | { type: 'reading'; title: string; text: string }
  | { type: 'big'; text: string }
  /** Mřížka (mapa moře, dílna): drak, cíl, skály, pojmenovaná místa, případně
   *  nakreslená cesta a růžice světových stran. */
  | {
      type: 'grid';
      cols: number;
      rows: number;
      dragon?: Cell;
      goal?: Cell;
      rocks?: Cell[];
      /** Věci k sebrání cestou (vajíčka) – u odpovědi 'program' viz collect. */
      eggs?: Cell[];
      places?: (Cell & { emoji: string; name: string })[];
      /** Nakreslený program od draka s očíslovanými kroky (u „najdi chybu
       *  v programu“). U odpovědi 'program' smí být jen chybný, k opravě. */
      path?: Move[];
      compass?: boolean;
    }
  /** Karty vedle sebe (zvířata, zboží s cenou, draci s vlastnostmi).
   *  `tag` = štítek na kartě (cena, skupina), `mark` = zvýrazněná karta. */
  | { type: 'cards'; cards: { emoji: string; title: string; lines?: string[]; tag?: string; mark?: boolean }[] }
  /** Sloupcový graf (sbírání dat, počasí, útrata). */
  | { type: 'bars'; title?: string; unit?: string; bars: { label: string; value: number; emoji?: string }[] }
  /** Očíslovaný postup (algoritmus, recept). `highlight` = index zvýrazněného kroku. */
  | { type: 'steps'; title?: string; steps: string[]; highlight?: number }
  /** Tabulka (sudoku 4 × 4, matice obrázků): buňky po řádcích, null =
   *  prázdné políčko, `ask` = index políčka s otazníkem. `boxes` = rozměry
   *  bloku sudoku [šířka, výška] – hranice bloků se nakreslí silněji.
   *  `head: 'row'` = první řádek je záhlaví (klíč šifry, popisky sloupců). */
  | {
      type: 'table';
      cols: number;
      cells: (number | string | null)[];
      ask?: number;
      boxes?: [number, number];
      head?: 'row';
    };

export interface Item {
  /** Stabilní identifikátor: `${skillId}:${level}:${klíč}`. Stejná úloha =
   *  stejné id (kvůli opakování a statistikám). */
  id: string;
  skillId: string;
  level: Level;
  /** Zadání česky, krátké a jasné. */
  prompt: string;
  /** Text pro předčítání, pokud se liší od zadání (např. bez symbolů). */
  speak?: string;
  visual?: Visual;
  answer: AnswerSpec;
  /** Postupné nápovědy (1–3), od obecné po konkrétní. Nikdy neprozrazují
   *  výsledek přímo. */
  hints: string[];
  /** Vysvětlení řešení, ukáže se po chybě nebo na požádání. */
  explanation: string;
  /** Jemné posunutí obtížnosti v rámci úrovně (−0,5 až +0,5). */
  difficulty?: number;
}

// ---------------------------------------------------------------------------
// Dovednost a ostrov

export interface SkillDef {
  /** Např. 'cisla.scitani'. */
  id: string;
  island: IslandId;
  /** Název pro dítě i rodiče. */
  name: string;
  /** Jedna věta pro rodiče: co dovednost rozvíjí. */
  description: string;
  levels: Level[];
  /** Kódy očekávaných výstupů RVP ZV 2021 podle úrovně. */
  rvp: Partial<Record<Level, string[]>>;
  ability: AbilityTag;
  /** Pokud úlohy připomínají subtest inteligence. */
  testLike?: TestLikeFormat;
  /** Otevřené tvořivé úlohy nemají správně/špatně a neovlivňují model. */
  open?: boolean;
  /** Vygeneruje úlohu dané úrovně. Musí být deterministická pro dané rng. */
  generate: (level: Level, rng: Rng) => Item;
}

/** Karta znalostí do Knihy draků. Odemkne se, když hráčka v dovednosti
 *  `skillId` zvládne úroveň `level`. `fix` = stránka „opravená podle
 *  důkazů“: co se dřív tvrdilo a jak se na to přišlo. */
export interface KnowledgeCard {
  /** Unikátní v celé hře, např. 'svet.vesmir.mesic'. */
  id: string;
  skillId: string;
  level: Level;
  emoji: string;
  title: string;
  /** 1–3 krátké věty. */
  text: string;
  fix?: { before: string; evidence: string };
}

/** Společná mise s rodičem – úkol do skutečného světa (změř si tep,
 *  zaplať v obchodě, sleduj Měsíc). Hráčka ji odškrtne, až ji splní. */
export interface JointMission {
  /** Unikátní v celé hře, např. 'trh.nakup'. */
  id: string;
  island: IslandId;
  emoji: string;
  title: string;
  /** Zadání pro dítě (1–3 věty, předčítá se). */
  text: string;
  /** Tip pro rodiče: jak misi vést a na co se ptát. */
  parentTip: string;
  /** Orientačně od které úrovně mise dává smysl (1 = hned). */
  level: Level;
}

export interface IslandDef {
  id: IslandId;
  name: string;
  /** Kde: „na Ostrově čísel“, „ve Vynálezecké dílně“. */
  where: string;
  /** Odkud: „z Ostrova čísel“. */
  from: string;
  tagline: string;
  /** Dračí druh, se kterým se hráčka na ostrově spřátelí. */
  species: { name: string; description: string };
  available: boolean;
}

// ---------------------------------------------------------------------------
// Záznam odpovědí (radar)

export type Confidence = 'hadala' | 'asi' | 'jiste';

export interface AnswerEvent {
  t: number;              // čas (ms od epochy)
  sessionId: string;
  itemId: string;
  skillId: string;
  island: IslandId;
  level: Level;
  /** Správně na první pokus bez nápovědy / nakonec správně / nevyřešeno. */
  outcome: 'first' | 'later' | 'failed' | 'open';
  attempts: number;
  hintsUsed: number;
  responseMs: number;
  confidence?: Confidence;
  brave?: boolean;        // úloha z Bouřkového letu
  novel?: boolean;        // první setkání s dovedností
  testLike?: TestLikeFormat;
  /** Otevřená odpověď (příběh, nápady) – jen lokálně, pro portfolio. */
  text?: string;
  ideas?: number;
}

export interface SkillState {
  theta: number;   // odhad schopnosti (logitová škála)
  n: number;       // počet započtených odpovědí
  lastSeen: number;
  history: { t: number; theta: number }[]; // řídké snímky pro graf vývoje
}
