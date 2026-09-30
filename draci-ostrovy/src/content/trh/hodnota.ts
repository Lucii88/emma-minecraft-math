// Cena a hodnota – co se opravdu vyplatí: porovnání cen u stánků, ceny
// končící devítkou, akce „3 za cenu 2“, cena za kus a za 100 g, slevy
// a permanentky. A hlavně: cena není totéž co hodnota a dražší neznamená
// automaticky lepší.

import { capitalize, count, formatNumber as f, type Forms } from '../../core/czech';
import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import {
  GOODS,
  MESIC,
  ONE_ACC,
  ONE_NOM,
  PEOPLE,
  PIECES,
  ROK,
  fx,
  goodsBetween,
  isOffer,
  kc,
  korun,
  list,
  mix,
  nm,
  offer,
  ord,
  pickDistinct,
  pkey,
  priceOf,
  q,
  sum,
  type Attempt,
  type Piece,
} from './common';

const ID = 'trh.hodnota';

/** Procenta k předčítání: „50 %“ → „50 procent“. */
const speakPct = (s: string) => s.replace(/ %/g, ' procent');

const KRAT = ['', 'jednou', 'dvakrát', 'třikrát', 'čtyřikrát', 'pětkrát', 'šestkrát', 'sedmkrát', 'osmkrát', 'devětkrát', 'desetkrát'];
const VSTUP: Forms = ['vstup', 'vstupy', 'vstupů'];

// ---------------------------------------------------------------------------
// L2 – cena a hodnota, porovnání cen

const L2: Spec[] = [
  q('neda-se-koupit', 'Co se nedá koupit za peníze?', 'Přátelství',
    ['Rohlík', 'Míč', 'Pastelky', 'Zmrzlina'],
    ['Co by šlo dát do nákupního košíku?'],
    'Přátelství se nedá koupit v žádném obchodě – vzniká z času, který spolu kamarádi tráví. Vědci spočítali, že z nového známého se stane kamarád asi po 50 hodinách společného času.'),
  q('obrazek-babicka', 'Babička si schovává obrázek, který jsi jí {nakreslila|nakreslil}. Proč je pro ni tak cenný?', 'Protože je od tebe',
    ['Protože byl drahý', 'Protože je ze zlata', 'Protože ho prodá'],
    ['Kolik asi stál papír a pastelky?'],
    'Obrázek nestál skoro nic, ale babičce připomíná tebe. Hodnota věci není jen její cena – patří k ní i vzpomínky a to, kdo nám ji dal.'),
  q('micek-obrazek', 'Dva míčky jsou úplně stejné, jen jeden má obrázek draka. Obyčejný stojí 60 Kč, ten s drakem 90 Kč. Za co platíš těch 30 Kč navíc?', 'Za obrázek draka',
    ['Za lepší skákání', 'Za větší míček', 'Za víc vzduchu'],
    ['V čem se míčky liší?'],
    'Míčky jsou stejné, takže 30 Kč navíc platíš jen za obrázek. Když jde o známou postavičku z filmu, výrobce často platí jejímu majiteli, aby ji na míček směl dát – a to se promítne do ceny.'),
  q('cas-s-tatou', 'Táta si s tebou celé odpoledne hraje. Co ti tím dává?', 'Svůj čas',
    ['Peníze', 'Novou hračku', 'Bonbony'],
    ['Co táta při hře „utrácí“, i když za nic neplatí?'],
    'Táta ti dává svůj čas. Čas s rodinou se nedá koupit ani vrátit, a proto má velkou hodnotu.'),
  q('voda-zizen', 'Jsi na dlouhém výletě a máš velkou žízeň. Co má pro tebe teď největší hodnotu?', 'Láhev vody',
    ['Zlatý prstýnek', 'Nová hračka', 'Třpytivá samolepka'],
    ['Co tvé tělo teď nejvíc potřebuje?'],
    'Když máš žízeň, voda je nejcennější věc, i když stojí jen pár korun. Hodnota věci záleží na tom, jak moc ji zrovna potřebuješ – doma přitom litr vody z kohoutku stojí méně než korunu.'),
  q('drazsi-vzdy', 'Je dražší věc vždycky lepší?', 'Ne, ne vždycky',
    ['Ano, vždycky', 'Ano, pozná se to podle ceny', 'Ano, levné je vždycky špatné'],
    ['Za co všechno se v ceně platí? Jen za věc samotnou?'],
    'Cena záleží i na obalu, značce a reklamě. Jestli je věc dobrá, poznáš, až ji vyzkoušíš nebo porovnáš s jinými – levnější věc někdy vyhraje.'),
  q('naramek', 'Kamarádka ti vyrobila náramek z korálků. Co je na něm nejcennější?', 'Že ho dělala pro tebe',
    ['Kolik stály korálky', 'Že je z obchodu', 'Že je nejdražší'],
    ['Co do náramku kamarádka dala kromě korálků?'],
    'Vlastnoručně vyrobený dárek má velkou hodnotu, protože do něj kamarádka dala svůj čas a péči. Takový náramek se nikde jinde koupit nedá.'),
  q('zdrazeni', 'Jablko stálo loni 5 Kč a letos stojí 6 Kč. Co se stalo s cenou?', 'Zvýšila se',
    ['Snížila se', 'Zůstala stejná', 'Zmizela'],
    ['Je 6 víc, nebo míň než 5?'],
    'Ceny se mění. Když něco zdraží, zaplatíš za stejnou věc víc peněz – o korunu dražší jablko je u deseti jablek o 10 Kč víc.'),
  q('porovnat', 'Chceš koupit pastelky. Co je chytré udělat předtím?', 'Porovnat ceny',
    ['Koupit ty první', 'Koupit ty nejdražší', 'Koupit dvoje'],
    ['Stojí stejné pastelky všude stejně?'],
    'Stejné pastelky mohou v různých obchodech stát různě. Když porovnáš ceny, zaplatíš méně a ušetřené peníze můžeš dát na něco jiného.'),
  q('svicka-krabicka', 'V obchodě jsou dvě stejné svíčky. Jedna je ve zlaté krabičce a stojí víc. Která bude svítit déle?', 'Obě stejně dlouho',
    ['Ta ve zlaté krabičce', 'Ta levnější'],
    ['Liší se svíčky, nebo jen krabičky?'],
    'Svíčky jsou stejné, jen krabička je jiná. Jak dlouho svíčka svítí, záleží na vosku a knotu – krabička na tom nic nezmění.'),
  q('hodnota-pomoc', '{Pomohla|Pomohl} jsi sousedce odnést nákup a {nedostala|nedostal} jsi za to žádné peníze. Měla ta pomoc hodnotu?', 'Ano, velkou',
    ['Ne, nic to nestálo', 'Ne, nikdo nezaplatil', 'Jen kdyby zaplatila'],
    ['Je něco cenné, i když se za to neplatí?'],
    'Pomoc má velkou hodnotu, i když se za ni neplatí. Kdyby si sousedka na nošení nákupu musela někoho najmout, musela by mu zaplatit.'),
];

