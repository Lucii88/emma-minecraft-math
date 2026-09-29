// Pokusy a látky: skupenství vody, plave × potopí se, magnet, rozpouštění,
// měřidla a jednotky, kroky pokusu, spravedlivý pokus (měníme jen jednu věc),
// bezpečnost (pokusy s ohněm a horkou vodou jen s dospělým).

import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, KnowledgeCard } from '../../core/types';
import { fixed, num, ord, pickSome, q, slug } from './common';

const ID = 'svet.pokusy';

/** Teplota jako tlačítko: „100 °C“ se předčítá slovy. */
const tepl = (label: string, speak: string): ChoiceOption => ({ label, speak });

// ---------------------------------------------------------------------------
// Plave, nebo se potopí?

/** [1. pád, 4. pád, plave?, vysvětlení] */
type Vec = [string, string, boolean, string];

const PLAVE_L1: Vec[] = [
  ['korek', 'korek', true, 'Korek je lehký a plný drobných vzduchových bublinek, a tak plave.'],
  ['dřevěná kostka', 'dřevěnou kostku', true, 'Dřevo je lehčí než stejně velký kus vody, a proto dřevěná kostka plave.'],
  ['plastový míček', 'plastový míček', true, 'Míček je uvnitř plný vzduchu, a tak plave.'],
  ['jablko', 'jablko', true, 'Jablko plave, protože je v něm hodně vzduchu.'],
  ['pírko', 'pírko', true, 'Pírko je velmi lehké a zůstane na hladině.'],
  ['pingpongový míček', 'pingpongový míček', true, 'Pingpongový míček je dutý a plný vzduchu, a tak plave.'],
  ['gumová kachnička', 'gumovou kachničku', true, 'Gumová kachnička je dutá a plná vzduchu, a tak plave.'],
  ['kamínek', 'kamínek', false, 'Kámen je těžší než stejně velký kus vody, a tak se potopí.'],
  ['železný hřebík', 'železný hřebík', false, 'Železný hřebík je malý, ale těžký a plný, a tak se potopí.'],
  ['klíč', 'klíč', false, 'Kovový klíč se potopí, protože kov je těžší než stejně velký kus vody.'],
  ['skleněná kulička', 'skleněnou kuličku', false, 'Skleněná kulička je plná a těžká, a tak se potopí.'],
  ['kovová lžička', 'kovovou lžičku', false, 'Kovová lžička se potopí, protože kov je těžší než voda.'],
  ['kulička z plastelíny', 'kuličku z plastelíny', false, 'Kulička z plastelíny se potopí. Když ale z plastelíny uděláš lodičku, bude plavat.'],
  ['mince', 'minci', false, 'Mince je z kovu, a tak se potopí.'],
];

const PLAVE_L2: Vec[] = [
  ['dřevěná tužka', 'dřevěnou tužku', true, 'Dřevěná tužka plave, protože dřevo je lehčí než stejně velký kus vody.'],
  ['svíčka', 'svíčku', true, 'Vosk je o trochu lehčí než voda, a tak svíčka plave.'],
  ['kostka ledu', 'kostku ledu', true, 'Led je lehčí než stejně velký kus vody, a tak kostka ledu plave.'],
  // Bez vlašského ořechu: čerstvý ořech se často potopí, suchý plave.
  ['zavřená prázdná láhev', 'zavřenou prázdnou láhev', true, 'Zavřená láhev je plná vzduchu, a tak plave. Když do ní napustíš vodu, potopí se.'],
  ['kousek polystyrenu', 'kousek polystyrenu', true, 'Polystyren je skoro celý ze vzduchových bublinek, a tak plave.'],
  ['brambora', 'bramboru', false, 'Brambora je těžší než stejně velký kus vody, a tak se potopí.'],
  ['guma na gumování', 'gumu na gumování', false, 'Guma na gumování je těžší než stejně velký kus vody, a tak se potopí.'],
  ['kulička hroznového vína', 'kuličku hroznového vína', false, 'Kulička hroznového vína se ve vodě potopí.'],
  ['kovový šroubek', 'kovový šroubek', false, 'Kovový šroubek je plný kov, a tak se potopí.'],
  ['kamínek', 'kamínek', false, 'Kámen je těžší než stejně velký kus vody, a tak se potopí.'],
];

function plaveNeboNe(pool: Vec[]) {
  return (rng: Rng): Spec => {
    const [nom, acc, plave, explain] = rng.pick(pool);
    return fixed(`plave-${slug(nom)}`, `Pustíš do vody ${acc}. Bude plavat, nebo se potopí?`, ['Bude plavat', 'Potopí se'], plave ? 0 : 1,
      ['Je ta věc lehká, nebo je v ní vzduch?', 'Je z kovu, kamene nebo skla?'],
      explain);
  };
}

// ---------------------------------------------------------------------------
// Přitáhne magnet…?

/** [4. pád, přitáhne?, vysvětlení] */
type MagVec = [string, boolean, string];

const MAGNET_L1: MagVec[] = [
  ['železný hřebík', true, 'Hřebík je ze železa a magnet železo přitahuje.'],
  ['ocelovou kancelářskou sponku', true, 'Sponka je z oceli a ocel je hlavně železo. Magnet ji přitáhne.'],
  ['železný šroubek', true, 'Šroubek je ze železa, a tak ho magnet přitáhne.'],
  ['ocelový špendlík', true, 'Špendlík je z oceli, a tak ho magnet přitáhne.'],
  ['dřevěnou tužku', false, 'Dřevo magnet nepřitahuje.'],
  ['plastové víčko', false, 'Plast magnet nepřitahuje.'],
  ['papír', false, 'Papír magnet nepřitahuje.'],
  ['gumu', false, 'Gumu magnet nepřitahuje.'],
  ['skleněnou kuličku', false, 'Sklo magnet nepřitahuje.'],
  ['korek', false, 'Korek magnet nepřitahuje.'],
];

/** Bez zlatého prstýnku, stříbrné lžičky a konzervy: levné šperky bývají z pozlacené
 *  oceli, „stříbrné“ lžičky z nerezu nebo alpaky a některé konzervy z hliníku –
 *  doma by pokus mohl dopadnout jinak. */
const MAGNET_L3: MagVec[] = [
  ['hliníkovou plechovku od limonády', false, 'Hliník je kov, ale magnet ho nepřitahuje. Magnet přitahuje hlavně železo.'],
  ['hliníkovou fólii', false, 'Hliníková fólie je z kovu, ale magnet ji nepřitáhne. Hliník není železo.'],
  ['měděný drátek', false, 'Měď je kov, ale magnet ji nepřitahuje.'],
  ['plechové víčko od sklenice s okurkami', true, 'Víčka od sklenic s okurkami nebo marmeládou jsou z ocelového plechu, a tak je magnet přitáhne.'],
  ['železnou matičku', true, 'Matička je ze železa, a tak ji magnet přitáhne.'],
  ['ocelovou kancelářskou sponku', true, 'Sponka je z oceli a ocel je hlavně železo. Magnet ji přitáhne.'],
  ['ocelovou kuličku', true, 'Kulička je z oceli, a tak ji magnet přitáhne.'],
];

function magnet(pool: MagVec[]) {
  return (rng: Rng): Spec => {
    const [acc, yes, explain] = rng.pick(pool);
    return fixed(`magnet-${slug(acc)}`, `Přitáhne magnet ${acc}?`, ['Ano, přitáhne', 'Ne, nepřitáhne'], yes ? 0 : 1,
      ['Magnet přitahuje železo. Je ta věc ze železa?'],
      explain);
  };
}

