// Potřeby a přání – co opravdu potřebujeme a co jen chceme, výběr v rámci
// peněz, které máme („nemůžu mít všechno“), co nás výběr stojí a čekání na
// odměnu. Tlačítka Potřeba × Přání jen u jednoznačných případů. Přání
// nejsou nic špatného – jen se platí až po potřebách.

import { capitalize, formatNumber as f } from '../../core/czech';
import { bankSkill, type FixedSpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import {
  POTREBA_PRANI,
  goodsBetween,
  isOffer,
  kc,
  korun,
  list,
  mix,
  nm,
  offer,
  pickDistinct,
  priceOf,
  q,
  speakOffer,
  sum,
  type Attempt,
  type Good,
} from './common';

const ID = 'trh.potreby';

/** Potřeba, nebo přání? Stálá tlačítka a obrázek věci. */
function pp(key: string, emoji: string, what: string, need: boolean, hint: string, explain: string): FixedSpec {
  return {
    kind: 'fixed',
    key: `${need ? 'potreba' : 'prani'}-${key}`,
    prompt: `${what} – je to potřeba, nebo přání?`,
    visual: { type: 'big', text: emoji },
    options: POTREBA_PRANI,
    correct: need ? 0 : 1,
    hints: ['Dá se bez toho dobře žít?', hint],
    explain: `${need ? 'Potřeba' : 'Přání'}. ${explain}`,
  };
}

// ---------------------------------------------------------------------------
// L1 – jasné potřeby a jasná přání

const L1: Spec[] = [
  pp('voda', '💧', 'Voda na pití', true, 'Vydrží tělo celý den bez pití?',
    'Bez vody tělo nevydrží. Pít potřebujeme každý den.'),
  pp('obed', '🍲', 'Oběd, když máš hlad', true, 'Co by se stalo, kdyby člověk nejedl?',
    'Jídlo dává tělu sílu, abychom mohli růst, učit se i hrát si.'),
  pp('bunda', '🧥', 'Teplá bunda v zimě', true, 'Jak by ti bylo v zimě bez bundy?',
    'Teplé oblečení nás v zimě chrání před chladem a prochladnutím.'),
  pp('lek', '💊', 'Lék od lékaře, když jsi nemocná', true, 'Kdo ten lék předepsal a proč?',
    'Lék, který předepíše lékař, pomáhá, aby ses uzdravila.'),
  pp('domov', '🏠', 'Domov, kde můžeš bydlet', true, 'Kde by se spalo a kde by bylo teplo?',
    'Každý potřebuje místo, kde může spát, umýt se a být v teple a bezpečí.'),
  pp('kartacek', '🦷', 'Zubní kartáček', true, 'Co by se stalo se zuby bez čištění?',
    'Zuby si čistíme každý den, aby zůstaly zdravé.'),
  pp('boty-male', '👟', 'Nové boty, když ti staré už jsou malé', true, 'Dá se chodit v botách, které tlačí?',
    'V malých botách noha bolí a nemůže správně růst.'),
  pp('postel', '🛏️', 'Postel na spaní', true, 'Kolik času denně prospíš?',
    'Spánek je pro tělo moc důležitý a postel k němu potřebujeme.'),
  pp('mydlo', '🧼', 'Mýdlo na mytí rukou', true, 'Co se stane s bacily na rukou?',
    'Mýdlo smyje z rukou špínu a bacily, a tak nás chrání před nemocemi.'),
  pp('snidane', '🥣', 'Snídaně', true, 'Kde vezmeš ráno sílu do školy?',
    'Jídlo potřebujeme každý den. Snídaně dá tělu sílu do začátku dne.'),
  pp('hracka', '🧸', 'Nová hračka', false, 'Máš doma nějaké hračky?',
    'Hračka udělá radost, ale bez nové hračky se dá dobře žít.'),
  pp('lizatko', '🍭', 'Lízátko', false, 'Potřebuje tělo sladkosti?',
    'Sladkost je dobrota pro radost. Tělo ji ke zdraví nepotřebuje.'),
  pp('plysak', '🐻', 'Desátý plyšák do sbírky', false, 'Kolik plyšáků už ve sbírce je?',
    'Plyšák je milý, ale devět už jich doma máš.'),
  pp('hra-mobil', '📱', 'Nová hra do mobilu', false, 'Stalo by se něco zlého bez ní?',
    'Hra může být zábavná, ale bez ní se dá žít úplně v pohodě.'),
  pp('samolepky', '✨', 'Třpytivé samolepky', false, 'K čemu samolepky jsou?',
    'Samolepky jsou pro radost a na hraní. Bez nich se dá dobře žít.'),
  pp('zmrzlina', '🍦', 'Zmrzlina', false, 'Je zmrzlina obyčejné jídlo, nebo mlsání?',
    'Zmrzlina je dobrota pro radost, ne jídlo, které tělo potřebuje.'),
  pp('balonek', '🎈', 'Balónek z pouti', false, 'Stalo by se něco bez balónku?',
    'Balónek je pro radost. Bez něj se dá dobře žít.'),
  pp('druhy-mic', '⚽', 'Další míč, když jeden už máš', false, 'Můžeš si hrát s míčem, který už máš?',
    'Jeden míč už máš a můžeš si s ním hrát.'),
  pp('kolotoc', '🎠', 'Jízda na kolotoči', false, 'Je to nutné, nebo zábava?',
    'Kolotoč je zábava, na kterou se můžeš těšit, ale k životu ho nepotřebujeme.'),
  pp('cokolada', '🍫', 'Čokoláda', false, 'Potřebuje tělo čokoládu, aby bylo zdravé?',
    'Čokoláda je mlsání pro radost. Hlad zažene i obyčejné jídlo.'),
];

// ---------------------------------------------------------------------------
// L2 – potřeby a přání s okolnostmi, nemůžu mít všechno, čekání

const L2: Spec[] = [
  pp('bryle', '👓', 'Brýle pro někoho, kdo špatně vidí', true, 'Jak by se mu bez brýlí četlo?',
    'Kdo špatně vidí, bez brýlí nepřečte tabuli ani knížku. Pro něj jsou brýle nutné.'),
  pp('sesity', '📓', 'Sešity do školy', true, 'Kam si ve škole píšeš?',
    'Bez sešitů by se ve škole špatně psalo a učilo.'),
  pp('cepice-mraz', '🧣', 'Čepice a šála, když venku mrzne', true, 'Co chrání uši a krk v mrazu?',
    'V mrazu nás teplé oblečení chrání před prochladnutím.'),
  pp('krmeni-pes', '🐕', 'Krmení pro psa, kterého máte doma', true, 'Kdo se o psa stará?',
    'Pes, kterého máte doma, potřebuje jíst každý den. O zvíře se musíme postarat.'),
  pp('voda-vylet', '💧', 'Láhev vody na dlouhý výlet v horku', true, 'Co tělo v horku potřebuje nejvíc?',
    'V horku tělo ztrácí hodně vody, a proto ji musíme doplňovat.'),
  pp('topeni', '🌡️', 'Teplo doma v zimě', true, 'Dalo by se v zimě bydlet v ledové místnosti?',
    'V zimě potřebujeme doma topit, jinak by nám byla zima a mohli bychom onemocnět.'),
  pp('ovoce', '🍎', 'Ovoce a zelenina', true, 'Co tělu dodává vitamíny?',
    'Ovoce a zelenina jsou jídlo, které tělo potřebuje k tomu, aby bylo zdravé.'),
  pp('tenisky-svitici', '👟', 'Tenisky se svítící podrážkou, i když staré jsou ještě dobré', false, 'Dá se chodit ve starých teniskách?',
    'Staré tenisky jsou ještě dobré. Svítící podrážka je hezká, ale nutná není.'),
  pp('penal', '✏️', 'Nový penál, i když starý je v pořádku', false, 'Vejdou se tužky do starého penálu?',
    'Starý penál slouží dobře, nový by byl jen pro radost.'),
  pp('tricko', '👕', 'Další tričko s oblíbeným obrázkem, i když jich máš dost', false, 'Máš co na sebe?',
    'Triček máš dost. Další by bylo jen pro radost.'),
  pp('kino', '🎬', 'Lístek do kina', false, 'Je kino nutné k životu?',
    'Kino je pěkný zážitek, na který se můžeš těšit, ale k životu ho nepotřebujeme.'),
  pp('obal-mobil', '📱', 'Další třpytivý obal na mobil, i když jeden už máš', false, 'Chrání mobil i obal, který už máš?',
    'Mobil už obal má a ten ho chrání. Další třpytivý by byl jen pro radost.'),
  pp('autodraha', '🏎️', 'Velká autodráha z reklamy', false, 'Odkud ji znáš?',
    'Autodráha je zábava a reklama umí přání pořádně rozdmýchat.'),
  pp('limonada', '🥤', 'Sladká limonáda, když máš doma vodu', false, 'Čím se dá zahnat žízeň?',
    'Žízeň zažene i voda. Sladká limonáda je jen dobrota navíc.'),
  pp('kostym-hra', '🎮', 'Nový kostým pro postavičku ve hře', false, 'Hraje se hra i bez nového kostýmu?',
    'Hra funguje i bez nového kostýmu – a kostýmy ve hrách často stojí skutečné peníze.'),
  q('vsechno', 'Proč si nemůžeme koupit všechno, co chceme?', 'Peníze nestačí na všechno',
    ['Obchody nechtějí prodávat', 'Věci nejsou na prodej', 'Kupovat se nesmí'],
    ['Kolik peněz má rodina na měsíc?'],
    'Peněz je vždycky jen určité množství. Proto vybíráme: nejdřív potřeby, a co zbude, můžeme dát na přání.'),
  q('pockat-mic', 'Šupinka má 20 Kč. Může si hned koupit lízátko, nebo šetřit tři týdny na vlastní míček. Co se stane, když počká?', 'Bude mít na míček',
    ['Nebude mít nic', 'Dostane lízátko zadarmo', 'Peníze se jí ztratí'],
    ['Co se děje s penězi, když se šetří?'],
    'Když počká a bude šetřit, koupí si věc, kterou chce víc. Obojí je v pořádku – jen je dobré vědět, že čekání se někdy vyplatí.'),
  q('cekani-pomoc', 'Šetříš na knížku a čekání je dlouhé. Co ti pomůže vydržet?', 'Nakreslit si cíl a odškrtávat týdny',
    ['Každý den si trochu vzít z prasátka', 'Utratit to za první hračku', 'Pořád chodit kolem výlohy s hračkami'],
    ['Co ti připomene, na co šetříš?'],
    'Když vidíš svůj cíl a odškrtáváš týdny, čekání ubíhá líp. Pomáhá i dělat mezitím něco jiného zábavného.'),
];

// ---------------------------------------------------------------------------
// L3 – nejdřív potřeby, skryté náklady, rozmyslet si to

const L3: Spec[] = [
  q('rodina-nejdriv', 'Rodina má na víkend 800 Kč. Za co by měla utratit nejdřív?', 'Za jídlo na víkend',
    ['Za novou hru', 'Za balónky', 'Za sladkosti'],
    ['Bez čeho se o víkendu nedá obejít?'],
    'Rozumné je zaplatit nejdřív potřeby, jako je jídlo. Co zbude, může rodina dát na přání.'),
  q('pes-naklady', 'Ivar chce psa. Za co bude muset platit i potom, co psa dostane?', 'Za krmení a veterináře',
    ['Za nic, pes je hotový', 'Jen jednou za obojek', 'Pes si na sebe vydělá'],
    ['Co pes potřebuje každý den?'],
    'Pes potřebuje jíst každý den a občas musí k veterináři. Když něco kupujeme, je dobré myslet i na to, co bude stát potom.'),
  q('kolo-naklady', 'Když si koupíš kolo, co tě může stát peníze i potom?', 'Přilba a opravy',
    ['Nic, kolo vydrží navždy', 'Jen zvonek', 'Kolo si samo vydělá'],
    ['Může se kolo rozbít?'],
    'K jízdě potřebuješ přilbu a kolo se občas musí opravit. I na to je dobré myslet předem.'),
  q('seznam', 'K čemu je nákupní seznam?', 'Koupíš jen to, co potřebuješ',
    ['Aby byl nákup delší', 'Aby ses nemusela dívat na ceny', 'Aby obchod věděl, co chceš'],
    ['Co se stane, když jdeš nakupovat bez plánu?'],
    'Se seznamem nezapomeneš na potřeby a nenecháš se tolik zlákat věcmi, které jsi koupit nechtěla.'),
  q('bryle-pro-koho', 'Pro koho jsou brýle potřeba?', 'Pro toho, kdo bez nich špatně vidí',
    ['Pro každého', 'Pro nikoho', 'Jen pro dospělé'],
    ['Nosí brýle všichni lidé?'],
    'Kdo vidí dobře, brýle nepotřebuje. Stejná věc může být pro jednoho potřeba a pro druhého přání.'),
  q('hlad', 'Máš hlad. Co je tvoje potřeba, a ne jen přání?', 'Obyčejné jídlo',
    ['Dort se šlehačkou', 'Lízátko', 'Hrst bonbonů'],
    ['Co tě opravdu zasytí?'],
    'Na hlad pomůže obyčejné jídlo, třeba chléb se sýrem nebo polévka. Dort a bonbony jsou dobrota pro radost.'),
  q('je-prani-spatne', 'Je špatné mít přání?', 'Ne, přání jsou v pořádku',
    ['Ano, vždycky', 'Ano, když něco stojí', 'Ano, přání se nesmí mít'],
    ['Máš nějaké přání ty?'],
    'Přání jsou v pořádku a dělají život veselejší. Jen je rozumné nejdřív zaplatit potřeby a pak vybírat z přání.'),
  q('dve-prani', 'Máš peníze jen na jedno přání: knížku, nebo stavebnici. Co je dobré udělat?', 'Rozmyslet si, co chci víc',
    ['Koupit obojí na dluh', 'Nekoupit nic a zlobit se', 'Vzít peníze sourozenci'],
    ['Na obojí peníze nestačí.'],
    'Když peníze nestačí na obojí, je dobré si v klidu rozmyslet, co ti udělá větší radost. Druhé přání může počkat.'),
  q('den-pockat', 'Ve výloze vidíš hračku, kterou hned chceš. Co je chytré udělat?', 'Den počkat a rozmyslet si to',
    ['Hned ji koupit', 'Koupit hned dvě', 'Utratit všechny úspory'],
    ['Budeš ji chtít i zítra?'],
    'Když den počkáš, často zjistíš, jestli hračku opravdu chceš, nebo se ti jen v tu chvíli líbila.'),
  q('slib-cekani', 'Tove slíbili: „Když chvíli počkáš, dostaneš dvě sušenky místo jedné.“ Kdy se jí bude čekat nejlíp?', 'Když ten, kdo slíbil, sliby plní',
    ['Když má velký hlad', 'Když sušenku pořád vidí', 'Když se nudí'],
    ['Dá se věřit slibu někoho, kdo sliby neplní?'],
    'Vědci zjistili, že děti čekají mnohem déle, když dospělý předtím dodržel slib. Čekání pomáhá důvěra – a taky dívat se jinam.'),
];

// ---------------------------------------------------------------------------
// L4 – reklama, nákupy „na poslední chvíli“, potřeby podle situace

const L4: Spec[] = [
  q('reklama-deti', 'Proč reklama na hračky ukazuje šťastné děti?', 'Aby v nás vzbudila přání',
    ['Aby děti byly šťastné', 'Protože je to zpráva', 'Aby hračka zlevnila'],
    ['Kdo reklamu platí a co od ní chce?'],
    'Reklamu platí firma, která chce hračku prodat. Šťastné děti na obrazovce v nás mají vzbudit pocit, že tu hračku chceme taky.'),
  q('pokladna', 'Proč bývají sladkosti a drobnosti u pokladny?', 'Aby je lidé koupili při čekání',
    ['Nikam jinam se nevejdou', 'Aby byly blízko dveří', 'Protože je tam chladno'],
    ['Co děláš, když stojíš ve frontě?'],
    'Ve frontě lidé čekají a rozhlížejí se. Obchody tam dávají drobnosti, které si lidé často koupí, i když je neplánovali.'),
  q('youtuberka', 'Oblíbená youtuberka chválí hračku, protože jí za to firma zaplatila. Co to je?', 'Reklama',
    ['Nezávislá rada', 'Zpráva ze školy', 'Soutěž'],
    ['Kdo za video zaplatil?'],
    'Když někomu firma zaplatí, aby věc chválil, je to reklama. Poctivé video by mělo říct, že jde o placenou spolupráci.'),
  q('zalezi-na-situaci', 'Proč může být stejná věc pro jednoho potřeba a pro druhého přání?', 'Záleží na situaci',
    ['Protože se liší ceny', 'Protože přání neexistují', 'Protože to určuje obchod'],
    ['Vzpomeň si na brýle: kdo je potřebuje a kdo ne?'],
    'Kolo je pro pošťačku, která rozváží dopisy, potřeba k práci. Pro někoho jiného je to přání na výlety.'),
  q('stavebnice', 'Knut chce stavebnici za 1200 Kč, ale má jen 300 Kč. Co je rozumné?', 'Šetřit, nebo vybrat levnější',
    ['Půjčit si od kamaráda 900 Kč', 'Vzít peníze z rodinné kasičky', 'Koupit ji a nezaplatit'],
    ['Co se dá dělat, když peníze zatím nestačí?'],
    'Může šetřit, dokud nebude mít dost, nebo vybrat levnější stavebnici. Půjčovat si na přání obvykle není dobrý nápad.'),
  q('dovolena', 'Rodina chce šetřit na dovolenou. Co musí platit dál, i když šetří?', 'Bydlení, jídlo a energie',
    ['Novou televizi', 'Hračky', 'Výlety do aquaparku'],
    ['Bez čeho se rodina neobejde?'],
    'Potřeby jako bydlení, jídlo, voda a energie se platí pořád. Na dovolenou se šetří z toho, co zbude.'),
  q('seradit-prani', 'Co pomůže, když máš víc přání než peněz?', 'Seřadit přání podle důležitosti',
    ['Koupit to první, co uvidíš', 'Vzdát se všech přání', 'Půjčit si na všechno'],
    ['Které přání je pro tebe nejdůležitější?'],
    'Když si přání seřadíš, víš, na co šetřit nejdřív. Ostatní přání můžou počkat.'),
  q('gumicka', 'Všichni ve třídě mají stejnou třpytivou gumičku. Co je dobré si říct, než o ni požádáš?', 'Chci ji opravdu já?',
    ['Musím ji mít hned', 'Bez ní mě nikdo nebude mít rád', 'Musím mít dvě'],
    ['Chceš ji kvůli sobě, nebo kvůli ostatním?'],
    'Chtít to, co mají ostatní, je normální. Stojí ale za to se zeptat, jestli ti ta věc udělá radost i tobě.'),
  q('vyprodej', 'Obchod láká: „Kupte teď, zítra už nebude!“ Co je dobré udělat?', 'Rozmyslet si, jestli to potřebuju',
    ['Hned koupit, než to zmizí', 'Koupit dvakrát', 'Utratit všechny úspory'],
    ['Proč asi obchod tak spěchá?'],
    'Spěch má lidi přimět nakupovat bez přemýšlení. Když věc nepotřebuješ, klidně ji nech v obchodě.'),
];

// ---------------------------------------------------------------------------
// Generátory: co si můžeš koupit, co tě výběr stojí

type Offer = { good: Good; price: number };

function offerOf(rng: Rng, goods: Good[], n: number): Offer[] | null {
  const items = pickDistinct(rng, goods, n).map((good) => ({ good, price: priceOf(rng, good) }));
  return new Set(items.map((i) => i.price)).size === n ? items : null;
}

const title = (o: Offer) => capitalize(o.good.nom);

/** Na kterou věc ti peníze stačí / nestačí? Právě jedna odpověď. */
function koupis(max: number): Attempt {
  return (rng) => {
    const items = offerOf(rng, goodsBetween(1, max), 3);
    if (!items) return null;
    const sorted = items.map((i) => i.price).sort((a, b) => a - b);
    const enough = rng.chance(0.6);
    // Stačí: právě jedna cena ≤ peníze. Nestačí: právě jedna cena > peníze.
    const budget = enough ? rng.int(sorted[0], sorted[1] - 1) : rng.int(sorted[1], sorted[2] - 1);
    const pick = items.find((i) => (enough ? i.price <= budget : i.price > budget))!;
    const ask = `Na kterou věc ti peníze ${enough ? 'stačí' : 'nestačí'}?`;
    return q(
      `${enough ? 'koupis' : 'nestaci'}-${budget}-${items.map((i) => `${i.good.key}${i.price}`).join('-')}`,
      `Máš ${kc(budget)}. ${ask}`,
      title(pick),
      items.filter((i) => i !== pick).map(title),
      ['Porovnej každou cenovku se svými penězi.', enough ? 'Hledáš cenu, která je stejná nebo menší než tvoje peníze.' : 'Hledáš cenu, která je větší než tvoje peníze.'],
      enough
        ? `Peníze ti stačí jen na ${pick.good.acc} za ${kc(pick.price)}. Na ostatní věci máš málo – nemůžeš mít všechno najednou.`
        : `${capitalize(pick.good.nom)} stojí ${kc(pick.price)}, to je víc než ${kc(budget)}. Na ostatní věci peníze stačí.`,
      { visual: offer(items), speak: `Máš ${korun(budget)}. ${capitalize(speakOffer(items))}. ${ask}`, difficulty: enough ? -0.1 : 0.1 },
    );
  };
}

/** Které dvě věci si můžeš koupit obě? Právě jedna dvojice se vejde. */
function dvojice(rng: Rng): Spec | null {
  const items = offerOf(rng, goodsBetween(1, 100), 4);
  if (!items) return null;
  const pairs: [Offer, Offer][] = [];
  items.forEach((a, i) => items.slice(i + 1).forEach((b) => pairs.push([a, b])));
  const sums = pairs.map(([a, b]) => a.price + b.price).sort((x, y) => x - y);
  if (sums[0] === sums[1] || sums[0] > 100) return null;
  const budget = rng.int(sums[0], Math.min(sums[1] - 1, 100));
  const fits = pairs.filter(([a, b]) => a.price + b.price <= budget);
  if (fits.length !== 1) return null;
  const pairLabel = ([a, b]: [Offer, Offer]) => `${title(a)} a ${b.good.nom}`;
  const ask = 'Které dvě věci si můžeš koupit obě najednou?';
  return q(
    `dvojice-${budget}-${items.map((i) => `${i.good.key}${i.price}`).join('-')}`,
    `Máš ${kc(budget)}. ${ask}`,
    pairLabel(fits[0]),
    pairs.filter((p) => p !== fits[0]).map(pairLabel),
    ['Sečti ceny dvou věcí a porovnej součet se svými penězi.', 'Když je součet větší než tvoje peníze, na obě věci to nestačí.'],
    `${f(fits[0][0].price)} + ${f(fits[0][1].price)} = ${kc(fits[0][0].price + fits[0][1].price)}, to se do ${kc(budget)} vejde. Každá jiná dvojice stojí víc.`,
    { visual: offer(items), speak: `Máš ${korun(budget)}. ${capitalize(speakOffer(items))}. ${ask}`, difficulty: 0.2 },
  );
}

/** Co tě výběr stojí: když koupíš X, na co ti ještě (ne)zbude? */
function zbude(level: 2 | 3): Attempt {
  return (rng) => {
    const goods = level === 2 ? goodsBetween(1, 100) : goodsBetween(40, 900);
    const items = offerOf(rng, goods, 4);
    if (!items) return null;
    const [x, ...others] = rng.shuffle(items);
    const still = level === 2 || rng.chance(0.5);
    // Peníze v kulatých částkách: po pěti korunách (L2), po padesáti (L3).
    const step = level === 2 ? 5 : 50;
    const lo = Math.ceil((x.price + 1) / step);
    const hi = (level === 2 ? 100 : 1000) / step;
    if (lo > hi) return null;
    const budget = rng.int(lo, hi) * step;
    const rest = budget - x.price;
    const match = others.filter((o) => (still ? o.price <= rest : o.price > rest));
    if (match.length !== 1) return null;
    const y = match[0];
    const ask = `na co ti ${still ? 'ještě zbude' : 'už nezbude'}?`;
    return q(
      `${still ? 'zbude' : 'nezbude'}-${budget}-${x.good.key}${x.price}-${others.map((o) => `${o.good.key}${o.price}`).join('-')}`,
      `Máš ${kc(budget)}. Když koupíš ${x.good.acc} za ${kc(x.price)}, ${ask}`,
      title(y),
      others.filter((o) => o !== y).map(title),
      ['Nejdřív spočítej, kolik ti po prvním nákupu zbude.', 'Pak porovnej zbytek s cenovkami.'],
      still
        ? `Zbude ti ${f(budget)} − ${f(x.price)} = ${kc(rest)}. To stačí jen na ${y.good.acc} za ${kc(y.price)}. Každý nákup zmenší, co ti zbude na další věci.`
        : `Zbude ti ${f(budget)} − ${f(x.price)} = ${kc(rest)}. Na ${y.good.acc} za ${kc(y.price)} už to nestačí. To tě tvůj výběr „stojí“.`,
      {
        visual: offer(others),
        speak: `Máš ${korun(budget)}. Když koupíš ${x.good.acc} za ${korun(x.price)}, ${ask} Na kartách ${isOffer(others)}.`,
        difficulty: still ? 0 : 0.2,
      },
    );
  };
}

/** Nejdřív potřeby: kolik zbude na přání? */
function naPrani(level: 3 | 4): Attempt {
  return (rng) => {
    const budget = level === 3 ? rng.pick([100, 150, 200]) : rng.pick([300, 500, 1000]);
    const needs = pickDistinct(rng, level === 3 ? NEEDS.filter((n) => n.max <= 60) : NEEDS, 2).map((n) => ({ ...n, price: rng.int(n.min, n.max) }));
    const cost = sum(needs.map((n) => n.price));
    if (cost >= budget) return null;
    return nm(
      `naprani-${budget}-${needs.map((n) => `${n.key}${n.price}`).join('-')}`,
      `Máš ${kc(budget)}. Nejdřív musíš koupit ${list(needs.map((n) => `${n.acc} za ${kc(n.price)}`))}. Kolik ti zbude na přání?`,
      budget - cost,
      ['Sečti, kolik stojí potřeby.', 'Součet odečti od svých peněz.'],
      `Potřeby stojí ${f(needs[0].price)} + ${f(needs[1].price)} = ${kc(cost)}. Na přání zbude ${f(budget)} − ${f(cost)} = ${kc(budget - cost)}.`,
      { unit: 'Kč', difficulty: level === 4 ? 0.1 : 0 },
    );
  };
}

/** Nejdřív potřeby, pak jedno přání z nabídky. */
function potomPrani(rng: Rng): Spec | null {
  const budget = rng.pick([300, 400, 500, 800, 1000]);
  const needs = pickDistinct(rng, NEEDS, 2).map((n) => ({ ...n, price: rng.int(n.min, n.max) }));
  const cost = sum(needs.map((n) => n.price));
  const rest = budget - cost;
  if (rest < 40) return null;
  const wishes = offerOf(rng, WISHES(), 3);
  if (!wishes) return null;
  const fit = wishes.filter((w) => w.price <= rest);
  if (fit.length !== 1) return null;
  const ask = 'Které přání si pak ještě můžeš koupit?';
  return q(
    `potomprani-${budget}-${needs.map((n) => `${n.key}${n.price}`).join('-')}-${wishes.map((w) => `${w.good.key}${w.price}`).join('-')}`,
    `Máš ${kc(budget)}. Nejdřív musíš koupit ${list(needs.map((n) => `${n.acc} za ${kc(n.price)}`))}. ${ask}`,
    title(fit[0]),
    wishes.filter((w) => w !== fit[0]).map(title),
    ['Nejdřív spočítej, kolik stojí potřeby.', 'Kolik ti po nich zbude? Porovnej to s cenovkami přání.'],
    `Potřeby stojí ${f(needs[0].price)} + ${f(needs[1].price)} = ${kc(cost)} a zbude ${f(budget)} − ${f(cost)} = ${kc(rest)}. Na to stačí jen ${fit[0].good.nom} za ${kc(fit[0].price)}.`,
    { visual: offer(wishes), speak: `Máš ${korun(budget)}. Nejdřív musíš koupit ${list(needs.map((n) => `${n.acc} za ${korun(n.price)}`))}. ${ask} Přání jsou: ${speakOffer(wishes)}.`, difficulty: 0.2 },
  );
}

/** Potřeby do školy a domácnosti (4. pád) s rozsahem cen. */
const NEEDS = [
  { key: 'sesity', acc: 'sešity', min: 30, max: 60 },
  { key: 'pastelky', acc: 'pastelky do školy', min: 40, max: 90 },
  { key: 'chleb', acc: 'chléb', min: 35, max: 55 },
  { key: 'mleko', acc: 'mléko', min: 20, max: 30 },
  { key: 'mydlo', acc: 'mýdlo', min: 15, max: 35 },
  { key: 'boty', acc: 'boty na tělocvik', min: 150, max: 350 },
  { key: 'rukavice', acc: 'rukavice na zimu', min: 100, max: 250 },
  { key: 'kartacek', acc: 'zubní kartáček', min: 25, max: 60 },
];

/** Přání z nabídky (hračky a zábava). */
const WISHES = () => goodsBetween(40, 900).filter((g) => ['jojo', 'konik', 'mic', 'puzzle', 'plysak', 'drak', 'knizka', 'prut'].includes(g.key));

// ---------------------------------------------------------------------------

export const potreby = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Potřeby a přání',
  description: 'Rozlišování potřeb a přání, výběr v rámci peněz, které máme, co nás výběr stojí a čekání na odměnu.',
  rvp: { 1: ['ČJS-5-2-03'], 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03'] },
  ability: 'usuzovani',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
  gen: {
    1: mix(ID, [[1, koupis(20)]]),
    2: mix(ID, [[1, koupis(100)], [1.5, dvojice], [1.5, zbude(2)]]),
    3: mix(ID, [[2, zbude(3)], [1, naPrani(3)]]),
    4: mix(ID, [[1, naPrani(4)], [2, potomPrani]]),
  },
});
