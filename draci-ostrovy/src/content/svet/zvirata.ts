// Zvířata a jejich skupiny: domácí × volně žijící, mláďata, skupiny zvířat
// (savci, ptáci, ryby, obojživelníci, plazi, hmyz, pavoukovci), pokryv těla,
// rozmnožování, záludná zařazení s vysvětlením, obratlovci × bezobratlí.
//
// Vysvětlení se ukazuje i po správné odpovědi jako zajímavost (showFact):
// nejdřív znaky, podle kterých zvíře zařadíme, pak jeden detail o tomtéž zvířeti.

import { bankSkill, type ChoiceSpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard } from '../../core/types';
import { fixed, num, ord, pickSome, q, slug } from './common';

const ID = 'svet.zvirata';

export type Skupina = 'savci' | 'ptaci' | 'ryby' | 'obojzivelnici' | 'plazi' | 'hmyz' | 'pavoukovci';

export const SKUPINA: Record<Skupina, string> = {
  savci: 'Savci',
  ptaci: 'Ptáci',
  ryby: 'Ryby',
  obojzivelnici: 'Obojživelníci',
  plazi: 'Plazi',
  hmyz: 'Hmyz',
  pavoukovci: 'Pavoukovci',
};

export interface Zvire {
  name: string;
  group: Skupina;
  /** Skupina, kam ho lidé často mylně řadí (ukáže se vždy jako chybná možnost). */
  trap?: Skupina;
  why: string;
}

/** Zvířata pro otázku „Do které skupiny patří…?“ podle úrovně. */
export const ZVIRATA: Record<2 | 3 | 4, Zvire[]> = {
  2: [
    { name: 'pes', group: 'savci', why: 'Pes má srst a štěňata krmí mlékem, a tak je to savec. Štěňata se rodí slepá a oči otevřou asi za dva týdny.' },
    { name: 'kráva', group: 'savci', why: 'Kráva má srst a tele krmí mlékem, a tak je to savec. Trávu nejdřív spolkne a pak ji v klidu přežvykuje.' },
    { name: 'kůň', group: 'savci', why: 'Kůň má srst a hříbě krmí mlékem, a tak je to savec. Hříbě se postaví na nohy asi hodinu po narození.' },
    { name: 'veverka', group: 'savci', why: 'Veverka má srst a mláďata krmí mlékem, a tak je to savec. Mláďata se rodí holá a slepá v kulatém hnízdě v koruně stromu.' },
    { name: 'ježek', group: 'savci', why: 'Ježek krmí mláďata mlékem, a tak je to savec. Jeho bodliny jsou zvláštní tvrdé chlupy.' },
    { name: 'slepice', group: 'ptaci', why: 'Slepice má peří a zobák a snáší vejce, a tak je to pták. Vejce snáší skoro každý den, i když u ní není kohout.' },
    { name: 'kos', group: 'ptaci', why: 'Kos má peří, zobák a křídla a mláďata se mu líhnou z vajec, a tak je to pták. Sameček je černý se žlutým zobákem, samička hnědá.' },
    { name: 'kachna', group: 'ptaci', why: 'Kachna má peří a zobák a klade vejce, a tak je to pták. Peří si maže tukem ze žlázy u ocasu, a proto jí nepromokne.' },
    { name: 'sova', group: 'ptaci', why: 'Sova má peří, zobák a křídla, a tak je to pták. Díky měkkému peří létá skoro úplně neslyšně.' },
    { name: 'kapr', group: 'ryby', why: 'Kapr dýchá žábrami a má šupiny a ploutve, a tak je to ryba. Na šupinách mu každý rok přiroste proužek, podobně jako stromu letokruh.' },
    { name: 'štika', group: 'ryby', why: 'Štika dýchá žábrami a má šupiny a ploutve, a tak je to ryba. Dorůstá i přes metr.' },
    { name: 'pstruh', group: 'ryby', why: 'Pstruh dýchá žábrami a má ploutve, a tak je to ryba. Žije jen v čisté studené vodě, ve které je hodně kyslíku.' },
    { name: 'žába', group: 'obojzivelnici', why: 'Žába má holou vlhkou kůži a její pulci žijí ve vodě, a tak je to obojživelník. Vodu nepije ústy – nasává ji kůží.' },
    { name: 'ropucha', group: 'obojzivelnici', why: 'Ropucha má holou kůži a klade vajíčka do vody, a tak je to obojživelník. Na jaře putuje k rybníku, ve kterém se sama vylíhla.' },
    { name: 'ještěrka', group: 'plazi', why: 'Ještěrka má suchou kůži se šupinami, a tak je to plaz. V nebezpečí umí odhodit ocas a ten jí pak znovu doroste.' },
    { name: 'užovka', group: 'plazi', why: 'Užovka je had se suchou šupinatou kůží, a tak patří mezi plazy. Užovky nejsou jedovaté.' },
    { name: 'želva', group: 'plazi', why: 'Želva má krunýř a suchou šupinatou kůži a klade vejce, a tak je to plaz. Krunýř má srostlý s kostrou, takže z něj nikdy nevyleze.' },
    { name: 'včela', group: 'hmyz', why: 'Včela má šest nohou a tělo ze tří částí, a tak je to hmyz. Má pět očí – dvě velká po stranách hlavy a tři malá nahoře.' },
    { name: 'motýl', group: 'hmyz', why: 'Motýl má šest nohou a čtyři křídla, a tak je to hmyz. Chuť pozná nohama, hned jak dosedne na květ.' },
    { name: 'beruška', group: 'hmyz', why: 'Beruška má šest nohou a krovky, a tak je to hmyz. Pod tvrdými krovkami schovává tenká křídla, kterými létá.' },
    { name: 'mravenec', group: 'hmyz', why: 'Mravenec má šest nohou a tělo ze tří částí, a tak je to hmyz. Unese i věc mnohem těžší, než je sám.' },
  ],
  3: [
    { name: 'velryba', group: 'savci', trap: 'ryby', why: 'Velryba žije v moři, ale dýchá plícemi a kojí mláďata, a tak je to savec, ne ryba. Nozdry má nahoře na hlavě, aby se mohla nadechnout hned u hladiny.' },
    { name: 'delfín', group: 'savci', trap: 'ryby', why: 'Delfín se vynořuje, aby se nadechl vzduchu, a mládě krmí mlékem, a tak je to savec. Spí napůl – jedna polovina mozku odpočívá a druhá hlídá dýchání.' },
    { name: 'kosatka', group: 'savci', trap: 'ryby', why: 'Kosatka je velký delfín – dýchá plícemi a kojí mláďata, takže je to savec. Žije v rodinných skupinách a často je vede nejstarší samice, babička.' },
    { name: 'netopýr', group: 'savci', trap: 'ptaci', why: 'Netopýr létá, ale nemá peří – má srst a mláďata krmí mlékem, a tak je to savec. Křídla má z tenké kůže napnuté mezi dlouhými prsty.' },
    { name: 'vydra', group: 'savci', trap: 'ryby', why: 'Vydra skvěle plave, ale má srst a mláďata krmí mlékem, a tak je to savec. Srst má tak hustou, že voda neproleze až ke kůži.' },
    { name: 'lachtan', group: 'savci', trap: 'ryby', why: 'Lachtan tráví hodně času v moři, ale dýchá plícemi a kojí mláďata, a tak je to savec. Na souši chodí po všech čtyřech ploutvích.' },
    { name: 'krokodýl', group: 'plazi', trap: 'obojzivelnici', why: 'Krokodýl žije ve vodě i na souši, ale má suchou kůži s tvrdými šupinami a vejce klade na souši, a tak je to plaz. Maminka pak mláďata opatrně nosí v tlamě do vody.' },
    { name: 'čolek', group: 'obojzivelnici', trap: 'plazi', why: 'Čolek vypadá jako ještěrka, ale má holou vlhkou kůži a vajíčka klade do vody, a tak je to obojživelník. Každé vajíčko samička zabalí do lístku vodní rostliny.' },
    { name: 'mořský koník', group: 'ryby', trap: 'savci', why: 'Mořský koník vypadá zvláštně, ale dýchá žábrami a má ploutve, a tak je to ryba. Mláďata u něj nosí v břišním vaku tatínek.' },
    { name: 'pštros', group: 'ptaci', trap: 'savci', why: 'Pštros neumí létat, ale má peří a zobák a klade vejce, a tak je to pták. Jeho vejce je největší ze všech ptačích – váží asi jako dvacet slepičích.' },
  ],
  4: [
    { name: 'pavouk', group: 'pavoukovci', trap: 'hmyz', why: 'Pavouk má osm nohou a tělo ze dvou částí, a tak patří mezi pavoukovce, ne mezi hmyz. Vlákno jeho pavučiny je na svou váhu pevnější než ocel.' },
    { name: 'klíště', group: 'pavoukovci', trap: 'hmyz', why: 'Klíště má osm nohou jako pavouk, a tak patří mezi pavoukovce. Žije v trávě a v křoví, proto se po vycházce do přírody vyplatí prohlédnout.' },
    { name: 'štír', group: 'pavoukovci', trap: 'hmyz', why: 'Štír má osm nohou a vpředu klepeta, a tak patří mezi pavoukovce. Pod ultrafialovou lampou svítí modrozeleně.' },
    { name: 'sekáč', group: 'pavoukovci', trap: 'hmyz', why: 'Sekáč má osm dlouhých nohou, a tak patří mezi pavoukovce. Na rozdíl od pavouků ale nemá jed a sítě nestaví.' },
    { name: 'kobylka', group: 'hmyz', trap: 'pavoukovci', why: 'Kobylka má šest nohou a tělo ze tří částí, a tak je to hmyz. Uši má na předních nohou.' },
    { name: 'vážka', group: 'hmyz', trap: 'pavoukovci', why: 'Vážka má šest nohou a čtyři křídla, a tak je to hmyz. Každým křídlem umí mávat zvlášť, a proto dokáže létat i pozpátku.' },
    { name: 'čmelák', group: 'hmyz', trap: 'pavoukovci', why: 'Čmelák má šest nohou, čtyři křídla a tělo ze tří částí, a tak je to hmyz. Létá i v chladném počasí – před letem se zahřeje chvěním svalů.' },
    { name: 'komár', group: 'hmyz', trap: 'pavoukovci', why: 'Komár má šest nohou a tělo ze tří částí, a tak je to hmyz. Bzučí proto, že mává křídly víc než třistakrát za sekundu.' },
    { name: 'slepýš', group: 'plazi', trap: 'obojzivelnici', why: 'Slepýš je beznohá ještěrka se suchou šupinatou kůží, a tak je to plaz. Na rozdíl od hadů umí mrkat.' },
    { name: 'mlok', group: 'obojzivelnici', trap: 'plazi', why: 'Mlok má holou vlhkou kůži a jeho larvy žijí ve vodě, a tak je to obojživelník. Samička nekladé vajíčka, ale rodí do potoka rovnou malé larvy.' },
    { name: 'úhoř', group: 'ryby', trap: 'plazi', why: 'Úhoř vypadá jako had, ale dýchá žábrami a má ploutve, a tak je to ryba. Úhoři z našich řek se rodí až v Sargasovém moři v Atlantském oceánu.' },
  ],
};

