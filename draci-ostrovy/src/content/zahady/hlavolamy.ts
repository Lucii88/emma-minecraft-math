// Ostrov záhad – hlavolamy a testové formáty: logické hlavolamy, dračí
// sudoku, matice, analogie a obrázkové řady.
//
// Matice, analogie a obrázkové řady mají formát podobný subtestům
// inteligence. Hra je podle rozhodnutí rodiče trénuje, ale každé procvičení
// zapisuje (testLike), aby šlo psycholožce přesně říct, co dítě dělalo.
// Úlohy jsou vlastní, nejsou převzaté ze skutečných testů.
//
// Vysvětlení hlavolamů je postup řešení, ne zajímavost – showFact tu
// záměrně chybí (po správné odpovědi by jen zdržovalo).

import { bankSkill } from '../../core/bank';
import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { ANALOGIE_BANKS } from './hlavolamy-analogie';
import { LOGIKA_BANKS, LOGIKA_GEN } from './hlavolamy-logika';
import { MATICE_GEN } from './hlavolamy-matice';
import { RADY_GEN } from './hlavolamy-rady';
import { SUDOKU_GEN } from './hlavolamy-sudoku';

const PROBLEMS = ['M-5-4-01'];

export const logika = bankSkill({
  id: 'zahady.logika',
  island: 'zahady',
  name: 'Logické hlavolamy',
  description:
    'Usuzování z vodítek: seřazení, kdo má kterého draka, zasedací pořádek, „když…, tak…“, kombinace, princip holubníku a poctivci s lháři.',
  rvp: { 1: PROBLEMS, 2: PROBLEMS, 3: PROBLEMS, 4: PROBLEMS, 5: PROBLEMS },
  ability: 'usuzovani',
  banks: LOGIKA_BANKS,
  gen: LOGIKA_GEN,
  genShare: 0.5,
});

export const sudoku = bankSkill({
  id: 'zahady.sudoku',
  island: 'zahady',
  name: 'Dračí sudoku',
  description:
    'Sudoku 4 × 4 s obrázky a čísly a 6 × 6: doplnit políčko podle řádku, sloupce a bloku, na vyšších úrovních přes mezikrok.',
  rvp: { 1: ['M-3-2-03', ...PROBLEMS], 2: ['M-3-2-03', ...PROBLEMS], 3: ['M-3-2-03', ...PROBLEMS], 4: PROBLEMS, 5: PROBLEMS },
  ability: 'usuzovani',
  gen: SUDOKU_GEN,
});

export const matice = bankSkill({
  id: 'zahady.matice',
  island: 'zahady',
  name: 'Dračí matice',
  description:
    'Doplnění chybějícího obrázku v tabulce podle pravidel v řádcích a sloupcích: tvar, barva, počet a latinský čtverec, na vyšších úrovních několik pravidel naráz.',
  rvp: { 1: ['M-3-2-03', ...PROBLEMS], 2: ['M-3-2-03', ...PROBLEMS], 3: ['M-3-2-03', ...PROBLEMS], 4: PROBLEMS, 5: PROBLEMS },
  ability: 'usuzovani',
  testLike: 'matice',
  gen: MATICE_GEN,
});

export const analogie = bankSkill({
  id: 'zahady.analogie',
  island: 'zahady',
  name: 'Analogie',
  description: 'Najít vztah mezi dvěma slovy nebo obrázky a přenést ho na další dvojici (A je k B jako C je k ?).',
  rvp: {
    1: ['ČJL-3-2-02'],
    2: ['ČJL-3-2-02'],
    3: ['ČJL-3-2-02'],
    4: ['ČJL-5-2-01', ...PROBLEMS],
    5: ['ČJL-5-2-01', ...PROBLEMS],
  },
  ability: 'usuzovani',
  testLike: 'analogie',
  banks: ANALOGIE_BANKS,
});

