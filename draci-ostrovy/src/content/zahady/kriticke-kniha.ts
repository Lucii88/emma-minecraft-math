// Kritické myšlení na Ostrově záhad: karty do Knihy draků a společné mise.
// Motto ostrova: kniha se opravuje podle důkazů – „opravené stránky“ říkají,
// co se dřív tradovalo a jak se přišlo na pravdu.

import type { JointMission, KnowledgeCard } from '../../core/types';

export const kritickeCards: KnowledgeCard[] = [
  // Jak to víme?
  {
    id: 'zahady.jak-to-vime.pet-cest', skillId: 'zahady.jak-to-vime', level: 1, emoji: '🔍',
    title: 'Pět cest k poznání',
    text: 'Věci se dají zjistit pozorováním, měřením, pokusem, otázkou pro odborníka nebo ve spolehlivé knize. „Někdo to říkal“ mezi ně nepatří.',
  },
  {
    id: 'zahady.jak-to-vime.ferovy-pokus', skillId: 'zahady.jak-to-vime', level: 3, emoji: '⚖️',
    title: 'Férový pokus',
    text: 'Při férovém pokusu změníš jen jednu věc a všechno ostatní necháš stejné. Jen tak víš, co způsobilo rozdíl.',
  },
  {
    id: 'zahady.jak-to-vime.opakovani', skillId: 'zahady.jak-to-vime', level: 4, emoji: '🔁',
    title: 'Proč se pokusy opakují',
    text: 'Jeden pokus může dopadnout náhodou. Vědci proto pokusy opakují a nechají je zopakovat i jiné vědce – teprve pak výsledku věří.',
  },
  {
    id: 'zahady.jak-to-vime.dinosauri-peri', skillId: 'zahady.jak-to-vime', level: 4, emoji: '🦖',
    title: 'Dinosauři s peřím',
    text: 'Mnoho dinosaurů mělo peří. I vědci mění názor, když najdou nový důkaz.',
    fix: {
      before: 'Dinosauři měli jen šupiny jako ještěrky.',
      evidence: 'Od roku 1996 vědci v Číně i jinde našli spoustu zkamenělin dinosaurů s otisky peří.',
    },
  },

  // Fakt, nebo názor?
  {
    id: 'zahady.fakt-nazor.rozdil', skillId: 'zahady.fakt-nazor', level: 1, emoji: '🗣️',
    title: 'Fakt, nebo názor?',
    text: 'Fakt se dá ověřit a platí pro každého. Názor říká, co si někdo myslí nebo co se mu líbí – a každý může mít jiný.',
  },
  {
    id: 'zahady.fakt-nazor.slova', skillId: 'zahady.fakt-nazor', level: 2, emoji: '🏷️',
    title: 'Slova, která prozradí názor',
    text: 'Nejlepší, nejkrásnější, nudný, super – taková slova hodnotí. Když je ve větě najdeš, jde nejspíš o názor.',
  },
  {
    id: 'zahady.fakt-nazor.cislo-pocit', skillId: 'zahady.fakt-nazor', level: 4, emoji: '🌡️',
    title: 'Číslo, nebo pocit?',
    text: '„Voda má 24 stupňů“ je fakt, „voda je studená“ je pocit. Otužilec a zimomřivý člověk cítí stejnou vodu úplně jinak.',
  },

  // Mýtus, nebo pravda?
  {
    id: 'zahady.mytus.pstros', skillId: 'zahady.mytus', level: 2, emoji: '🐦',
    title: 'Pštros hlavu neschovává',
    text: 'Když pštrosovi hrozí nebezpečí, utíká, nebo si lehne a přitiskne krk k zemi.',
    fix: {
      before: 'Vyděšený pštros strčí hlavu do písku.',
      evidence: 'Přírodovědci pštrosy dlouho pozorovali. Hlavu skloní až k zemi, když v hnízdě – mělké jamce v písku – obracejí vejce. Z dálky to vypadá, jako by ji schovali.',
    },
  },
  {
    id: 'zahady.mytus.netopyri', skillId: 'zahady.mytus', level: 2, emoji: '🦇',
    title: 'Netopýři vidí',
    text: 'Netopýři nejsou slepí. Vidí a ve tmě se navíc orientují podle ozvěny svého volání.',
    fix: {
      before: 'Netopýři jsou slepí – říká se přece „slepý jako netopýr“.',
      evidence: 'Vědci pokusy zjistili, že netopýři vidí, a přístroji zachytili jejich velmi vysoké volání, které lidské ucho většinou neslyší.',
    },
  },
  {
    id: 'zahady.mytus.komodsky-varan', skillId: 'zahady.mytus', level: 3, emoji: '🦎',
    title: 'Skutečný drak z ostrovů',
    text: 'Komodský varan, kterému se říká i komodský drak, žije na ostrovech v Indonésii. Oheň nechrlí, ale je to největší žijící ještěr na světě.',
  },
  {
    id: 'zahady.mytus.blesk', skillId: 'zahady.mytus', level: 3, emoji: '⚡',
    title: 'Blesk a stejné místo',
    text: 'Blesk klidně uhodí do stejného místa mnohokrát. Do mrakodrapu Empire State Building v New Yorku uhodí v průměru asi pětadvacetkrát za rok.',
    fix: {
      before: 'Blesk nikdy neuhodí dvakrát do stejného místa.',
      evidence: 'Vědci měří údery blesku přístroji a kamerami na vysokých stavbách.',
    },
  },
  {
    id: 'zahady.mytus.zlata-rybka', skillId: 'zahady.mytus', level: 4, emoji: '🐟',
    title: 'Paměť zlaté rybky',
    text: 'Zlatá rybka si pamatuje celé měsíce, ne jen pár vteřin. Naučí se třeba, kdy a kde dostane jídlo.',
    fix: {
      before: 'Zlatá rybka si pamatuje jen pár vteřin.',
      evidence: 'Vědci učili zlaté rybky, že jídlo dostanou u barevného světla nebo když zmáčknou páčku. Co se rybky naučily, si pamatovaly aspoň tři měsíce.',
    },
  },
  {
    id: 'zahady.mytus.pluto', skillId: 'zahady.mytus', level: 5, emoji: '🪐',
    title: 'Pluto je trpasličí planeta',
    text: 'Od roku 2006 řadí astronomové Pluto mezi trpasličí planety. Kniha se opravuje, když přibudou nové objevy.',
    fix: {
      before: 'Pluto je devátá planeta Sluneční soustavy.',
      evidence: 'Astronomové za Neptunem objevili mnoho podobných těles, některá skoro stejně velká jako Pluto. V roce 2006 se proto na sjezdu v Praze dohodli na nových pravidlech.',
    },
  },

  // Reklama
  {
    id: 'zahady.reklama.kdo-plati', skillId: 'zahady.reklama', level: 2, emoji: '📺',
    title: 'Kdo reklamu platí?',
    text: 'Reklamu platí ten, kdo chce něco prodat. U každé reklamy se proto vyplatí zeptat: Kdo ji zaplatil a co po mně chce?',
  },
  {
    id: 'zahady.reklama.hvezdicka', skillId: 'zahady.reklama', level: 3, emoji: '⭐',
    title: 'Pozor na hvězdičku',
    text: 'Když je v reklamě hvězdička, hledej malé písmo. Často v něm stojí to, co by tě od nákupu odradilo.',
  },
  {
    id: 'zahady.reklama.spoluprace', skillId: 'zahady.reklama', level: 4, emoji: '🤝',
    title: 'Placené doporučení',
    text: 'Když slavný člověk něco chválí ve videu, může za to dostávat peníze. Poctivé video má nápis „reklama“ nebo „spolupráce“.',
  },

  // Dračí detektivka
  {
    id: 'zahady.detektiv.jiste-tuseni', skillId: 'zahady.detektiv', level: 2, emoji: '🕵️',
    title: 'Jisté, nebo tušení?',
    text: 'Detektiv odděluje, co ví jistě, od toho, co jen tuší. Mokrá tráva je jistá – že v noci pršelo, je jen tušení.',
  },
  {
    id: 'zahady.detektiv.alibi', skillId: 'zahady.detektiv', level: 4, emoji: '🕰️',
    title: 'Alibi',
    text: 'Alibi je důkaz, že podezřelý byl v tu chvíli jinde. Kdo má alibi, které platí, ten to udělat nemohl.',
  },
  {
    id: 'zahady.detektiv.vic-stop', skillId: 'zahady.detektiv', level: 5, emoji: '🧩',
    title: 'Víc stop dohromady',
    text: 'Jedna stopa často sedí na víc podezřelých. Teprve několik stop dohromady ukáže na jediného.',
  },
];