// ---------------------------------------------------------------------------
// L3 – ceny končící devítkou, značka, vzácnost, vikingské stříbro

const L3: Spec[] = [
  q('devitky', 'Proč obchody často píšou ceny jako 99 Kč, a ne 100 Kč?', 'Aby cena vypadala nižší',
    ['Protože 99 je víc než 100', 'Protože stokoruny neplatí', 'Protože to nařizuje zákon'],
    ['Kterou číslici si na cenovce všimneš nejdřív?'],
    'Oči si všimnou hlavně první číslice, a tak 99 Kč působí levněji než 100 Kč. V jednom pokusu se dokonce šaty za 39 dolarů prodávaly líp než stejné šaty za 34 dolarů.'),
  q('o-kolik-399', 'Hračka stojí 399 Kč. O kolik je to méně než 400 Kč?', 'O 1 Kč',
    ['O 100 Kč', 'O 10 Kč', 'O 99 Kč'],
    ['Kolik chybí od 399 do 400?'],
    '400 − 399 = 1. Cena 399 Kč vypadá jako „tři sta něco“, ale je to skoro 400 Kč – proto se vyplatí ceny v duchu zaokrouhlit.'),
  q('znacka-tricko', 'Dvě trička jsou ze stejné látky a šila je stejná dílna. Jedno má logo známé značky a stojí třikrát víc. Za co platíš navíc?', 'Za logo značky',
    ['Za lepší látku', 'Za delší rukávy', 'Za pevnější švy'],
    ['V čem se trička liší?'],
    'Trička jsou stejná, liší se jen logem. Za známou značku se platí víc, protože firma utrácí za reklamu a lidé značku rádi nosí – tričko samo ale lepší není.'),
  q('zlato', 'Proč je zlato drahé?', 'Je vzácné a lidé ho chtějí',
    ['Je lehké jako peříčko', 'Je ho všude plno', 'Roste na stromech'],
    ['Je zlata na světě hodně, nebo málo?'],
    'Zlata je na světě málo a lidé ho chtějí na šperky i do přístrojů. Všechno zlato, které lidé kdy vytěžili, by se vešlo do kostky o hraně asi 22 metrů.'),
  q('vikingove-vaha', 'Vikingové často platili kousky stříbra. Jak poznali, kolik stříbra dávají?', 'Zvážili ho',
    ['Změřili ho pravítkem', 'Podívali se na obrázek', 'Hodili si kostkou'],
    ['Kousky stříbra byly různě velké.'],
    'Vikingové nosili malé skládací váhy a stříbro vážili. Do kousků stříbra navíc často dělali nožem malé zářezy, aby poznali, jestli je stříbro pravé i uvnitř.'),
  q('svicka-a-b', 'Jedna svíčka stojí 40 Kč, druhá 80 Kč. Vypadají stejně, stejně voní a hoří stejně dlouho. Která je výhodnější?', 'Ta za 40 Kč',
    ['Ta za 80 Kč', 'Obě stejně', 'Nedá se to poznat'],
    ['Co dostaneš za své peníze u každé svíčky?'],
    'Obě svíčky dělají totéž, ale jedna stojí polovinu. Za cenu té dražší se dají koupit hned dvě levnější.'),
  q('sacky-bonbonu', 'Dva sáčky stejných bonbonů stojí stejně. V jednom je 10 bonbonů, ve druhém 15. Který je výhodnější?', 'Ten s 15 bonbony',
    ['Ten s 10 bonbony', 'Oba stejně', 'Ten s hezčím obalem'],
    ['Kde dostaneš za stejné peníze víc?'],
    'Za stejnou cenu dostaneš ve druhém sáčku o 5 bonbonů víc. Vyplatí se dívat nejen na cenu, ale i na to, kolik v balení je – proto bývá na cenovkách i cena za kilogram.'),
  q('pastelky-vyber', 'Na co je nejlepší se dívat, když vybíráš pastelky na malování?', 'Jak dobře malují',
    ['Jak lesklou mají krabičku', 'Kolik reklam na ně je', 'Jakou barvu má krabička'],
    ['K čemu pastelky potřebuješ?'],
    'Pastelky kupuješ na malování, takže nejdůležitější je, jak malují. Lesklá krabička ani reklama malovat nepomůže – nejlíp je pastelky vyzkoušet.'),
  q('destnik-vydrz', 'Levný deštník stojí 100 Kč a rozbije se při prvním větru. Dražší stojí 300 Kč a vydrží roky. Co vyjde nakonec levněji?', 'Dražší, který vydrží',
    ['Levný, protože je levný', 'Kupovat každý měsíc nový', 'Dva levné najednou'],
    ['Kolik deštníků koupíš, když se levný pořád rozbíjí?'],
    'Levný deštník by se musel kupovat znovu a znovu – a už čtyři levné stojí 400 Kč, víc než jeden dražší. Věc, která dlouho vydrží, se často vyplatí.'),
];

// ---------------------------------------------------------------------------
// L4 – ochutnávky naslepo, sezóna, slevy, velká balení