/** Skupiny, ze kterých se na dané úrovni berou chybné možnosti. */
const SKUPINY_UROVNE: Record<2 | 3 | 4, Skupina[]> = {
  2: ['savci', 'ptaci', 'ryby', 'obojzivelnici', 'plazi', 'hmyz'],
  3: ['savci', 'ptaci', 'ryby', 'obojzivelnici', 'plazi', 'hmyz'],
  4: ['savci', 'ptaci', 'ryby', 'obojzivelnici', 'plazi', 'hmyz', 'pavoukovci'],
};

function doSkupiny(level: 2 | 3 | 4) {
  return (rng: Rng): Spec => {
    const z = rng.pick(ZVIRATA[level]);
    const others = SKUPINY_UROVNE[level].filter((g) => g !== z.group && g !== z.trap);
    const wrong = [...(z.trap ? [z.trap] : []), ...pickSome(rng, others, z.trap ? 2 : 3)].map((g) => SKUPINA[g]);
    // U hmyzu a pavoukovců rozhoduje počet nohou, ne pokryv těla a krmení mláďat.
    // (Části těla ne: u klíštěte a sekáče dvě části splývají.)
    const nohy = z.group === 'hmyz' || z.group === 'pavoukovci';
    return q(`skupina-${slug(z.name)}`, `Do které skupiny zvířat patří ${z.name}?`, SKUPINA[z.group], wrong,
      nohy
        ? ['Spočítej, kolik má nohou.', 'Má šest nohou, nebo osm?']
        : ['Čím je pokryté tělo tohoto zvířete?', 'Jak přicházejí na svět jeho mláďata a čím je krmí?'],
      z.why);
  };
}

/** Skupinou se myslí třída zvířat (savci, ptáci…), ne třeba „zvířata, která plavou“. */
const LICHY_SKUPINA = 'Které zvíře patří do jiné skupiny zvířat než ostatní? Skupiny jsou třeba savci, ptáci nebo hmyz.';
/** Na L5 rozhoduje páteř. */
const LICHY_PATER = 'Obratlovci, nebo bezobratlí? Které zvíře je jiné než ostatní?';

/** Karty zvířat, jedno do skupiny nepatří. */
function lichy(key: string, cards: [string, string][], odd: number, hints: string[], explain: string, prompt = LICHY_SKUPINA): ChoiceSpec {
  const titles = cards.map(([, t]) => t);
  return q(key, prompt, titles[odd], titles.filter((_, i) => i !== odd), hints, explain, {
    visual: { type: 'cards', cards: cards.map(([emoji, title]) => ({ emoji, title })) },
    speak: `${titles.join(', ')}. ${prompt}`,
  });
}

// ---------------------------------------------------------------------------
// L1 – mláďata, domácí × volně žijící, pokryv těla, co nám zvířata dávají

