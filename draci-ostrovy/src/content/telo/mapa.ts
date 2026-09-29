// Kde to v těle je? – klepání na mapu těla (části těla zvenku, orgány uvnitř)
// a poznávání zvýrazněných míst.

import type { BodyRegion, Level } from '../../core/types';
import { BODY_REGIONS } from '../../core/types';
import { bankSkill, regionOption, type ChoiceQ, type Spec, type TapQ } from './common';

const ID = 'telo.mapa';

type Outside = keyof (typeof BODY_REGIONS)['outside'];
type Inside = keyof (typeof BODY_REGIONS)['inside'];

interface RegionInfo {
  /** „Tohle je koleno.“ / „Tohle jsou plíce.“ */
  sentence: string;
  about: string;
  hints: [string, string];
  /** Krátká funkce pro L4 („Srdce – pumpuje krev“). */
  job?: string;
}

const OUT: Record<Outside, RegionInfo> = {
  hlava: {
    sentence: 'Tohle je hlava.',
    about: 'Jsou na ní oči, uši, nos a pusa a uvnitř je schovaný mozek.',
    hints: ['Je to úplně nahoře.', 'Jsou na tom oči, uši a nos.'],
  },
  krk: {
    sentence: 'Tohle je krk.',
    about: 'Spojuje hlavu s tělem a díky němu můžeš otáčet hlavou.',
    hints: ['Je to mezi hlavou a hrudníkem.', 'Když je zima, uvazuješ si na to šálu.'],
  },
  hrudnik: {
    sentence: 'Tohle je hrudník.',
    about: 'Chrání ho žebra a uvnitř jsou srdce a plíce.',
    hints: ['Je to pod krkem.', 'Uvnitř tluče srdce.'],
  },
  bricho: {
    sentence: 'Tohle je břicho.',
    about: 'Uvnitř jsou třeba žaludek a střeva.',
    hints: ['Je to uprostřed těla, pod hrudníkem.', 'Je na tom pupík.'],
  },
  paze: {
    sentence: 'Tohle je paže.',
    about: 'Je to horní část ruky mezi ramenem a loktem.',
    hints: ['Je to část ruky.', 'Je to mezi ramenem a loktem.'],
  },
  loket: {
    sentence: 'Tohle je loket.',
    about: 'Je to kloub uprostřed ruky, díky kterému můžeš ruku ohnout.',
    hints: ['Je to na ruce.', 'Tady se ruka ohýbá.'],
  },
  dlan: {
    sentence: 'Tohle je dlaň.',
    about: 'Je to vnitřní strana ruky. Držíš v ní věci a tleskáš s ní.',
    hints: ['Je to na konci ruky.', 'Tím tleskáš.'],
  },
  koleno: {
    sentence: 'Tohle je koleno.',
    about: 'Je to kloub uprostřed nohy, díky kterému můžeš nohu ohnout.',
    hints: ['Je to na noze.', 'Tady se noha ohýbá.'],
  },
  noha: {
    sentence: 'Tohle je noha.',
    about: 'Nohy nás nesou – díky nim chodíme, běháme a skáčeme.',
    hints: ['Je to dole na těle.', 'Díky tomu chodíš a běháš.'],
  },
  chodidlo: {
    sentence: 'Tohle je chodidlo.',
    about: 'Je to spodní část nohy, na které stojíme.',
    hints: ['Je to úplně dole.', 'Stojíš na tom.'],
  },
};