const L4: Spec[] = [
  q('ochutnavka', 'Proč se při ochutnávce naslepo schovávají obaly?', 'Aby obal ani cena nikoho neovlivnily',
    ['Aby se jídlo nezkazilo', 'Aby ochutnávka trvala déle', 'Aby nikdo nic nesnědl'],
    ['Co se stane, když víš, že něco bylo drahé?'],
    'Když lidé vidí drahý obal nebo vysokou cenu, často jim věc chutná víc. V jednom pokusu dospělým chutnal stejný nápoj víc, když si mysleli, že je drahý.'),
  q('dzus-naslepo', 'Při ochutnávce naslepo vyhrál levný džus nad drahým. Co to ukazuje?', 'Dražší nemusí chutnat líp',
    ['Levné je vždycky lepší', 'Ochutnávka se nepovedla', 'Drahý džus byl zkažený'],
    ['Věděli ochutnávači, který džus je drahý?'],
    'Ochutnávači nevěděli, co je drahé, a přesto jim víc chutnal levný džus. Cena sama o chuti nerozhoduje – jindy zase vyhraje ten dražší.'),
  q('jahody-zima', 'Proč jsou jahody v zimě dražší než v létě?', 'V zimě se vozí zdaleka',
    ['V zimě jsou sladší', 'V zimě je nikdo nechce', 'V zimě jsou větší'],
    ['Rostou u nás jahody v zimě na zahradě?'],
    'V létě jahody dozrávají u nás a je jich hodně. V zimě se vozí z teplých krajin nebo rostou ve vytápěných sklenících, a to stojí víc peněz.'),
  q('zbytecna-sleva', 'Obchod má slevu na obří plyšáky. Ty žádného nechceš ani nepotřebuješ. Ušetříš, když ho koupíš?', 'Ne, utratím peníze navíc',
    ['Ano, sleva je vždycky úspora', 'Ano, čím víc koupím, tím víc ušetřím', 'Ano, protože je obří'],
    ['Utratily by se ty peníze, kdyby sleva nebyla?'],
    'Sleva ušetří peníze jen tehdy, když věc opravdu potřebuješ nebo chceš. Jinak utratíš peníze za něco, co by sis vůbec {nekoupila|nekoupil} – i se slevou je to výdaj navíc.'),
  q('velke-baleni', 'Velké balení jogurtů je levnější za kus. Kdy se ho nevyplatí koupit?', 'Když je nestihneš sníst',
    ['Když máš jogurty {ráda|rád}', 'Když je lednička prázdná', 'Když máte velkou rodinu'],
    ['Co se stane s jogurtem, který dlouho leží?'],
    'Levnější za kus se vyplatí, jen když všechno spotřebuješ. Jogurty, které se zkazí a vyhodí, jsou vyhozené peníze – proto se vyplatí hlídat datum spotřeby.'),
  q('mensi-cokolada', 'Čokoláda stojí pořád 30 Kč, ale místo 100 g má teď jen 80 g. Co se stalo?', 'Vlastně zdražila',
    ['Zlevnila', 'Nic se nezměnilo', 'Je jí teď víc'],
    ['Dostaneš za 30 Kč stejně čokolády jako dřív?'],
    'Za stejné peníze dostaneš méně čokolády, takže vlastně zdražila. Tomu triku se říká smrskflace – menšího balení si lidé všimnou hůř než vyšší ceny.'),
  q('reklama-cena', 'Proč bývá zboží, o kterém je hodně reklam, někdy dražší?', 'Reklamy stojí peníze',
    ['V televizi vypadá hezčí', 'Je vždycky lepší', 'Je těžší'],
    ['Kdo platí za reklamy?'],
    'Reklamy platí firmy a peníze na ně se často vracejí v ceně zboží. Třeba půlminutová reklama při finále amerického fotbalu stojí přes 7 milionů dolarů.'),
  q('cesta-leif', 'Leif může jet do obchodu, kde je jeho nákup o 20 Kč levnější. Jízdenka tam a zpátky ale stojí 30 Kč. Vyplatí se mu to?', 'Ne, jízda stojí víc',
    ['Ano, ušetří 20 Kč', 'Ano, ušetří 50 Kč', 'Vyjde to úplně stejně'],
    ['Porovnej, kolik ušetří a kolik zaplatí za cestu.'],
    'Ušetří 20 Kč, ale za jízdenku zaplatí 30 Kč. Celkem by tedy utratil o 10 Kč víc – a ještě by strávil čas cestou.'),
];

// ---------------------------------------------------------------------------
// L5 – procenta ve slevách, nabídka a poptávka, permanentky

const L5: Spec[] = [
  q('co-je-sleva-50', 'Co znamená sleva 50 %?', 'Zaplatíš polovinu ceny',
    ['Cena klesne o 50 Kč', 'Zaplatíš 50 Kč', 'Cena se zdvojnásobí'],
    ['Kolik je 50 ze 100?'],
    '50 % je polovina: z ceny se odečte půlka a ty zaplatíš tu druhou. Slovo procento totiž znamená „ze sta“ – a 50 ze 100 je právě polovina.',
    { speak: 'Co znamená sleva padesát procent?' }),
  q('co-je-sleva-100', 'Co by znamenala sleva 100 %?', 'Věc by byla zadarmo',
    ['Věc by stála 100 Kč', 'Věc by byla dvakrát dražší', 'Věc by stála polovinu'],
    ['100 % je celá cena.'],
    'Kdyby se z ceny odečetla celá cena, nezbylo by nic – věc by byla zadarmo. 100 % znamená všechno, proto se taková sleva v obchodech skoro nevidí.',
    { speak: 'Co by znamenala sleva sto procent?' }),
  q('deset-procent', 'Sleva 10 % na bundu za 2000 Kč, nebo sleva 10 % na čepici za 200 Kč. Která ušetří víc korun?', 'Sleva na bundu',
    ['Sleva na čepici', 'Obě stejně', 'Žádná'],
    ['10 % je desetina ceny.'],
    '10 % je desetina. Z 2000 Kč je to 200 Kč, z 200 Kč jen 20 Kč – stejná procenta z vyšší ceny jsou víc korun.',
    { speak: 'Sleva deset procent na bundu za 2000 korun, nebo sleva deset procent na čepici za 200 korun. Která ušetří víc korun?' }),
  q('jablek-hodne', 'Na trh přijelo deset prodavačů jablek, ale kupců je málo. Co se asi stane s cenou jablek?', 'Cena klesne',
    ['Cena stoupne', 'Jablka budou zadarmo', 'Jablka zmizí'],
    ['Co udělá prodavač, když jablka nikdo nekupuje?'],
    'Když je zboží hodně a kupců málo, prodavači snižují ceny, aby něco prodali. Když je zboží málo a kupců hodně, ceny rostou – tomu se říká nabídka a poptávka.'),
  q('medu-malo', 'Včelaři letos mají málo medu, ale lidé ho chtějí pořád stejně. Co se asi stane s cenou medu?', 'Cena stoupne',
    ['Cena klesne', 'Med bude zadarmo', 'Lidé přestanou jíst med'],
    ['Co je vzácnější – med letos, nebo loni?'],
    'Když je zboží málo a zájemců pořád stejně, prodávající můžou chtít víc peněz. Proto bývá med dražší po roce, kdy se včelám nedařilo.'),
  q('permanentka-kdy', 'Permanentka na 10 vstupů do bazénu je za jeden vstup levnější. Kdy se nevyplatí?', 'Když půjdeš jen dvakrát',
    ['Když půjdeš desetkrát', 'Když {ráda|rád} plaveš', 'Když chodíš každý týden'],
    ['Kolik vstupů za cenu permanentky opravdu využiješ?'],
    'Permanentka se vyplatí, jen když ji opravdu využiješ. Za dva vstupy bys {zaplatila|zaplatil} celou permanentku a osm vstupů by zůstalo nevyužitých.'),
  q('druhy-za-pul', 'Akce: druhý kus za polovinu. Chceš ale jen jeden kus. Jak utratíš nejméně?', 'Koupím jen jeden',
    ['Koupím dva, je to akce', 'Koupím tři kusy', 'Koupím dva a jeden vyhodím'],
    ['Kolik zaplatíš za jeden kus a kolik za dva?'],
    'Za dva kusy bys {zaplatila|zaplatil} jeden a půl ceny, i když chceš jen jeden. Nejméně utratíš, když koupíš jen to, co potřebuješ.'),
  q('jen-deset-minut', 'Na obrazovce bliká: „Sleva jen dalších 10 minut!“ Proč to obchod píše?', 'Aby lidé nakoupili bez rozmýšlení',
    ['Obchod se za 10 minut navždy zavře', 'Aby lidé měli dost času', 'Musí to tam být'],
    ['Jak se nakupuje, když člověk spěchá?'],
    'Kdo spěchá, nepřemýšlí, jestli věc opravdu potřebuje. Takové odpočítávání je obchodní trik – vyplatí se nenechat se uspěchat a chvíli počkat.'),
];

