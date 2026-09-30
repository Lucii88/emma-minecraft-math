// Kde to v těle je? – klepání na mapu těla (části těla zvenku, orgány uvnitř)
// a poznávání zvýrazněných míst. Vysvětlení je zajímavost: nejdřív kde to
// je a k čemu to je, pak jeden navazující překvapivý detail.

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
    about: 'Uvnitř je schovaný mozek a chrání ho lebka poskládaná z 22 kostí.',
    hints: ['Je to úplně nahoře.', 'Jsou na tom oči, uši a nos.'],
  },
  krk: {
    sentence: 'Tohle je krk.',
    about: 'Spojuje hlavu s tělem a drží ji – a hlava dospělého váží asi pět kilogramů.',
    hints: ['Je to mezi hlavou a hrudníkem.', 'Když je zima, uvazuješ si na to šálu.'],
  },
  hrudnik: {
    sentence: 'Tohle je hrudník.',
    about: 'Uvnitř jsou srdce a plíce a chrání je žebra. Při každém nádechu se hrudník trochu zvedne.',
    hints: ['Je to pod krkem.', 'Uvnitř tluče srdce.'],
  },
  bricho: {
    sentence: 'Tohle je břicho.',
    about: 'Uvnitř jsou třeba žaludek a střeva. Většinu břicha nekryjí kosti, ale silné břišní svaly.',
    hints: ['Je to uprostřed těla, pod hrudníkem.', 'Je na tom pupík.'],
  },
  paze: {
    sentence: 'Tohle je paže.',
    about: 'Je to horní část ruky mezi ramenem a loktem. Svaly biceps a triceps v ní ruku ohýbají a narovnávají.',
    hints: ['Je to část ruky.', 'Je to mezi ramenem a loktem.'],
  },
  loket: {
    sentence: 'Tohle je loket.',
    about: 'Je to kloub uprostřed ruky. Ohýbá se jen jedním směrem, podobně jako dveře na pantech.',
    hints: ['Je to na ruce.', 'Tady se ruka ohýbá.'],
  },
  dlan: {
    sentence: 'Tohle je dlaň.',
    about: 'Je to vnitřní strana ruky. Je v ní hodně potních žláz, a proto se dlaně potí, i když máme trému.',
    hints: ['Je to na konci ruky.', 'Tím tleskáš.'],
  },
  koleno: {
    sentence: 'Tohle je koleno.',
    about: 'Je to kloub uprostřed nohy, díky kterému můžeš nohu ohnout – a zároveň největší kloub v těle.',
    hints: ['Je to na noze.', 'Tady se noha ohýbá.'],
  },
  noha: {
    sentence: 'Tohle je noha.',
    about: 'Nohy nás nesou – díky nim chodíme, běháme a skáčeme. Za den s nimi uděláme tisíce kroků.',
    hints: ['Je to dole na těle.', 'Díky tomu chodíš a běháš.'],
  },
  chodidlo: {
    sentence: 'Tohle je chodidlo.',
    about: 'Je to spodní část nohy, na které stojíme. Jeho klenba pruží jako pružina, když skáčeš nebo běháš.',
    hints: ['Je to úplně dole.', 'Stojíš na tom.'],
  },
};