const IN: Record<Inside, RegionInfo> = {
  mozek: {
    sentence: 'Tohle je mozek.',
    about: 'Je v hlavě, chrání ho lebka a řídí celé tělo.',
    hints: ['Je to v hlavě.', 'Tím přemýšlíš.'],
    job: 'Mozek – řídí celé tělo',
  },
  srdce: {
    sentence: 'Tohle je srdce.',
    about: 'Je v hrudníku mezi plícemi a pumpuje krev do celého těla.',
    hints: ['Je to v hrudníku.', 'Pořád to tluče.'],
    job: 'Srdce – pumpuje krev',
  },
  plice: {
    sentence: 'Tohle jsou plíce.',
    about: 'Jsou v hrudníku po obou stranách srdce a dýcháme jimi.',
    hints: ['Je to v hrudníku.', 'Při nádechu se to naplní vzduchem.'],
    job: 'Plíce – dostávají do krve kyslík',
  },
  zaludek: {
    sentence: 'Tohle je žaludek.',
    about: 'Je nahoře v břiše a míchá spolknuté jídlo s trávicími šťávami.',
    hints: ['Je to v břiše.', 'Sem doputuje spolknuté jídlo.'],
    job: 'Žaludek – míchá jídlo se šťávami',
  },
  jatra: {
    sentence: 'Tohle jsou játra.',
    about: 'Jsou nahoře v břiše pod plícemi. Zpracovávají živiny a vyrábějí žluč.',
    hints: ['Je to nahoře v břiše.', 'Je to největší orgán v břiše.'],
    job: 'Játra – vyrábějí žluč',
  },
  streva: {
    sentence: 'Tohle jsou střeva.',
    about: 'Jsou dlouhá a stočená v břiše. Z jídla v nich přecházejí živiny do krve.',
    hints: ['Je to v břiše.', 'Je to dlouhé a stočené.'],
    job: 'Střeva – vstřebávají živiny',
  },
  ledviny: {
    sentence: 'Tohle jsou ledviny.',
    about: 'Jsou dvě, vzadu v břiše. Čistí krev a vyrábějí moč.',
    hints: ['Jsou dvě, vzadu v břiše u páteře.', 'Mají tvar fazole.'],
    job: 'Ledviny – vyrábějí moč',
  },
  mechyr: {
    sentence: 'Tohle je močový měchýř.',
    about: 'Je dole v břiše a hromadí se v něm moč.',
    hints: ['Je to úplně dole v břiše.', 'Když je to plné, chce se ti na záchod.'],
    job: 'Močový měchýř – uchovává moč',
  },
};

const OUTSIDE_KEYS = Object.keys(OUT) as Outside[];
const INSIDE_KEYS = Object.keys(IN) as Inside[];
const MAIN_ORGANS: Inside[] = ['mozek', 'srdce', 'plice', 'zaludek'];

function tap(
  key: string,
  mode: 'outside' | 'inside',
  region: BodyRegion,
  prompt: string,
  hints: string[],
  explain: string,
): TapQ {
  return { kind: 'tap', key, mode, region, prompt, hints, explain };
}

/** „Co je zvýrazněné?“ – výběr z názvů oblastí. */
function highlight(mode: 'outside' | 'inside', region: BodyRegion, pool: BodyRegion[]): ChoiceQ {
  const info = mode === 'outside' ? OUT[region as Outside] : IN[region as Inside];
  return {
    key: `zvyraznene-${region}`,
    prompt: 'Co je na obrázku zvýrazněné?',
    visual: { type: 'body', mode, highlight: region },
    correct: regionOption(region),
    wrong: pool.filter((r) => r !== region).map(regionOption),
    hints: [...info.hints],
    explain: `${info.sentence} ${info.about}`,
  };
}

/** L4: zvýrazněný orgán a jeho práce. */
function highlightJob(region: Inside): ChoiceQ {
  const info = IN[region];
  return {
    key: `zvyraznene-prace-${region}`,
    prompt: 'Co je na obrázku zvýrazněné a k čemu to slouží?',
    visual: { type: 'body', mode: 'inside', highlight: region },
    correct: info.job!,
    wrong: INSIDE_KEYS.filter((r) => r !== region).map((r) => IN[r].job!),
    hints: ['Nejdřív poznej, který orgán je zvýrazněný.', info.hints[0]],
    explain: `${info.sentence} ${info.about}`,
  };
}

// ---------------------------------------------------------------------------
// L1 – části těla zvenku