// ---------------------------------------------------------------------------
// Rozpustí se ve vodě?

/** [klíč, zadání bez otázky, rozpustí se?, vysvětlení] */
type RozVec = [string, string, boolean, string];

const ROZPUSTI_L1: RozVec[] = [
  ['cukr', 'Nasypeš do sklenice s vodou lžičku cukru a zamícháš.', true, 'Cukr se ve vodě rozpustí – zmizí z očí, ale voda je sladká.'],
  ['sul', 'Nasypeš do sklenice s vodou lžičku soli a zamícháš.', true, 'Sůl se ve vodě rozpustí. Nevidíme ji, ale voda je slaná.'],
  ['kostka-cukru', 'Dáš do teplého čaje kostku cukru a zamícháš.', true, 'Kostka cukru se v teplém čaji rozpustí a čaj zesládne.'],
  ['pisek', 'Nasypeš do sklenice s vodou lžičku písku a zamícháš.', false, 'Písek se nerozpustí. Po chvíli klesne ke dnu.'],
  ['kaminky', 'Dáš do sklenice s vodou pár kamínků a zamícháš.', false, 'Kamínky se ve vodě nerozpustí, zůstanou ležet na dně.'],
  ['ryze', 'Nasypeš do sklenice se studenou vodou lžičku rýže a zamícháš.', false, 'Rýže se ve studené vodě nerozpustí, zrníčka klesnou ke dnu.'],
];

const ROZPUSTI_L2: RozVec[] = [
  ['med', 'Dáš do teplé vody lžičku medu a zamícháš.', true, 'Med se v teplé vodě rozpustí a voda zesládne.'],
  ['olej', 'Naleješ do sklenice s vodou lžičku oleje a zamícháš.', false, 'Olej se ve vodě nerozpustí. Po chvíli vyplave nahoru a udělá na hladině oka.'],
  ['koralky', 'Nasypeš do sklenice s vodou hrst korálků a zamícháš.', false, 'Korálky se nerozpustí. Pořád je ve vodě uvidíš.'],
  ['piliny', 'Nasypeš do sklenice s vodou hrst dřevěných pilin a zamícháš.', false, 'Piliny se nerozpustí. Většina jich zůstane plavat na hladině.'],
  ['sul-tepla', 'Nasypeš do teplé vody lžičku soli a zamícháš.', true, 'Sůl se v teplé vodě rozpustí ještě rychleji než ve studené.'],
  ['pisek-tepla', 'Nasypeš do teplé vody lžičku písku a zamícháš.', false, 'Písek se nerozpustí ani v teplé vodě. Klesne ke dnu.'],
];

function rozpusti(pool: RozVec[]) {
  return (rng: Rng): Spec => {
    const [key, text, yes, explain] = rng.pick(pool);
    return fixed(`rozpusti-${key}`, `${text} Rozpustí se?`, ['Ano, rozpustí se', 'Ne, nerozpustí se'], yes ? 0 : 1,
      ['Zmizí ta věc ve vodě z očí, nebo ji pořád uvidíš?'],
      explain);
  };
}

// ---------------------------------------------------------------------------
// Měřidla a jednotky

const MERIDLA = ['Metrem', 'Teploměrem', 'Váhou', 'Odměrkou', 'Stopkami'] as const;
type Meridlo = (typeof MERIDLA)[number];

/** [klíč, co měříme, měřidlo, vysvětlení, měřidla, která by šla použít také, a proto
 *  nesmí být chybnou možností]. Vodu i mléko jde odměřit i vážením. */
const CO_MERIME: [string, string, Meridlo, string, Meridlo[]?][] = [
  ['stul', 'jak dlouhý je stůl', 'Metrem', 'Délku stolu změříme metrem. Je na něm stupnice v centimetrech.'],
  ['postava', 'jak jsi vysoká', 'Metrem', 'Výšku postavy změříme metrem, třeba u zdi nebo na dveřích.'],
  ['voda-lavor', 'jak teplá je voda v lavoru', 'Teploměrem', 'Teplotu vody změříme teploměrem. Ukáže ji ve stupních Celsia.'],
  ['venku', 'jak teplo je venku', 'Teploměrem', 'Teplotu vzduchu změříme teploměrem za oknem.'],
  ['jablka', 'kolik váží jablka', 'Váhou', 'Kolik co váží, zjistíme vážením na váze.'],
  ['batoh', 'kolik váží tvůj batoh', 'Váhou', 'Hmotnost batohu zjistíme vážením na váze.'],
  ['hrnek', 'kolik vody se vejde do hrnku', 'Odměrkou', 'Kolik vody se vejde do hrnku, zjistíme odměrkou – nádobou s čárkami.', ['Váhou']],
  ['mleko', 'kolik mléka naleješ do těsta', 'Odměrkou', 'Mléko do těsta odměříme odměrkou. Na boku má čárky s mililitry.', ['Váhou']],
  ['noha', 'jak dlouho vydržíš stát na jedné noze', 'Stopkami', 'Jak dlouho něco trvá, změříme stopkami.'],
  ['kolecko', 'za jak dlouho oběhneš dům', 'Stopkami', 'Čas běhu změříme stopkami.'],
];

function cimZmeris(rng: Rng): Spec {
  const [key, co, meridlo, explain, also = []] = rng.pick(CO_MERIME);
  return q(`meridlo-${key}`, `Čím změříš, ${co}?`, meridlo, pickSome(rng, MERIDLA, 3, [meridlo, ...also]),
    ['Co chceš zjistit: délku, teplotu, hmotnost, objem, nebo čas?'],
    explain);
}

type Velicina = 'delka' | 'hmotnost' | 'objem' | 'teplota' | 'cas';
const JEDNOTKY: Record<Velicina, string[]> = {
  delka: ['V milimetrech', 'V centimetrech', 'V metrech', 'V kilometrech'],
  hmotnost: ['V gramech', 'V kilogramech'],
  objem: ['V mililitrech', 'V litrech'],
  teplota: ['Ve stupních Celsia'],
  cas: ['V sekundách', 'V minutách', 'V hodinách'],
};

/** [klíč, co měříme, veličina, správná jednotka, vysvětlení] */
type JedVec = [string, string, Velicina, string, string];

const JEDNOTKY_L2: JedVec[] = [
  ['tuzka', 'délku tužky', 'delka', 'V centimetrech', 'Tužka je dlouhá asi 15 až 20 centimetrů. Krátké věci měříme v centimetrech, delší v metrech.'],
  ['strom', 'výšku stromu', 'delka', 'V metrech', 'Strom bývá vysoký několik metrů. Délky a výšky měříme v metrech.'],
  ['pes', 'hmotnost psa', 'hmotnost', 'V kilogramech', 'Hmotnost měříme v kilogramech. Velký pes váží třeba 30 kilogramů.'],
  ['vana', 'kolik vody je ve vaně', 'objem', 'V litrech', 'Množství vody měříme v litrech. Do vany se vejde přes sto litrů.'],
  ['pokoj', 'teplotu v pokoji', 'teplota', 'Ve stupních Celsia', 'Teplotu měříme ve stupních Celsia. V pokoji bývá kolem 21 stupňů.'],
  ['zuby', 'jak dlouho si čistíš zuby', 'cas', 'V minutách', 'Čas měříme v sekundách, minutách a hodinách. Zuby si čistíme asi dvě minuty.'],
];