const IN: Record<Inside, RegionInfo> = {
  mozek: {
    sentence: 'Tohle je mozek.',
    about: 'Je v hlavě, chrání ho lebka a řídí celé tělo. Spotřebuje aspoň pětinu energie celého těla.',
    hints: ['Je to v hlavě.', 'Tím přemýšlíš.'],
    job: 'Mozek – řídí celé tělo',
  },
  srdce: {
    sentence: 'Tohle je srdce.',
    about: 'Je v hrudníku mezi plícemi a pumpuje krev do celého těla. Je velké zhruba jako pěst svého majitele.',
    hints: ['Je to v hrudníku.', 'Pořád to tluče.'],
    job: 'Srdce – pumpuje krev',
  },
  plice: {
    sentence: 'Tohle jsou plíce.',
    about: 'Jsou v hrudníku po obou stranách srdce a dýcháme jimi. Uvnitř jsou složené z milionů drobných váčků – plicních sklípků.',
    hints: ['Je to v hrudníku.', 'Při nádechu se to naplní vzduchem.'],
    job: 'Plíce – dostávají do krve kyslík',
  },
  zaludek: {
    sentence: 'Tohle je žaludek.',
    about: 'Je nahoře v břiše a míchá spolknuté jídlo s trávicími šťávami. Prázdný je malý, ale po jídle se umí hodně roztáhnout.',
    hints: ['Je to v břiše.', 'Sem doputuje spolknuté jídlo.'],
    job: 'Žaludek – míchá jídlo se šťávami',
  },
  jatra: {
    sentence: 'Tohle jsou játra.',
    about: 'Jsou nahoře v břiše pod plícemi, zpracovávají živiny a vyrábějí žluč. Jsou to největší orgán uvnitř těla.',
    hints: ['Je to nahoře v břiše.', 'Je to největší orgán v břiše.'],
    job: 'Játra – vyrábějí žluč',
  },
  streva: {
    sentence: 'Tohle jsou střeva.',
    about: 'Jsou dlouhá a stočená v břiše a z jídla v nich přecházejí živiny do krve. Tenké střevo je delší, tlusté je širší.',
    hints: ['Je to v břiše.', 'Je to dlouhé a stočené.'],
    job: 'Střeva – vstřebávají živiny',
  },
  ledviny: {
    sentence: 'Tohle jsou ledviny.',
    about: 'Jsou dvě, vzadu v břiše, čistí krev a vyrábějí moč. Člověk může zdravě žít i s jedinou ledvinou.',
    hints: ['Jsou dvě, vzadu v břiše u páteře.', 'Mají tvar fazole.'],
    job: 'Ledviny – vyrábějí moč',
  },
  mechyr: {
    sentence: 'Tohle je močový měchýř.',
    about: 'Je dole v břiše a hromadí se v něm moč. Když se plní, roztahuje se jako balonek.',
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
    'Hlava je nahoře na těle a ukrývá mozek. U miminka je obrovská – tvoří asi čtvrtinu délky celého těla, u dospělého jen osminu.'),
  tap('klepni-krk', 'outside', 'krk', 'Klepni na krk.', ['Hledej mezi hlavou a zbytkem těla.', 'Když je zima, uvazuješ si na něj šálu.'],
    'Krk spojuje hlavu s tělem a díky němu můžeš otáčet hlavou. Vepředu na něm je ohryzek – chrupavka, která chrání hlasivky.'),
  tap('klepni-hrudnik', 'outside', 'hrudnik', 'Klepni na hrudník.', ['Je na přední straně těla, pod krkem.', 'Uvnitř něj tluče srdce.'],
    'Hrudník je pod krkem a uvnitř jsou srdce a plíce. Chrání je žebra – většina lidí jich má dvanáct párů.'),
  tap('klepni-bricho', 'outside', 'bricho', 'Klepni na břicho.', ['Je pod hrudníkem.', 'Najdeš na něm pupík.'],
    'Břicho je pod hrudníkem a uvnitř jsou třeba žaludek a střeva. Střeva jsou tak dlouhá, že se tam vejdou jen stočená.'),
  tap('klepni-paze', 'outside', 'paze', 'Klepni na paži.', ['Paže je část ruky.', 'Je mezi ramenem a loktem.'],
    'Paže je horní část ruky mezi ramenem a loktem. Je v ní jen jedna kost, pažní, zatímco v předloktí pod loktem jsou kosti dvě.'),
  tap('klepni-loket', 'outside', 'loket', 'Klepni na loket.', ['Loket je na ruce.', 'Je to místo, kde se ruka ohýbá napůl.'],
    'Loket je kloub uprostřed ruky, díky kterému ruku ohneš. Když se do něj na určitém místě uhodíš, brní celá ruka – těsně pod kůží tam vede nerv.'),
  tap('klepni-dlan', 'outside', 'dlan', 'Klepni na dlaň.', ['Dlaň je na konci ruky.', 'Je to vnitřní strana ruky.'],
    'Dlaň je vnitřní strana ruky. Čáry na dlaních má každý už před narozením – vzniknou, když je miminko ještě v bříšku.'),
  tap('klepni-koleno', 'outside', 'koleno', 'Klepni na koleno.', ['Koleno je na noze.', 'Je to kloub v polovině nohy.'],
    'Koleno je kloub uprostřed nohy, díky kterému si sedneš, klekneš i vyskočíš. Je to největší kloub v těle.'),
  tap('klepni-noha', 'outside', 'noha', 'Klepni na nohu – třeba na stehno nebo lýtko.', ['Nohy jsou dole, pod břichem.', 'Hledej nad kolenem nebo pod kolenem.'],
    'Nohy nás nesou – díky nim chodíme, běháme a skáčeme. Ve stehně je nejdelší kost těla, dlouhá asi jako čtvrtina výšky člověka.'),
  tap('klepni-chodidlo', 'outside', 'chodidlo', 'Klepni na chodidlo.', ['Chodidlo je úplně dole.', 'Stojíš na něm.'],
    'Chodidlo je spodní část nohy, na které stojíme. Je v něm 26 kostí, takže v obou chodidlech je asi čtvrtina všech kostí těla.'),

  tap('hadanka-cepice', 'outside', 'hlava', 'Kam si nasazuješ čepici? Klepni na to místo.', ['Je to úplně nahoře na těle.'],
    'Čepici nosíme na hlavě – v zimě hřeje a v létě chrání před sluncem. Hlavu kryjí i vlasy: roste jich na ní kolem sto tisíc.'),
  tap('hadanka-oci', 'outside', 'hlava', 'Kde máš oči, uši a nos? Klepni na tu část těla.', ['Je to nahoře.'],
    'Oči, uši i nos jsou na hlavě, kousek od mozku. Zprávy o tom, co vidíme, slyšíme a cítíme, tak mají do mozku jen krátkou cestu.'),
  tap('hadanka-sala', 'outside', 'krk', 'Kam si uvazuješ šálu, když je zima? Klepni na to místo.', ['Je to hned pod hlavou.'],
    'Šálu si uvazujeme kolem krku, aby nám nebyla zima. Krkem vede jídlo, vzduch i krev – jícnem, průdušnicí a velkými cévami.'),
  tap('hadanka-otaceni', 'outside', 'krk', 'Co ti pomáhá otočit hlavu doleva a doprava? Klepni na to.', ['Je to hned pod hlavou.'],
    'Hlavou otáčíme díky krku. Je v něm sedm malých kostí – krčních obratlů – a stejně sedm jich má i žirafa, jen mnohem delších.'),
  tap('hadanka-srdce', 'outside', 'hrudnik', 'Kde cítíš, jak ti tluče srdce? Klepni na to místo.', ['Je to na přední straně těla, pod krkem.', 'Chrání to žebra.'],
    'Srdce tluče v hrudníku, skoro uprostřed. Jeho špička ale míří doleva, a proto tlukot ucítíš spíš vlevo.'),
  tap('hadanka-pupik', 'outside', 'bricho', 'Kde máš pupík? Klepni na to místo.', ['Je to pod hrudníkem.'],
    'Pupík máme uprostřed břicha. Je to jizvička po pupeční šňůře, kterou miminko v bříšku dostávalo jídlo i kyslík.'),
  tap('hadanka-kruceni', 'outside', 'bricho', 'Kde ti kručí, když máš hlad? Klepni na to místo.', ['Je to pod hrudníkem.'],
    'Kručí nám v břiše, když žaludek a střeva posouvají vzduch a šťávy. Děje se to i po jídle – s prázdným břichem je to jen víc slyšet.'),
  tap('hadanka-rukavky', 'outside', 'paze', 'Kam si navlékají nafukovací rukávky děti, které se učí plavat? Klepni na to místo.', ['Je to na ruce.', 'Je to nad loktem.'],
    'Rukávky se navlékají na paže – mezi rameno a loket. Na přední straně paže je sval biceps, který ohýbá ruku v lokti.'),
  tap('hadanka-kychani', 'outside', 'loket', 'Kam kýchneš, když nemáš kapesník? Klepni na to místo.', ['Je to na ruce.', 'Je to místo, kde se ruka ohýbá.'],
    'Když nemáš kapesník, kýchni do lokte. Bacily pak nezůstanou na dlani a nerozneseš je na všechno, na co sáhneš.'),
  tap('hadanka-tleskani', 'outside', 'dlan', 'Čím tleskáš? Klepni na tu část ruky.', ['Je to na konci ruky.'],
    'Tleskáme dlaněmi – vnitřní stranou rukou. Kůže na dlaních je silnější než jinde a nerostou na ní žádné chloupky.'),
  tap('hadanka-kleceni', 'outside', 'koleno', 'Na čem klečíš? Klepni na to místo.', ['Je to na noze.', 'Je to kloub uprostřed nohy.'],
    'Když klečíš, opíráš se o kolena. Vpředu je chrání čéška – malá kost, která je u miminek ještě z měkké chrupavky.'),
  tap('hadanka-trava', 'outside', 'chodidlo', 'Kde tě lechtá tráva, když chodíš naboso? Klepni na to místo.', ['Je to úplně dole.'],
    'Po trávě šlapeme chodidly. Kůže na chodidlech je na dotek hodně citlivá, a proto jsou chodidla tak lechtivá.'),

  ...OUTSIDE_KEYS.map((r) => highlight('outside', r, OUTSIDE_KEYS)),
];