const L1: Spec[] = [
  tap('klepni-hlava', 'outside', 'hlava', 'Klepni na hlavu.', ['Je úplně nahoře.', 'Máš na ní oči, uši a nos.'],
    'Hlava je nahoře na těle. Jsou na ní oči, uši, nos a pusa a uvnitř je schovaný mozek.'),
  tap('klepni-krk', 'outside', 'krk', 'Klepni na krk.', ['Hledej mezi hlavou a zbytkem těla.', 'Když je zima, uvazuješ si na něj šálu.'],
    'Krk spojuje hlavu s tělem. Díky němu můžeš otáčet hlavou.'),
  tap('klepni-hrudnik', 'outside', 'hrudnik', 'Klepni na hrudník.', ['Je na přední straně těla, pod krkem.', 'Uvnitř něj tluče srdce.'],
    'Hrudník je pod krkem. Chrání ho žebra a uvnitř jsou srdce a plíce.'),
  tap('klepni-bricho', 'outside', 'bricho', 'Klepni na břicho.', ['Je pod hrudníkem.', 'Najdeš na něm pupík.'],
    'Břicho je pod hrudníkem. Uvnitř jsou třeba žaludek a střeva.'),
  tap('klepni-paze', 'outside', 'paze', 'Klepni na paži.', ['Paže je část ruky.', 'Je mezi ramenem a loktem.'],
    'Paže je horní část ruky mezi ramenem a loktem. Jsou v ní silné svaly.'),
  tap('klepni-loket', 'outside', 'loket', 'Klepni na loket.', ['Loket je na ruce.', 'Je to místo, kde se ruka ohýbá napůl.'],
    'Loket je kloub uprostřed ruky. Díky němu můžeš ruku ohnout.'),
  tap('klepni-dlan', 'outside', 'dlan', 'Klepni na dlaň.', ['Dlaň je na konci ruky.', 'Je to vnitřní strana ruky.'],
    'Dlaň je vnitřní strana ruky. Držíš v ní věci a tleskáš s ní.'),
  tap('klepni-koleno', 'outside', 'koleno', 'Klepni na koleno.', ['Koleno je na noze.', 'Je to kloub v polovině nohy.'],
    'Koleno je kloub uprostřed nohy. Díky němu můžeš nohu ohnout, sednout si nebo kleknout.'),
  tap('klepni-noha', 'outside', 'noha', 'Klepni na nohu – třeba na stehno nebo lýtko.', ['Nohy jsou dole, pod břichem.', 'Hledej nad kolenem nebo pod kolenem.'],
    'Nohy nás nesou. Díky nim chodíme, běháme a skáčeme.'),
  tap('klepni-chodidlo', 'outside', 'chodidlo', 'Klepni na chodidlo.', ['Chodidlo je úplně dole.', 'Stojíš na něm.'],
    'Chodidlo je spodní část nohy. Stojíme na něm a chodíme po něm.'),

  tap('hadanka-cepice', 'outside', 'hlava', 'Kam si nasazuješ čepici? Klepni na to místo.', ['Je to úplně nahoře na těle.'],
    'Čepici nosíme na hlavě. V zimě hřeje a v létě chrání před sluncem.'),
  tap('hadanka-oci', 'outside', 'hlava', 'Kde máš oči, uši a nos? Klepni na tu část těla.', ['Je to nahoře.'],
    'Oči, uši i nos jsou na hlavě. Díky nim vidíme, slyšíme a cítíme vůně.'),
  tap('hadanka-sala', 'outside', 'krk', 'Kam si uvazuješ šálu, když je zima? Klepni na to místo.', ['Je to hned pod hlavou.'],
    'Šálu si uvazujeme kolem krku, aby nám nebyla zima.'),
  tap('hadanka-otaceni', 'outside', 'krk', 'Co ti pomáhá otočit hlavu doleva a doprava? Klepni na to.', ['Je to hned pod hlavou.'],
    'Hlavou otáčíme díky krku. V krku je sedm malých kostí – krčních obratlů.'),
  tap('hadanka-srdce', 'outside', 'hrudnik', 'Kde cítíš, jak ti tluče srdce? Klepni na to místo.', ['Je to na přední straně těla, pod krkem.', 'Chrání to žebra.'],
    'Srdce tluče v hrudníku, uprostřed a trochu vlevo. Když si tam položíš ruku, můžeš ho cítit.'),
  tap('hadanka-pupik', 'outside', 'bricho', 'Kde máš pupík? Klepni na to místo.', ['Je to pod hrudníkem.'],
    'Pupík máme uprostřed břicha.'),
  tap('hadanka-kruceni', 'outside', 'bricho', 'Kde ti kručí, když máš hlad? Klepni na to místo.', ['Je to pod hrudníkem.'],
    'Kručí nám v břiše. To žaludek a střeva posouvají vzduch a šťávy.'),
  tap('hadanka-rukavky', 'outside', 'paze', 'Kam si navlékají nafukovací rukávky děti, které se učí plavat? Klepni na to místo.', ['Je to na ruce.', 'Je to nad loktem.'],
    'Rukávky se navlékají na paže – mezi rameno a loket.'),
  tap('hadanka-kychani', 'outside', 'loket', 'Kam kýchneš, když nemáš kapesník? Klepni na to místo.', ['Je to na ruce.', 'Je to místo, kde se ruka ohýbá.'],
    'Když nemáš kapesník, kýchni do lokte. Bacily pak nezůstanou na dlani a nerozneseš je na všechno, na co sáhneš.'),
  tap('hadanka-tleskani', 'outside', 'dlan', 'Čím tleskáš? Klepni na tu část ruky.', ['Je to na konci ruky.'],
    'Tleskáme dlaněmi – vnitřní stranou rukou.'),
  tap('hadanka-kleceni', 'outside', 'koleno', 'Na čem klečíš? Klepni na to místo.', ['Je to na noze.', 'Je to kloub uprostřed nohy.'],
    'Když klečíš, opíráš se o kolena.'),
  tap('hadanka-trava', 'outside', 'chodidlo', 'Co tě lechtá, když chodíš naboso po trávě? Klepni na to místo.', ['Je to úplně dole.'],
    'Po trávě šlapeme chodidly. Kůže na chodidlech je citlivá, a proto tráva lechtá.'),

  ...OUTSIDE_KEYS.map((r) => highlight('outside', r, OUTSIDE_KEYS)),
];