const JEDNOTKY_L3: JedVec[] = [
  ['mravenec', 'délku mravence', 'delka', 'V milimetrech', 'Mravenec je dlouhý jen několik milimetrů. Na malé věci jsou milimetry nejlepší.'],
  ['cesta-vylet', 'délku cesty na výlet autem', 'delka', 'V kilometrech', 'Dlouhé cesty měříme v kilometrech. Jeden kilometr je tisíc metrů.'],
  ['bonbon', 'hmotnost jednoho bonbonu', 'hmotnost', 'V gramech', 'Lehké věci vážíme v gramech. Bonbon váží jen pár gramů.'],
  ['lek', 'kolik sirupu je na lžičce', 'objem', 'V mililitrech', 'Malá množství tekutin měříme v mililitrech. Na lžičku se vejde asi 5 mililitrů.'],
  ['sprint', 'jak dlouho trvá sprint na 50 metrů', 'cas', 'V sekundách', 'Krátký sprint trvá jen několik sekund, a tak ho měříme v sekundách.'],
  ['vylet-cas', 'jak dlouho trvá cesta vlakem k babičce do jiného kraje', 'cas', 'V hodinách', 'Dlouhé cesty trvají hodiny, a tak je měříme v hodinách.'],
  ['pytel', 'hmotnost pytle brambor', 'hmotnost', 'V kilogramech', 'Pytel brambor váží několik kilogramů. Těžší věci vážíme v kilogramech.'],
  ['horecka', 'teplotu, když máš horečku', 'teplota', 'Ve stupních Celsia', 'Teplotu těla měříme teploměrem ve stupních Celsia. Zdravý člověk má kolem 36 a půl stupně.'],
];

/** Druhá nápověda podle veličiny (u teploty stačí první). */
const JEDNOTKY_HINT: Record<Velicina, string | null> = {
  delka: 'Je to dlouhé, nebo krátké?',
  hmotnost: 'Je to těžké, nebo lehké?',
  objem: 'Je toho hodně, nebo málo?',
  teplota: null,
  cas: 'Trvá to dlouho, nebo krátce?',
};

function vJakychJednotkach(pool: JedVec[]) {
  return (rng: Rng): Spec => {
    const [key, co, velicina, correct, explain] = rng.pick(pool);
    const others = (Object.keys(JEDNOTKY) as Velicina[]).filter((v) => v !== velicina).flatMap((v) => JEDNOTKY[v]);
    // Vedlejší věta („kolik vody…“, „jak dlouho…“) se odděluje čárkou.
    const sep = /^(kolik|jak) /.test(co) ? ', ' : ' ';
    const hint2 = JEDNOTKY_HINT[velicina];
    return q(`jednotka-${key}`, `V jakých jednotkách nejlépe změříš${sep}${co}?`, correct, pickSome(rng, others, 3),
      ['Měříš délku, hmotnost, objem, teplotu, nebo čas?', ...(hint2 ? [hint2] : [])],
      explain);
  };
}

// ---------------------------------------------------------------------------
// Grafy z pokusů

const DNY = ['Po', 'Út', 'St', 'Čt', 'Pá'];
const DNY_1 = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek'];
const DNY_4 = ['pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek'];
const DNY_V = ['v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek'];

/** Výška fazole v cm po dnech: přečti hodnotu, nebo spočítej, kolik vyrostla. */
function grafFazole(rng: Rng): Spec {
  const heights = [rng.int(1, 4)];
  for (let i = 1; i < 5; i++) heights.push(heights[i - 1] + rng.int(0, 3));
  const visual = { type: 'bars' as const, title: 'Výška fazole', unit: 'cm', bars: DNY.map((label, i) => ({ label, value: heights[i] })) };
  const data = heights.join('-');
  const said = `Graf ukazuje výšku fazole v centimetrech: ${DNY_1.map((d, i) => `${d} ${heights[i]}`).join(', ')}.`;
  if (rng.chance(0.5)) {
    const day = rng.int(0, 4);
    const prompt = `Graf ukazuje výšku fazole. Jak vysoká byla fazole ${DNY_V[day]}?`;
    return num(`graf-${data}-den-${day}`, prompt, heights[day],
      ['Najdi sloupec toho dne a podívej se, kam sahá.'],
      `Sloupec pro ${DNY_4[day]} sahá k číslu ${heights[day]}. Fazole byla vysoká ${heights[day]} cm.`,
      { visual, unit: 'cm', speak: `${said} Jak vysoká byla fazole ${DNY_V[day]}?` });
  }
  const growth = heights[4] - heights[0];
  return num(`graf-${data}-rust`, 'Graf ukazuje výšku fazole. O kolik centimetrů vyrostla od pondělí do pátku?', growth,
    ['Najdi výšku v pondělí a v pátek.', 'Odečti menší číslo od většího.'],
    `V pondělí měla fazole ${heights[0]} cm a v pátek ${heights[4]} cm. Vyrostla o ${heights[4]} − ${heights[0]} = ${growth} cm.`,
    { visual, unit: 'cm', speak: `${said} O kolik centimetrů vyrostla od pondělí do pátku?` });
}

/** Teploty ve třech dnech: průměr (vždy vyjde celé číslo) nebo rozdíl. */
function grafTeplot(rng: Rng): Spec {
  const avg = rng.int(8, 16); // nejnižší možná teplota je 8 − 8 = 0 °C, sloupce nejdou pod nulu
  const d1 = rng.int(-4, 4);
  const d2 = rng.int(-4, 4);
  const t = [avg + d1, avg + d2, avg - d1 - d2];
  const labels = ['Pondělí', 'Úterý', 'Středa'];
  const visual = { type: 'bars' as const, title: 'Teplota v poledne', unit: '°C', bars: labels.map((label, i) => ({ label, value: t[i] })) };
  const data = t.join('-');
  const said = `Graf ukazuje teplotu v poledne ve stupních Celsia: pondělí ${t[0]}, úterý ${t[1]}, středa ${t[2]}.`;
  const hi = Math.max(...t);
  const lo = Math.min(...t);
  if (hi === lo || rng.chance(0.5)) {
    const sum = t[0] + t[1] + t[2];
    return num(`teploty-${data}-prumer`, 'Graf ukazuje teplotu ve třech dnech. Jaká byla průměrná teplota?', avg,
      ['Sečti všechny tři teploty.', 'Součet vyděl počtem dní.'],
      `${t[0]} + ${t[1]} + ${t[2]} = ${sum} a ${sum} : 3 = ${avg}. Průměrná teplota byla ${avg} °C.`,
      { visual, unit: '°C', speak: `${said} Jaká byla průměrná teplota?` });
  }
  return num(`teploty-${data}-rozdil`, 'Graf ukazuje teplotu ve třech dnech. O kolik stupňů byl nejteplejší den teplejší než nejchladnější?', hi - lo,
    ['Najdi nejvyšší a nejnižší sloupec.', 'Odečti menší číslo od většího.'],
    `Nejtepleji bylo ${hi} °C, nejchladněji ${lo} °C. Rozdíl je ${hi} − ${lo} = ${hi - lo} °C.`,
    { visual, unit: '°C', speak: `${said} O kolik stupňů byl nejteplejší den teplejší než nejchladnější?` });
}

// ---------------------------------------------------------------------------
// L1 – skupenství vody, bezpečnost, magnet, rozpouštění, měřidla