export const kritickeMissions: JointMission[] = [
  {
    id: 'zahady.detektiv-reklam', island: 'zahady', emoji: '📺', level: 2,
    title: 'Detektivka reklam',
    text: 'Najdi s rodičem tři reklamy – v časopise, na ulici nebo v televizi. U každé zjisti, co po tobě chce a kdo ji asi zaplatil.',
    parentTip: 'Ptejte se společně: Co nám reklama slibuje? Jaký trik používá – známou tvář, spěch, hvězdičku s malým písmem? Chvalte, když si dcera všimne detailu, ne rychlou odpověď. Klidně se spolu zasmějte nejvtipnějšímu triku.',
  },
  {
    id: 'zahady.overeni-mytu', island: 'zahady', emoji: '🧪', level: 1,
    title: 'Ověř tvrzení pokusem',
    text: 'Vyber si jedno tvrzení a ověř ho bezpečným pokusem. Třeba: Plave kostka ledu? Hřeje svetr sám od sebe? Nejdřív si tipni, pak zkoušej.',
    parentTip: 'Nechte dceru nejdřív říct tip a zapsat nebo nakreslit ho. Pokus zopakujte aspoň třikrát. Pak se ptejte: Co jsme čekali a co se stalo? Když tip nevyšel, oslavte to – přesně tak se věda opravuje. Použijte jen bezpečné věci z kuchyně.',
  },
  {
    id: 'zahady.vecere', island: 'zahady', emoji: '🍽️', level: 1,
    title: 'Fakt a názor u večeře',
    text: 'U večeře řekne každý jeden fakt a jeden názor o dnešním dni. Ostatní hádají, co bylo co.',
    parentTip: 'Začněte sami, třeba: „Dnes pršelo“ a „Déšť je otravný“. Ptejte se: Jak bychom fakt ověřili? Může mít někdo jiný názor? Oceňujte zajímavé příklady a nechte dceru nachytat vás na zapeklitých větách.',
  },
  {
    id: 'zahady.tyden-jak-to-vis', island: 'zahady', emoji: '🔎', level: 2,
    title: 'Týden „A jak to víš?“',
    text: 'Celý týden si hrajte na Hádankáře mlžného. Kdo doma něco tvrdí, toho se ostatní mohou zeptat: „A jak to víš?“ Uvidíte, co víte jistě a co jen z doslechu.',
    parentTip: 'Hrajte vlídně a s humorem, otázka nemá nikoho zahanbit. Za dobrou odpověď (viděla jsem, změřila jsem, četla jsem v knize) dejte třeba dračí razítko. Nechte dceru ptát se i vás a přiznejte, když něco víte jen z doslechu.',
  },
];