export const rady = bankSkill({
  id: 'zahady.rady',
  island: 'zahady',
  name: 'Obrázkové řady',
  description:
    'Pokračování v řadě obrázků: opakující se vzory, rostoucí počty, otáčející se šipky, zrcadlové řady a dvě řady zamíchané do sebe.',
  rvp: { 1: ['M-3-2-03'], 2: ['M-3-2-03'], 3: ['M-3-2-03'], 4: PROBLEMS, 5: PROBLEMS },
  ability: 'usuzovani',
  testLike: 'obrazkove-rady',
  gen: RADY_GEN,
});

export const hlavolamySkills: SkillDef[] = [logika, sudoku, matice, analogie, rady];

// ---------------------------------------------------------------------------
// Karty do Knihy draků

export const hlavolamyCards: KnowledgeCard[] = [
  {
    id: 'zahady.sudoku.garns',
    skillId: 'zahady.sudoku',
    level: 2,
    emoji: '📰',
    title: 'Kdo vymyslel sudoku',
    text: 'Sudoku v dnešní podobě vymyslel nejspíš Američan Howard Garns. Poprvé vyšlo v roce 1979 v americkém časopise pod názvem Number Place – „místo pro číslo“.',
    fix: {
      before: 'Sudoku vymysleli v Japonsku – vždyť má japonské jméno.',
      evidence:
        'Hádankář Will Shortz prošel staré americké časopisy: Garnsovo jméno stálo mezi autory právě v číslech, kde vyšlo Number Place. Jméno sudoku dostala hádanka v Japonsku až v roce 1984.',
    },
  },
  {
    id: 'zahady.sudoku.pocet',
    skillId: 'zahady.sudoku',
    level: 4,
    emoji: '🔢',
    title: 'Kolik je různých sudoku',
    text: 'Různě vyplněných sudoku 4 × 4 je jen 288. U velkého sudoku 9 × 9 je jich tolik, že to číslo má 22 číslic. Spočítali to v roce 2005 dva vědci s pomocí počítače.',
  },
  {
    id: 'zahady.sudoku.sedmnact',
    skillId: 'zahady.sudoku',
    level: 6,
    emoji: '🧩',
    title: 'Nejméně 17 čísel',
    text: 'Aby mělo velké sudoku 9 × 9 jediné řešení, musí v něm být zadaných aspoň 17 čísel.',
    fix: {
      before: 'Dlouho nikdo nevěděl, jestli nejde udělat sudoku s jediným řešením jen ze 16 zadaných čísel.',
      evidence:
        'V roce 2012 tým vědců z Irska prověřil s pomocí superpočítače všechna možná vyplněná sudoku. Zadání se 16 čísly a jediným řešením nenašli žádné.',
    },
  },
  {
    id: 'zahady.matice.pixely',
    skillId: 'zahady.matice',
    level: 2,
    emoji: '📱',
    title: 'Obrazovka jako tabulka',
    text: 'Obrázek na obrazovce se skládá z drobných teček, pixelů, v řádcích a sloupcích. Každá barva na obrazovce vzniká smícháním jen tří světel: červeného, zeleného a modrého. Pod silnou lupou je někdy uvidíš.',
  },
  {
    id: 'zahady.matice.euler',
    skillId: 'zahady.matice',
    level: 3,
    emoji: '🧮',
    title: 'Latinské čtverce',
    text: 'Tabulce, kde je v každém řádku i sloupci každý znak právě jednou, se říká latinský čtverec. Zkoumal je švýcarský matematik Leonhard Euler a psal do nich latinská písmena – odtud to jméno.',
  },
  {
    id: 'zahady.matice.bile-svetlo',
    skillId: 'zahady.matice',
    level: 4,
    emoji: '🌈',
    title: 'Bílé světlo z barev',
    text: 'Když smícháš barevná světla, vznikne světlejší barva. Červené, zelené a modré světlo dohromady dají bílou – proto stačí obrazovce tři barvy.',
    fix: {
      before: 'Bílé světlo je čisté a žádné barvy v sobě nemá – barvy k němu přidá až sklo.',
      evidence:
        'Isaac Newton poslal sluneční světlo skleněným hranolem a to se rozložilo na barvy duhy. Čočkou a druhým hranolem je pak zase složil zpátky do bílé.',
    },
  },
  {
    id: 'zahady.analogie.suchy-zip',
    skillId: 'zahady.analogie',
    level: 2,
    emoji: '🐕',
    title: 'Suchý zip podle lopuchu',
    text: 'Švýcarský vynálezce George de Mestral viděl, jak se jeho psovi do srsti chytají ostnaté plody lopuchu. Pod mikroskopem na nich objevil drobné háčky a podle nich vymyslel suchý zip.',
  },
  {
    id: 'zahady.analogie.duha',
    skillId: 'zahady.analogie',
    level: 4,
    emoji: '🎵',
    title: 'Proč má duha sedm barev',
    text: 'Isaac Newton v duze nejdřív rozlišil pět barev. Pak přidal oranžovou a indigovou (tmavě modrou), aby jich bylo sedm – stejně jako tónů v hudební stupnici.',
    fix: {
      before: 'Duha má přesně sedm barev.',
      evidence:
        'Přístroje, které rozkládají světlo, ukazují, že barvy v duze plynule přecházejí jedna v druhou. Kolik jich pojmenujeme, je jen dohoda.',
    },
  },
  {
    id: 'zahady.analogie.letani',
    skillId: 'zahady.analogie',
    level: 5,
    emoji: '✈️',
    title: 'Létat jako pták?',
    text: 'Lidé dlouho chtěli létat jako ptáci. Pomohlo až pochopit, jak křídlo funguje, a ne ho přesně napodobit.',
    fix: {
      before: 'Aby člověk vzlétl, musí mávat křídly jako pták.',
      evidence:
        'Dávné pokusy s mávajícími křídly se nepovedly. Bratři Wrightové zkoušeli tvary křídel ve větrném tunelu a v roce 1903 vzlétli s pevnými křídly a vrtulemi.',
    },
  },
  {
    id: 'zahady.logika.aristoteles',
    skillId: 'zahady.logika',
    level: 4,
    emoji: '📜',
    title: 'Pravidla správného usuzování',
    text: 'Už před více než 2 300 lety sepsal řecký myslitel Aristotelés pravidla, jak z pravdivých vět správně vyvodit další pravdivou větu. Dnes tomu říkáme logika.',
  },
  {
    id: 'zahady.logika.smullyan',
    skillId: 'zahady.logika',
    level: 5,
    emoji: '🎩',
    title: 'Ostrov poctivců a lhářů',
    text: 'Hádanky o poctivcích a lhářích proslavil americký matematik Raymond Smullyan. Byl také kouzelník a hrál na klavír.',
  },
  {
    id: 'zahady.logika.kostka',
    skillId: 'zahady.logika',
    level: 5,
    emoji: '🎲',
    title: 'Kostka nemá paměť',
    text: 'Každý hod kostkou je nový začátek. Co padlo předtím, na další hod vliv nemá.',
    fix: {
      before: 'Když na kostce dlouho nepadla šestka, teď už padnout musí.',
      evidence:
        'Vědci házeli kostkami desetitisíckrát a výsledky zapisovali. Šestka padala zhruba v každém šestém hodu. Kostka si nepamatuje, co padlo předtím.',
    },
  },
  {
    id: 'zahady.logika.holubnik',
    skillId: 'zahady.logika',
    level: 6,
    emoji: '🕊️',
    title: 'Princip holubníku',
    text: 'Když vletí do holubníků víc holubů, než je holubníků, v některém musí být aspoň dva. Matematici tomu říkají Dirichletův princip nebo princip holubníku. Pomáhá řešit i velmi těžké úlohy.',
  },
  {
    id: 'zahady.rady.vlocky',
    skillId: 'zahady.rady',
    level: 1,
    emoji: '❄️',
    title: 'Vzory v přírodě',
    text: 'Sněhové hvězdičky mají šest cípů – ověříš si to lupou na tmavém rukávu. Hodně vloček je ale nepravidelných, tak hledej trpělivě. Vzory najdeš v přírodě všude.',
  },
  {
    id: 'zahady.rady.mars',
    skillId: 'zahady.rady',
    level: 3,
    emoji: '🛰️',
    title: 'Tvář na Marsu',
    text: 'Mozek rád hledá vzory a tváře. Proto vidíme obličeje v mracích, na skalách, a dokonce i na předku auta.',
    fix: {
      before: 'Na snímku ze sondy Viking 1 z roku 1976 byla na Marsu vidět obří tvář. Někteří lidé věřili, že ji tam někdo postavil.',
      evidence: 'Ostřejší snímky ze sondy Mars Global Surveyor z let 1998 a 2001 ukázaly obyčejný skalnatý kopec. Tvář vytvořily jen stíny, rozmazaný snímek – a náš mozek.',
    },
  },
  {
    id: 'zahady.rady.slunecnice',
    skillId: 'zahady.rady',
    level: 5,
    emoji: '🌻',
    title: 'Spirály ve slunečnici',
    text: 'Semínka ve slunečnici tvoří spirály. Když je spočítáš, často vyjdou čísla 21, 34, 55 nebo 89. Patří do řady 1, 1, 2, 3, 5, 8, 13, 21…, kde je každé číslo součtem dvou předchozích.',
  },
];