const L1: Spec[] = [
  q('led-teplo', 'Co se stane s kostkou ledu na teplém talíři?', 'Roztaje na vodu',
    ['Promění se v kámen', 'Zvětší se', 'Zůstane stejná'],
    ['Co se děje se sněhulákem na jaře?'],
    'V teple led roztaje a změní se ve vodu. Voda je pořád stejná látka, jen v jiném skupenství.'),
  q('voda-mrazak', 'Co vznikne z vody v mrazáku?', 'Led',
    ['Pára', 'Mléko', 'Písek'],
    ['V mrazáku je mráz.'],
    'V mrazu voda zamrzne a vznikne led. Když ho vytáhneš, zase roztaje.'),
  q('para', 'Co stoupá nad hrncem s vařící vodou?', 'Pára',
    ['Led', 'Písek', 'Kouř z ohně'],
    ['Voda se v horku mění v něco, co stoupá vzhůru.'],
    'Z vařící vody vzniká pára. Nad hrncem vidíme bílý obláček z drobných kapiček. K hrnci chodíme jen s dospělým.'),
  q('horka-voda', 'Chceš dělat pokus s horkou vodou. Co uděláš?', 'Požádám dospělého o pomoc',
    ['Zkusím to sama potajmu', 'Sáhnu do vody, jestli je horká', 'Postavím hrnec na zem'],
    ['Horká voda může opařit.'],
    'Pokusy s horkou vodou, ohněm nebo sporákem děláme vždycky s dospělým.'),
  q('neochutnavat', 'Smíš při pokusu ochutnat neznámou látku?', 'Ne, nikdy',
    ['Ano, trochu', 'Ano, když je bílá', 'Ano, když voní'],
    ['Poznáš cukr od prášku na praní jen podle barvy?'],
    'Neznámé látky nikdy neochutnáváme. Bílý prášek může být cukr nebo sůl, ale i prášek na praní.'),
  q('teplomer', 'Co ukazuje teploměr?', 'Jak je teplo nebo zima',
    ['Kolik je hodin', 'Kolik co váží', 'Jak je co dlouhé'],
    ['Podívej se na teploměr za oknem.'],
    'Teploměr měří teplotu. Venku ukáže, jestli je mráz, nebo teplo.'),
  q('snih-doma', 'Necháš hrnek sněhu stát doma v teple. Co v něm bude za pár hodin?', 'Voda',
    ['Písek', 'Mléko', 'Kamínky'],
    ['V pokoji je teplo.'],
    'V teple sníh roztaje a v hrnku zůstane voda. Všimni si, že vody je mnohem méně, než bylo sněhu.'),
  q('louze', 'Kam zmizí louže, když svítí slunce?', 'Voda se vypaří do vzduchu',
    ['Odnesou ji ptáci', 'Promění se v led', 'Promění se v písek'],
    ['Co dělá sluníčko s mokrým prádlem?'],
    'Sluníčko vodu ohřeje a ta se pomalu vypaří do vzduchu jako neviditelná pára. Část vody se také vsákne do země.'),
  q('pradlo', 'Kde uschne mokré prádlo nejrychleji?', 'Venku na slunci a ve větru',
    ['Ve skříni', 'V igelitovém sáčku', 'Ve sklepě'],
    ['Co pomáhá vodě vypařit se?'],
    'Teplo a vítr pomáhají vodě vypařit se. Proto prádlo nejrychleji uschne venku na slunci.'),
  ord('led-voda-para', 'Seřaď, jak se mění voda, když ji ohříváme. Začni ledem.', ['Led', 'Voda', 'Pára'],
    ['Co se stane s ledem v teple?'],
    'Led v teple roztaje na vodu a voda se při varu mění v páru.'),
  q('magnet-co', 'Co z toho přitáhne magnet?', 'Železný hřebík',
    ['Dřevěnou tužku', 'Plastové víčko', 'Papír', 'Gumu'],
    ['Magnet přitahuje některé kovy.'],
    'Magnet přitahuje železo. Dřevo, plast, papír ani guma se k němu nepřichytí.'),
  q('cukr-caj', 'Co se stane s kostkou cukru v teplém čaji?', 'Rozpustí se',
    ['Poplave jako loďka', 'Ztvrdne', 'Změní se v led'],
    ['Proč čaj po zamíchání zesládne?'],
    'Cukr se v čaji rozpustí – rozpadne se na tak malé kousky, že je nevidíme. Poznáme ho ale podle chuti.'),
  q('pisek-voda', 'Nasypeš písek do sklenice s vodou a zamícháš. Co se stane?', 'Písek klesne ke dnu',
    ['Písek se rozpustí', 'Voda zmizí', 'Písek začne plavat'],
    ['Viděla jsi někdy písek na dně potoka?'],
    'Písek se ve vodě nerozpustí. Po zamíchání se zvíří a pak klesne ke dnu.'),
  q('odhad-prvni', 'Chceš zjistit, jestli jablko plave. Co uděláš ještě před pokusem?', 'Odhadnu, co se stane',
    ['Rovnou napíšu závěr', 'Pokus vynechám', 'Jablko schovám'],
    ['Co si myslíš, že se stane?'],
    'Dobrá badatelka nejdřív odhadne, co se stane, a pak to pokusem ověří. Porovnat odhad s výsledkem je zábava.'),
  q('svicka', 'Chceš vyzkoušet, co udělá svíčka pod sklenicí. Co uděláš jako první?', 'Zavolám dospělého',
    ['Zapálím ji sama', 'Půjdu potajmu pro sirky', 'Postavím ji na postel'],
    ['S ohněm si děti samy nehrají.'],
    'Pokusy s ohněm děláme jen s dospělým a na bezpečném místě. Svíčka pod sklenicí po chvíli zhasne, protože už nemá dost kyslíku.'),
  q('stopky', 'Co měří stopky?', 'Čas',
    ['Teplotu', 'Délku', 'Hmotnost'],
    ['Používají se při běžeckém závodě.'],
    'Stopky měří čas – třeba za jak dlouho uběhneš kolečko nebo jak dlouho se vaří vajíčko.'),
  q('odmerka', 'Co měříme odměrkou?', 'Kolik je tekutiny',
    ['Teplotu', 'Čas', 'Délku'],
    ['Odměrka je nádoba s čárkami na boku.'],
    'Odměrkou odměříme, kolik je vody nebo mléka – třeba půl litru do těsta.'),
];

// ---------------------------------------------------------------------------
// L2 – kroky pokusu, pára a rosa, vzduch zabírá místo