// ---------------------------------------------------------------------------
// L6 – paradox vody a diamantů, slevy za sebou, kupony, cesta za levnějším

const L6: Spec[] = [
  q('voda-diamanty', 'Voda je k životu nezbytná, a přesto bývá levná. Diamanty k životu nepotřebujeme, a jsou drahé. Proč?', 'Vody je hodně, diamantů málo',
    ['Diamanty jsou k jídlu', 'Voda je k ničemu', 'Ceny se losují'],
    ['Co je vzácnější?'],
    'Cena hodně záleží na tom, kolik je čeho k dispozici. Vody je většinou dost, diamanty jsou vzácné. Této hádance se říká paradox vody a diamantů – psal o ní už před 250 lety Adam Smith.'),
  q('omyl-dvou-slev', 'Obchod zlevní bundu o 50 % a potom novou cenu ještě o 50 %. Je teď bunda zadarmo?', 'Ne, stojí čtvrtinu',
    ['Ano, 50 + 50 = 100 %', 'Ne, stojí polovinu', 'Ano, dvě slevy jsou všechno'],
    ['Z jaké ceny se počítá druhá sleva?'],
    'Druhá sleva se počítá z nové, poloviční ceny. Polovina z poloviny je čtvrtina – bunda za 1000 Kč by tedy stála 250 Kč.',
    { speak: 'Obchod zlevní bundu o padesát procent a potom novou cenu ještě o padesát procent. Je teď bunda zadarmo?' }),
  q('dve-slevy-poradi', 'Je jedno, jestli obchod zlevní nejdřív o 20 % a pak o 50 %, nebo naopak?', 'Ano, vyjde to stejně',
    ['Ne, lepší je nejdřív 50 %', 'Ne, lepší je nejdřív 20 %', 'Ne, pak je to zadarmo'],
    ['Zkus to na ceně 1000 Kč.'],
    'Třeba z 1000 Kč: po slevě 20 % je 800 Kč a po slevě 50 % 400 Kč. Naopak: po 50 % je 500 Kč a po 20 % zase 400 Kč. Vyjde to stejně.',
    { speak: 'Je jedno, jestli obchod zlevní nejdřív o dvacet procent a pak o padesát procent, nebo naopak?' }),
  nm('kupon', 'Kupon dává slevu 100 Kč při nákupu od 500 Kč. Tvůj nákup stojí 450 Kč. Kolik zaplatíš, když přidáš čokoládu za 50 Kč?', 400,
    ['Kolik bude stát nákup i s čokoládou?', 'Bude teď kupon platit?'],
    'S čokoládou stojí nákup 500 Kč, takže kupon platí: 500 − 100 = 400 Kč. Zaplatíš méně než bez čokolády – a čokoládu máš navíc.',
    { unit: 'Kč' }),
  q('syr-cesta', 'Stánek vedle domu prodává 100 g sýra za 30 Kč. Na druhém konci města stojí 100 g jen 25 Kč, ale jízdenka tam a zpátky stojí 40 Kč. Chceš 200 g. Kde to vyjde levněji?', 'U stánku vedle domu',
    ['Na druhém konci města', 'Vyjde to stejně', 'Nedá se to spočítat'],
    ['Spočítej cenu 200 g na obou místech.', 'Na druhý konec města musíš připočítat jízdenku.'],
    'Vedle domu: 2 × 30 = 60 Kč. Na druhém konci města: 2 × 25 + 40 = 90 Kč. Levnější je stánek vedle domu – nižší cena za 100 g nepomůže, když se k ní musí připočítat cesta.'),
  q('hrnek-prababicka', 'Starý hrnek, ze kterého pila už prababička, by se na trhu prodal jen za 20 Kč. Pro rodinu je ale nejcennější věcí v kuchyni. Jak to jde dohromady?', 'Cena a hodnota nejsou totéž',
    ['Rodina se spletla', 'Hrnek je ze zlata', 'Na trhu se spletli'],
    ['Proč si rodina hrnku váží?'],
    'Cena je to, kolik by za věc zaplatil někdo cizí. Hodnota je to, jak moc je věc pro někoho důležitá – třeba kvůli vzpomínkám na prababičku.'),
];

// ---------------------------------------------------------------------------
// Generátory: stánky, pořadí cen, rozdíl cen

const NUM_WORD: Record<number, string> = { 3: 'Tři', 4: 'Čtyři' };

/** Stejná věc u několika stánků: kde je nejlevnější? */
function stanky(level: 2 | 3): Attempt {
  return (rng) => {
    const n = level === 2 ? 3 : 4;
    const pool = GOODS.filter((x) => !x.pl && x.min >= 10 && (level === 2 ? x.max <= 100 : x.min >= 60 && x.max <= 900));
    const good = rng.pick(pool);
    const base = priceOf(rng, good);
    const spread = level === 2 ? 9 : 60;
    const prices = [base];
    for (let i = 0; i < 30 && prices.length < n; i++) {
      const p = base + rng.int(-spread, spread);
      // Ceny zůstávají uvěřitelné: blízko obvyklému rozsahu zboží.
      if (p >= good.min - 3 && p <= good.max + 10 && !prices.includes(p)) prices.push(p);
    }
    if (prices.length < n) return null;
    const shuffled = rng.shuffle(prices);
    const sellers = pickDistinct(rng, PEOPLE, n);
    const min = Math.min(...shuffled);
    const best = sellers[shuffled.indexOf(min)];
    const max = Math.max(...shuffled);
    const worst = sellers[shuffled.indexOf(max)];
    const head = `${NUM_WORD[n]} stánky prodávají ${good.acc} stejné kvality.`;
    const ask = `U kterého stánku je ${good.nom} nejlevnější?`;
    return q(
      `stanky-${good.key}-${sellers.map(pkey).join('-')}-${shuffled.join('-')}`,
      `${head} ${ask}`,
      `U ${best.gen}`,
      sellers.filter((s) => s !== best).map((s) => `U ${s.gen}`),
      ['Porovnej cenovky na kartách.', 'Hledáš nejmenší číslo.'],
      `Nejlevnější je to u ${best.gen}: ${kc(min)}. U ${worst.gen} by stejná věc stála o ${kc(max - min)} víc – proto se vyplatí ceny porovnat.`,
      {
        visual: { type: 'cards', cards: sellers.map((s, i) => ({ emoji: good.emoji, title: `U ${s.gen}`, tag: kc(shuffled[i]) })) },
        speak: `${head} ${capitalize(list(sellers.map((s, i) => `u ${s.gen} ${i === 0 ? 'stojí ' : ''}${korun(shuffled[i])}`)))}. ${ask}`,
        difficulty: level === 3 ? 0.1 : -0.1,
      },
    );
  };
}