/** Mládě: [čí (2. pád), jméno mláděte, vysvětlení]. */
const MLADATA: [string, string, string][] = [
  ['krávy', 'Tele', 'Krávě se narodí tele. Pije mléko a brzy začne ochutnávat i trávu.'],
  ['koně', 'Hříbě', 'Mládě koně je hříbě. Krátce po narození už stojí na dlouhých nohou.'],
  ['ovce', 'Jehně', 'Mládě ovce je jehně. Pije mléko a brzy běhá za mámou po pastvině.'],
  ['kozy', 'Kůzle', 'Mládě kozy je kůzle. Kůzlátka ráda skáčou a lezou po kamenech.'],
  ['prasete', 'Sele', 'Mládě prasete je sele. Prasnice jich najednou porodí i deset a víc.'],
  ['slepice', 'Kuře', 'Ze slepičího vejce se vylíhne kuře. Bývá žluté a chmýřovité.'],
  ['kachny', 'Kachně', 'Z kachního vejce se vylíhne kachně. Brzy po vylíhnutí umí plavat.'],
  ['husy', 'House', 'Mládě husy je house. Housata chodí za husou v řadě.'],
  ['psa', 'Štěně', 'Mládě psa je štěně. Štěňata se rodí slepá a oči otevřou asi za dva týdny.'],
  ['kočky', 'Kotě', 'Mládě kočky je kotě. Koťata se rodí slepá a potřebují mámino mléko.'],
];

const mladata: Spec[] = MLADATA.map(([ci, mlade, explain], i) =>
  q(`mlade-${slug(ci)}`, `Jak se jmenuje mládě ${ci}?`, mlade,
    [1, 2, 3, 4].map((d) => MLADATA[(i + d) % MLADATA.length][1]),
    ['Vzpomeň si na pohádky a písničky o zvířatech na statku.'],
    explain));

const L1: Spec[] = [
  ...mladata,
  q('domaci', 'Které zvíře je domácí?', 'Kráva',
    ['Liška', 'Srna', 'Vlk', 'Jezevec'],
    ['Domácí zvíře chová člověk – na statku nebo doma.'],
    'Kráva je domácí zvíře, chová ji zemědělec kvůli mléku. Liška, srna, vlk i jezevec žijí volně v přírodě. Dojnice dá za den běžně přes dvacet litrů mléka.'),
  q('volne', 'Které zvíře žije volně v lese?', 'Srna',
    ['Kráva', 'Ovce', 'Koza', 'Kůň'],
    ['Které zvíře nikdo nechová ve chlévě?'],
    'Srna žije volně v lese a na loukách. Kráva, ovce, koza i kůň jsou domácí zvířata. Mládě srny má na hřbetě bílé skvrnky, díky kterým ho v trávě skoro není vidět.'),
  q('mazlicek', 'Které zvíře si lidé často chovají doma pro radost?', 'Morče',
    ['Jezevec', 'Srna', 'Liška', 'Vlk'],
    ['Hledej malé zvíře, které bydlí v kleci s pilinami.'],
    'Morče je domácí mazlíček, jezevec, srna, liška i vlk patří do volné přírody. Morčata k nám kdysi přivezli z hor Jižní Ameriky.'),
  q('peri', 'Které zvíře má peří?', 'Slepice',
    ['Kočka', 'Kapr', 'Žába', 'Pes'],
    ['Peří mají zvířata, která mají zobák a křídla.'],
    'Slepice je pták a ptáci mají peří. Kočka a pes mají srst, kapr šupiny a žába holou kůži.'),
  q('supiny', 'Které zvíře má šupiny a ploutve?', 'Kapr',
    ['Pes', 'Slepice', 'Žába', 'Kůň'],
    ['Hledej zvíře, které žije jen ve vodě.'],
    'Kapr je ryba. Ryby mají šupiny a ploutve a dýchají žábrami. Šupiny se na těle překrývají jako tašky na střeše.'),
  q('srst', 'Které zvíře má srst?', 'Pes',
    ['Kapr', 'Slepice', 'Žába', 'Ještěrka'],
    ['Srst můžeš pohladit.'],
    'Pes je savec a savci mají srst. Slepice má peří, kapr šupiny a žába ani ještěrka srst nemají.'),
  num('nohy-slepice', 'Kolik nohou má slepice?', 2,
    ['Slepice je pták. Kolik nohou mají ptáci?'],
    'Slepice má dvě nohy, stejně jako všichni ptáci. Místo předních nohou mají ptáci křídla.'),
  num('nohy-pes', 'Kolik nohou má pes?', 4,
    ['Spočítej přední a zadní nohy.'],
    'Pes má čtyři nohy – dvě přední a dvě zadní. Chodí po prstech, ne po celém chodidle jako my.'),
  q('vejce', 'Co nám dává slepice?', 'Vejce',
    ['Vlnu', 'Med', 'Mléko'],
    ['Co se k snídani vaří natvrdo nebo naměkko?'],
    'Slepice snáší vejce – dobrá nosnice skoro každý den jedno. Vlnu dávají ovce, med včely a mléko krávy.'),
  q('med', 'Kdo nám dává med?', 'Včely',
    ['Mravenci', 'Motýli', 'Mouchy'],
    ['Kdo bydlí v úlu?'],
    'Med vyrábějí včely z nektaru květů a včelař jim část medu odebere. Na jednu sklenici medu musí včely navštívit miliony květů.'),
  q('vlna', 'Ze srsti kterého zvířete se přede vlna na svetry?', 'Z ovce',
    ['Z krávy', 'Z prasete', 'Ze slepice'],
    ['Toto zvíře se na jaře stříhá.'],
    'Ovce se na jaře stříhají a z jejich vlny se přede příze na svetry a ponožky.'),
  q('ul', 'Kde bydlí včely, které chová včelař?', 'V úlu',
    ['V kurníku', 'V chlévě', 'V psí boudě'],
    ['Včelař má u domu dřevěné domečky pro včely.'],
    'Včely chované včelařem bydlí v úlu. Kurník je pro slepice, chlév pro krávy a psí bouda pro psa.'),
  q('kurnik', 'Kde bydlí slepice?', 'V kurníku',
    ['V úlu', 'V psí boudě', 'V akváriu'],
    ['Slepice na noc sedají na bidla.'],
    'Slepice bydlí v kurníku, kde na noc sedají na bidla a snášejí vejce do hnízd.'),
  q('ulita', 'Které zvíře nosí na zádech ulitu?', 'Hlemýžď',
    ['Žížala', 'Ještěrka', 'Mravenec'],
    ['Je pomalý a zanechává za sebou slizkou stopu.'],
    'Hlemýžď nosí ulitu, do které se schová, když je sucho nebo nebezpečí. Ulita s ním roste celý život – nikdy ji nevymění za jinou.'),
  q('krtek', 'Které zvíře si hrabe chodbičky pod zemí?', 'Krtek',
    ['Vrabec', 'Kapr', 'Slepice'],
    ['Na louce po něm zůstávají hromádky hlíny.'],
    'Krtek žije pod zemí a hrabe si chodbičky. Hlína, kterou vyhrabe, tvoří na louce krtiny. Skoro nevidí, cestu najde hmatem a čichem.'),
  q('letat', 'Které z těchto zvířat umí létat?', 'Motýl',
    ['Hlemýžď', 'Ježek', 'Žížala'],
    ['Hledej zvíře s křídly.'],
    'Motýl má čtyři křídla a létá z květu na květ. Hlemýžď, ježek ani žížala křídla nemají.'),
  q('dojeni', 'Které zvíře se dojí, abychom měli mléko?', 'Kráva',
    ['Slepice', 'Prase', 'Kočka'],
    ['Na statku stojí ve chlévě a bučí.'],
    'Krávy se dojí a jejich mléko pijeme a vyrábí se z něj sýr, máslo a jogurty.'),
  q('voda', 'Které zvíře žije jen ve vodě?', 'Kapr',
    ['Kočka', 'Slepice', 'Ovce'],
    ['Potřebuje vodu, aby mohlo dýchat.'],
    'Kapr je ryba a dýchá žábrami, a proto žije jen ve vodě. Žábry berou kyslík, který je ve vodě rozpuštěný.'),
];