const L2: Spec[] = [
  ord('kroky-pokusu', 'Seřaď kroky pokusu.', ['Otázka', 'Odhad', 'Pokus', 'Pozorování výsledku', 'Závěr'],
    ['Čím každé bádání začíná?', 'Kdy si zapíšeš, co jsi zjistila?'],
    'Badatelka se nejdřív zeptá, pak odhadne, co se stane, udělá pokus, pozoruje a nakonec napíše závěr.'),
  q('odhad-co', 'Co je při pokusu odhad?', 'Co si myslím, že se stane',
    ['Co se opravdu stalo', 'Jak se pokus jmenuje', 'Co si zapíšu na konec'],
    ['Odhad děláme ještě před pokusem.'],
    'Odhad je to, co si myslíme, že se stane. Pokusem ho pak ověříme – a když nevyjde, naučili jsme se něco nového.'),
  q('zapisovat', 'Proč si při pokusu zapisujeme, co vidíme?', 'Abychom nezapomněli a mohli porovnat',
    ['Aby byl pokus delší', 'Aby se pokus povedl', 'Protože se to musí'],
    ['Pamatuješ si přesně, co bylo před týdnem?'],
    'Zápis pomůže nezapomenout a porovnat výsledky. Vědci si zapisují každé měření.'),
  q('rychleji-rozpusti', 'Kde se cukr rozpustí rychleji?', 'V teplé vodě',
    ['Ve studené vodě', 'Všude stejně rychle', 'V ledu'],
    ['Vyzkoušej to se dvěma sklenicemi.'],
    'V teplé vodě se cukr rozpouští rychleji. Můžeš to vyzkoušet se dvěma stejnými sklenicemi a stopkami.'),
  q('vaha-miska', 'Na jedné misce vah je jablko, na druhé švestka. Která miska klesne?', 'Ta s jablkem',
    ['Ta se švestkou', 'Žádná', 'Obě'],
    ['Klesne miska s těžší, nebo s lehčí věcí?'],
    'Klesne miska s těžší věcí. Jablko je těžší než švestka, a tak jeho miska klesne.'),
  q('magnet-papir', 'Přitáhne magnet sponku přes list papíru?', 'Ano, magnet působí i přes papír',
    ['Ne, papír magnet zastaví', 'Jen když je papír mokrý', 'Jen v noci'],
    ['Jak drží obrázek na lednici?'],
    'Magnet působí i přes tenký papír. Proto drží obrázek na dvířkách lednice.'),
  q('houbicka', 'Co se stane s mokrou houbičkou na nádobí, když ji dáš na topení?', 'Uschne',
    ['Zmokne ještě víc', 'Zmrzne', 'Zmodrá'],
    ['Kam se ztratí voda z houbičky?'],
    'Teplo z topení vodu vypaří a houbička uschne.'),
  q('poklice', 'Proč jsou na poklici nad vařící vodou kapky?', 'Pára se na chladné poklici srazí',
    ['Voda prosákne poklicí', 'Někdo ji pokapal', 'Poklice se potí'],
    ['Co je pára?'],
    'Pára z hrnce narazí na chladnější poklici a změní se zpátky v kapky vody.'),
  q('orosena-lahev', 'Vyndáš z lednice studenou láhev. Proč se za chvíli orosí?', 'Pára ze vzduchu se na ní srazí',
    ['Voda prosákne sklem', 'Láhev se potí jako člověk', 'Někdo ji polil'],
    ['Ve vzduchu je vždycky trochu neviditelné vodní páry.'],
    'Ve vzduchu je neviditelná vodní pára. Když se dotkne studené láhve, zchladne a změní se v kapičky.'),
  q('pravitko', 'Čím změříš, jak dlouhá je tvoje tužka?', 'Pravítkem',
    ['Teploměrem', 'Váhou', 'Stopkami'],
    ['Na čem jsou vyznačené centimetry?'],
    'Délku tužky změříme pravítkem. Je na něm stupnice v centimetrech a milimetrech.'),
  q('prazdna-lahev', 'Je v prázdné láhvi něco?', 'Vzduch',
    ['Nic', 'Voda', 'Písek'],
    ['Zkus zavřenou prázdnou láhev zmáčknout.'],
    'V „prázdné“ láhvi je vzduch. Když ji zavřeš a zmáčkneš, ucítíš, že se vzduch brání.'),
  q('balonek', 'Jak dokážeš, že vzduch zabírá místo?', 'Nafouknu balonek',
    ['Zavřu oči', 'Zhasnu světlo', 'Zakřičím'],
    ['Co se stane s balonkem, když do něj foukáš?'],
    'Když do balonku foukáš, vzduch ho nafoukne. Vzduch zabírá místo, i když ho nevidíme.'),
  q('led-kde', 'Kde roztaje kostka ledu nejrychleji?', 'Na slunci',
    ['V mrazáku', 'Ve stínu v zimě', 'Ve sněhu'],
    ['Kde je nejtepleji?'],
    'Na slunci je nejtepleji, a tak tam led roztaje nejrychleji.'),
  q('nula', 'Teploměr za oknem ukazuje 0 °C. Co to znamená?', 'Voda může začít mrznout',
    ['Je horko', 'Teploměr je rozbitý', 'Venku není žádná teplota'],
    ['Při jaké teplotě mrzne voda?'],
    'Nula stupňů Celsia je teplota, při které voda mrzne. Louže mohou začít zamrzat.',
    { speak: 'Teploměr za oknem ukazuje nula stupňů Celsia. Co to znamená?' }),
  q('vitr-susi', 'Proč uschnou vlasy rychleji, když foukáš fénem?', 'Teplý vzduch pomáhá vodě vypařit se',
    ['Fén vodu vysaje', 'Vlasy se bojí hluku', 'Fén vlasy zmrazí'],
    ['Co pomáhá prádlu uschnout venku?'],
    'Teplo a proudící vzduch pomáhají vodě vypařit se. Fén dělá obojí najednou.'),
];

// ---------------------------------------------------------------------------
// L3 – bod mrazu a varu, proč pluje loď, oddělování směsí, teploty