// ---------------------------------------------------------------------------
// Společné mise

export const hlavolamyMissions: JointMission[] = [
  {
    id: 'zahady.rodinne-sudoku',
    island: 'zahady',
    emoji: '🧩',
    title: 'Rodinné sudoku',
    text: 'Nakresli si s rodičem na papír dvě tabulky 4 × 4. Každý z vás vymyslí sudoku ze čtyř obrázků pro toho druhého. Pak si zadání vyměňte a vyřešte je.',
    parentTip:
      'Nejdřív vyplňte celou tabulku a pak pár políček vygumujte – tak sudoku vzniká. Ptejte se: „Podle čeho víš, že tam patří tohle?“ Když zadání nejde vyřešit jednoznačně, je to skvělý objev: zkuste spolu přijít na to proč. Chvalte postup, ne rychlost.',
    level: 1,
  },
  {
    id: 'zahady.rady-z-veci',
    island: 'zahady',
    emoji: '🥄',
    title: 'Řady z věcí',
    text: 'Rodič poskládá na stůl řadu z lžiček, kostek nebo pastelek. Ty přijdeš na pravidlo a v řadě pokračuješ. Pak si role vyměníte.',
    parentTip:
      'Začněte jednoduše (lžička, kostka, lžička, kostka…) a postupně přidávejte: dvě stejné a jednu jinou, tři různé, rostoucí řady. Ptejte se: „Jak jsi na to {přišla|přišel}?“ Když skládá řadu dítě, občas se schválně spleťte a nechte ho chybu najít.',
    level: 1,
  },
  {
    id: 'zahady.hadanka-u-stolu',
    island: 'zahady',
    emoji: '🍽️',
    title: 'Hádanka u stolu',
    text: 'Vymysli s rodičem logickou hádanku pro celou rodinu – třeba kdo je nejvyšší nebo kdo sedí vedle koho. U večeře ji zadejte ostatním.',
    parentTip:
      'Pomozte hádanku ověřit: má právě jedno řešení? Zkuste ji nejdřív vyřešit sami. Ptejte se: „Co z vodítek víme jistě?“ Když dítě v zadání najde chybu, pochvalte to – i to je důležitá dovednost.',
    level: 2,
  },
];