// ---------------------------------------------------------------------------
// L2 – hlavní orgány: mozek, srdce, plíce, žaludek

const L2: Spec[] = [
  tap('klepni-mozek', 'inside', 'mozek', 'Klepni na mozek.', ['Mozek je schovaný nahoře.', 'Je v hlavě, chrání ho lebka.'],
    'Mozek je v hlavě a chrání ho tvrdá lebka. Uvnitř lebky ho navíc obklopuje tekutina, která tlumí otřesy.'),
  tap('klepni-srdce', 'inside', 'srdce', 'Klepni na srdce.', ['Srdce je v hrudníku.', 'Je mezi plícemi.'],
    'Srdce je v hrudníku mezi plícemi, trochu vlevo, a pumpuje krev do celého těla. Je to sval, který pracuje sám – nemusíš na něj myslet.'),
  tap('klepni-plice', 'inside', 'plice', 'Klepni na plíce.', ['Plíce jsou v hrudníku.', 'Jsou dvě a jsou velké – po obou stranách srdce.'],
    'Plíce jsou v hrudníku po obou stranách srdce a dýcháme jimi. Levá je o trochu menší, protože jí dělá místo srdce.'),
  tap('klepni-zaludek', 'inside', 'zaludek', 'Klepni na žaludek.', ['Žaludek je v břiše.', 'Je nahoře v břiše, pod plícemi.'],
    'Žaludek je v horní části břicha. Spolknuté sousto do něj jícnem doputuje za pár vteřin.'),

  tap('prace-premysleni', 'inside', 'mozek', 'Klepni na orgán, kterým přemýšlíš.', ['Je v hlavě.'],
    'Přemýšlíme mozkem. Pracují v něm miliardy nervových buněk, které si pořád posílají zprávy.'),
  tap('prace-ridi', 'inside', 'mozek', 'Klepni na orgán, který řídí celé tělo.', ['Posílá povely rukám i nohám.', 'Je schovaný nahoře.'],
    'Mozek řídí celé tělo: posílá povely svalům a dostává zprávy od očí, uší i kůže. Nejrychlejší zprávy běží po nervech rychleji, než jede auto po dálnici.'),
  tap('prace-lebka', 'inside', 'mozek', 'Klepni na orgán, který chrání lebka.', ['Lebka je kost na hlavě.'],
    'Lebka je tvrdá kostěná přilba, která chrání mozek. Její kosti jsou pevně spojené – pohnout se může jen dolní čelist.'),
  tap('prace-sny', 'inside', 'mozek', 'Klepni na orgán, díky kterému se ti zdají sny.', ['Je to stejný orgán, kterým přemýšlíš.'],
    'Sny vytváří mozek, který pracuje i ve spánku. Nejživější sny se nám zdají, když se pod zavřenými víčky rychle pohybují oči.'),
  tap('prace-pumpa', 'inside', 'srdce', 'Klepni na orgán, který pumpuje krev do celého těla.', ['Pracuje pořád, i když spíš.', 'Je v hrudníku.'],
    'Srdce je silný sval, který pumpuje krev do celého těla. Za den udeří zhruba stotisíckrát – a dětské srdce ještě častěji.'),
  tap('prace-buseni', 'inside', 'srdce', 'Klepni na orgán, který ti buší rychleji, když běháš.', ['Můžeš si ho nahmatat na hrudníku.'],
    'Když běháš, srdce bije rychleji, aby svaly dostaly víc krve. Pravidelný pohyb srdce posiluje, a tak sportovcům bije v klidu pomaleji.'),
  tap('prace-pest', 'inside', 'srdce', 'Klepni na orgán, který je velký asi jako tvoje pěst a pořád tluče.', ['Je v hrudníku.'],
    'Srdce je zhruba tak velké jako pěst svého majitele a tluče celý život. Začne tlouct už v bříšku maminky, když je miminko menší než zrnko rýže.'),
  tap('prace-dychani', 'inside', 'plice', 'Klepni na orgán, kterým dýcháš.', ['Hledej v hrudníku.', 'Je velký a je po obou stranách srdce.'],
    'Dýcháme plícemi – při nádechu se naplní vzduchem. Za hodinu se nadechneš zhruba tisíckrát, a ani o tom nevíš.'),
  tap('prace-nadech', 'inside', 'plice', 'Klepni na orgán, do kterého jde vzduch, když se nadechneš.', ['Vzduch jde nosem a krkem dolů do hrudníku.'],
    'Vzduch jde nosem nebo pusou přes krk až do plic. V nose se cestou ohřeje a zvlhčí a chloupky z něj zachytí prach.'),
  tap('prace-balonky', 'inside', 'plice', 'Klepni na orgány, které se při nádechu nafouknou jako balonky.', ['Jsou v hrudníku.'],
    'Při nádechu se plíce naplní vzduchem a zvětší se, při výdechu se zmenší. Samy se ale nafouknout neumějí – roztáhne je sval pod nimi, bránice.'),
  tap('prace-spolknuti', 'inside', 'zaludek', 'Klepni na orgán, kam doputuje jídlo, když ho spolkneš.', ['Je v břiše.', 'Je to takový vak na jídlo.'],
    'Když spolkneš sousto, jde jícnem do žaludku. Jícen ho posouvá vlnami svalů, takže polknout by šlo i vzhůru nohama.'),
  tap('prace-stavy', 'inside', 'zaludek', 'Klepni na orgán, ve kterém se jídlo míchá s trávicími šťávami.', ['Je v břiše, pod plícemi.'],
    'V žaludku se jídlo míchá s trávicími šťávami, až se změní na kaši. Žaludek přitom pracuje jako mixér – jeho svalnaté stěny se pořád stahují.'),

  tap('kde-srdce', 'outside', 'hrudnik', 'Ve které části těla máš srdce? Klepni na ni.', ['Srdce chrání žebra.'],
    'Srdce je v hrudníku, schované za hrudní kostí a žebry. Když přiložíš ucho kamarádovi na hrudník, uslyšíš ho tlouct.'),
  tap('kde-mozek', 'outside', 'hlava', 'Ve které části těla je mozek? Klepni na ni.', ['Mozek chrání lebka.'],
    'Mozek je v hlavě, schovaný v lebce. U dospělého váží asi 1,4 kilogramu.'),
  tap('kde-zaludek', 'outside', 'bricho', 'Ve které části těla je žaludek? Klepni na ni.', ['Je to pod hrudníkem.'],
    'Žaludek je v horní části břicha, víc vlevo. Když se najíš, jídlo v něm zůstane obvykle několik hodin.'),
  tap('kde-plice', 'outside', 'hrudnik', 'Ve které části těla jsou plíce? Klepni na ni.', ['Jsou ve stejné části těla jako srdce.'],
    'Plíce jsou v hrudníku, po obou stranách srdce. Zabírají v něm většinu místa.'),
  tap('kde-lebka', 'outside', 'hlava', 'Kde máš lebku? Klepni na to místo.', ['Lebka je kost, která chrání mozek.'],
    'Lebka je kostra hlavy a chrání mozek jako přilba. Miminko má mezi kostmi lebky ještě měkká místa, která se zavřou až během prvních let.'),
  tap('kde-zebra', 'outside', 'hrudnik', 'Kde máš žebra? Klepni na to místo.', ['Žebra chrání srdce a plíce.'],
    'Žebra jsou v hrudníku a tvoří kolem srdce a plic ochranný koš. Při nádechu se zvednou, a hrudník se tak rozšíří.'),

  ...MAIN_ORGANS.map((r) => highlight('inside', r, MAIN_ORGANS)),
];