const L3: Spec[] = [
  q('mrznuti', 'Při jaké teplotě mrzne čistá voda?', tepl('0 °C', 'nula stupňů Celsia'),
    [tepl('10 °C', 'deset stupňů Celsia'), tepl('100 °C', 'sto stupňů Celsia'), tepl('−50 °C', 'minus padesát stupňů Celsia')],
    ['Při této teplotě začínají zamrzat louže.'],
    'Čistá voda mrzne při 0 °C. Stupnice Celsia je podle toho nastavená: nula je bod mrazu.'),
  q('var', 'Při jaké teplotě se vaří voda u hladiny moře?', tepl('100 °C', 'sto stupňů Celsia'),
    [tepl('50 °C', 'padesát stupňů Celsia'), tepl('0 °C', 'nula stupňů Celsia'), tepl('200 °C', 'dvě stě stupňů Celsia')],
    ['Je to kulaté číslo, mnohem větší než teplota v pokoji.'],
    'U hladiny moře se voda vaří při 100 °C. Na vysokých horách je vzduch řidší a voda se vaří dřív, při nižší teplotě.'),
  q('lod', 'Proč pluje obrovská železná loď, když se železný hřebík potopí?', 'Je dutá a vytlačí hodně vody',
    ['Železo je lehčí než voda', 'Loď drží na hladině lana', 'Loď pluje jen po moři'],
    ['Záleží jen na materiálu, nebo i na tvaru?'],
    'Loď je uvnitř dutá a plná vzduchu. Svým tvarem vytlačí tolik vody, kolik sama váží, a voda ji nadnáší.'),
  q('plastelina', 'Kulička z plastelíny se ve vodě potopí. Jak ji přinutíš plavat?', 'Vytvaruji z ní lodičku',
    ['Rozdělím ji na dvě kuličky', 'Namočím ji předem', 'Zahřeji ji v dlani'],
    ['Proč pluje loď ze železa?'],
    'Když z plastelíny uděláš lodičku, vytlačí víc vody a voda ji unese. Změnil se tvar, ne materiál.'),
  q('magnet-hlinik', 'Přitahuje magnet všechny kovy?', 'Ne, třeba hliník ani měď ne',
    ['Ano, všechny kovy', 'Ano, ale jen lesklé', 'Jen když jsou studené'],
    ['Zkus magnet u plechovky od limonády.'],
    'Magnet přitahuje hlavně železo a ocel. Hliník, měď, zlato ani stříbro nepřitáhne.'),
  q('sul-zpet', 'Jak dostaneš sůl zpátky ze slané vody?', 'Nechám vodu vypařit',
    ['Vodu přecedím sítkem', 'Vodu promíchám', 'Přidám do ní cukr'],
    ['Kam zmizí voda z louže na slunci?'],
    'Když slaná voda na slunci nebo v teple vyschne, sůl zůstane na dně. Tak se sůl získává i z mořské vody.'),
  q('pisek-zpet', 'Jak oddělíš písek od vody?', 'Přecedím ji přes filtr',
    ['Přidám do ní cukr', 'Zamíchám ji', 'Zmrazím ji'],
    ['Co propustí vodu, ale písek ne?'],
    'Papírový filtr na kávu v trychtýři propustí vodu, ale písek zachytí. Říká se tomu filtrace.'),
  ord('kroky-magnet', 'Seřaď kroky pokusu s magnetem.',
    ['Ptám se, co magnet přitáhne', 'Odhadnu, které věci přitáhne', 'Přikládám magnet k věcem', 'Zapíšu, co se stalo', 'Podle zápisu porovnám odhad a výsledek'],
    ['Čím pokus začíná?'],
    'Nejdřív otázka, pak odhad, potom samotný pokus, zápis pozorování a nakonec porovnání odhadu s výsledkem – to je závěr.'),
  q('lahev-mrazak', 'Proč skleněná láhev plná vody v mrazáku praskne?', 'Voda při zamrzání zvětší objem',
    ['Led je těžší než voda', 'Mráz sklo rozpustí', 'Voda v mrazu zmizí'],
    ['Porovnej, kolik místa zabírá voda a kolik led.'],
    'Když voda zamrzá, roztáhne se a zabere víc místa. Plná láhev to nevydrží a praskne.'),
  q('led-plave', 'Proč kostka ledu plave ve vodě?', 'Led je lehčí než stejný objem vody',
    ['Led je těžší než voda', 'Voda led odstrkuje', 'Led je teplejší než voda'],
    ['Co se děje s objemem vody, když zamrzne?'],
    'Voda se při zamrzání roztáhne, a tak je led lehčí než stejně velký kus vody. Proto plave a rybníky zamrzají odshora.'),
  num('teplota-rozdil', 'Ráno bylo 5 °C, odpoledne 12 °C. O kolik stupňů se oteplilo?', 7,
    ['Kolik chybí od 5 do 12?'],
    'Od 5 do 12 je to 7. Oteplilo se o 7 °C.',
    { unit: '°C', speak: 'Ráno bylo 5 stupňů Celsia, odpoledne 12 stupňů. O kolik stupňů se oteplilo?' }),
  num('teplota-mraz', 'Ráno bylo −2 °C, v poledne 4 °C. O kolik stupňů se oteplilo?', 6,
    ['Kolik stupňů je od −2 do nuly a kolik od nuly do 4?'],
    'Od −2 do 0 jsou 2 stupně a od 0 do 4 jsou další 4. Dohromady se oteplilo o 6 °C.',
    { unit: '°C', speak: 'Ráno byly minus 2 stupně Celsia, v poledne 4 stupně. O kolik stupňů se oteplilo?', difficulty: 0.4 }),
  q('minus', 'Teploměr ukazuje −5 °C. Co to znamená?', 'Je mráz, 5 stupňů pod nulou',
    ['Je teplo, 5 stupňů nad nulou', 'Teploměr je rozbitý', 'Je přesně nula'],
    ['Co znamená znaménko minus?'],
    'Minus znamená pod nulou. Při −5 °C je mráz a voda venku zamrzne.',
    { speak: 'Teploměr ukazuje minus 5 stupňů Celsia. Co to znamená?' }),
  q('zavod', 'Leif a Tove běhají kolem domu. Čím zjistí, za jak dlouho uběhli jedno kolo?', 'Stopkami',
    ['Teploměrem', 'Pravítkem', 'Váhou'],
    ['Co měří čas?'],
    'Čas změří stopky. Aby bylo porovnání spravedlivé, musí oba běžet stejné kolo.'),
  q('magnety-poly', 'Dva tyčové magnety k sobě přiblížíš stejnými konci. Co se stane?', 'Odpuzují se',
    ['Přitáhnou se', 'Zmizí', 'Rozsvítí se'],
    ['Magnet má dva různé konce – póly.'],
    'Stejné póly magnetů se odpuzují a různé se přitahují. Vyzkoušej to se dvěma tyčovými magnety.'),
];

// ---------------------------------------------------------------------------
// L4 – spravedlivý pokus, porovnávání, vratné změny, hustota