/** Seřaď věci od nejlevnější po nejdražší. */
function poradi(level: 2 | 3): Attempt {
  return (rng) => {
    const goods = level === 2 ? goodsBetween(1, 100) : goodsBetween(40, 1000);
    const items = pickDistinct(rng, goods, level === 2 ? 4 : 5).map((good) => ({ good, price: priceOf(rng, good) }));
    const prices = items.map((i) => i.price);
    if (new Set(prices).size !== prices.length) return null;
    const sorted = items.slice().sort((a, b) => a.price - b.price);
    // Zajímavost navíc: stojí nejdražší věc víc než všechny ostatní dohromady?
    const top = sorted[sorted.length - 1];
    const others = sum(sorted.slice(0, -1).map((i) => i.price));
    const compare =
      top.price > others
        ? `${capitalize(top.good.nom)} stojí víc než všechny ostatní věci dohromady.`
        : top.price < others
          ? `Všechny ostatní věci dohromady stojí víc než ${top.good.nom}.`
          : `${capitalize(top.good.nom)} stojí stejně jako všechny ostatní věci dohromady.`;
    return ord(
      `poradi-${items.map((i) => `${i.good.key}${i.price}`).join('-')}`,
      'Seřaď věci od nejlevnější po nejdražší.',
      sorted.map((i) => capitalize(i.good.nom)),
      ['Najdi nejdřív tu nejlevnější.', level === 2 ? 'Porovnávej nejdřív desítky, potom jednotky.' : 'U delších čísel porovnávej nejdřív stovky, potom desítky.'],
      `Od nejlevnější: ${sorted.map((i) => `${i.good.nom} ${kc(i.price)}`).join(', ')}. ${compare}`,
      {
        visual: offer(items),
        speak: `Seřaď věci od nejlevnější po nejdražší. Na kartách ${isOffer(items)}.`,
        difficulty: level === 3 ? 0.1 : 0,
      },
    );
  };
}

/** Zboží, které se kupuje každý týden (u něj se dá spočítat úspora za rok). */
const WEEKLY = new Set(['chleb', 'mleko', 'syr', 'pernicek']);

/** O kolik je to jinde levnější? */
function okolik(rng: Rng): Spec | null {
  const good = rng.pick(goodsBetween(10, 100));
  const a = priceOf(rng, good);
  const b = a + rng.int(-15, 15);
  if (b === a || b < good.min || b > good.max) return null;
  const diff = Math.abs(a - b);
  return nm(
    `okolik-${good.key}-${a}-${b}`,
    `${capitalize(good.nom)} stojí na trhu ${kc(a)} a v obchodě ${kc(b)}. O kolik korun ušetříš, když nakoupíš tam, kde je to levnější?`,
    diff,
    ['Kde je to levnější?', 'Od vyšší ceny odečti nižší.'],
    `${f(Math.max(a, b))} − ${f(Math.min(a, b))} = ${f(diff)}. ${a < b ? 'Na trhu' : 'V obchodě'} ušetříš ${kc(diff)}. ${WEEKLY.has(good.key) ? `Kdo ho tam kupuje každý týden, ušetří za rok ${kc(diff * 52)}.` : 'Stejná věc může na různých místech stát různě, proto se vyplatí ceny porovnat.'}`,
    { unit: 'Kč', difficulty: 0.1 },
  );
}

// ---------------------------------------------------------------------------
// Generátory: „skoro stovka“, akce 3 za 2, slevy

function skoro(rng: Rng): Spec | null {
  const good = rng.pick(GOODS.filter((x) => x.max >= 200 && x.min <= 900));
  const hundreds = rng.int(Math.max(2, Math.ceil(good.min / 100)), Math.min(9, Math.floor((good.max + 50) / 100)));
  const d = rng.pick([1, 1, 10]);
  const price = hundreds * 100 - d;
  const round = hundreds * 100;
  const wrong = [round - 100, round + 100, round * 10, hundreds * 10];
  return q(
    `skoro-${good.key}-${price}`,
    `${capitalize(good.nom)} stojí ${kc(price)}. Kolik to je zhruba?`,
    `Skoro ${kc(round)}`,
    wrong.map((x) => `Skoro ${kc(x)}`),
    ['Kolik korun chybí do nejbližší celé stovky?'],
    `${kc(price)} je jen o ${kc(d)} méně než ${kc(round)}. Obchody rády píšou ceny těsně pod celou stovkou, aby vypadaly nižší – první číslice nás snadno zmate.`,
    { difficulty: -0.1 },
  );
}

const cheapPieces = () => PIECES.filter((x) => x.max <= 40);
const oneNom = (p: Piece) => `${capitalize(ONE_NOM[p.rod])} ${p.nom[0]}`;

/** „3 za cenu 2“: vyplatí se, jen když využiješ všechny kusy. */
function akce(rng: Rng): Spec | null {
  const p = rng.pick(cheapPieces());
  const u = rng.int(p.min, p.max);
  const need = rng.pick([1, 3]);
  const one = ONE_ACC[p.rod];
  return fx(
    `akce-${p.key}-${u}-${need}`,
    `${oneNom(p)} stojí ${kc(u)}. V akci jsou 3 ${p.nom[1]} za cenu dvou. Potřebuješ ${need === 1 ? `jen ${one} ${p.acc[0]}` : `3 ${p.acc[1]}`}. Jak zaplatíš méně?`,
    [need === 1 ? `Koupím jen ${one}` : 'Koupím tři zvlášť', 'Vezmu akci 3 za 2'],
    need === 1 ? 0 : 1,
    ['Spočítej, kolik zaplatíš v akci a kolik bez ní.', 'V akci platíš za dva kusy.'],
    need === 1
      ? `Bez akce zaplatíš ${kc(u)}. V akci bys {zaplatila|zaplatil} 2 × ${u} = ${kc(2 * u)}, i když potřebuješ jen ${one}. Akce se vyplatí, jen když využiješ všechny kusy.`
      : `Tři zvlášť stojí 3 × ${u} = ${kc(3 * u)}, v akci jen 2 × ${u} = ${kc(2 * u)}. Když potřebuješ všechny tři, akce se vyplatí.`,
    { difficulty: need === 1 ? 0.1 : -0.1 },
  );
}

function akceVic(rng: Rng): Spec | null {
  const p = rng.pick(cheapPieces());
  const u = rng.int(p.min, p.max);
  const n = rng.pick([6, 9]);
  const triples = n / 3;
  const pay = triples * 2 * u;
  return nm(
    `akcevic-${p.key}-${u}-${n}`,
    `${oneNom(p)} stojí ${kc(u)}. V akci jsou 3 ${p.nom[1]} za cenu dvou. Kolik zaplatíš za ${count(n, p.acc)} v akci?`,
    pay,
    ['Kolik trojic koupíš?', 'Za každou trojici platíš jen dva kusy.'],
    `Koupíš ${triples} trojice. Za každou platíš 2 × ${u} = ${kc(2 * u)}, celkem ${triples} × ${2 * u} = ${kc(pay)}. Bez akce by to stálo ${kc(n * u)} – akce 3 za 2 je vlastně sleva o třetinu.`,
    { unit: 'Kč', difficulty: 0.2 },
  );
}