// ---------------------------------------------------------------------------
// L3 – všechny orgány, i podle toho, co dělají

const L3: Spec[] = [
  tap('klepni-jatra', 'inside', 'jatra', 'Klepni na játra.', ['Játra jsou v břiše.', 'Jsou nahoře v břiše, hned pod plícemi.'],
    'Játra jsou velký orgán nahoře v břiše, hlavně na pravé straně. Zpracovávají živiny z jídla a dělají si zásoby, třeba cukru nebo železa.'),
  tap('klepni-streva', 'inside', 'streva', 'Klepni na střeva.', ['Střeva jsou v břiše.', 'Jsou dlouhá a stočená jako hadice.'],
    'Střeva tvoří dlouhou trubici stočenou v břiše a z jídla v nich přecházejí živiny do krve. Žijí v nich i miliardy užitečných bakterií, které pomáhají s trávením.'),
  tap('klepni-ledviny', 'inside', 'ledviny', 'Klepni na ledviny.', ['Ledviny jsou v břiše, blízko zad.', 'Jsou dvě a mají tvar fazole.'],
    'Ledviny jsou dvě a mají tvar fazole. Čistí krev – za den ji přečistí mnohokrát dokola.'),
  tap('klepni-mechyr', 'inside', 'mechyr', 'Klepni na močový měchýř.', ['Je v břiše úplně dole.'],
    'Močový měchýř je dole v břiše a hromadí se v něm moč. Když se naplní, pošle mozku zprávu – a to je ten pocit, že se ti chce na záchod.'),

  tap('prace-ledviny', 'inside', 'ledviny', 'Klepni na orgán, který čistí krev a vyrábí moč.', ['Takové orgány máme v těle dva.', 'Mají tvar fazole.'],
    'Ledviny čistí krev, a co tělo nepotřebuje, odvedou s vodou jako moč. Proto je moč světlejší, když piješ hodně vody.'),
  tap('prace-fazole', 'inside', 'ledviny', 'Klepni na orgány, které jsou dva a mají tvar fazole.', ['Jsou v břiše blízko zad.'],
    'Ledviny jsou dvě a opravdu připomínají velké fazole. Každá je zhruba tak velká jako pěst.'),
  tap('prace-zachod', 'inside', 'mechyr', 'Klepni na orgán, ve kterém se hromadí moč, než jdeš na záchod.', ['Je úplně dole v břiše.'],
    'Moč teče z ledvin do močového měchýře dvěma tenkými trubičkami – močovody. Když je měchýř plný, chce se nám na záchod.'),
  tap('prace-nejtezsi', 'inside', 'jatra', 'Klepni na nejtěžší orgán v břiše.', ['Je nahoře v břiše, pod plícemi.', 'Zpracovává živiny z jídla.'],
    'Játra jsou nejtěžší orgán v břiše a vůbec největší vnitřní orgán. U dospělého váží asi jeden a půl kilogramu.'),
  tap('prace-tovarna', 'inside', 'jatra', 'Klepni na orgán, který zpracovává živiny z jídla a zbavuje krev škodlivých látek.', ['Je nahoře v břiše.', 'Je to velký orgán pod plícemi.'],
    'Játra jsou taková chemická továrna těla: zpracovávají živiny a zbavují krev škodlivých látek. Když se kus jater ztratí, umějí zase dorůst.'),
  tap('prace-metry', 'inside', 'streva', 'Klepni na orgán, který je dlouhý několik metrů a je stočený v břiše.', ['Jídlo do něj putuje ze žaludku.', 'Vypadá jako stočená hadice.'],
    'Střeva jsou dohromady dlouhá několik metrů, a tak jsou v břiše stočená. Jídlo jimi putuje obvykle den i déle.'),
  tap('prace-po-zaludku', 'inside', 'streva', 'Klepni na orgán, kam putuje jídlo ze žaludku.', ['Je v břiše pod žaludkem.'],
    'Ze žaludku jde jídlo do střev a tam se z něj vstřebávají živiny. Žaludek ho do střeva pouští postupně, po malých dávkách.'),
  tap('prace-vzpominky', 'inside', 'mozek', 'Klepni na orgán, ve kterém se ukládají vzpomínky.', ['Je v hlavě.'],
    'Vzpomínky si pamatujeme díky mozku. Hodně z toho, co se přes den stalo, si mozek třídí a ukládá ve spánku.'),
  tap('prace-sval', 'inside', 'srdce', 'Klepni na orgán, který je sval a tluče ve dne i v noci.', ['Je v hrudníku mezi plícemi.'],
    'Srdce je sval, který nikdy nepřestává pracovat – tluče, i když spíš. Mezi dvěma údery si ale vždycky na chvilku odpočine.'),
  tap('prace-kyslik', 'inside', 'plice', 'Klepni na orgán, díky kterému se do krve dostává kyslík.', ['Souvisí to s dýcháním.'],
    'V plicích přechází kyslík ze vzduchu do krve. Kyslík tvoří asi pětinu vzduchu, který dýcháme.'),
  tap('prace-jicen', 'inside', 'zaludek', 'Klepni na orgán, do kterého vede jícen.', ['Jícen je trubice, kterou polykáme jídlo.'],
    'Jícen vede jídlo z krku do žaludku. Sousto v něm neklouže samo – posouvají ho vlny svalů.'),
  tap('prace-vedle-srdce', 'inside', 'plice', 'Klepni na orgány, které leží po obou stranách srdce.', ['Dýcháme jimi.'],
    'Po obou stranách srdce jsou plíce – pravá a levá. Pravá má tři části, laloky, levá jen dva a je o trochu menší, protože jí dělá místo srdce.'),

  tap('kde-jatra', 'outside', 'bricho', 'Ve které části těla jsou játra? Klepni na ni.', ['Jsou pod hrudníkem.'],
    'Játra jsou v břiše, nahoře pod žebry, víc vpravo. Spodní žebra je tak zčásti chrání.'),
  tap('kde-ledviny', 'outside', 'bricho', 'Ve které části těla jsou ledviny? Klepni na ni.', ['Jsou blízko zad, ve výšce pasu.'],
    'Ledviny jsou v břiše, vzadu u zad, po obou stranách páteře. Jejich horní část chrání poslední žebra.'),
  tap('kde-streva', 'outside', 'bricho', 'Ve které části těla jsou střeva? Klepni na ni.', ['Jídlo do nich putuje ze žaludku.'],
    'Střeva vyplňují velkou část břicha. Tenké střevo je u dospělého dlouhé několik metrů, a proto je stočené.'),

  ...INSIDE_KEYS.map((r) => highlight('inside', r, INSIDE_KEYS)),
];