// ---------------------------------------------------------------------------
// L2 – skupiny zvířat, pokryv těla, vejce × mláďata

const L2: Spec[] = [
  q('peri-skupina', 'Jak se jmenuje skupina zvířat, která mají peří?', 'Ptáci',
    ['Savci', 'Ryby', 'Plazi'],
    ['Mají také zobák a křídla.'],
    'Peří mají jen ptáci. Mají i zobák a křídla a mláďata se jim líhnou z vajec.'),
  q('ptaci-maji', 'Co mají všichni ptáci?', 'Peří a zobák',
    ['Srst a zuby', 'Šupiny a ploutve', 'Šest nohou'],
    ['Vzpomeň si na slepici nebo kosa.'],
    'Všichni ptáci mají peří, zobák, dvě nohy a křídla. I ti, kteří nelétají.'),
  q('savci-mleko', 'Čím krmí savci svá mláďata?', 'Mlékem',
    ['Zrním', 'Hmyzem', 'Medem'],
    ['Co pije tele od krávy?'],
    'Savci krmí mláďata mlékem – mláďata ho sají. Proto se jim říká savci.'),
  q('klade-vejce', 'Které zvíře klade vejce?', 'Kachna',
    ['Kráva', 'Kočka', 'Ovce', 'Pes'],
    ['Hledej ptáka.'],
    'Kachna je pták a ptáci kladou vejce. Kráva, kočka, ovce i pes jsou savci a rodí živá mláďata.'),
  q('rodi-mladata', 'Které zvíře rodí živá mláďata?', 'Koza',
    ['Kachna', 'Želva', 'Kapr', 'Slepice'],
    ['Hledej savce.'],
    'Koza je savec a rodí živá kůzlata. Kachna, slepice i želva kladou vejce a kapr klade jikry.'),
  q('zabry', 'Čím dýchají ryby?', 'Žábrami',
    ['Plícemi', 'Ploutvemi', 'Šupinami'],
    ['Ryby berou kyslík rozpuštěný ve vodě.'],
    'Ryby dýchají žábrami. Ty berou z vody rozpuštěný kyslík.'),
  num('nohy-hmyz', 'Kolik nohou má hmyz?', 6,
    ['Spočítej nohy berušky nebo mravence.'],
    'Hmyz má šest nohou. Třeba mravenec, včela, motýl i beruška.'),
  num('nohy-pavouk', 'Kolik nohou má pavouk?', 8,
    ['Má o dvě nohy víc než hmyz.'],
    'Pavouk má osm nohou. Hmyz má jen šest, a proto pavouk hmyz není.'),
  q('hola-kuze', 'Které zvíře má holou vlhkou kůži?', 'Žába',
    ['Ještěrka', 'Kapr', 'Kos', 'Pes'],
    ['Hledej zvíře, které žije ve vodě i na souši.'],
    'Žába má holou vlhkou kůži bez šupin. Ještěrka má suchou kůži se šupinami.'),
  q('hmyz-kdo', 'Kdo z nich je hmyz?', 'Beruška',
    ['Žížala', 'Hlemýžď', 'Ještěrka'],
    ['Hmyz má šest nohou.'],
    'Beruška má šest nohou a tělo ze tří částí – je to hmyz. Žížala nemá nohy, hlemýžď má jednu svalnatou nohu a ještěrka čtyři.'),
  q('pulec', 'Z čeho vyroste žába?', 'Z pulce',
    ['Z housenky', 'Z kukly', 'Z ještěrky'],
    ['Žáby kladou vajíčka do vody.'],
    'Ze žabích vajíček se ve vodě vylíhnou pulci. Pulcům narostou nohy, zmizí ocásek a je z nich žába.'),
  q('housenka', 'Z čeho vyroste motýl?', 'Z housenky',
    ['Z pulce', 'Ze žížaly', 'Z mravence'],
    ['Mládě motýla se živí listy.'],
    'Z vajíčka se vylíhne housenka. Ta se zakuklí a z kukly vyleze motýl.'),
  q('savec-kdo', 'Které zvíře je savec?', 'Ježek',
    ['Kos', 'Kapr', 'Žába', 'Ještěrka'],
    ['Savci krmí mláďata mlékem.'],
    'Ježek krmí mláďata mlékem, je to savec. Jeho bodliny jsou zvláštní tvrdé chlupy.'),
  q('plaz-kdo', 'Které zvíře je plaz?', 'Ještěrka',
    ['Žába', 'Kapr', 'Myš', 'Kos'],
    ['Plazi mají suchou kůži se šupinami.'],
    'Ještěrka je plaz – má suchou kůži se šupinami. Žába je obojživelník s holou vlhkou kůží.'),
  q('obojzivelnik-kdo', 'Které zvíře je obojživelník?', 'Žába',
    ['Ještěrka', 'Užovka', 'Kapr', 'Kos'],
    ['Obojživelníci žijí ve vodě i na souši.'],
    'Žába je obojživelník. Pulci žijí ve vodě, dospělé žáby i na souši.'),
  q('obojzivelnik-jmeno', 'Proč se žábě říká obojživelník?', 'Žije ve vodě i na souši',
    ['Umí létat i plavat', 'Má srst i ploutve', 'Má šupiny i peří'],
    ['Slovo obojí znamená dvojí.'],
    'Obojživelník žije dvojím životem: jako pulec ve vodě a jako dospělá žába i na souši.'),
  q('ryba-telo', 'Čím je pokryté tělo ryby?', 'Šupinami',
    ['Peřím', 'Srstí', 'Holou kůží'],
    ['Na kaprovi uvidíš lesklé destičky.'],
    'Tělo většiny ryb pokrývají šupiny. Chrání je jako drobné destičky brnění.'),
  q('ptak-telo', 'Čím je pokryté tělo ptáka?', 'Peřím',
    ['Šupinami', 'Srstí', 'Holou kůží'],
    ['Čím se plní peřiny?'],
    'Ptáky pokrývá peří. Hřeje je a pomáhá jim létat.'),
  q('liska-telo', 'Čím je pokryté tělo lišky?', 'Srstí',
    ['Peřím', 'Šupinami', 'Holou kůží'],
    ['Liška je savec.'],
    'Liška je savec a má hustou srst, která ji v zimě hřeje. Když spí ve sněhu, zakryje si nos huňatým ocasem.'),
  q('krunyr', 'Které zvíře má krunýř?', 'Želva',
    ['Ježek', 'Kapr', 'Kos', 'Žába'],
    ['Do krunýře se umí celé schovat.'],
    'Želva má pevný krunýř. Když se bojí, schová do něj hlavu i nohy.'),
];