const L4: Spec[] = [
  q('fer-jine', 'Tove chce zjistit, jestli fazole potřebuje světlo. Co musí mít oba kelímky jiné?', 'Jen světlo',
    ['Hlínu', 'Množství vody', 'Druh semínka'],
    ['Na co se Tove ptá?'],
    'Když se kelímky liší jen světlem, víme, že rozdíl v růstu způsobilo světlo. Tomu se říká spravedlivý pokus.'),
  q('fer-stejne', 'Tove zkoumá, jestli fazole potřebuje světlo. Co musí být u obou kelímků stejné?', 'Hlína, voda i teplo',
    ['Jen barva kelímku', 'Nic', 'Jen světlo'],
    ['Co všechno může ovlivnit, jak fazole roste?'],
    'Všechno kromě světla musí být stejné: hlína, voda, teplota i druh fazole. Jinak by Tove nevěděla, co rozdíl způsobilo.'),
  q('jedna-vec', 'Proč v pokusu měníme jen jednu věc?', 'Abychom věděli, co změnu způsobilo',
    ['Aby byl pokus rychlejší', 'Aby nás to méně bavilo', 'Protože víc věcí nemáme'],
    ['Kdybys změnila dvě věci najednou, poznala bys, která zabrala?'],
    'Když změníme jen jednu věc a všechno ostatní necháme stejné, víme jistě, že rozdíl způsobila právě ona.'),
  q('opakovani', 'Proč je dobré pokus zopakovat vícekrát?', 'Aby výsledek nebyl náhoda',
    ['Aby se pokus zkazil', 'Aby nás to víc unavilo', 'Protože poprvé se nepočítá'],
    ['Může se jednou něco stát náhodou?'],
    'Jeden pokus může dopadnout jinak náhodou. Když ho zopakujeme a vyjde stejně, můžeme si být jistější.'),
  q('odhad-nevysel', 'Odhadla jsi, že se jablko potopí, ale plavalo. Co uděláš?', 'Zapíšu, jak to bylo, a hledám proč',
    ['Pokus vymažu', 'Napíšu, že se potopilo', 'Přestanu bádat'],
    ['Je nevydařený odhad chyba, nebo objev?'],
    'Nevydařený odhad je objev. Zapíšeme skutečný výsledek a hledáme vysvětlení. Tak postupují i vědci.'),
  q('sul-plan', 'Leif chce zjistit, jestli se sůl rozpouští rychleji v teplé vodě. Co udělá?', 'Dá stejně soli do teplé a studené vody',
    ['Dá sůl jen do teplé vody', 'Dá do teplé vody sůl a do studené cukr', 'Zamíchá jen teplou vodu'],
    ['Co musí být v obou sklenicích stejné?'],
    'Spravedlivý pokus: stejné sklenice, stejně vody, stejně soli a stejné míchání. Liší se jen teplota vody.'),
  q('kontrolni', 'Tove zkoumá, jestli hnojivo pomáhá fazolím růst. Proč nechala jednu fazoli bez hnojiva?', 'Aby měla s čím porovnávat',
    ['Zapomněla na ni', 'Hnojivo došlo', 'Ta fazole hnojivo nemá ráda'],
    ['Jak pozná, že hnojivo pomohlo?'],
    'Fazole bez hnojiva slouží k porovnání. Když ta s hnojivem vyroste víc, víme, že hnojivo pomohlo.'),
  q('mereni-rustu', 'Jak nejlépe zjistíš, kolik fazole za týden vyrostla?', 'Měřím ji každý den a zapisuji',
    ['Odhadnu to od oka na konci', 'Zeptám se kamarádky', 'Změřím jen první den'],
    ['Co ti pomůže nezapomenout?'],
    'Pravidelné měření a zápis do tabulky ukážou, jak rychle fazole roste a ve které dny nejvíc.'),
  q('graf', 'Zapisuješ výšku fazole každý den. Jak výsledky přehledně ukážeš?', 'Sloupcovým grafem',
    ['Básničkou', 'Jedním číslem', 'Obrázkem mraku'],
    ['Jak porovnáš mnoho čísel najednou?'],
    'Sloupcový graf ukáže výšku v každém dni. Hned je vidět, kdy fazole rostla nejvíc.'),
  q('teplomer-stin', 'Proč se teplota vzduchu měří ve stínu?', 'Na slunci by se teploměr sám ohřál',
    ['Ve stínu je víc vzduchu', 'Slunce by teploměr rozbilo', 'Ve stínu teploměr líp vidíme'],
    ['Co se stane s věcí, která leží na slunci?'],
    'Na slunci se teploměr ohřeje paprsky a ukázal by víc, než kolik má vzduch. Meteorologové proto měří ve stínu, v bílé budce.'),
  q('vejce-sul', 'Syrové vejce se v obyčejné vodě potopí. Co udělá ve velmi slané vodě?', 'Bude plavat',
    ['Rozpustí se', 'Potopí se rychleji', 'Změní barvu'],
    ['Slaná voda nadnáší víc než obyčejná.'],
    'Ve velmi slané vodě vejce plave, protože slaná voda nadnáší víc. Proto se v moři plave snáz než v rybníce.'),
  q('pomeranc', 'Pomeranč ve slupce plave. Co udělá oloupaný pomeranč?', 'Potopí se',
    ['Bude plavat výš', 'Rozpustí se', 'Vyskočí z vody'],
    ['Co je ve slupce schované?'],
    'Ve slupce pomeranče jsou drobné bublinky vzduchu, které ho nadnášejí. Oloupaný pomeranč se potopí. Vyzkoušej to!'),
  q('vratna', 'Kterou změnu můžeme vrátit zpátky?', 'Tání ledu',
    ['Pečení bábovky', 'Hoření dřeva', 'Vaření vajíčka'],
    ['Dá se z vody znovu udělat led?'],
    'Roztátou vodu můžeme znovu zmrazit na led, taková změna je vratná. Upečenou bábovku ani spálené dřevo zpátky nevrátíme.'),
  q('nevratna', 'Kterou změnu nemůžeme vrátit zpátky?', 'Upečení bábovky',
    ['Tání ledu', 'Zamrznutí vody', 'Vypaření vody'],
    ['Dá se z bábovky zase udělat těsto?'],
    'Z upečené bábovky už těsto neuděláme – je to nevratná změna. Led, vodu i páru můžeme měnit tam i zpátky.'),
  q('hypoteza', 'Jak se odborně říká odhadu, který chceme pokusem ověřit?', 'Hypotéza',
    ['Závěr', 'Pozorování', 'Tabulka'],
    ['Závěr to není – ten přichází až po pokusu.', 'Je to odborné slovo z řečtiny.'],
    'Hypotéza je odhad, který se dá pokusem ověřit. Když pokus dopadne jinak, hypotézu opravíme.'),
  // Bez kroku „Napíšu odhad“: odhad jde napsat před přípravou kelímků i po ní,
  // takže by pořadí nebylo jediné.
  ord('plan-fazole', 'Seřaď plán pokusu s fazolemi.',
    ['Položím otázku', 'Připravím dva stejné kelímky', 'Jeden dám do tmy', 'Měřím a zapisuji růst', 'Porovnám a napíšu závěr'],
    ['Co je vždycky na začátku bádání?'],
    'Nejdřív otázka, pak příprava dvou stejných kelímků a změna jediné věci. Potom měření a nakonec porovnání a závěr.'),
  q('sklenice-voda', 'Převrácenou prázdnou sklenici zatlačíš do vody. Proč do ní voda skoro nenateče?', 'Ve sklenici je vzduch a zabírá místo',
    ['Sklo vodu odpuzuje', 'Sklenice je příliš studená', 'Voda se nevejde do skla'],
    ['Je prázdná sklenice opravdu prázdná?'],
    'Ve sklenici je vzduch. Nemá kam uniknout, a tak vodu nepustí dovnitř. Tak fungují i potápěčské zvony.'),
];

// ---------------------------------------------------------------------------
// L5 – plánování a vyhodnocení pokusu, průměr, příčina × souvislost