// ---------------------------------------------------------------------------
// L2 – hlavní orgány: mozek, srdce, plíce, žaludek

const L2: Spec[] = [
  tap('klepni-mozek', 'inside', 'mozek', 'Klepni na mozek.', ['Mozek je schovaný nahoře.', 'Je v hlavě, chrání ho lebka.'],
    'Mozek je v hlavě. Chrání ho tvrdá lebka.'),
  tap('klepni-srdce', 'inside', 'srdce', 'Klepni na srdce.', ['Srdce je v hrudníku.', 'Je mezi plícemi.'],
    'Srdce je v hrudníku mezi plícemi, trochu vlevo. Pumpuje krev do celého těla.'),
  tap('klepni-plice', 'inside', 'plice', 'Klepni na plíce.', ['Plíce jsou v hrudníku.', 'Jsou dvě a jsou velké – po obou stranách srdce.'],
    'Plíce jsou v hrudníku po obou stranách srdce. Dýcháme jimi.'),
  tap('klepni-zaludek', 'inside', 'zaludek', 'Klepni na žaludek.', ['Žaludek je v břiše.', 'Je nahoře v břiše, pod plícemi.'],
    'Žaludek je v horní části břicha. Jídlo do něj doputuje, když ho spolkneš.'),

  tap('prace-premysleni', 'inside', 'mozek', 'Klepni na orgán, kterým přemýšlíš.', ['Je v hlavě.'],
    'Přemýšlíme mozkem. Mozek je v hlavě a řídí celé tělo.'),
  tap('prace-ridi', 'inside', 'mozek', 'Klepni na orgán, který řídí celé tělo.', ['Posílá povely rukám i nohám.', 'Je schovaný nahoře.'],
    'Mozek řídí celé tělo. Posílá zprávy svalům a dostává zprávy od očí, uší i kůže.'),
  tap('prace-lebka', 'inside', 'mozek', 'Klepni na orgán, který chrání lebka.', ['Lebka je kost na hlavě.'],
    'Lebka je tvrdá kostěná přilba, která chrání mozek.'),
  tap('prace-sny', 'inside', 'mozek', 'Klepni na orgán, díky kterému se ti zdají sny.', ['Je to stejný orgán, kterým přemýšlíš.'],
    'Sny vytváří mozek. Pracuje totiž i ve spánku.'),
  tap('prace-pumpa', 'inside', 'srdce', 'Klepni na orgán, který pumpuje krev do celého těla.', ['Pracuje pořád, i když spíš.', 'Je v hrudníku.'],
    'Srdce je silný sval. Pumpuje krev do celého těla.'),
  tap('prace-buseni', 'inside', 'srdce', 'Klepni na orgán, který ti buší rychleji, když běháš.', ['Můžeš si ho nahmatat na hrudníku.'],
    'Když běháš, srdce bije rychleji, aby svaly dostaly víc krve.'),
  tap('prace-pest', 'inside', 'srdce', 'Klepni na orgán, který je velký asi jako tvoje pěst a pořád tluče.', ['Je v hrudníku.'],
    'Srdce je zhruba tak velké jako pěst svého majitele. Tluče celý život.'),
  tap('prace-dychani', 'inside', 'plice', 'Klepni na orgán, kterým dýcháš.', ['Hledej v hrudníku.', 'Je velký a je po obou stranách srdce.'],
    'Dýcháme plícemi. Když se nadechneš, plíce se naplní vzduchem.'),
  tap('prace-nadech', 'inside', 'plice', 'Klepni na orgán, do kterého jde vzduch, když se nadechneš.', ['Vzduch jde nosem a krkem dolů do hrudníku.'],
    'Vzduch jde nosem nebo pusou přes krk až do plic.'),
  tap('prace-balonky', 'inside', 'plice', 'Klepni na orgány, které se při nádechu nafouknou jako balonky.', ['Jsou v hrudníku.'],
    'Při nádechu se plíce naplní vzduchem a zvětší se. Při výdechu se zase zmenší.'),
  tap('prace-spolknuti', 'inside', 'zaludek', 'Klepni na orgán, kam doputuje jídlo, když ho spolkneš.', ['Je v břiše.', 'Je to takový vak na jídlo.'],
    'Když spolkneš sousto, jde jícnem do žaludku. Tam se jídlo mísí s trávicími šťávami.'),
  tap('prace-stavy', 'inside', 'zaludek', 'Klepni na orgán, ve kterém se jídlo míchá s trávicími šťávami.', ['Je v břiše, pod plícemi.'],
    'V žaludku se jídlo míchá s trávicími šťávami, až se změní na kaši.'),

  tap('kde-srdce', 'outside', 'hrudnik', 'Ve které části těla máš srdce? Klepni na ni.', ['Srdce chrání žebra.'],
    'Srdce je v hrudníku. Chrání ho žebra.'),
  tap('kde-mozek', 'outside', 'hlava', 'Ve které části těla je mozek? Klepni na ni.', ['Mozek chrání lebka.'],
    'Mozek je v hlavě, schovaný v lebce.'),
  tap('kde-zaludek', 'outside', 'bricho', 'Ve které části těla je žaludek? Klepni na ni.', ['Je to pod hrudníkem.'],
    'Žaludek je v břiše, v jeho horní části.'),
  tap('kde-plice', 'outside', 'hrudnik', 'Ve které části těla jsou plíce? Klepni na ni.', ['Jsou ve stejné části těla jako srdce.'],
    'Plíce jsou v hrudníku, po obou stranách srdce.'),
  tap('kde-lebka', 'outside', 'hlava', 'Kde máš lebku? Klepni na to místo.', ['Lebka je kost, která chrání mozek.'],
    'Lebka je kostra hlavy. Chrání mozek jako přilba.'),
  tap('kde-zebra', 'outside', 'hrudnik', 'Kde máš žebra? Klepni na to místo.', ['Žebra chrání srdce a plíce.'],
    'Žebra jsou v hrudníku. Tvoří kolem srdce a plic ochranný koš.'),

  ...MAIN_ORGANS.map((r) => highlight('inside', r, MAIN_ORGANS)),
];