// ---------------------------------------------------------------------------
// L3 – záludná zařazení, „co sem nepatří“

const L3: Spec[] = [
  lichy('lichy-kapr', [['🐋', 'Velryba'], ['🐬', 'Delfín'], ['🐄', 'Kráva'], ['🐟', 'Kapr']], 3,
    ['Kdo z nich kojí mláďata?'],
    'Kapr je ryba a dýchá žábrami. Velryba, delfín i kráva jsou savci – dýchají plícemi a mláďata krmí mlékem. Velryba i delfín proto musí pro vzduch připlouvat k hladině.'),
  lichy('lichy-netopyr', [['🦉', 'Sova'], ['🐧', 'Tučňák'], ['🦇', 'Netopýr'], ['🦆', 'Kachna']], 2,
    ['Kdo z nich má peří?'],
    'Netopýr je savec: má srst a kojí mláďata. Sova, tučňák i kachna jsou ptáci – mají peří a zobák. Křídla má netopýr z tenké kůže napnuté mezi dlouhými prsty.'),
  lichy('lichy-pavouk', [['🐝', 'Včela'], ['🐞', 'Beruška'], ['🕷️', 'Pavouk'], ['🦋', 'Motýl']], 2,
    ['Spočítej nohy.'],
    'Pavouk má osm nohou, a proto není hmyz. Včela, beruška i motýl mají šest nohou – jsou to hmyz. Pavouk nemá ani tykadla, která má každý hmyz.'),
  lichy('lichy-zaba', [['🐊', 'Krokodýl'], ['🐢', 'Želva'], ['🦎', 'Ještěrka'], ['🐸', 'Žába']], 3,
    ['Kdo z nich má suchou kůži se šupinami?'],
    'Žába je obojživelník s holou vlhkou kůží. Krokodýl, želva i ještěrka jsou plazi se suchou kůží a šupinami. Vlhkou kůží žába dokonce i dýchá.'),
  lichy('lichy-delfin', [['🐔', 'Slepice'], ['🦆', 'Kachna'], ['🐧', 'Tučňák'], ['🐬', 'Delfín']], 3,
    ['Kdo z nich klade vejce?'],
    'Delfín je savec a rodí živá mláďata. Slepice, kachna i tučňák jsou ptáci – mají peří a kladou vejce. Mládě delfína se rodí pod vodou a hned plave k hladině, aby se poprvé nadechlo.'),
  lichy('lichy-zelva', [['🐕', 'Pes'], ['🐈', 'Kočka'], ['🐇', 'Králík'], ['🐢', 'Želva']], 3,
    ['Kdo z nich má srst?'],
    'Želva je plaz a klade vejce. Pes, kočka i králík jsou savci se srstí. Želvu místo srsti chrání krunýř, který má srostlý s kostrou.'),
  lichy('lichy-krokodyl', [['🐘', 'Slon'], ['🦒', 'Žirafa'], ['🦓', 'Zebra'], ['🐊', 'Krokodýl']], 3,
    ['Kdo z nich kojí mláďata?'],
    'Krokodýl je plaz a klade vejce. Slon, žirafa i zebra jsou savci a mláďata kojí. Malí krokodýli volají na mámu už zevnitř vajec a ona pak hnízdo rozhrabe.'),
  lichy('lichy-tucnak', [['🐒', 'Opice'], ['🐻', 'Medvěd'], ['🐧', 'Tučňák'], ['🐺', 'Vlk']], 2,
    ['Kdo z nich má peří?'],
    'Tučňák je pták – má peří a zobák, i když neumí létat. Opice, medvěd i vlk jsou savci se srstí. Tučňáka hřeje husté peří a vrstva tuku i v ledové vodě.'),
  lichy('lichy-had', [['🐁', 'Myš'], ['🐿️', 'Veverka'], ['🦔', 'Ježek'], ['🐍', 'Had']], 3,
    ['Kdo z nich krmí mláďata mlékem?'],
    'Had je plaz se šupinatou kůží. Myš, veverka i ježek jsou savci a krmí mláďata mlékem. Když had roste, svlékne starou kůži vcelku jako punčochu.'),
  lichy('lichy-hlemyzd', [['🦋', 'Motýl'], ['🐞', 'Beruška'], ['🐜', 'Mravenec'], ['🐌', 'Hlemýžď']], 3,
    ['Kdo z nich má šest nohou?'],
    'Hlemýžď není hmyz, patří mezi měkkýše. Motýl, beruška i mravenec mají šest nohou a jsou to hmyz. Hlemýžď má jedinou svalnatou nohu a klouže na ní po vlastním slizu.'),
  q('velryba-proc', 'Proč je velryba savec, a ne ryba?', 'Dýchá plícemi a kojí mláďata',
    ['Žije v moři', 'Má ploutve', 'Je obrovská'],
    ['Co mají společného všichni savci?'],
    'Velryba se musí vynořovat, aby se nadechla vzduchu, a mládě krmí mlékem. Proto je to savec.'),
  q('netopyr-proc', 'Proč je netopýr savec, i když létá?', 'Má srst a kojí mláďata',
    ['Létá v noci', 'Visí hlavou dolů', 'Má křídla z kůže'],
    ['Co mají všichni savci?'],
    'Netopýr nemá peří, ale srst, a mláďata krmí mlékem. Netopýři a jejich příbuzní jsou jediní savci, kteří umějí opravdu létat.'),
  q('tucnak', 'Tučňák neumí létat. Do které skupiny patří?', 'Ptáci',
    ['Savci', 'Ryby', 'Obojživelníci'],
    ['Čím je pokryté jeho tělo?'],
    'Tučňák má peří a zobák a klade vejce – je to pták. Křídla mu slouží jako ploutve k plavání.'),
  q('pavouk-proc', 'Proč pavouk není hmyz?', 'Má osm nohou',
    ['Umí plést sítě', 'Je malý', 'Nemá křídla'],
    ['Spočítej nohy pavouka a mravence.'],
    'Hmyz má šest nohou a tělo ze tří částí. Pavouk má osm nohou a tělo ze dvou částí – patří mezi pavoukovce. Bez křídel je i leckterý hmyz, třeba blecha.'),
  q('neni-ryba', 'Kdo z nich není ryba?', 'Delfín',
    ['Kapr', 'Štika', 'Pstruh', 'Úhoř'],
    ['Kdo se musí vynořovat, aby se nadechl?'],
    'Delfín je savec – dýchá plícemi a kojí mláďata. Kapr, štika, pstruh i úhoř jsou ryby.'),
  q('mlok', 'Mlok vypadá jako ještěrka. Do které skupiny patří?', 'Obojživelníci',
    ['Plazi', 'Ryby', 'Savci'],
    ['Jakou má kůži: suchou se šupinami, nebo holou a vlhkou?'],
    'Mlok má holou vlhkou kůži a jeho larvy žijí ve vodě. Je to obojživelník jako žába. Ještěrka má suchou kůži se šupinami.'),
  q('slepys', 'Slepýš vypadá jako had. Co je doopravdy?', 'Ještěrka bez nohou',
    ['Had', 'Žížala', 'Úhoř'],
    ['Slepýš umí mrkat. Hadi pohyblivá víčka nemají.'],
    'Slepýš je beznohá ještěrka. Na rozdíl od hadů má pohyblivá oční víčka. Slepýš i hadi jsou ale plazi.'),
  q('uhor', 'Úhoř vypadá jako had. Kdo to je?', 'Ryba',
    ['Had', 'Obojživelník', 'Savec'],
    ['Čím dýchá?'],
    'Úhoř dýchá žábrami a má ploutve. Je to ryba, i když je dlouhý jako had.'),
  q('vejce-kdo', 'Kdo z nich klade vejce?', 'Želva',
    ['Delfín', 'Netopýr', 'Velryba'],
    ['Tři z nich jsou savci.'],
    'Želva je plaz a vejce zahrabává do písku nebo do hlíny. Delfín, netopýr i velryba jsou savci a rodí živá mláďata.'),
  q('pstros', 'Které zvíře je pták, i když neumí létat?', 'Pštros',
    ['Netopýr', 'Veverka', 'Ježek'],
    ['Ptáci mají peří a zobák.'],
    'Pštros neumí létat, ale má peří a zobák a klade vejce – je to pták. Zato skvěle běhá.'),
];