const L5: Spec[] = [
  q('var-hory', 'Při jaké teplotě se vaří voda na vysokých horách?', tepl('Při nižší než 100 °C', 'Při nižší teplotě než sto stupňů Celsia'),
    [tepl('Při vyšší než 100 °C', 'Při vyšší teplotě než sto stupňů Celsia'), 'Voda se tam nevaří', tepl('Přesně při 100 °C', 'Přesně při sto stupních Celsia')],
    ['Na horách je vzduch řidší a méně tlačí na hladinu.'],
    'Na vysokých horách je nižší tlak vzduchu, a tak se voda vaří dřív, při nižší teplotě. Na nejvyšší hoře světa asi při 70 °C.'),
  q('padak', 'Liv zkoumá, jestli větší padák padá pomaleji. Co bude v pokusu měnit?', 'Jen velikost padáku',
    ['Velikost i zátěž', 'Výšku, ze které ho pouští', 'Nic'],
    ['Na co se Liv ptá?'],
    'Liv mění jen velikost padáku. Zátěž i výška musí zůstat stejné, jinak by nevěděla, co rozdíl způsobilo.'),
  num('prumer', 'Liv pustila padák třikrát. Padal 4 s, 5 s a 6 s. Jaký je průměrný čas v sekundách?', 5,
    ['Sečti časy a vyděl je počtem pokusů.'],
    '4 + 5 + 6 = 15 a 15 : 3 = 5. Průměrný čas je 5 sekund.',
    { unit: 's', speak: 'Liv pustila padák třikrát. Padal 4 sekundy, 5 sekund a 6 sekund. Jaký je průměrný čas v sekundách?' }),
  q('dve-veci', 'Bo zaléval jednu fazoli víc a dal ji na slunce, druhou míň a do stínu. Proč nepozná, co fazolím pomáhá?', 'Změnil dvě věci najednou',
    ['Fazole byly moc malé', 'Použil moc hlíny', 'Zaléval je vodou'],
    ['Kolik věcí se u kelímků liší?'],
    'Bo změnil vodu i světlo zároveň. Když jedna fazole vyroste víc, neví, jestli díky vodě, nebo světlu.'),
  q('olej', 'Proč olej plave na vodě?', 'Olej je lehčí než stejný objem vody',
    ['Olej je teplejší', 'Olej je lepkavý', 'Olej je těžší než voda'],
    ['Porovnej, co je nahoře a co dole.'],
    'Olej je lehčí než stejné množství vody, a tak vystoupá nahoru. Totéž platí o ledu nebo korku.'),
  q('balon', 'Proč teplovzdušný balon stoupá?', 'Teplý vzduch je lehčí než studený',
    ['V balonu je vždy helium', 'Balon táhnou ptáci', 'Studený vzduch je lehčí'],
    ['Kde je v pokoji tepleji – u stropu, nebo u podlahy?'],
    'Hořák ohřeje vzduch v balonu. Teplý vzduch je lehčí než studený kolem, a tak balon stoupá.'),
  q('odparovani', 'Proč je ti zima, když vylezeš mokrá z vody?', 'Odpařující se voda ti bere teplo',
    ['Voda je studenější než led', 'Vítr v létě mrzne', 'Mokrá kůže nevidí slunce'],
    ['Co se děje s vodou na kůži?'],
    'Když se voda z kůže vypařuje, bere si teplo z tvého těla. Proto se po koupání utíráme a zabalíme do osušky.'),
  q('led-sul', 'Kostku ledu posypeš solí. Co se stane?', 'Začne rychleji tát',
    ['Začne víc mrznout', 'Změní barvu', 'Nic se nestane'],
    ['Proč se v zimě sypou chodníky solí?'],
    'Sůl s ledem vytvoří slanou vodu, která zamrzá až při nižší teplotě. Led proto taje rychleji. Vyzkoušej to na talířku.'),
  q('destniky', 'Když prší, lidé nosí deštníky. Způsobují deštníky déšť?', 'Ne, deštníky nosíme kvůli dešti',
    ['Ano, přivolávají ho', 'Ano, ale jen v létě', 'Nedá se to poznat'],
    ['Co bylo dřív – déšť, nebo deštník?'],
    'Dvě věci se často dějí spolu, ale to neznamená, že jedna způsobuje druhou. Deštníky nosíme, protože prší – ne naopak.'),
  q('necekany', 'Pokus dopadl jinak, než jsi čekala. Co je na tom dobré?', 'Něco nového jsem zjistila',
    ['Nic, pokus se nepovedl', 'Můžu ho vymazat', 'Že je konec bádání'],
    ['Co se z nečekaného výsledku můžeš dozvědět?'],
    'Nečekaný výsledek je objev. Mnoho důležitých objevů vzniklo právě tak, že pokus dopadl jinak, než vědci čekali.'),
  q('nejtepleji', 'Zapisuješ teplotu venku každou hodinu. Kdy bude nejspíš nejtepleji?', 'Odpoledne',
    ['Ráno za úsvitu', 'O půlnoci', 'Pozdě večer'],
    ['Kdy už je země od Slunce nejvíc prohřátá?'],
    'Nejtepleji bývá odpoledne. Slunce je nejvýš v poledne, ale zem a vzduch se ještě pár hodin ohřívají.'),
  q('kulicky', 'Pustíš ze stejné výšky těžkou a lehkou kuličku stejné velikosti. Co se stane?', 'Dopadnou skoro současně',
    ['Těžká dopadne mnohem dřív', 'Lehká dopadne dřív', 'Těžká zůstane viset'],
    ['Tohle zkoumal už Galileo Galilei.'],
    'Těžká i lehká kulička padají skoro stejně rychle. Rozdíl dělá jen vzduch, který víc brzdí lehké a velké věci, třeba pírko.'),
  q('pirko', 'Na Měsíci pustil astronaut kladívko a pírko. Co se stalo?', 'Dopadly současně',
    ['Kladívko dopadlo dřív', 'Pírko odletělo', 'Pírko dopadlo dřív'],
    ['Na Měsíci není vzduch.'],
    'Na Měsíci není vzduch, který by pírko brzdil. Kladívko a pírko proto dopadly současně. V roce 1971 to předvedl astronaut David Scott z mise Apollo 15 a natočila to kamera.'),
  q('mereni-stejne', 'Leif měřil fazoli jednou od hlíny a jindy od okraje kelímku. Co je špatně?', 'Neměřil pokaždé stejně',
    ['Měřil moc často', 'Měl moc krátké pravítko', 'Nic, je to jedno'],
    ['Dají se pak jednotlivá měření porovnat?'],
    'Aby se měření dala porovnat, musí se měřit pokaždé stejně – třeba vždy od hlíny po špičku.'),
  q('hudba', 'Maja chce zjistit, jestli hudba pomáhá rostlinám růst. Co potřebuje?', 'Dvě stejné rostliny, jednu bez hudby',
    ['Jednu rostlinu a hodně hudby', 'Rostlinu, která umí zpívat', 'Nic, stačí se zeptat'],
    ['S čím Maja porovná rostlinu, které hraje hudba?'],
    'Maja potřebuje dvě stejné rostliny ve stejných podmínkách. Jedné bude hrát hudba, druhé ne, a pak je porovná.'),
];

export const pokusy = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Pokusy a látky',
  description: 'Jednoduché pokusy s vodou, magnetem a rozpouštěním, měření a jednotky, spravedlivý pokus a vyhodnocení výsledků.',
  rvp: {
    1: ['ČJS-3-4-03'],
    2: ['ČJS-3-4-03'],
    3: ['ČJS-3-4-03'],
    4: ['ČJS-5-4-06'],
    5: ['ČJS-5-4-06'],
  },
  ability: 'usuzovani',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: {
    1: (rng) => {
      const r = rng.next();
      if (r < 0.35) return plaveNeboNe(PLAVE_L1)(rng);
      if (r < 0.6) return magnet(MAGNET_L1)(rng);
      if (r < 0.8) return rozpusti(ROZPUSTI_L1)(rng);
      return cimZmeris(rng);
    },
    2: (rng) => {
      const r = rng.next();
      if (r < 0.4) return plaveNeboNe(PLAVE_L2)(rng);
      if (r < 0.7) return rozpusti(ROZPUSTI_L2)(rng);
      return vJakychJednotkach(JEDNOTKY_L2)(rng);
    },
    3: (rng) => (rng.chance(0.5) ? magnet(MAGNET_L3)(rng) : vJakychJednotkach(JEDNOTKY_L3)(rng)),
    4: grafFazole,
    5: grafTeplot,
  },
  genShare: 0.45,
});

export const pokusyCards: KnowledgeCard[] = [
  {
    id: `${ID}.led`,
    skillId: ID,
    level: 2,
    emoji: '🧊',
    title: 'Led plave',
    text: 'Voda se při zamrzání roztáhne, a tak je led lehčí než stejně velký kus vody. Proto rybníky zamrzají odshora a ryby přečkají zimu ve vodě pod ledem.',
  },
  {
    id: `${ID}.lod`,
    skillId: ID,
    level: 3,
    emoji: '⚓',
    title: 'Proč pluje železná loď',
    text: 'Železný hřebík se potopí, ale loď je dutá a plná vzduchu. Vytlačí tolik vody, kolik sama váží, a voda ji nadnáší.',
  },
  {
    id: `${ID}.pad`,
    skillId: ID,
    level: 5,
    emoji: '🌙',
    title: 'Kladívko a pírko',
    text: 'Když není vzduch, padají lehké i těžké věci stejně rychle. Na Měsíci to v roce 1971 předvedl astronaut David Scott z mise Apollo 15: pustil kladívko a sokolí pírko a obojí dopadlo současně.',
    fix: {
      before: 'Už od starověku se učilo, že těžké věci padají vždycky rychleji než lehké.',
      evidence: 'Před více než 400 lety to Galileo Galilei zkoumal pokusy s kuličkami na nakloněné rovině. Usoudil, že pírko padá pomalu jen proto, že ho brzdí vzduch.',
    },
  },
];