// ---------------------------------------------------------------------------
// L3 – všechny orgány, i podle toho, co dělají

const L3: Spec[] = [
  tap('klepni-jatra', 'inside', 'jatra', 'Klepni na játra.', ['Játra jsou v břiše.', 'Jsou nahoře v břiše, hned pod plícemi.'],
    'Játra jsou velký orgán nahoře v břiše, hlavně na pravé straně. Zpracovávají živiny z jídla.'),
  tap('klepni-streva', 'inside', 'streva', 'Klepni na střeva.', ['Střeva jsou v břiše.', 'Jsou dlouhá a stočená jako hadice.'],
    'Střeva jsou dlouhá trubice stočená v břiše. Z jídla v nich přecházejí živiny do krve.'),
  tap('klepni-ledviny', 'inside', 'ledviny', 'Klepni na ledviny.', ['Ledviny jsou v břiše, blízko zad.', 'Jsou dvě a mají tvar fazole.'],
    'Ledviny jsou dvě a mají tvar fazole. Čistí krev a vyrábějí moč.'),
  tap('klepni-mechyr', 'inside', 'mechyr', 'Klepni na močový měchýř.', ['Je v břiše úplně dole.'],
    'Močový měchýř je dole v břiše. Hromadí se v něm moč, dokud nejdeš na záchod.'),

  tap('prace-ledviny', 'inside', 'ledviny', 'Klepni na orgán, který čistí krev a vyrábí moč.', ['Takové orgány máme v těle dva.', 'Mají tvar fazole.'],
    'Ledviny čistí krev. Co tělo nepotřebuje, odvedou s vodou jako moč.'),
  tap('prace-fazole', 'inside', 'ledviny', 'Klepni na orgány, které jsou dva a mají tvar fazole.', ['Jsou v břiše blízko zad.'],
    'Ledviny jsou dvě a opravdu připomínají velké fazole.'),
  tap('prace-zachod', 'inside', 'mechyr', 'Klepni na orgán, ve kterém se hromadí moč, než jdeš na záchod.', ['Je úplně dole v břiše.'],
    'Moč teče z ledvin do močového měchýře. Když je plný, chce se nám na záchod.'),
  tap('prace-nejtezsi', 'inside', 'jatra', 'Klepni na nejtěžší orgán v břiše.', ['Je nahoře v břiše, pod plícemi.', 'Zpracovává živiny z jídla.'],
    'Játra jsou nejtěžší orgán v břiše a vůbec největší vnitřní orgán. U dospělého váží asi jeden a půl kilogramu.'),
  tap('prace-tovarna', 'inside', 'jatra', 'Klepni na orgán, který zpracovává živiny z jídla a zbavuje krev škodlivých látek.', ['Je nahoře v břiše.', 'Je to velký orgán pod plícemi.'],
    'Játra jsou taková chemická továrna těla. Zpracovávají živiny a zbavují krev škodlivých látek.'),
  tap('prace-metry', 'inside', 'streva', 'Klepni na orgán, který je dlouhý několik metrů a je stočený v břiše.', ['Jídlo do něj putuje ze žaludku.', 'Vypadá jako stočená hadice.'],
    'Střeva jsou dohromady dlouhá několik metrů. Aby se vešla do břicha, jsou stočená.'),
  tap('prace-po-zaludku', 'inside', 'streva', 'Klepni na orgán, kam putuje jídlo ze žaludku.', ['Je v břiše pod žaludkem.'],
    'Ze žaludku jde jídlo do střev. Tam se z něj vstřebávají živiny.'),
  tap('prace-vzpominky', 'inside', 'mozek', 'Klepni na orgán, ve kterém se ukládají vzpomínky.', ['Je v hlavě.'],
    'Vzpomínky si pamatujeme díky mozku.'),
  tap('prace-sval', 'inside', 'srdce', 'Klepni na orgán, který je sval a tluče ve dne i v noci.', ['Je v hrudníku mezi plícemi.'],
    'Srdce je sval, který nikdy nepřestává pracovat. Tluče, i když spíš.'),
  tap('prace-kyslik', 'inside', 'plice', 'Klepni na orgán, díky kterému se do krve dostává kyslík.', ['Souvisí to s dýcháním.'],
    'V plicích přechází kyslík ze vzduchu do krve.'),
  tap('prace-jicen', 'inside', 'zaludek', 'Klepni na orgán, do kterého vede jícen.', ['Jícen je trubice, kterou polykáme jídlo.'],
    'Jícen vede jídlo z krku do žaludku.'),
  tap('prace-vedle-srdce', 'inside', 'plice', 'Klepni na orgány, které leží po obou stranách srdce.', ['Dýcháme jimi.'],
    'Po obou stranách srdce jsou plíce – pravá a levá.'),

  tap('kde-jatra', 'outside', 'bricho', 'Ve které části těla jsou játra? Klepni na ni.', ['Jsou pod hrudníkem.'],
    'Játra jsou v břiše, nahoře pod žebry.'),
  tap('kde-ledviny', 'outside', 'bricho', 'Ve které části těla jsou ledviny? Klepni na ni.', ['Jsou blízko zad, ve výšce pasu.'],
    'Ledviny jsou v břiše, vzadu u zad, po obou stranách páteře.'),
  tap('kde-streva', 'outside', 'bricho', 'Ve které části těla jsou střeva? Klepni na ni.', ['Jídlo do nich putuje ze žaludku.'],
    'Střeva vyplňují velkou část břicha.'),

  ...INSIDE_KEYS.map((r) => highlight('inside', r, INSIDE_KEYS)),
];