// ---------------------------------------------------------------------------
// L4 – pavoukovci, stavba těla hmyzu, proměny, určovací klíč

const KLIC = [
  'Má peří: pták',
  'Krmí mláďata mlékem: savec',
  'Má žábry a ploutve: ryba',
  'Má holou vlhkou kůži: obojživelník',
  'Má suchou kůži se šupinami: plaz',
];
const KLIC_SPEAK = `Určovací klíč. ${KLIC.join('. ')}.`;

function podleKlice(key: string, popis: string, correct: string, wrong: string[], explain: string): ChoiceSpec {
  const prompt = `Podle klíče urči: ${popis} Kam patří?`;
  return q(key, prompt, correct, wrong,
    ['Projdi klíč řádek po řádku a hledej znak, který sedí.'],
    explain,
    { visual: { type: 'steps', title: 'Určovací klíč', steps: KLIC }, speak: `${KLIC_SPEAK} ${prompt}` });
}

const L4: Spec[] = [
  ord('motyl', 'Seřaď, jak se vyvíjí motýl. Začni vajíčkem.', ['Vajíčko', 'Housenka', 'Kukla', 'Motýl'],
    ['Co se vylíhne z vajíčka?', 'V čem se housenka promění?'],
    'Z vajíčka se vylíhne housenka, ta se zakuklí a z kukly vyleze motýl. Říká se tomu proměna.'),
  ord('zaba', 'Seřaď, jak se vyvíjí žába. Začni vajíčky.',
    ['Vajíčka ve vodě', 'Pulec', 'Pulec s nožičkami', 'Žabka s ocáskem', 'Dospělá žába'],
    ['Co se vylíhne z vajíček?', 'Co přijde dřív: narostou nožičky, nebo zmizí ocásek?'],
    'Z vajíček se vylíhnou pulci, narostou jim nožičky, pak se z nich stanou malé žabky s ocáskem a nakonec dospělé žáby.'),
  num('casti-hmyzu', 'Z kolika hlavních částí se skládá tělo hmyzu?', 3,
    ['Hlava je jedna z nich.'],
    'Tělo hmyzu má tři části: hlavu, hruď a zadeček. Na hrudi má šest nohou a často i křídla.'),
  q('nohy-hmyzu', 'Na které části těla má hmyz nohy?', 'Na hrudi',
    ['Na hlavě', 'Na zadečku', 'Na křídlech'],
    ['Je to prostřední část těla.'],
    'Všech šest nohou a křídla vyrůstají hmyzu z hrudi – prostřední části těla.'),
  q('pavoukovci-kdo', 'Kdo patří mezi pavoukovce?', 'Klíště',
    ['Komár', 'Moucha', 'Blecha', 'Beruška'],
    ['Pavoukovci mají osm nohou.'],
    'Klíště má osm nohou jako pavouk, a proto patří mezi pavoukovce. Komár, moucha, blecha i beruška jsou hmyz.'),
  q('teplokrevni', 'Které skupiny si udržují teplé tělo, i když je venku zima?', 'Savci a ptáci',
    ['Ryby a plazi', 'Plazi a obojživelníci', 'Hmyz a ryby'],
    ['Které skupiny mají srst nebo peří?'],
    'Savci a ptáci mají stálou teplotu těla a hřeje je srst nebo peří. Plazi, obojživelníci a ryby mají teplotu jako okolí, a proto v zimě zpomalí nebo strnou.'),
  q('ptaci-kosti', 'Proč mají ptáci lehké kosti?', 'Kosti jsou uvnitř duté',
    ['Kosti jsou z peří', 'Nemají žádné kosti', 'Kosti jsou z gumy'],
    ['Co by ptákovi pomohlo lépe létat?'],
    'Mnohé ptačí kosti jsou uvnitř duté a vyztužené jako lešení. Jsou lehké a přitom pevné, a to pomáhá létat.'),
  q('savci-jmeno', 'Proč se savcům říká savci?', 'Mláďata sají mléko',
    ['Sají nektar z květů', 'Nasávají vodu kůží', 'Mají přísavky'],
    ['Co pije tele, kotě nebo štěně?'],
    'Mláďata savců sají mateřské mléko. Odtud jméno savci.'),
  podleKlice('klic-plaz', 'zvíře má suchou kůži se šupinami a čtyři nohy.', 'Plaz', ['Obojživelník', 'Ryba', 'Savec'],
    'Suchá kůže se šupinami je znak plazů. Takhle vypadá třeba ještěrka.'),
  podleKlice('klic-obojzivelnik', 'zvíře má holou vlhkou kůži a čtyři nohy.', 'Obojživelník', ['Plaz', 'Ryba', 'Savec'],
    'Holá vlhká kůže je znak obojživelníků. Takhle vypadá třeba žába nebo mlok.'),
  podleKlice('klic-ryba', 'zvíře žije ve vodě a má žábry a ploutve.', 'Ryba', ['Savec', 'Plaz', 'Obojživelník'],
    'Žábry a ploutve má ryba. Delfín má také ploutve, ale nemá žábry – dýchá plícemi.'),
  podleKlice('klic-savec', 'zvíře žije v moři, nemá žábry a mládě krmí mlékem.', 'Savec', ['Ryba', 'Obojživelník', 'Plaz'],
    'Kdo krmí mláďata mlékem, je savec – i když žije v moři. Takový je delfín nebo velryba.'),
  podleKlice('klic-ptak', 'zvíře neumí létat, ale má peří.', 'Pták', ['Savec', 'Plaz', 'Obojživelník'],
    'Peří mají jen ptáci. Takový je třeba tučňák nebo pštros.'),
  lichy('lichy-stir', [['🐜', 'Mravenec'], ['🦗', 'Cvrček'], ['🦂', 'Štír'], ['🐝', 'Včela']], 2,
    ['Spočítej nohy.'],
    'Štír je pavoukovec s osmi nohama. Mravenec, cvrček i včela jsou hmyz se šesti nohama. Klepeta vpředu se do nohou nepočítají, jsou to takzvaná makadla.'),
  lichy('lichy-motyl', [['🕷️', 'Pavouk'], ['🦂', 'Štír'], ['🦋', 'Motýl']], 2,
    ['Kolik nohou má každé z nich?'],
    'Motýl je hmyz se šesti nohama. Pavouk i štír mají osm nohou a patří mezi pavoukovce. Na nohou má motýl chuťové buňky, a tak pozná chuť květu, hned jak na něj dosedne.'),
  q('kukla', 'Co se děje v kukle?', 'Housenka se mění v motýla',
    ['Líhnou se v ní pulci', 'Housenka v ní schovává jídlo', 'Je to motýlí hnízdo na zimu'],
    ['Kukla je mezi dvěma podobami stejného hmyzu.'],
    'V kukle se tělo housenky úplně přestaví – vyrostou křídla, nohy a tykadla. Pak z kukly vyleze motýl.'),
  q('zaba-dychani', 'Čím dýchá dospělá žába?', 'Plícemi a také kůží',
    ['Jen žábrami', 'Jen ploutvemi', 'Vůbec nedýchá'],
    ['Pulec a dospělá žába dýchají jinak.'],
    'Pulci dýchají žábrami. Dospělá žába dýchá plícemi a část kyslíku přijímá i vlhkou kůží.'),
  q('sezeni-na-vejcich', 'Proč ptáci sedí na vejcích?', 'Zahřívají je, aby se vylíhla mláďata',
    ['Aby se vejce nekutálela', 'Odpočívají po letu', 'Vejce by jinak uletěla'],
    ['Co potřebuje zárodek ve vejci?'],
    'Zárodek ve vejci potřebuje teplo. Ptáci vejce zahřívají vlastním tělem, dokud se mláďata nevylíhnou.'),
  q('kure-dny', 'Za jak dlouho se z vejce vylíhne kuře?', 'Asi za tři týdny',
    ['Za jeden den', 'Asi za rok', 'Za hodinu'],
    ['Je to víc než týden, ale méně než měsíc.'],
    'Slepice sedí na vejcích asi 21 dní, tedy tři týdny. Pak se kuře samo vyklube z vejce.'),
];

