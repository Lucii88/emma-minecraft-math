// Karty znalostí Ostrova slov. Karta se odemkne, když hráčka v dovednosti
// dosáhne uvedené úrovně. Karty s `fix` jsou „opravené stránky“ – co se dřív
// tradovalo a jak se přišlo na pravdu. Tvořivé psaní (otevřená dovednost)
// karty nemá, protože nemá stupně.

import type { KnowledgeCard } from '../../core/types';

export const cards: KnowledgeCard[] = [
  // -------------------------------------------------------------------------
  // Čtení s porozuměním
  {
    id: 'slova.cteni.braillovo-pismo',
    skillId: 'slova.cteni',
    level: 1,
    emoji: '👆',
    title: 'Písmo pro prsty',
    text: 'Nevidomí lidé čtou prsty písmo z vystouplých teček. Vymyslel ho Francouz Louis Braille, když mu bylo teprve 15 let – a sám byl nevidomý.',
  },
  {
    id: 'slova.cteni.runy',
    skillId: 'slova.cteni',
    level: 2,
    emoji: '📜',
    title: 'Runy – písmo Vikingů',
    text: 'Vikingové psali runami a vyřezávali je do dřeva, kosti i kamene. Jejich abeceda se jmenuje futhark podle prvních šesti run (f, u, th, a, r, k) a v době Vikingů měla jen 16 znaků.',
  },
  {
    id: 'slova.cteni.oci-skacou',
    skillId: 'slova.cteni',
    level: 3,
    emoji: '👀',
    title: 'Oči při čtení skáčou',
    text: 'Když čteš, oči nejedou po řádku plynule. Poskakují: rychle skočí, na chviličku se zastaví a zase skočí dál. Zkus pozorovat oči někoho, kdo čte.',
    fix: {
      before: 'Oči při čtení kloužou po řádku plynule, jako když vedeš prstem.',
      evidence: 'V roce 1879 si francouzský oční lékař Louis Émile Javal všiml, že oči čtenářů poskakují. Dnes to vědci měří přístroji, které sledují pohyb očí.',
    },
  },

  // -------------------------------------------------------------------------
  // Hádanky
  {
    id: 'slova.hadanky.erben',
    skillId: 'slova.hadanky',
    level: 2,
    emoji: '📖',
    title: 'Hádanky z dávných časů',
    text: 'Hádanky si lidé dlouho jen vyprávěli a předávali z generace na generaci. Karel Jaromír Erben je před víc než 150 lety sbíral a zapisoval spolu s lidovými písněmi a říkadly, aby se nezapomněly.',
  },
  {
    id: 'slova.hadanky.odin',
    skillId: 'slova.hadanky',
    level: 3,
    emoji: '🎭',
    title: 'Hádanky u Vikingů',
    text: 'Hádanky milovali i Vikingové. Ve staré severské sáze se přijde s králem Heidrekem hádat sám bůh Ódin – v přestrojení, aby ho nikdo nepoznal.',
  },

  // -------------------------------------------------------------------------
  // Přesmyčky
  {
    id: 'slova.presmycky.palindromy',
    skillId: 'slova.presmycky',
    level: 2,
    emoji: '🐴',
    title: 'Věty, které jdou číst pozpátku',
    text: 'Věty „Kobyla má malý bok“ a „Jelenovi pivo nelej“ se dají číst i pozpátku. Takovým slovům a větám se říká palindromy – mezery, velká písmena a čárky nad písmeny se přitom nepočítají. Palindromy jsou i slova oko, krk nebo radar.',
  },
  {
    id: 'slova.presmycky.galileo',
    skillId: 'slova.presmycky',
    level: 4,
    emoji: '🔭',
    title: 'Objev schovaný v přesmyčce',
    text: 'Galileo Galilei schoval v roce 1610 svůj objev o Saturnu do přesmyčky. Johannes Kepler ji luštil a omylem vyčetl, že Mars má dva měsíce. Mars je opravdu má – objevili je ale až v roce 1877.',
  },

  // -------------------------------------------------------------------------
  // Rýmy
  {
    id: 'slova.rymy.skaldove',
    skillId: 'slova.rymy',
    level: 2,
    emoji: '🔥',
    title: 'Jak skládali básně Vikingové',
    text: 'Vikingští básníci, skaldové, nestavěli verše hlavně na rýmech. Spojovali slova, která začínají stejnou hláskou, třeba „drak držel drahokam“.',
  },
  {
    id: 'slova.rymy.rym-a-pravda',
    skillId: 'slova.rymy',
    level: 3,
    emoji: '🧐',
    title: 'Rým zní pravdivěji',
    text: 'Rýmovaná věta zní pravdivěji. Vědci dali lidem posoudit přísloví s rýmem a bez rýmu a ta rýmovaná jim připadala pravdivější, i když říkala totéž. Proto se rýmy hodí do reklam a proto je dobré přemýšlet, co věta opravdu říká.',
  },

  // -------------------------------------------------------------------------
  // Pravopis i/y
  {
    id: 'slova.pravopis.stejne-zni',
    skillId: 'slova.pravopis',
    level: 2,
    emoji: '🦉',
    title: 'Stejně zní, jinak znamenají',
    text: 'Mýt ruce, nebo mít psa? Výr je sova a vír je ve vodě, vlk vyje a věnec se vije. Slova zní stejně, ale y a i prozradí, co znamenají.',
  },
  {
    id: 'slova.pravopis.proc-y',
    skillId: 'slova.pravopis',
    level: 3,
    emoji: '⏳',
    title: 'Proč píšeme i a y',
    text: 'Kdysi se y vyslovovalo jinak než i, podobně jako dnes v polštině. Výslovnost se časem slila, ale v psaní rozdíl zůstal – proto se učíme vyjmenovaná slova. Jazykovědci to poznali ze starých rukopisů a z příbuzných jazyků.',
  },

  // -------------------------------------------------------------------------
  // Hlásky a velká písmena
  {
    id: 'slova.hlasky.strc-prst',
    skillId: 'slova.hlasky',
    level: 1,
    emoji: '👉',
    title: 'Věta bez samohlásek',
    text: 'Věta „Strč prst skrz krk“ nemá ani jednu samohlásku, a přesto se dá vyslovit. V češtině totiž umějí slabiku utvořit i r a l, třeba ve slovech vlk nebo krk.',
  },
  {
    id: 'slova.hlasky.ch',
    skillId: 'slova.hlasky',
    level: 2,
    emoji: '🔤',
    title: 'Písmeno ze dvou znaků',
    text: 'Ch je v češtině jedno písmeno, i když se píše dvěma znaky. V abecedě stojí hned za h, a proto ve slovníku najdeš chleba až za slovem hvězda.',
  },
  {
    id: 'slova.hlasky.hacky-a-carky',
    skillId: 'slova.hlasky',
    level: 3,
    emoji: '✒️',
    title: 'Odkud se vzaly háčky',
    text: 'Háčky a čárky navrhl asi před 600 lety spis o pravopisu, který se připisuje Janu Husovi. Místo dvojic písmen, třeba cz pro č, zavedl tečky a čárky nad písmeny – z teček se později staly háčky.',
  },

  // -------------------------------------------------------------------------
  // Slovní druhy
  {
    id: 'slova.druhy.kohout',
    skillId: 'slova.druhy',
    level: 2,
    emoji: '🐓',
    title: 'Kohout kokrhá různými jazyky',
    text: 'Česky kohout volá kykyryký, anglicky cock-a-doodle-doo a německy kikeriki. Slova, která napodobují zvuky, jsou citoslovce – a každý jazyk je slyší trochu jinak.',
  },
  {
    id: 'slova.druhy.sloveso',
    skillId: 'slova.druhy',
    level: 3,
    emoji: '🛌',
    title: 'Sloveso nemusí být činnost',
    text: 'Slovesa neříkají jen, co kdo dělá. Spát, ležet nebo být jsou taky slovesa, i když při nich nikdo nic nedělá. Slovesa vyjadřují děj nebo stav.',
    fix: {
      before: 'Sloveso je slovo, které říká, co kdo dělá.',
      evidence: 'Stačí jediný protipříklad: spát se časuje jako každé sloveso (spím, spala, budu spát), a přitom to žádná činnost není. Jazykovědci proto mluví o ději nebo stavu.',
    },
  },
  {
    id: 'slova.druhy.rod-slunce',
    skillId: 'slova.druhy',
    level: 4,
    emoji: '☀️',
    title: 'Slunce je on, ona, nebo ono?',
    text: 'Slunce je česky ono, německy ona (die Sonne) a francouzsky on (le soleil). Rod podstatného jména tedy neurčuje věc sama, ale jazyk.',
  },

  // -------------------------------------------------------------------------
  // Co k sobě patří
  {
    id: 'slova.skupiny.pavouk',
    skillId: 'slova.skupiny',
    level: 1,
    emoji: '🕷️',
    title: 'Pavouk není hmyz',
    text: 'Hmyz má šest nohou, pavouk osm. Přírodovědci proto pavouka nepočítají k hmyzu, ale k pavoukovcům – tam patří třeba i štíři.',
  },
  {
    id: 'slova.skupiny.velryba',
    skillId: 'slova.skupiny',
    level: 2,
    emoji: '🐋',
    title: 'Velryba není ryba',
    text: 'Velryba žije v moři, ale ryba to není. Dýchá plícemi vzduch a mláďata krmí mlékem – je to savec, stejně jako pes nebo člověk.',
    fix: {
      before: 'Velryba je obrovská ryba.',
      evidence: 'Badatelé pozorovali, že se velryby vynořují pro vzduch a kojí mláďata. Švédský přírodovědec Carl Linné je proto v roce 1758 zařadil mezi savce.',
    },
  },
  {
    id: 'slova.skupiny.rajce',
    skillId: 'slova.skupiny',
    level: 3,
    emoji: '🍅',
    title: 'Rajče: zelenina, nebo plod?',
    text: 'V kuchyni je rajče zelenina. Botanik v něm ale vidí plod – vzniklo z květu a jsou v něm semínka, stejně jako v jablku. Do které skupiny věc patří, záleží na tom, podle čeho třídíme.',
  },

  // -------------------------------------------------------------------------
  // Protiklady a podobná slova
  {
    id: 'slova.protiklady.no',
    skillId: 'slova.protiklady',
    level: 2,
    emoji: '🗣️',
    title: 'Když „no“ znamená ano',
    text: 'Když Čech řekne „no“, často tím myslí ano. Angličan tím ale myslí ne! Stejně znějící slovo může v jiném jazyce znamenat pravý opak.',
  },
  {
    id: 'slova.protiklady.recka-slova',
    skillId: 'slova.protiklady',
    level: 4,
    emoji: '🔠',
    title: 'Slova z řečtiny',
    text: 'Slova synonymum a antonymum přišla z řečtiny: syn znamená spolu, anti proti a onyma jméno. Synonyma jsou slova podobného významu, antonyma opačného.',
  },
];