function sleva(rng: Rng): Spec | null {
  const good = rng.pick(goodsBetween(100, 1200));
  const price = priceOf(rng, good);
  const off = rng.int(2, Math.min(30, Math.floor(price / 20))) * 10;
  const after = price - off;
  if (rng.chance(0.4)) {
    return nm(
      `slevazpet-${good.key}-${price}-${off}`,
      `Po slevě ${kc(off)} stojí ${good.nom} ${kc(after)}. Jaká byla cena před slevou?`,
      price,
      ['Byla cena před slevou vyšší, nebo nižší?', 'Slevu k dnešní ceně přičti.'],
      `Před slevou to bylo o ${kc(off)} víc: ${f(after)} + ${f(off)} = ${kc(price)}. Původní cenu je dobré znát – jen tak poznáš, jestli je sleva opravdu velká.`,
      { unit: 'Kč', difficulty: 0.2 },
    );
  }
  return nm(
    `sleva-${good.key}-${price}-${off}`,
    `${capitalize(good.nom)} stojí ${kc(price)}. Obchod dává slevu ${kc(off)}. Kolik zaplatíš?`,
    after,
    ['Sleva se od ceny odečítá.'],
    `${f(price)} − ${f(off)} = ${kc(after)}. Obchod musí u slevy uvést i nejnižší cenu za posledních 30 dní, aby sleva nebyla jen naoko.`,
    { unit: 'Kč', difficulty: -0.1 },
  );
}

// ---------------------------------------------------------------------------
// Cena za kus a za 100 g

/** Dvě balení stejné věci: ve kterém je kus levnější? */
function zakus(level: 4 | 5): Attempt {
  return (rng) => {
    const p = rng.pick(level === 4 ? PIECES.filter((x) => x.max <= 20) : cheapPieces());
    // Ve 4. třídě se dělí jednociferným číslem (nebo deseti), proto nejvýš 10 kusů v balení.
    const a = rng.int(2, level === 4 ? 6 : 10);
    const b = rng.int(a + 2, level === 4 ? 10 : 20);
    const u = rng.int(p.min, p.max);
    const kind = rng.pick(['same', 'big', 'small', 'big', 'small']);
    const w = kind === 'same' ? u : kind === 'big' ? u - rng.int(1, 3) : u + rng.int(1, 3);
    if (w < 1) return null;
    // Náhodně je větší balení vlevo, nebo vpravo.
    const packs = rng.chance(0.5) ? [{ n: a, unit: u }, { n: b, unit: w }] : [{ n: b, unit: w }, { n: a, unit: u }];
    const label = (x: { n: number; unit: number }) => `${count(x.n, p.nom)} za ${kc(x.n * x.unit)}`;
    const per = (x: { n: number; unit: number }) => `${f(x.n * x.unit)} : ${x.n} = ${kc(x.unit)}`;
    const [p1, p2] = packs;
    const correct = p1.unit < p2.unit ? 0 : p1.unit > p2.unit ? 1 : 2;
    const cheaperIsSmaller = (correct === 0 && p1.n < p2.n) || (correct === 1 && p2.n < p1.n);
    const verdict =
      correct === 2
        ? 'Za kus stojí obě balení stejně – stačí vybrat to, které spotřebuješ.'
        : `Za kus je levnější ${correct === 0 ? 'první' : 'druhé'} balení.${cheaperIsSmaller ? ' Větší balení nemusí být za kus levnější – vyplatí se to spočítat.' : ' Větší balení se ale vyplatí, jen když všechno spotřebuješ.'}`;
    return fx(
      `zakus-${p.key}-${p1.n}x${p1.unit}-${p2.n}x${p2.unit}`,
      `${capitalize(p.nom[1])} se prodávají ve dvou baleních. Ve kterém je ${ONE_NOM[p.rod]} ${p.nom[0]} levnější?`,
      [label(p1), label(p2), 'V obou stejně'],
      correct,
      ['Spočítej, kolik stojí jeden kus v každém balení.', 'Cenu balení vyděl počtem kusů.'],
      `V prvním balení stojí ${ONE_NOM[p.rod]} ${p.nom[0]} ${per(p1)}, ve druhém ${per(p2)}. ${verdict}`,
      {
        visual: { type: 'cards', cards: packs.map((x) => ({ emoji: p.emoji, title: count(x.n, p.nom), tag: kc(x.n * x.unit) })) },
        speak: `${capitalize(p.nom[1])} se prodávají ve dvou baleních. První má ${count(p1.n, p.acc)} a stojí ${korun(p1.n * p1.unit)}. Druhé má ${count(p2.n, p.acc)} a stojí ${korun(p2.n * p2.unit)}. Ve kterém je ${ONE_NOM[p.rod]} ${p.nom[0]} levnější?`,
        difficulty: level === 5 ? 0.1 : 0.2,
      },
    );
  };
}

interface Weighed {
  key: string;
  nom: string;
  /** „Který med je“, „Které ořechy jsou“. */
  which: string;
  emoji: string;
  /** Cena za 100 g v Kč. */
  min: number;
  max: number;
  grams: number[];
  /** Množné číslo („Ořechy se prodávají“). */
  pl?: boolean;
}

const WEIGHED: Weighed[] = [
  { key: 'syr', nom: 'Sýr', which: 'Který sýr je', emoji: '🧀', min: 18, max: 40, grams: [200, 250, 300, 400, 500] },
  { key: 'med', nom: 'Med', which: 'Který med je', emoji: '🍯', min: 20, max: 50, grams: [250, 400, 500, 750, 900] },
  { key: 'ryze', nom: 'Rýže', which: 'Která rýže je', emoji: '🍚', min: 4, max: 9, grams: [500, 1000] },
  { key: 'musli', nom: 'Müsli', which: 'Které müsli je', emoji: '🥣', min: 8, max: 20, grams: [300, 500, 750, 1000] },
  { key: 'orechy', nom: 'Ořechy', which: 'Které ořechy jsou', emoji: '🥜', min: 25, max: 60, grams: [100, 150, 200, 250, 500], pl: true },
  { key: 'cokolada', nom: 'Čokoláda', which: 'Která čokoláda je', emoji: '🍫', min: 20, max: 50, grams: [100, 150, 200, 250, 300] },
];

/** Cena za 100 g po krocích (u 250 g přes 50 g). */
function per100(g: number, price: number): string {
  const u = (price * 100) / g;
  if (g === 100) return `${kc(price)} za 100 g`;
  if (g % 100 === 0) return `${f(price)} : ${g / 100} = ${kc(u)} za 100 g`;
  return `50 g stojí ${f(price)} : ${g / 50} = ${kc(u / 2)}, 100 g tedy ${kc(u)}`;
}