// ---------------------------------------------------------------------------
// L5 – obratlovci × bezobratlí, ptakopysk, jak to víme

const L5: Spec[] = [
  q('obratlovci-co', 'Co mají všichni obratlovci?', 'Páteř',
    ['Křídla', 'Šupiny', 'Šest nohou', 'Ulitu'],
    ['Jméno obratlovec je odvozené od slova obratel.'],
    'Obratlovci mají vnitřní kostru s páteří z obratlů. Patří sem ryby, obojživelníci, plazi, ptáci i savci.'),
  q('bezobratly', 'Které zvíře je bezobratlé?', 'Hlemýžď',
    ['Kapr', 'Žába', 'Ještěrka', 'Vrabec'],
    ['Hledej zvíře, které nemá páteř.'],
    'Hlemýžď nemá páteř ani kosti – je to bezobratlý měkkýš. Kapr, žába, ještěrka i vrabec jsou obratlovci.'),
  q('obratlovec', 'Které zvíře je obratlovec?', 'Ještěrka',
    ['Pavouk', 'Žížala', 'Včela', 'Chobotnice'],
    ['Hledej zvíře s páteří.'],
    'Ještěrka má páteř, je to obratlovec (plaz). Pavouk, žížala, včela i chobotnice páteř nemají.'),
  q('chobotnice', 'Chobotnice je velká a chytrá. Je obratlovec?', 'Ne, nemá páteř ani kosti',
    ['Ano, je to ryba', 'Ano, je to savec', 'Ano, má pevnou páteř'],
    ['Chobotnice se protáhne i malou škvírou. Co to o jejím těle říká?'],
    'Chobotnice nemá žádné kosti, a proto se protáhne i úzkou škvírou. Patří mezi bezobratlé měkkýše, stejně jako hlemýžď.'),
  q('vic-druhu', 'Kterých živočichů je na Zemi víc druhů?', 'Bezobratlých',
    ['Obratlovců', 'Obou skupin stejně', 'Savců'],
    ['Kolik různých druhů hmyzu asi existuje?'],
    'Bezobratlých je mnohem víc druhů. Jen hmyzu vědci popsali přes milion druhů, savců je jen několik tisíc.'),
  q('ptakopysk', 'Čím je ptakopysk mezi savci zvláštní?', 'Klade vejce',
    ['Má peří', 'Dýchá žábrami', 'Nemá srst'],
    ['Porovnej, jak přicházejí na svět mláďata ostatních savců.'],
    'Ptakopysk z Austrálie má srst a mláďata krmí mlékem, ale klade vejce. Je jedním z mála savců, kteří kladou vejce.'),
  q('ptakopysk-savec', 'Proč je ptakopysk savec, i když klade vejce?', 'Má srst a mláďata krmí mlékem',
    ['Má zobák jako kachna', 'Umí dobře plavat', 'Žije v Austrálii'],
    ['Co mají společného všichni savci?'],
    'O tom, kam zvíře patří, rozhodují znaky jako srst a krmení mlékem. Ptakopysk je má, a tak je savec.'),
  q('netopyr-orientace', 'Jak se netopýr orientuje ve tmě?', 'Poslouchá ozvěnu svých pisků',
    ['Svítí si očima', 'Čichá ke hvězdám', 'Ohmatává stěny křídly'],
    ['Co se stane, když zavoláš do jeskyně?'],
    'Netopýr vydává velmi vysoké pisky a poslouchá, jak se odrážejí. Vědci to zjistili přístroji, které tyto zvuky zachytí – lidské ucho je neslyší.'),
  q('velryba-dychani', 'Jak dýchá velryba?', 'Plícemi, vynoří se nad hladinu',
    ['Žábrami pod vodou', 'Kůží', 'Ploutvemi'],
    ['Velryba je savec.'],
    'Velryba dýchá plícemi. Vynoří se, vydechne vysoký sloup vzduchu s kapičkami vody a znovu se nadechne.'),
  q('hmyz-kostra', 'Co drží tělo hmyzu, když nemá kosti?', 'Tvrdý povrch těla',
    ['Páteř', 'Chrupavky', 'Vzduch uvnitř'],
    ['Zkus opatrně sáhnout na krovky brouka.'],
    'Hmyz má vnější kostru – tvrdý povrch těla, který chrání vnitřek. Když roste, musí ho svléknout.'),
  q('kostra-uvnitr', 'Kdo má kostru uvnitř těla?', 'Kapr',
    ['Včela', 'Rak', 'Hlemýžď'],
    ['Hledej obratlovce.'],
    'Kapr je obratlovec a má kostru uvnitř těla. Včela a rak mají tvrdý povrch těla a hlemýžď ulitu.'),
  ord('skupiny-vznik', 'Seřaď skupiny obratlovců od nejstarší na Zemi.', ['Ryby', 'Obojživelníci', 'Plazi', 'Ptáci'],
    ['Život začal ve vodě.', 'Kdo vylezl z vody na souš jako první?'],
    'Nejdřív byly ryby, potom obojživelníci, kteří vylezli na souš, pak plazi a nakonec ptáci. Víme to ze zkamenělin.'),
  lichy('lichy-kapr-more', [['🦀', 'Krab'], ['🐙', 'Chobotnice'], ['🦑', 'Oliheň'], ['🐟', 'Kapr']], 3,
    ['Kdo z nich má páteř?'],
    'Kapr je obratlovec, má páteř. Krab, chobotnice i oliheň jsou bezobratlí: krab má jen tvrdý krunýř a chobotnice ani oliheň nemají kosti vůbec.', LICHY_PATER),
  lichy('lichy-zaba-obratlovec', [['🐝', 'Včela'], ['🕷️', 'Pavouk'], ['🐌', 'Hlemýžď'], ['🐸', 'Žába']], 3,
    ['Kdo z nich má kostru s páteří?'],
    'Žába má kostru s páteří, a tak je obratlovec. Včela, pavouk i hlemýžď jsou bezobratlí. Ke skokům žábě pomáhají dlouhé silné kosti zadních nohou.', LICHY_PATER),
  lichy('lichy-stir-plazi', [['🦎', 'Ještěrka'], ['🐍', 'Had'], ['🐢', 'Želva'], ['🦂', 'Štír']], 3,
    ['Kdo z nich nemá páteř?'],
    'Štír je bezobratlý pavoukovec – místo kostry ho chrání tvrdý povrch těla. Ještěrka, had i želva jsou plazi, tedy obratlovci.', LICHY_PATER),
  q('jesterka-slunce', 'Proč se ještěrky ráno vyhřívají na kameni?', 'Jejich tělo se samo nezahřeje',
    ['Hledají tam vodu', 'Kámen jim chutná', 'Schovávají se před sluncem'],
    ['Ještěrka nemá srst ani peří.'],
    'Plazi nemají stálou teplotu těla. Ráno jsou studení a pomalí, a tak se ohřejí na sluníčku.'),
];

