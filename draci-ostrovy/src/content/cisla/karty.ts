// Karty znalostí Ostrova čísel. Karta se odemkne, když hráčka v dovednosti
// dosáhne uvedené úrovně. Karty s `fix` jsou „opravené stránky“ – co se dřív
// tradovalo a jak se přišlo na pravdu. U Hejného prostředí (autobus, hadi,
// trojúhelníky) karty prozrazují zajímavé vlastnosti samotných úloh.

import type { KnowledgeCard } from '../../core/types';

export const cards: KnowledgeCard[] = [
  // -------------------------------------------------------------------------
  // Sčítání a odčítání
  {
    id: 'cisla.scitani.plus-minus',
    skillId: 'cisla.scitani',
    level: 2,
    emoji: '➕',
    title: 'Odkud se vzalo plus a minus',
    text: 'Znaménka + a − se v tištěné knize poprvé objevila v roce 1489, v německé početnici pro obchodníky. Předtím lidé místo nich psali slova nebo zkratky.',
  },
  {
    id: 'cisla.scitani.gauss',
    skillId: 'cisla.scitani',
    level: 4,
    emoji: '💯',
    title: 'Součet od 1 do 100 za chvilku',
    text: 'Vypráví se, že malý Carl Friedrich Gauss dostal ve škole za úkol sečíst čísla od 1 do 100 a měl hotovo za chvilku. Všiml si, že 1 + 100, 2 + 99 i 3 + 98 dávají pokaždé 101 – a padesát takových dvojic je dohromady 5050.',
  },

  // -------------------------------------------------------------------------
  // Násobení a dělení
  {
    id: 'cisla.nasobeni.krizek-tecka',
    skillId: 'cisla.nasobeni',
    level: 3,
    emoji: '✖️',
    title: 'Křížek, nebo tečka?',
    text: 'Křížek × pro násobení proslavil v roce 1631 anglický matematik William Oughtred. Německý učenec Gottfried Wilhelm Leibniz ale raději psal tečku, protože se mu křížek pletl s písmenem x. Tečku píšeme i v českých školách.',
  },
  {
    id: 'cisla.nasobeni.egyptske-nasobeni',
    skillId: 'cisla.nasobeni',
    level: 5,
    emoji: '🏺',
    title: 'Násobení zdvojováním',
    text: 'Staří Egypťané násobili zdvojováním – víme to z papyrů starých přes 3500 let. Třeba u 13 × 7 by zdvojovali sedmičku: 7, 14, 28, 56. Protože 13 = 1 + 4 + 8, sečetli by 7 + 28 + 56 a vyšlo by 91.',
  },

  // -------------------------------------------------------------------------
  // Čísla a číselná osa
  {
    id: 'cisla.cisla.indicke-cislice',
    skillId: 'cisla.cisla',
    level: 1,
    emoji: '🔢',
    title: 'Číslice z Indie',
    text: 'Číslice 0 až 9, kterými píšeme, vznikly v Indii. Do Evropy se dostaly přes arabský svět, a proto jim říkáme arabské číslice.',
  },
  {
    id: 'cisla.cisla.nula',
    skillId: 'cisla.cisla',
    level: 2,
    emoji: '0️⃣',
    title: 'Nula je taky číslo',
    text: 'Nula je číslo jako každé jiné: na číselné ose stojí před jedničkou a dá se s ní počítat, třeba 7 + 0 = 7 nebo 7 − 7 = 0. A je dokonce sudá.',
    fix: {
      before: 'Nula není číslo, je to přece nic.',
      evidence: 'Indický matematik Brahmagupta sepsal už v roce 628 pravidla, jak s nulou sčítat a odčítat. Do Evropy nula dorazila mnohem později, spolu s indickými číslicemi.',
    },
  },
  {
    id: 'cisla.cisla.milion-sekund',
    skillId: 'cisla.cisla',
    level: 4,
    emoji: '⏱️',
    title: 'Milion, nebo miliarda?',
    text: 'Milion sekund uběhne asi za 11 a půl dne. Miliarda sekund ale trvá skoro 32 let! Tak obrovský rozdíl je mezi milionem a miliardou.',
  },
  {
    id: 'cisla.cisla.zaporna-cisla',
    skillId: 'cisla.cisla',
    level: 5,
    emoji: '🌡️',
    title: 'Méně než nic',
    text: 'Záporná čísla potkáš na teploměru: −5 °C je o pět stupňů méně než nula. Čínští počtáři s nimi počítali už asi před 2000 lety – kladná čísla značili červenými tyčinkami a záporná černými.',
    fix: {
      before: 'Méně než nic být nemůže, takže záporná čísla jsou nesmysl.',
      evidence: 'Ještě před několika sty lety jim někteří evropští matematici říkali nesmyslná čísla. Ukázalo se ale, že se s nimi dá spolehlivě počítat a že dobře popisují třeba mráz nebo dluh.',
    },
  },

  // -------------------------------------------------------------------------
  // Slovní úlohy
  {
    id: 'cisla.slovni.slovo-vic',
    skillId: 'cisla.slovni',
    level: 2,
    emoji: '🍎',
    title: 'Slovo „víc“ může klamat',
    text: 'Ingrid má 8 jablek, o 3 víc než Leif. Kolik jablek má Leif? Správně je 5 – i když je v úloze slovo „víc“, tady se odčítá.',
    fix: {
      before: 'Když je v úloze slovo „víc“, sčítá se.',
      evidence: 'Stačí jediný protipříklad a pravidlo padá. Místo hledání slovíček pomáhá si úlohu nakreslit a zeptat se: Kdo má víc a kdo méně?',
    },
  },
  {
    id: 'cisla.slovni.vlk-koza-zeli',
    skillId: 'cisla.slovni',
    level: 4,
    emoji: '⛵',
    title: 'Vlk, koza a zelí',
    text: 'Úloha o převozníkovi, který má přes řeku převézt vlka, kozu a zelí, je stará přes 1200 let. Najdeš ji ve sbírce úloh pro bystření mladých, která se připisuje učenci Alkuinovi z Yorku.',
  },

  // -------------------------------------------------------------------------
  // Díly a zlomky
  {
    id: 'cisla.zlomky.noty',
    skillId: 'cisla.zlomky',
    level: 3,
    emoji: '🎵',
    title: 'Zlomky v hudbě',
    text: 'Hudebníci počítají se zlomky. Půlová nota trvá polovinu celé noty a čtvrťová čtvrtinu, takže dvě čtvrťové zní stejně dlouho jako jedna půlová.',
  },
  {
    id: 'cisla.zlomky.egyptske-zlomky',
    skillId: 'cisla.zlomky',
    level: 4,
    emoji: '🍞',
    title: 'Egyptské zlomky',
    text: 'Staří Egypťané zapisovali zlomky většinou jako součty zlomků s jedničkou nahoře. Když se dělí 5 chlebů mezi 8 lidí, dostane každý 1/2 + 1/8 chleba – a to je dohromady 5/8.',
  },

  // -------------------------------------------------------------------------
  // Hodiny a čas
  {
    id: 'cisla.cas.sedesat-minut',
    skillId: 'cisla.cas',
    level: 2,
    emoji: '🕛',
    title: 'Proč má hodina 60 minut',
    text: 'Počítání po šedesáti má kořeny u starých Babyloňanů. Šedesátka se dá beze zbytku dělit 2, 3, 4, 5, 6, 10, 12, 15, 20 i 30, a proto jde hodina snadno rozdělit na poloviny, třetiny i čtvrtiny.',
  },
  {
    id: 'cisla.cas.rimske-cislice',
    skillId: 'cisla.cas',
    level: 3,
    emoji: '🏛️',
    title: 'IIII na ciferníku',
    text: 'Na mnoha hodinách s římskými číslicemi je čtyřka zapsaná jako IIII, i když se ve škole učíme IV. Římské číslice ale nemají žádný znak pro nulu.',
  },
  {
    id: 'cisla.cas.orloj',
    skillId: 'cisla.cas',
    level: 4,
    emoji: '🕰️',
    title: 'Pražský orloj',
    text: 'Pražský orloj ukazuje čas už od roku 1410 a je to nejstarší orloj na světě, který pořád funguje. Ukazuje i staročeský čas, ve kterém se hodiny počítaly od západu slunce.',
  },

  // -------------------------------------------------------------------------
  // Peníze a placení
  {
    id: 'cisla.penize.prvni-mince',
    skillId: 'cisla.penize',
    level: 2,
    emoji: '💰',
    title: 'První mince',
    text: 'První mince vznikly asi před 2600 lety v Lýdii, na území dnešního Turecka. Byly z přírodní směsi zlata a stříbra a archeologové je nacházejí dodnes.',
  },
  {
    id: 'cisla.penize.tolar',
    skillId: 'cisla.penize',
    level: 3,
    emoji: '💵',
    title: 'Dolar má jméno z Čech',
    text: 'Slovo dolar pochází z českého Jáchymova. Stříbrné mince, které se tam začaly razit před víc než 500 lety, se jmenovaly jáchymovské tolary – a z tolaru se časem stal dolar.',
  },

  // -------------------------------------------------------------------------
  // Dračí autobus
  {
    id: 'cisla.autobus.zkratka',
    skillId: 'cisla.autobus',
    level: 2,
    emoji: '🐉',
    title: 'Zkratka pro dračí autobus',
    text: 'Nemusíš počítat ostrov po ostrově. K počtu Vikingů na začátku přičti všechny, kdo nastoupili, odečti všechny, kdo vystoupili – a vyjde to stejně.',
  },
  {
    id: 'cisla.autobus.pozpatku',
    skillId: 'cisla.autobus',
    level: 3,
    emoji: '⏪',
    title: 'Autobus pozpátku',
    text: 'Když víš, kolik Vikingů sedí na drakovi na konci, pusť si cestu pozpátku jako film. Kdo nastoupil, zase vystoupí, a kdo vystoupil, zase nastoupí – tak zjistíš, kolik jich letělo na začátku.',
  },

  // -------------------------------------------------------------------------
  // Početní hadi
  {
    id: 'cisla.hadi.opacne-kroky',
    skillId: 'cisla.hadi',
    level: 3,
    emoji: '🐍',
    title: 'Had se dá projít pozpátku',
    text: 'Každý krok hada se dá vrátit: krok +5 vrátíš krokem −5 a krok −3 krokem +3. Proto můžeš hada projít i od ocasu k hlavě – stačí dělat opačné kroky.',
  },
  {
    id: 'cisla.hadi.na-poradi-nezalezi',
    skillId: 'cisla.hadi',
    level: 4,
    emoji: '🔀',
    title: 'Na pořadí nezáleží',
    text: 'Když had jen přičítá a odčítá, na pořadí kroků nezáleží: +3, −5, +7 skončí stejně jako +7, +3, −5. Celkem je to totiž +5.',
  },

  // -------------------------------------------------------------------------
  // Součtové trojúhelníky
  {
    id: 'cisla.trojuhelniky.sudy-soucet',
    skillId: 'cisla.trojuhelniky',
    level: 4,
    emoji: '🔺',
    title: 'Součet stran je vždycky sudý',
    text: 'Sečti všechna tři čísla na stranách součtového trojúhelníku. Vyjde dvojnásobek součtu vrcholů, protože každý vrchol se započítá dvakrát – a proto je výsledek vždycky sudý.',
  },
  {
    id: 'cisla.trojuhelniky.necela-cisla',
    skillId: 'cisla.trojuhelniky',
    level: 6,
    emoji: '🧩',
    title: 'Když součet stran vyjde lichý',
    text: 'Kdyby měl trojúhelník na stranách čísla 2, 3 a 4, jejich součet 9 by byl lichý. Vrcholy by pak nevyšly celé: musela by v nich být čísla 0,5; 1,5 a 2,5.',
  },

  // -------------------------------------------------------------------------
  // Číselné řady
  {
    id: 'cisla.rady.sachovnice',
    skillId: 'cisla.rady',
    level: 2,
    emoji: '♟️',
    title: 'Rýže na šachovnici',
    text: 'Podle staré pověsti chtěl vynálezce šachů odměnu: na první políčko jedno zrnko rýže, na druhé dvě, na třetí čtyři a na každé další dvakrát víc. Na všech 64 políček by nestačila rýže, kterou lidé sklidí za stovky let.',
  },
  {
    id: 'cisla.rady.fibonacci',
    skillId: 'cisla.rady',
    level: 5,
    emoji: '🐇',
    title: 'Králíci pana Fibonacciho',
    text: 'Řadu 1, 1, 2, 3, 5, 8, 13… popsal v roce 1202 Leonardo Fibonacci v úloze o množení králíků. Každé další číslo je součtem dvou předchozích a stejná čísla často najdeš i ve spirálách šišek nebo slunečnic.',
  },

  // -------------------------------------------------------------------------
  // Kouzelné váhy
  {
    id: 'cisla.vahy.rovnitko',
    skillId: 'cisla.vahy',
    level: 3,
    emoji: '⚖️',
    title: 'Kdo vymyslel rovnítko',
    text: 'Rovnítko vymyslel velšský matematik Robert Recorde v roce 1557. Vybral dvě stejně dlouhé rovnoběžné čárky, protože podle něj nemůže být nic rovnějšího.',
  },
  {
    id: 'cisla.vahy.algebra',
    skillId: 'cisla.vahy',
    level: 6,
    emoji: '📚',
    title: 'Odkud je slovo algebra',
    text: 'Slovo algebra pochází z názvu knihy perského učence al-Chwárizmího, která vznikla asi před 1200 lety. Rovnice v ní vyrovnával jako váhy: na obě strany přidal nebo z obou ubral totéž. Z jeho jména vzniklo i slovo algoritmus.',
  },

  // -------------------------------------------------------------------------
  // Magické čtverce
  {
    id: 'cisla.ctverce.petka-uprostred',
    skillId: 'cisla.ctverce',
    level: 4,
    emoji: '✨',
    title: 'Pětka uprostřed',
    text: 'V magickém čtverci 3 × 3 s čísly 1 až 9 je uprostřed vždycky pětka a každý řádek, sloupec i úhlopříčka dává 15.',
  },
  {
    id: 'cisla.ctverce.jediny-ctverec',
    skillId: 'cisla.ctverce',
    level: 6,
    emoji: '🐢',
    title: 'Jediný čtverec a želva',
    text: 'Magický čtverec 3 × 3 s čísly 1 až 9 existuje v podstatě jen jeden: všech jeho 8 podob vznikne otáčením a převracením. Podle čínské pověsti ho lidé poprvé uviděli na krunýři želvy z řeky Luo.',
  },
];
