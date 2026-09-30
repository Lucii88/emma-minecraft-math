// Karty znalostí Ostrova těla. Karta se odemkne, když hráčka v dovednosti
// dosáhne uvedené úrovně: snadné klasiky na nižších úrovních, hlubší věci
// výš. Karty s `fix` jsou „opravené stránky“ – co se dřív tradovalo a jak se
// přišlo na pravdu.

import type { KnowledgeCard } from '../../core/types';

export const cards: KnowledgeCard[] = [
  // -------------------------------------------------------------------------
  // Kde to v těle je?
  {
    id: 'telo.mapa.nejvetsi-organ',
    skillId: 'telo.mapa',
    level: 1,
    emoji: '🤚',
    title: 'Největší orgán těla',
    text: 'Kůže je největší orgán lidského těla. U dospělého má plochu asi jako velká plážová osuška. Chrání tělo, pomáhá mu udržet teplotu a cítí dotek.',
  },
  {
    id: 'telo.mapa.srdce-uprostred',
    skillId: 'telo.mapa',
    level: 2,
    emoji: '❤️',
    title: 'Kde přesně je srdce?',
    text: 'Srdce neleží na levé straně hrudníku, ale skoro uprostřed, za hrudní kostí – jen je trochu posunuté doleva. Doleva míří i jeho špička, a proto tlukot cítíme víc vlevo.',
    fix: {
      before: 'Srdce máme na levé straně hrudníku.',
      evidence: 'Lékaři to vidí na rentgenovém snímku hrudníku i na ultrazvuku: srdce leží mezi plícemi, jen trochu vlevo.',
    },
  },
  {
    id: 'telo.mapa.ultrazvuk',
    skillId: 'telo.mapa',
    level: 3,
    emoji: '🦇',
    title: 'Obrázek z ozvěny',
    text: 'Ultrazvuk je zvuk tak vysoký, že ho neslyšíme. Přístroj ho pošle do těla, zvuk se odrazí od orgánů a počítač z ozvěny složí obrázek. Podobně se ve tmě orientují netopýři.',
  },

  // -------------------------------------------------------------------------
  // K čemu slouží orgány
  {
    id: 'telo.organy.sto-tisic-uderu',
    skillId: 'telo.organy',
    level: 2,
    emoji: '💓',
    title: 'Sto tisíc úderů denně',
    text: 'Srdce dospělého udeří zhruba 100 000krát za den, ve dne i v noci. Dětské srdce bije rychleji, a tak za den udeří ještě vícekrát. Spočítat se to dá z tepu: údery za minutu × 60 minut × 24 hodin.',
  },
  {
    id: 'telo.organy.myslime-mozkem',
    skillId: 'telo.organy',
    level: 3,
    emoji: '🧠',
    title: 'Myslíme mozkem, ne srdcem',
    text: 'Přemýšlíme a pamatujeme si mozkem. Srdce je silný sval, který pumpuje krev – když se lekneme nebo se na něco těšíme, jen rychleji bije.',
    fix: {
      before: 'Ve starověku si mnoho lidí myslelo, že přemýšlíme srdcem. Řecký učenec Aristotelés soudil, že mozek jen chladí krev.',
      evidence: 'Lékaři později zjistili, že zprávy z očí, uší i kůže vedou nervy do mozku. Dnes vědci přístroji vidí, které části mozku pracují, když přemýšlíme.',
    },
  },
  {
    id: 'telo.organy.krev-neni-modra',
    skillId: 'telo.organy',
    level: 5,
    emoji: '🔴',
    title: 'Krev v žilách není modrá',
    text: 'Krev je vždycky červená: v tepnách jasně červená, v žilách tmavší. Žíly na ruce vypadají namodrale jen proto, že je vidíme přes kůži.',
    fix: {
      before: 'V žilách teče modrá krev.',
      evidence: 'Krev ze žíly je ve zkumavce u lékaře tmavě červená. Vědci změřili, jak kůže propouští a odráží světlo různých barev, a vysvětlili, proč žíly prosvítají modře.',
    },
  },

  // -------------------------------------------------------------------------
  // Smysly
  {
    id: 'telo.smysly.usi-nespi',
    skillId: 'telo.smysly',
    level: 1,
    emoji: '👂',
    title: 'Uši nemají víčka',
    text: 'Oči můžeš zavřít, uši ne – slyšíme i ve spánku. Mozek si ale většiny zvuků nevšímá, a tak nás spíš vzbudí budík nebo vlastní jméno než tikání hodin.',
  },
  {
    id: 'telo.smysly.mapa-chuti',
    skillId: 'telo.smysly',
    level: 2,
    emoji: '👅',
    title: 'Mapa chutí na jazyku neplatí',
    text: 'Sladkou, slanou, kyselou i hořkou chuť cítíme na všech místech jazyka, kde jsou chuťové pohárky. Některá místa jsou jen o kousek citlivější než jiná.',
    fix: {
      before: 'Na jazyku je mapa chutí: sladké cítíme na špičce, hořké vzadu, kyselé a slané po stranách.',
      evidence: 'Mapa vznikla nepřesným převzetím jedné starší německé práce. Když vědci kapali chutě na různá místa jazyka, zjistili, že každé místo s pohárky cítí všechny chutě.',
    },
  },
  {
    id: 'telo.smysly.vic-nez-pet',
    skillId: 'telo.smysly',
    level: 3,
    emoji: '🤸',
    title: 'Smyslů je víc než pět',
    text: 'Kromě zraku, sluchu, čichu, chuti a hmatu máme i smysl pro rovnováhu ve vnitřním uchu. A jiný smysl ti prozradí, kde máš ruce, i když zavřeš oči.',
    fix: {
      before: 'Člověk má přesně pět smyslů.',
      evidence: 'Pět smyslů popsal už starověký učenec Aristotelés. Později vědci zjistili, že část vnitřního ucha neslouží ke slyšení, ale hlídá rovnováhu.',
    },
  },

  // -------------------------------------------------------------------------
  // Kostra a svaly
  {
    id: 'telo.kostra.pocet-kosti',
    skillId: 'telo.kostra',
    level: 2,
    emoji: '🦴',
    title: 'Kolik máme kostí',
    text: 'Dospělý člověk má asi 206 kostí. Miminko jich má víc, protože některé jeho kosti jsou ještě rozdělené na části a později srostou dohromady. Lékaři to vidí na rentgenu.',
  },
  {
    id: 'telo.kostra.trminek',
    skillId: 'telo.kostra',
    level: 3,
    emoji: '🔎',
    title: 'Kost menší než zrnko rýže',
    text: 'Nejmenší kost v těle je třmínek ve středním uchu. Je menší než zrnko rýže a spolu s kladívkem a kovadlinkou přenáší zvuk od bubínku dál do vnitřního ucha.',
  },
  {
    id: 'telo.kostra.zive-kosti',
    skillId: 'telo.kostra',
    level: 4,
    emoji: '🌱',
    title: 'Kosti jsou živé',
    text: 'Kosti mají cévy i nervy, rostou s námi a celý život se v nich tvoří nová kostní hmota. Proto kostem prospívá pohyb a jídlo s vápníkem.',
    fix: {
      before: 'Kosti jsou mrtvé a tvrdé jako kámen.',
      evidence: 'Lékaři na rentgenových snímcích dětí vidí, jak kosti rostou do délky. Pod mikroskopem jsou v kostech vidět živé buňky.',
    },
  },

  // -------------------------------------------------------------------------
  // Zdraví a denní režim
  {
    id: 'telo.zdravi.mydlo',
    skillId: 'telo.zdravi',
    level: 1,
    emoji: '🧼',
    title: 'Proč mýdlo, a ne jen voda',
    text: 'Mýdlo uvolní z kůže mastnotu, špínu i bacily a voda je pak spláchne. Vědci to ověřili: po umytí mýdlem zůstalo na rukou méně bakterií než po opláchnutí samotnou vodou.',
  },
  {
    id: 'telo.zdravi.mozek-ve-spanku',
    skillId: 'telo.zdravi',
    level: 2,
    emoji: '😴',
    title: 'Mozek ve spánku pracuje',
    text: 'Ve spánku mozek nevypíná. Třídí, co se přes den stalo, a ukládá si, co ses {naučila|naučil} – proto si po dobrém spánku víc pamatuješ.',
    fix: {
      before: 'Ve spánku mozek odpočívá a skoro nepracuje.',
      evidence: 'Když vědci začali přístroji měřit mozek spících lidí, zjistili opak. V roce 1953 objevili fázi spánku, ve které se oči rychle pohybují a zdají se nám živé sny.',
    },
  },
  {
    id: 'telo.zdravi.vnitrni-hodiny',
    skillId: 'telo.zdravi',
    level: 4,
    emoji: '⏰',
    title: 'Vnitřní hodiny',
    text: 'Tělo má vnitřní hodiny, které řídí, kdy jsme ospalí a kdy čilí. Nejvíc je seřizuje světlo, a proto pomáhá být ráno venku a večer ztlumit světla i obrazovky.',
  },

  // -------------------------------------------------------------------------
  // Bezpečí a první pomoc
  {
    id: 'telo.bezpeci.reflexni-prvky',
    skillId: 'telo.bezpeci',
    level: 1,
    emoji: '🦺',
    title: 'Za tmy vidět a být vidět',
    text: 'Reflexní prvky vracejí světlo z reflektorů auta zpátky k řidiči, a ten pak chodce za tmy uvidí mnohem dřív. Chodec, který jde za tmy po neosvětlené silnici mimo obec, je musí mít povinně.',
  },
  {
    id: 'telo.bezpeci.prilba',
    skillId: 'telo.bezpeci',
    level: 2,
    emoji: '🚲',
    title: 'Přilba na kolo',
    text: 'V Česku musí mít každý cyklista mladší 18 let při jízdě na hlavě připnutou přilbu. Tak to určuje zákon, protože přilba chrání hlavu při pádu.',
  },
  {
    id: 'telo.bezpeci.brzdna-draha',
    skillId: 'telo.bezpeci',
    level: 3,
    emoji: '🚗',
    title: 'Auto nezastaví hned',
    text: 'Auto jedoucí městem rychlostí 50 km/h ujede od chvíle, kdy řidič uvidí nebezpečí, až do zastavení zhruba 25 až 30 metrů. To jsou asi dva autobusy za sebou, a proto nikdy nevbíhej do silnice – ani za míčem.',
  },

  // -------------------------------------------------------------------------
  // Jak rosteme
  {
    id: 'telo.zivot.prvni-rok',
    skillId: 'telo.zivot',
    level: 3,
    emoji: '👶',
    title: 'Nejrychlejší růst',
    text: 'Nejrychleji roste člověk v prvním roce života: miminko vyroste zhruba o 25 centimetrů. Dětští lékaři to vědí, protože miminka při prohlídkách měří. Kdybys tak rychle {rostla|rostl} pořád, {měřila|měřil} bys dnes přes dva metry.',
  },
  {
    id: 'telo.zivot.schovane-zuby',
    skillId: 'telo.zivot',
    level: 4,
    emoji: '🦷',
    title: 'Zuby schované v čelisti',
    text: 'Mléčných zubů je 20, stálých může být až 32. Stálé zuby rostou schované v čelisti dlouho předtím, než mléčné vypadnou – zubař je uvidí na rentgenu.',
  },
  {
    id: 'telo.zivot.hlas-mamy',
    skillId: 'telo.zivot',
    level: 5,
    emoji: '🤰',
    title: 'Miminko pozná mámin hlas',
    text: 'Miminko slyší už v bříšku, a tak hned po narození pozná mámin hlas. Vědci to ověřili pokusem: novorozenci se naučili sát dudlík tak, aby se jim pustila nahrávka máminého hlasu, a ne hlasu jiné ženy.',
  },

  // -------------------------------------------------------------------------
  // Fakt, nebo pohádka? – jak to víme
  {
    id: 'telo.fakt-pohadka.fonendoskop',
    skillId: 'telo.fakt-pohadka',
    level: 1,
    emoji: '🩺',
    title: 'Fonendoskop z papíru',
    text: 'Přístroj na poslouchání srdce vymyslel francouzský lékař René Laennec v roce 1816. Ten první byl jen stočený papír – a srdce jím bylo slyšet líp než přiloženým uchem.',
  },
  {
    id: 'telo.fakt-pohadka.rentgen',
    skillId: 'telo.fakt-pohadka',
    level: 2,
    emoji: '💍',
    title: 'Paprsky, které vidí kosti',
    text: 'Paprsky, kterými lékaři fotí kosti, objevil v roce 1895 německý fyzik Wilhelm Röntgen. Jeden z prvních snímků ukázal ruku jeho ženy – i s prstenem na prstu.',
  },
  {
    id: 'telo.fakt-pohadka.prvni-bakterie',
    skillId: 'telo.fakt-pohadka',
    level: 3,
    emoji: '🔬',
    title: 'Kdo první uviděl bakterie',
    text: 'Bakterie jako první uviděl Antoni van Leeuwenhoek, obchodník s látkami z Nizozemska. Před víc než 340 lety si sám vyrobil čočku do mikroskopu a bakterie našel v povlaku ze svých zubů.',
  },
];