/** „Je kapr obratlovec, nebo bezobratlý?“ */
const OBRATLOVCI: [string, boolean, string][] = [
  ['kapr', true, 'Kapr je ryba s páteří, takže je obratlovec. Kromě páteře má v těle i spoustu drobných kůstek.'],
  ['žába', true, 'Žába je obojživelník s kostrou a páteří, takže je obratlovec. Ke skokům jí pomáhají dlouhé silné kosti zadních nohou.'],
  ['ještěrka', true, 'Ještěrka je plaz s páteří, takže je obratlovec. Když odhodí ocas, doroste jí nový – ale už bez obratlů, jen s chrupavkou.'],
  ['vrabec', true, 'Vrabec je pták s páteří, takže je obratlovec. V krku má víc obratlů než člověk, a proto má tak ohebný krk.'],
  ['delfín', true, 'Delfín je savec s kostrou a páteří, takže je obratlovec. V krku má sedm obratlů, stejně jako člověk nebo žirafa.'],
  ['užovka', true, 'Užovka je had s dlouhou páteří, takže je obratlovec. Obratlů má přes dvě stě, člověk jen něco přes třicet.'],
  ['netopýr', true, 'Netopýr je savec s kostrou a páteří, takže je obratlovec. Kosti prstů má dlouhé a mezi nimi je napnutá kůže křídel.'],
  ['pavouk', false, 'Pavouk nemá páteř ani kosti, je to bezobratlý pavoukovec. Kostru mu nahrazuje tvrdý povrch těla, ze kterého musí při růstu vylézt.'],
  ['hlemýžď', false, 'Hlemýžď nemá páteř, je to bezobratlý měkkýš. Oči má na špičkách delších tykadel a umí je zatáhnout dovnitř.'],
  ['žížala', false, 'Žížala nemá žádné kosti ani páteř, je bezobratlá. Tvar jí drží tekutina uvnitř těla, podobně jako balonek naplněný vodou.'],
  ['včela', false, 'Včela je hmyz s tvrdým povrchem těla, páteř nemá, a tak je bezobratlá. Tvrdý povrch jí slouží místo kostry.'],
  ['chobotnice', false, 'Chobotnice nemá žádné kosti, je to bezobratlý měkkýš. Má tři srdce a osm chapadel.'],
  ['rak', false, 'Rak má tvrdý krunýř, ale páteř nemá, a tak je bezobratlý. Když roste, krunýř svlékne a nový mu pak pár dní tvrdne.'],
  ['medúza', false, 'Medúza nemá kosti ani páteř, je bezobratlá. Tělo má skoro celé z vody.'],
  ['klíště', false, 'Klíště je pavoukovec bez páteře, a tak je bezobratlé. Stejně jako pavouk má osm nohou.'],
];

function obratlovecNeboNe(rng: Rng): Spec {
  const [name, vert, explain] = rng.pick(OBRATLOVCI);
  return fixed(`obratel-${slug(name)}`, `Je ${name} obratlovec, nebo bezobratlý živočich?`, ['Obratlovec', 'Bezobratlý'], vert ? 0 : 1,
    ['Má toto zvíře kostru s páteří?'],
    explain);
}

export const zvirata = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Zvířata a jejich skupiny',
  description: 'Třídění živočichů do skupin podle znaků: pokryv těla, rozmnožování, záludná zařazení, obratlovci a bezobratlí.',
  rvp: {
    1: ['ČJS-3-4-02'],
    2: ['ČJS-3-4-02'],
    3: ['ČJS-3-4-02'],
    4: ['ČJS-5-4-04'],
    5: ['ČJS-5-4-04'],
  },
  ability: 'znalosti',
  testLike: 'vedomosti',
  showFact: true,
  banks: { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: {
    2: doSkupiny(2),
    3: doSkupiny(3),
    4: doSkupiny(4),
    5: obratlovecNeboNe,
  },
  genShare: 0.4,
});

export const zvirataCards: KnowledgeCard[] = [
  {
    id: `${ID}.pavouk`,
    skillId: ID,
    level: 2,
    emoji: '🕷️',
    title: 'Pavouk není hmyz',
    text: 'Hmyz má šest nohou a tělo ze tří částí. Pavouk má osm nohou a tělo ze dvou částí, a proto patří mezi pavoukovce – stejně jako klíště.',
  },
  {
    id: `${ID}.velryba`,
    skillId: ID,
    level: 3,
    emoji: '🐋',
    title: 'Velryba není ryba',
    text: 'Velryba dýchá plícemi, rodí živá mláďata a krmí je mlékem. Je to savec, stejně jako delfín.',
    fix: {
      before: 'Dřív se velrybám říkalo ryby, protože žijí v moři a mají ploutve.',
      evidence: 'Přírodovědci pozorovali, že se velryby musí vynořovat kvůli dechu a že kojí mláďata. Carl Linné je proto v roce 1758 zařadil mezi savce.',
    },
  },
  {
    id: `${ID}.ptakopysk`,
    skillId: ID,
    level: 5,
    emoji: '🥚',
    title: 'Savec, který klade vejce',
    text: 'Ptakopysk z Austrálie má srst a mláďata krmí mlékem, a přece klade vejce. Je to savec, jen hodně zvláštní.',
    fix: {
      before: 'Když v roce 1799 zkoumali v Anglii první kůži ptakopyska, měli přírodovědci podezření, že je to podvrh – kachní zobák přišitý ke kožešině jiného zvířete.',
      evidence: 'Zoolog George Shaw hledal na kůži stehy, ale žádné nenašel. Později přírodovědci pozorovali živé ptakopysky v Austrálii a v roce 1884 tam našli i jejich vejce.',
    },
  },
];