// ---------------------------------------------------------------------------
// L4 – orgány podle soustav a podle toho, jak pracují

const L4: Spec[] = [
  tap('soustava-dychaci', 'inside', 'plice', 'Klepni na hlavní orgán dýchací soustavy.', ['Dýchací soustava přivádí do těla vzduch.'],
    'Plíce jsou hlavní částí dýchací soustavy. Patří k ní i nos, hrtan a průdušnice – a v hrtanu jsou hlasivky, díky kterým mluvíme.'),
  tap('soustava-obehova', 'inside', 'srdce', 'Klepni na hlavní orgán oběhové soustavy.', ['Oběhová soustava rozvádí krev.'],
    'Srdce pohání krev v cévách – srdce, cévy a krev tvoří oběhovou soustavu. Krev oběhne celé tělo zhruba za minutu.'),
  tap('soustava-nervova', 'inside', 'mozek', 'Klepni na hlavní orgán nervové soustavy.', ['Nervová soustava řídí tělo.'],
    'Mozek je řídicí centrum nervové soustavy, patří k ní i mícha a nervy. Nejdelší nerv vede od spodní části zad až do chodidla.'),
  tap('soustava-vyroba-moci', 'inside', 'ledviny', 'Klepni na orgány vylučovací soustavy, které vyrábějí moč.', ['Jsou to dva orgány vzadu v břiše.'],
    'Ledviny vyrábějí moč a spolu s močovým měchýřem patří do vylučovací soustavy. U dospělého jimi za den proteče přes tisíc litrů krve.'),
  tap('soustava-zasobnik', 'inside', 'mechyr', 'Klepni na orgán vylučovací soustavy, který moč uchovává.', ['Je dole v břiše.'],
    'Močový měchýř je zásobník moči. Když jdeme na záchod, sval v jeho stěně se stáhne a moč vytlačí ven.'),
  tap('prace-zluc', 'inside', 'jatra', 'Klepni na orgán, který vyrábí žluč na trávení tuků.', ['Patří do trávicí soustavy.', 'Je to největší vnitřní orgán.'],
    'Játra vyrábějí žluč, která pomáhá ve střevech trávit tuky. Než je jí potřeba, čeká v malém váčku – žlučníku.'),
  tap('prace-vstrebavani', 'inside', 'streva', 'Klepni na orgán, ve kterém se z jídla vstřebává nejvíc živin do krve.', ['Jídlo sem putuje ze žaludku.'],
    'Většina živin se vstřebá v tenkém střevě a krev je pak roznese po těle. Jeho stěna je pokrytá drobnými výběžky, a proto má obrovskou plochu.'),
  tap('prace-kyselina', 'inside', 'zaludek', 'Klepni na orgán s kyselou šťávou, která ničí mnoho bakterií z jídla.', ['Jídlo se v něm mění na kaši.'],
    'Žaludeční šťáva je hodně kyselá: pomáhá trávit a ničí mnoho bakterií, které spolkneme. Aby se žaludek sám nenatrávil, chrání ho vrstva hlenu.'),
  tap('prace-vymena-plynu', 'inside', 'plice', 'Klepni na orgán, ve kterém krev dostává kyslík a zbavuje se oxidu uhličitého.', ['Souvisí to s dýcháním.'],
    'V plicích přechází kyslík do krve a oxid uhličitý z krve ven – a pak ho vydechneme. Rostliny oxid uhličitý potřebují k růstu.'),
  tap('prace-dutiny', 'inside', 'srdce', 'Klepni na orgán, který má uvnitř dvě síně a dvě komory.', ['Pumpuje krev.'],
    'Srdce má čtyři dutiny: dvě síně a dvě komory, které pumpují krev do tepen. Chlopně mezi nimi pouštějí krev jen jedním směrem a jejich klapání slyšíme jako tlukot srdce.'),
  tap('prace-tenke-tluste', 'inside', 'streva', 'Klepni na orgán, který má tenkou a tlustou část.', ['Je dlouhý a stočený.'],
    'Střevo má dvě části: tenké a tlusté. Tenké měří u dospělého několik metrů, tlusté je kratší, ale širší.'),
  tap('prace-leky', 'inside', 'jatra', 'Klepni na orgán, který zpracovává léky a škodlivé látky, které se dostanou do krve.', ['Je nahoře v břiše.'],
    'Játra zpracovávají léky i škodlivé látky, aby je tělo mohlo vyloučit. Pomáhají jim ledviny, které je pak odvedou v moči.'),
  tap('prace-u-patere', 'inside', 'ledviny', 'Klepni na orgány, které leží vzadu v břiše po obou stranách páteře.', ['Čistí krev.'],
    'Ledviny leží vzadu v břiše po obou stranách páteře, zhruba ve výšce pasu. Pravá je o kousek níž než levá, protože nad ní jsou velká játra.'),
  tap('prace-basnicka', 'inside', 'mozek', 'Klepni na orgán, který nejvíc pracuje, když se učíš básničku nazpaměť.', ['Ukládají se v něm vzpomínky.'],
    'Při učení nejvíc pracuje mozek. Když básničku opakuješ, spojení mezi nervovými buňkami v mozku sílí a básnička se uloží pevněji.'),
  tap('prace-ridi-dech', 'inside', 'mozek', 'Klepni na orgán, který řídí dýchání, i když na to vůbec nemyslíš.', ['Plíce samy od sebe dýchat neumějí.', 'Posílá povely svalům.'],
    'Dýchání řídí mozek – i ve spánku posílá povely dýchacím svalům. Plíce samy od sebe dýchat neumějí.'),
  tap('prace-mocovody', 'inside', 'mechyr', 'Klepni na orgán, do kterého vedou močovody z ledvin.', ['Močovody jsou trubičky, kterými teče moč.'],
    'Močovody jsou tenké trubičky, kterými teče moč z ledvin do močového měchýře. Moč v nich neteče jen sama – posouvají ji vlny svalů.'),
  tap('prace-tepny', 'inside', 'srdce', 'Klepni na orgán, ze kterého vycházejí tepny.', ['Tepny vedou krev.'],
    'Tepny vedou krev ze srdce do těla a žíly ji vedou zpátky. Když si na zápěstí nahmatáš tep, cítíš právě tepnu.'),
  tap('prace-prudusnice', 'inside', 'plice', 'Klepni na orgán, do kterého vede průdušnice.', ['Průdušnicí jde vzduch.'],
    'Průdušnice vede vzduch z krku do plic a v hrudníku se rozvětví na průdušky. Otevřenou ji drží kroužky z chrupavky – nahmatáš je vpředu na krku.'),

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
  showFact: true,
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 } satisfies Partial<Record<Level, Spec[]>>,
});