// ---------------------------------------------------------------------------
// L4 – orgány podle soustav a podle toho, jak pracují

const L4: Spec[] = [
  tap('soustava-dychaci', 'inside', 'plice', 'Klepni na hlavní orgán dýchací soustavy.', ['Dýchací soustava přivádí do těla vzduch.'],
    'Plíce jsou hlavní částí dýchací soustavy. Patří k ní i nos, hrtan a průdušnice.'),
  tap('soustava-obehova', 'inside', 'srdce', 'Klepni na hlavní orgán oběhové soustavy.', ['Oběhová soustava rozvádí krev.'],
    'Srdce pohání krev v cévách. Srdce, cévy a krev tvoří oběhovou soustavu.'),
  tap('soustava-nervova', 'inside', 'mozek', 'Klepni na hlavní orgán nervové soustavy.', ['Nervová soustava řídí tělo.'],
    'Mozek je řídicí centrum nervové soustavy. Patří k ní i mícha a nervy.'),
  tap('soustava-vyroba-moci', 'inside', 'ledviny', 'Klepni na orgány vylučovací soustavy, které vyrábějí moč.', ['Jsou to dva orgány vzadu v břiše.'],
    'Ledviny vyrábějí moč. Spolu s močovým měchýřem patří do vylučovací soustavy.'),
  tap('soustava-zasobnik', 'inside', 'mechyr', 'Klepni na orgán vylučovací soustavy, který moč uchovává.', ['Je dole v břiše.'],
    'Močový měchýř je zásobník moči. Když se naplní, jdeme na záchod.'),
  tap('prace-zluc', 'inside', 'jatra', 'Klepni na orgán, který vyrábí žluč na trávení tuků.', ['Patří do trávicí soustavy.', 'Je to největší vnitřní orgán.'],
    'Játra vyrábějí žluč. Ta pomáhá ve střevech trávit tuky.'),
  tap('prace-vstrebavani', 'inside', 'streva', 'Klepni na orgán, ve kterém se z jídla vstřebává nejvíc živin do krve.', ['Jídlo sem putuje ze žaludku.'],
    'Většina živin se vstřebá v tenkém střevě. Odtud je krev roznese po celém těle.'),
  tap('prace-kyselina', 'inside', 'zaludek', 'Klepni na orgán s kyselou šťávou, která ničí mnoho bakterií z jídla.', ['Jídlo se v něm mění na kaši.'],
    'Žaludeční šťáva je hodně kyselá. Pomáhá trávit a ničí mnoho bakterií, které spolkneme s jídlem.'),
  tap('prace-vymena-plynu', 'inside', 'plice', 'Klepni na orgán, ve kterém krev dostává kyslík a zbavuje se oxidu uhličitého.', ['Souvisí to s dýcháním.'],
    'V plicích přechází kyslík do krve a oxid uhličitý z krve ven. Pak ho vydechneme.'),
  tap('prace-dutiny', 'inside', 'srdce', 'Klepni na orgán, který má uvnitř dvě síně a dvě komory.', ['Pumpuje krev.'],
    'Srdce má čtyři dutiny: dvě síně a dvě komory. Komory pumpují krev do tepen.'),
  tap('prace-tenke-tluste', 'inside', 'streva', 'Klepni na orgán, který má tenkou a tlustou část.', ['Je dlouhý a stočený.'],
    'Střevo má dvě části: tenké a tlusté. Tenké je delší, tlusté je širší.'),
  tap('prace-leky', 'inside', 'jatra', 'Klepni na orgán, který zpracovává léky a škodlivé látky, které se dostanou do krve.', ['Je nahoře v břiše.'],
    'Játra zpracovávají léky i škodlivé látky, aby je tělo mohlo vyloučit.'),
  tap('prace-u-patere', 'inside', 'ledviny', 'Klepni na orgány, které leží vzadu v břiše po obou stranách páteře.', ['Čistí krev.'],
    'Ledviny leží vzadu v břiše po obou stranách páteře, zhruba ve výšce pasu.'),
  tap('prace-basnicka', 'inside', 'mozek', 'Klepni na orgán, který nejvíc pracuje, když se učíš básničku nazpaměť.', ['Ukládají se v něm vzpomínky.'],
    'Při učení nejvíc pracuje mozek. Čím víc opakuješ, tím pevněji si to zapamatuje.'),
  tap('prace-ridi-dech', 'inside', 'mozek', 'Klepni na orgán, který řídí dýchání, i když na to vůbec nemyslíš.', ['Plíce samy od sebe dýchat neumějí.', 'Posílá povely svalům.'],
    'Dýchání řídí mozek – i ve spánku posílá povely dýchacím svalům. Plíce samy od sebe dýchat neumějí.'),
  tap('prace-mocovody', 'inside', 'mechyr', 'Klepni na orgán, do kterého vedou močovody z ledvin.', ['Močovody jsou trubičky, kterými teče moč.'],
    'Močovody jsou tenké trubičky, kterými teče moč z ledvin do močového měchýře.'),
  tap('prace-tepny', 'inside', 'srdce', 'Klepni na orgán, ze kterého vycházejí tepny.', ['Tepny vedou krev.'],
    'Tepny vedou krev ze srdce do těla. Žíly ji vedou zpátky do srdce.'),
  tap('prace-prudusnice', 'inside', 'plice', 'Klepni na orgán, do kterého vede průdušnice.', ['Průdušnicí jde vzduch.'],
    'Průdušnice vede vzduch z krku do plic. V hrudníku se rozvětví na průdušky.'),

  ...INSIDE_KEYS.map(highlightJob),
];

export const mapa = bankSkill({
  id: ID,
  name: 'Kde to v těle je?',
  description: 'Učí najít části těla a vnitřní orgány na mapě těla a spojit je s tím, co dělají.',
  rvp: {
    1: ['ČJS-3-5-01'],
    2: ['ČJS-3-5-01'],
    3: ['ČJS-3-5-01'],
    4: ['ČJS-5-5-01'],
  },
  ability: 'znalosti',
  testLike: 'vedomosti',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 } satisfies Partial<Record<Level, Spec[]>>,
});