function za100g(rng: Rng): Spec | null {
  const w = rng.pick(WEIGHED);
  const [g1, g2] = rng.shuffle(w.grams).slice(0, 2);
  const u1 = rng.int(w.min, w.max);
  const same = rng.chance(0.15);
  const u2 = same ? u1 : u1 + rng.pick([-3, -2, -1, 1, 2, 3]);
  if (u2 < 2) return null;
  const p1 = (u1 * g1) / 100;
  const p2 = (u2 * g2) / 100;
  if (!Number.isInteger(p1) || !Number.isInteger(p2)) return null;
  const correct = u1 < u2 ? 0 : u1 > u2 ? 1 : 2;
  const ask = `${w.which} levnější, když porovnáš cenu za 100 g?`;
  const sold = w.pl ? 'se prodávají' : 'se prodává';
  return fx(
    `za100g-${w.key}-${g1}-${p1}-${g2}-${p2}`,
    `${w.nom} ${sold} ve dvou baleních. ${ask}`,
    [`${w.nom} ${g1} g za ${kc(p1)}`, `${w.nom} ${g2} g za ${kc(p2)}`, 'Vyjde to stejně'],
    correct,
    ['Spočítej, kolik stojí 100 g v každém balení.', [g1, g2].some((g) => g % 100 !== 0) ? `U ${[g1, g2].find((g) => g % 100 !== 0)} g pomůže spočítat nejdřív cenu 50 g.` : 'Cenu balení vyděl počtem stovek gramů.'],
    `První balení: ${per100(g1, p1)}. Druhé: ${per100(g2, p2)}. ${correct === 2 ? 'Za 100 g stojí obě balení stejně.' : `Za 100 g je levnější ${correct === 0 ? 'první' : 'druhé'} balení.`} Proto bývá na cenovkách v obchodě i cena za kilogram.`,
    {
      visual: { type: 'cards', cards: [{ emoji: w.emoji, title: `${w.nom} ${g1} g`, tag: kc(p1) }, { emoji: w.emoji, title: `${w.nom} ${g2} g`, tag: kc(p2) }] },
      speak: `${w.nom} ${sold} ve dvou baleních. První má ${g1} gramů a stojí ${korun(p1)}. Druhé má ${g2} gramů a stojí ${korun(p2)}. ${w.which} levnější, když porovnáš cenu za 100 gramů?`,
      difficulty: 0,
    },
  );
}

// ---------------------------------------------------------------------------
// Procenta ve slevách, permanentky, cena za měsíc nošení

interface Big {
  key: string;
  nom: string;
  /** Minulý čas: „stála“, „stálo“. */
  was: string;
  /** Zájmeno ve 4. pádě: „ji“, „ho“, „je“. */
  it: string;
  min: number;
  max: number;
}

const BIG: Big[] = [
  { key: 'bunda', nom: 'Bunda', was: 'stála', it: 'ji', min: 600, max: 2000 },
  { key: 'kolo', nom: 'Kolo', was: 'stálo', it: 'ho', min: 2000, max: 6000 },
  { key: 'stan', nom: 'Stan', was: 'stál', it: 'ho', min: 1000, max: 4000 },
  { key: 'brusle', nom: 'Brusle', was: 'stály', it: 'je', min: 800, max: 2400 },
];

function pulka(rng: Rng): Spec | null {
  const good = rng.pick(goodsBetween(100, 1200));
  const price = priceOf(rng, good);
  if (price % 2) return null;
  const prompt = `${capitalize(good.nom)} stojí ${kc(price)} a teď ${good.pl ? 'jsou' : 'je'} ve slevě 50 %. Kolik zaplatíš?`;
  return nm(
    `pulka-${good.key}-${price}`,
    prompt,
    price / 2,
    ['Kolik je 50 % z celé ceny?'],
    `Sleva 50 % je polovina ceny: ${f(price)} : 2 = ${kc(price / 2)}. Procento znamená „ze sta“ – a 50 ze 100 je právě polovina.`,
    { unit: 'Kč', speak: speakPct(prompt), difficulty: -0.1 },
  );
}

function slevy(rng: Rng): Spec | null {
  const it = rng.pick(BIG);
  const price = rng.int(it.min / 20, it.max / 20) * 20;
  const half = price / 2;
  const [a, b] = rng.shuffle(pickDistinct(rng, PEOPLE, 2));
  const off = rng.chance(0.15) ? half : half + rng.pick([-1, 1]) * rng.int(2, 20) * 10;
  if (off <= 0 || off >= price) return null;
  const correct = off < half ? 0 : off > half ? 1 : 2;
  const prompt = `${it.nom} stojí u ${a.gen} i u ${b.gen} ${kc(price)}. ${a.name} dává slevu 50 %, ${b.name} slevu ${kc(off)}. U koho zaplatíš méně?`;
  return fx(
    `slevy-${it.key}-${price}-${pkey(a)}-${pkey(b)}-${off}`,
    prompt,
    [`U ${a.gen}`, `U ${b.gen}`, 'Všude stejně'],
    correct,
    ['Kolik korun je sleva 50 % z této ceny?', 'Porovnej obě slevy v korunách.'],
    `Sleva 50 % je polovina: u ${a.gen} zaplatíš ${f(price)} : 2 = ${kc(half)}. U ${b.gen} zaplatíš ${f(price)} − ${f(off)} = ${kc(price - off)}. ${correct === 2 ? 'Vyjde to stejně.' : `Méně zaplatíš u ${correct === 0 ? a.gen : b.gen}.`} Slevy v procentech a v korunách se dají porovnat, až když obě převedeš na koruny.`,
    { speak: speakPct(prompt), difficulty: 0.2 },
  );
}

const ACTIVITIES = [
  { key: 'bazen', entry: 'Jeden vstup do bazénu', go: 'Půjdeš plavat', min: 60, max: 120 },
  { key: 'stadion', entry: 'Jeden vstup na zimní stadion', go: 'Půjdeš bruslit', min: 50, max: 100 },
  { key: 'stena', entry: 'Jeden vstup na lezeckou stěnu', go: 'Půjdeš lézt', min: 120, max: 200 },
];

function perm(rng: Rng): Spec | null {
  const a = rng.pick(ACTIVITIES);
  const s = rng.int(a.min / 10, a.max / 10) * 10;
  const price = s * rng.int(6, 8) + rng.pick([-30, -20, -10, 10, 20]);
  const n = rng.int(2, 10);
  if (n * s === price) return null;
  const permCheaper = price < n * s;
  return fx(
    `perm-${a.key}-${s}-${price}-${n}`,
    `${a.entry} stojí ${kc(s)}, permanentka na 10 vstupů ${kc(price)}. ${a.go} ${KRAT[n]}. Co vyjde levněji?`,
    ['Permanentka', 'Platit každý vstup'],
    permCheaper ? 0 : 1,
    ['Kolik by stály všechny vstupy zvlášť?', 'Porovnej to s cenou permanentky.'],
    `Bez permanentky: ${n} × ${s} = ${kc(n * s)}. Permanentka stojí ${kc(price)}. ${permCheaper ? 'Levněji vyjde permanentka – vyplatí se tomu, kdo chodí často.' : 'Levněji vyjde platit každý vstup – permanentka se vyplatí, jen když ji dost využiješ.'}`,
    { difficulty: 0.1 },
  );
}

