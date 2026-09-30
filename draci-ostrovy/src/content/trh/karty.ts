// Karty znalostí Vikingského trhu do Knihy draků. Karty s `fix` jsou
// „opravené stránky“: co se dřív tradovalo a jak se přišlo na pravdu.

import type { KnowledgeCard } from '../../core/types';

export const cards: KnowledgeCard[] = [
  // --- Placení a kontrola ---------------------------------------------------
  {
    id: 'trh.platba.koruna',
    skillId: 'trh.platba',
    level: 1,
    emoji: '💰',
    title: 'Česká koruna',
    text: 'Česká koruna platí od roku 1993, kdy vznikla samostatná Česká republika. Předtím se platilo korunou československou. Zkratka Kč znamená koruna česká.',
  },
  {
    id: 'trh.platba.vodoznak',
    skillId: 'trh.platba',
    level: 2,
    emoji: '🔍',
    title: 'Tajný obrázek v bankovce',
    text: 'Když českou bankovku podržíš proti světlu, uvidíš v ní vodoznak – skrytý portrét. Je to jeden z ochranných prvků, které ztěžují padělání.',
  },
  {
    id: 'trh.platba.prvni-mince',
    skillId: 'trh.platba',
    level: 3,
    emoji: '🏺',
    title: 'První mince',
    text: 'Nejstarší známé mince jsou asi 2 600 let staré. Byly ze směsi zlata a stříbra a razily se v Lýdii a sousedních řeckých městech v dnešním Turecku. Archeologové je našli třeba v základech Artemidina chrámu v Efesu.',
  },
  {
    id: 'trh.platba.papirove-penize',
    skillId: 'trh.platba',
    level: 4,
    emoji: '📜',
    title: 'Papírové peníze z Číny',
    text: 'Papírové peníze se poprvé rozšířily v Číně asi před tisíci lety. Fungovaly, protože jim lidé věřili a vládce zaručoval, že se jimi dá platit. Dnes platíme i penězi, které jsou jen čísla na účtu.',
    fix: {
      before: 'Lidé si dlouho mysleli, že peníze mají hodnotu, jen když jsou ze zlata nebo stříbra.',
      evidence: 'Cestovatel Marco Polo popsal, jak se v Číně platí papírem, a Evropané se tomu divili. Papírové peníze ale fungovaly, dokud jim lidé důvěřovali – rozhoduje důvěra, ne kov.',
    },
  },

  // --- Cena a hodnota ---------------------------------------------------------
  {
    id: 'trh.hodnota.devitky',
    skillId: 'trh.hodnota',
    level: 3,
    emoji: '🏷️',
    title: 'Proč ceny končí devítkou',
    text: 'Oči čtou cenu zleva a první číslice si všimnou nejvíc. Proto 99 Kč působí levněji než 100 Kč, i když je to jen o korunu méně. Vědci to ověřili pokusy s nakupováním.',
  },
  {
    id: 'trh.hodnota.sekane-stribro',
    skillId: 'trh.hodnota',
    level: 3,
    emoji: '⚖️',
    title: 'Stříbro na váhu',
    text: 'Vikingové často platili kousky stříbra, které vážili na malých skládacích vahách. Velký šperk klidně rozsekli. Archeologové takové sekané stříbro i váhy nacházejí v zakopaných pokladech i na místech starých tržišť.',
  },
  {
    id: 'trh.hodnota.naslepo',
    skillId: 'trh.hodnota',
    level: 4,
    emoji: '🥤',
    title: 'Dražší není vždycky lepší',
    text: 'Při ochutnávkách naslepo lidé nevidí obal ani cenu. Levnější výrobek pak často chutná stejně dobře jako dražší, a někdy dokonce vyhraje.',
    fix: {
      before: 'Co je dražší, to je vždycky lepší.',
      evidence: 'Vědci i spotřebitelské časopisy pořádají ochutnávky a testy naslepo. Dražší výrobek v nich často nevyhraje.',
    },
  },
  {
    id: 'trh.hodnota.voda-diamanty',
    skillId: 'trh.hodnota',
    level: 6,
    emoji: '💎',
    title: 'Paradox vody a diamantů',
    text: 'Voda je k životu nezbytná, a přesto bývá levná. Diamanty nepotřebujeme, a jsou drahé. Už před 250 lety o tom psal skotský myslitel Adam Smith: cena záleží i na tom, jak je věc vzácná.',
  },

  // --- Potřeby a přání --------------------------------------------------------
  {
    id: 'trh.potreby.potreby-prani',
    skillId: 'trh.potreby',
    level: 1,
    emoji: '🏠',
    title: 'Potřeby a přání',
    text: 'Potřeby jsou věci, bez kterých se nedá dobře žít: jídlo, voda, teplé oblečení nebo domov. Přání nám udělají radost. Proto je rozumné platit nejdřív potřeby a potom přání.',
  },
  {
    id: 'trh.potreby.bonbon',
    skillId: 'trh.potreby',
    level: 3,
    emoji: '🍬',
    title: 'Pokus s bonbonem',
    text: 'Při známém pokusu dostaly děti na výběr: jeden bonbon hned, nebo dva, když chvíli počkají. Čekání si usnadňovaly chytrými triky – zpívaly si nebo si zakrývaly oči.',
    fix: {
      before: 'Kdo nedokáže počkat na odměnu, nemá dost vůle.',
      evidence: 'Vědci zjistili, že děti čekaly mnohem déle, když jim dospělý předtím splnil slib. Čekání hodně záleží i na důvěře.',
    },
  },
  {
    id: 'trh.potreby.reklama',
    skillId: 'trh.potreby',
    level: 4,
    emoji: '📺',
    title: 'Reklama budí přání',
    text: 'Reklamy platí firmy, aby v nás vzbudily přání něco mít. Proto ukazují jen to nejlepší. Než si něco koupíš, zeptej se {sama|sám} sebe, jestli to potřebuješ, nebo to jen chceš.',
  },

  // --- Spoření na cíl --------------------------------------------------------
  {
    id: 'trh.sporeni.pokladnicky',
    skillId: 'trh.sporeni',
    level: 2,
    emoji: '🐷',
    title: 'Pokladničky ze starověku',
    text: 'Pokladničky s úzkou štěrbinou na mince znali lidé už ve starověku. Archeologové našli hliněné pokladničky staré přes dva tisíce let.',
  },
  {
    id: 'trh.sporeni.sporitelna',
    skillId: 'trh.sporeni',
    level: 3,
    emoji: '🏛️',
    title: 'První spořitelna v Čechách',
    text: 'První spořitelna v Čechách vznikla v Praze v roce 1825. Měla pomoct, aby i lidé s malými příjmy mohli bezpečně ukládat úspory.',
  },
  {
    id: 'trh.sporeni.pojistene',
    skillId: 'trh.sporeni',
    level: 5,
    emoji: '🏦',
    title: 'Pojištěné úspory',
    text: 'Vklady v bankách jsou v Česku ze zákona pojištěné. Kdyby banka zkrachovala, každý dostane své úspory zpátky až do částky 100 000 eur, což je přes dva miliony korun.',
  },
  {
    id: 'trh.sporeni.urok-z-uroku',
    skillId: 'trh.sporeni',
    level: 6,
    emoji: '📈',
    title: 'Úrok z úroku',
    text: 'Když necháš úrok na účtu, příští rok banka počítá úrok i z něj. Proto úspory rostou čím dál rychleji a vyplatí se začít šetřit brzy.',
  },

  // --- Práce a výdělek -------------------------------------------------------
  {
    id: 'trh.prace.kovar',
    skillId: 'trh.prace',
    level: 1,
    emoji: '🔨',
    title: 'Vikingský kovář',
    text: 'Kovář byl u Vikingů velmi důležitý: vyráběl nástroje, zámky, klíče i železné nýty, které držely pohromadě prkna lodí. Na ostrově Gotland vyoral jeden zemědělec v roce 1936 celou truhlu vikingského nářadí.',
  },
  {
    id: 'trh.prace.dobrovolni-hasici',
    skillId: 'trh.prace',
    level: 2,
    emoji: '🚒',
    title: 'Dobrovolní hasiči',
    text: 'V Česku je spousta sborů dobrovolných hasičů. Většina jejich členů chodí do jiné práce, a přesto pomáhají při požárech a povodních a vedou kroužky pro děti.',
  },
  {
    id: 'trh.prace.prace-doma',
    skillId: 'trh.prace',
    level: 3,
    emoji: '🧺',
    title: 'Práce, za kterou se neplatí',
    text: 'Vaření, úklid, praní a péče o děti zaberou spoustu času. Když je dělá rodina, nikdo za ně neplatí, a přesto má tahle práce obrovskou hodnotu.',
    fix: {
      before: 'Práce se počítá, jen když se za ni platí.',
      evidence: 'Statistici v mnoha zemích měří, kolik času lidé práci doma věnují. Kdyby se za ni platilo, šlo by o obrovské peníze.',
    },
  },
  {
    id: 'trh.prace.dane',
    skillId: 'trh.prace',
    level: 5,
    emoji: '🏫',
    title: 'Společná pokladna',
    text: 'Z daní se platí třeba školy, silnice, hasiči i policie. Kousek daně zaplatíš i ty, když si v obchodě koupíš zmrzlinu – bývá schovaný v její ceně.',
  },

  // --- Peníze na kartě a v mobilu -------------------------------------------
  {
    id: 'trh.digitalni.karta',
    skillId: 'trh.digitalni',
    level: 2,
    emoji: '💳',
    title: 'Peníze na kartě jsou skutečné',
    text: 'Karta je jako klíč k penězům na účtu. Když s ní zaplatíš, peníze z účtu opravdu ubudou – stejně jako z peněženky.',
    fix: {
      before: 'Placení kartou není placení opravdovými penězi.',
      evidence: 'Na výpisu z účtu je vidět každá platba kartou i to, o kolik peněz na účtu ubylo.',
    },
  },
  {
    id: 'trh.digitalni.pin',
    skillId: 'trh.digitalni',
    level: 2,
    emoji: '🔢',
    title: 'PIN je tajemství',
    text: 'PIN má znát jen majitel karty. Banka se na něj nikdy neptá – ani telefonem, ani zprávou. Když ho po tobě někdo takhle chce, jde o podvod.',
  },
  {
    id: 'trh.digitalni.pipnuti',
    skillId: 'trh.digitalni',
    level: 3,
    emoji: '📶',
    title: 'Karta, která pípá',
    text: 'Bezkontaktní karta si s terminálem povídá rádiovými vlnami, ale jen na vzdálenost pár centimetrů. Proto ji musíš k terminálu přiložit.',
  },
  {
    id: 'trh.digitalni.hra-zdarma',
    skillId: 'trh.digitalni',
    level: 3,
    emoji: '🎮',
    title: 'Hra zdarma, která vydělává',
    text: 'Mnoho her zdarma vydělává na nákupech ve hře a na reklamách. Proto tě lákají k nákupu drahokamů a kostýmů za skutečné peníze.',
    fix: {
      before: 'Hra zdarma nic nestojí.',
      evidence: 'V obchodech s aplikacemi bývá u takových her napsané, že nabízejí nákupy v aplikaci.',
    },
  },

  // --- Rozpočet ---------------------------------------------------------------
  {
    id: 'trh.rozpocet.destivy-den',
    skillId: 'trh.rozpocet',
    level: 3,
    emoji: '☂️',
    title: 'Peníze na deštivý den',
    text: 'Rezerva jsou peníze schované pro případ, že se stane něco nečekaného. V angličtině se jim říká peníze na deštivý den.',
  },
  {
    id: 'trh.rozpocet.nejstarsi-zapisy',
    skillId: 'trh.rozpocet',
    level: 4,
    emoji: '✍️',
    title: 'Nejstarší zápisy',
    text: 'Nejstarší písemné záznamy z Mezopotámie, staré přes 5 000 let, jsou hlavně seznamy: kolik obilí, ovcí nebo látek kdo odevzdal nebo dostal. Počítání majetku patří k nejstarším důvodům, proč lidé začali psát.',
  },
  {
    id: 'trh.rozpocet.stat',
    skillId: 'trh.rozpocet',
    level: 5,
    emoji: '📊',
    title: 'Rozpočet státu',
    text: 'I stát má rozpočet: plánuje příjmy, hlavně z daní a pojištění, a výdaje třeba na důchody, školy nebo silnice. Každý rok ho schvaluje Poslanecká sněmovna jako zákon.',
  },
];