function permOd(rng: Rng): Spec | null {
  const a = rng.pick(ACTIVITIES);
  const s = rng.int(a.min / 10, a.max / 10) * 10;
  const price = s * rng.int(5, 9) + rng.pick([-40, -30, -20, -10, 10, 20, 30, 40]);
  if (price % s === 0) return null;
  const n = Math.floor(price / s) + 1;
  if (n > 10 || n < 3) return null;
  return nm(
    `permod-${a.key}-${s}-${price}`,
    `${a.entry} stojí ${kc(s)}, permanentka na 10 vstupů ${kc(price)}. Od kolika vstupů je permanentka levnější než platit každý vstup?`,
    n,
    ['Zkus spočítat, kolik by stálo několik vstupů zvlášť.', 'Hledáš první počet vstupů, kdy placení zvlášť stojí víc než permanentka.'],
    `${count(n - 1, VSTUP)} zvlášť stojí ${n - 1} × ${s} = ${kc((n - 1) * s)}, to je méně než permanentka. ${count(n, VSTUP)} stojí ${kc(n * s)}, a to už je víc než ${kc(price)}. Kdo půjde aspoň ${n}krát, ušetří s permanentkou.`,
    { difficulty: 0.2 },
  );
}

function dvojsleva(rng: Rng): Spec | null {
  const it = rng.pick(BIG);
  const [d1, d2] = rng.pick([[50, 50], [50, 20], [20, 50], [50, 10], [10, 50], [20, 20], [25, 20]] as const);
  const price = rng.int(Math.ceil(it.min / 200), Math.floor(it.max / 200)) * 200;
  const a1 = (price * (100 - d1)) / 100;
  const a2 = (a1 * (100 - d2)) / 100;
  if (!Number.isInteger(a1) || !Number.isInteger(a2)) return null;
  const prompt = `${it.nom} ${it.was} ${kc(price)}. Nejdřív ${it.it} zlevnili o ${d1} %, potom novou cenu ještě o ${d2} %. Kolik stojí teď?`;
  return nm(
    `dvojsleva-${it.key}-${price}-${d1}-${d2}`,
    prompt,
    a2,
    ['Druhá sleva se počítá z nové ceny.', `Nejdřív spočítej cenu po slevě ${d1} %.`],
    `Po první slevě: ${f(price)} − ${f(price - a1)} = ${kc(a1)}. Po druhé: ${f(a1)} − ${f(a1 - a2)} = ${kc(a2)}. ${d1 + d2 === 100 ? 'Dvě slevy po 50 % tedy nejsou sleva 100 %.' : `Není to totéž jako sleva ${d1 + d2} % z původní ceny.`}`,
    { unit: 'Kč', speak: speakPct(prompt), difficulty: 0.2 },
  );
}

interface Lasting {
  key: string;
  cheap: string;
  dear: string;
  /** „stojí … a vydrží …“ – u všech stejné. */
  unit: Forms;
  /** „na jeden měsíc nošení“. */
  per: string;
  /** „měsíc“ do vysvětlení. */
  short: string;
  which: string;
}

const ZIMA: Forms = ['zimu', 'zimy', 'zim'];

const LASTING: Lasting[] = [
  { key: 'boty', cheap: 'Levné boty', dear: 'Dražší boty', unit: MESIC, per: 'jeden měsíc nošení', short: 'měsíc', which: 'Které vyjdou' },
  { key: 'tenisky', cheap: 'Levné tenisky', dear: 'Dražší tenisky', unit: MESIC, per: 'jeden měsíc nošení', short: 'měsíc', which: 'Které vyjdou' },
  { key: 'batoh', cheap: 'Levný batoh', dear: 'Dražší batoh', unit: ROK, per: 'jeden rok', short: 'rok', which: 'Který vyjde' },
  { key: 'bunda', cheap: 'Levná bunda', dear: 'Dražší bunda', unit: ZIMA, per: 'jednu zimu', short: 'zimu', which: 'Která vyjde' },
];

function vydrz(rng: Rng): Spec | null {
  const it = rng.pick(LASTING);
  const t1 = rng.int(1, 3);
  const t2 = rng.int(t1 + 2, it.unit === MESIC ? 12 : 6);
  const u1 = rng.int(8, 30) * 10;
  const u2 = rng.chance(0.15) ? u1 : u1 + rng.pick([-1, 1]) * rng.int(1, 6) * 10;
  const c = u1 * t1;
  const d = u2 * t2;
  if (u2 < 30 || d <= c) return null;
  const correct = u1 < u2 ? 0 : u1 > u2 ? 1 : 2;
  return fx(
    `vydrz-${it.key}-${c}-${t1}-${d}-${t2}`,
    `${it.cheap} stojí ${kc(c)} a vydrží ${count(t1, it.unit)}. ${it.dear} stojí ${kc(d)} a vydrží ${count(t2, it.unit)}. ${it.which} levněji na ${it.per}?`,
    [it.cheap, it.dear, 'Vyjde to stejně'],
    correct,
    [`Spočítej, kolik stojí každá možnost na ${it.short}.`, 'Cenu vyděl tím, jak dlouho věc vydrží.'],
    `${it.cheap}: ${t1 === 1 ? kc(u1) : `${f(c)} : ${t1} = ${kc(u1)}`} na ${it.short}. ${it.dear}: ${f(d)} : ${t2} = ${kc(u2)} na ${it.short}.${correct === 1 ? ' Dražší věc, která dlouho vydrží, může nakonec vyjít levněji.' : correct === 0 ? ' Tady se dražší věc nevyplatí.' : ` Na ${it.short} vyjdou obě stejně.`}`,
    { difficulty: 0.2 },
  );
}

// ---------------------------------------------------------------------------

export const hodnota = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Cena a hodnota',
  description: 'Porovnávání cen, cena za kus a za 100 g, akce a slevy a rozdíl mezi cenou a hodnotou – dražší neznamená automaticky lepší.',
  rvp: { 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03', 'M-5-1-04'], 5: ['ČJS-5-2-03', 'M-5-1-04'] },
  ability: 'usuzovani',
  showFact: true,
  banks: { 2: L2, 3: L3, 4: L4, 5: L5, 6: L6 },
  gen: {
    2: mix(ID, [[2, stanky(2)], [1.5, okolik], [1.5, poradi(2)]]),
    3: mix(ID, [[1.5, stanky(3)], [1.5, skoro], [2, akce], [1, poradi(3)]]),
    4: mix(ID, [[3, zakus(4)], [1.5, akceVic], [1.5, sleva]]),
    5: mix(ID, [[2, zakus(5)], [1.5, pulka], [1.5, slevy], [1.5, perm]]),
    6: mix(ID, [[2, za100g], [1.5, dvojsleva], [1.5, vydrz], [1, permOd]]),
  },
});
