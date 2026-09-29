// Hádanky: lidové hádanky (v běžně užívaném znění, existují i varianty),
// vlastní rýmované hádanky a několik chytáků na logické myšlení.
//
// `lvl` = přirozená obtížnost hádanky (1–4). Úroveň úlohy L bere hádanky
// z okolních obtížností, takže se zásobníky překrývají.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, relDifficulty, type Entry, type Pools } from './common';

const ID = 'slova.hadanky';

export interface Riddle {
  key: string;
  lvl: 1 | 2 | 3 | 4;
  /** Řádky hádanky oddělené \n. */
  text: string;
  /** Otázka pod hádankou. */
  ask?: string;
  answer: string;
  distractors: [string, string, string] | [string, string];
  hints: [string] | [string, string];
  explanation: string;
  /** Lidová hádanka (ne vlastní). */
  folk?: boolean;
}

export const RIDDLES: Riddle[] = [
  // --- obtížnost 1 ---------------------------------------------------------
  {
    key: 'zajic', lvl: 1,
    text: 'Dlouhé uši, krátký chvost,\nna poli je častý host.',
    ask: 'Kdo je to?',
    answer: 'zajíc', distractors: ['liška', 'ježek', 'veverka'],
    hints: ['Je to zvíře, které umí rychle běhat a skákat.'],
    explanation: 'Zajíc má dlouhé uši a krátký ocásek a často ho potkáš na poli.',
  },
  {
    key: 'jezek', lvl: 1,
    text: 'Na zahradě v listí spí,\npichlavý je, to se ví.',
    ask: 'Kdo je to?',
    answer: 'ježek', distractors: ['kaktus', 'krtek', 'zajíc'],
    hints: ['Je to zvíře, které chodí hlavně v noci.'],
    explanation: 'Ježek je pichlavý, protože má bodliny, a rád spí v listí.',
  },
  {
    key: 'kocka', lvl: 1,
    text: 'Myši chytá, mlíčko pije,\nmňouká a s námi doma žije.',
    ask: 'Kdo je to?',
    answer: 'kočka', distractors: ['pes', 'sova', 'myš'],
    hints: ['Když je spokojená, přede.'],
    explanation: 'Kočka chytá myši, ráda pije mlíčko a mňouká.',
  },
  {
    key: 'pes', lvl: 1,
    text: 'Štěká a vrtí chvostem,\nrád si hraje s každým hostem.',
    ask: 'Kdo je to?',
    answer: 'pes', distractors: ['kočka', 'liška', 'koza'],
    hints: ['Umí hlídat dům.'],
    explanation: 'Pes štěká a vrtí ocasem, když má radost.',
  },
  {
    key: 'krava', lvl: 1,
    text: 'Na louce se pase, trávu žvýká,\nmléko nám dává a „bú“ říká.',
    ask: 'Kdo je to?',
    answer: 'kráva', distractors: ['koza', 'ovce', 'kůň'],
    hints: ['Poslouchej, jaký zvuk to zvíře dělá.'],
    explanation: 'Kráva se pase na louce, dává mléko a bučí.',
  },
  {
    key: 'slepice', lvl: 1,
    text: 'Na dvorku zrníčka zobe,\nvajíčko snese i tobě.',
    ask: 'Kdo je to?',
    answer: 'slepice', distractors: ['kohout', 'vrabec', 'kočka'],
    hints: ['Je to pták, který bydlí na dvoře.', 'Ozývá se: kdák, kdák!'],
    explanation: 'Slepice zobe zrní a snáší vajíčka. Kohout vajíčka nesnáší.',
  },
  {
    key: 'ryba', lvl: 1,
    text: 'Nemá nohy, a přece plave,\nšupinky má a ploutve hravé.',
    ask: 'Kdo je to?',
    answer: 'ryba', distractors: ['kachna', 'žába', 'rak'],
    hints: ['Žije ve vodě.', 'Přečti si pozorně první řádek.'],
    explanation: 'Ryba nemá nohy, plave pomocí ploutví a má šupiny.',
  },
  {
    key: 'snek', lvl: 1,
    text: 'Na hlavě růžky, domeček nosí sám,\nleze pomalu sem a tam.',
    ask: 'Kdo je to?',
    answer: 'šnek', distractors: ['želva', 'beruška', 'ježek'],
    hints: ['Je hodně pomalý.', 'Má opravdu růžky na hlavě.'],
    explanation: 'Šnek má na hlavě růžky a na zádech nosí ulitu – svůj domeček.',
  },
  {
    key: 'mic', lvl: 1,
    text: 'Kulatý jsem, skáču rád,\nse mnou si můžeš hrát.',
    answer: 'míč', distractors: ['kolo', 'jablko', 'talíř'],
    hints: ['Je to hračka.'],
    explanation: 'Míč je kulatý, skáče a hraješ si s ním.',
  },
  {
    key: 'destnik', lvl: 1,
    text: 'Když venku prší, otevři mě hned,\npod mou stříškou je suchý celý svět.',
    answer: 'deštník', distractors: ['klobouk', 'holínky', 'pláštěnka'],
    hints: ['Nosíš ho v ruce.'],
    explanation: 'Deštník otevřeš, když prší, a pod ním zůstaneš v suchu.',
  },
  {
    key: 'snehulak', lvl: 1,
    text: 'Na hlavě hrnec, z mrkve nos,\nv zimě stojí venku bos.',
    ask: 'Kdo je to?',
    answer: 'sněhulák', distractors: ['trpaslík', 'rampouch', 'Mikuláš'],
    hints: ['Potkáš ho jen v zimě.', 'Postavíš ho z koulí.'],
    explanation: 'Sněhulák má místo nosu mrkev a na hlavě často hrnec.',
  },
  {
    key: 'hodiny', lvl: 1,
    text: 'Tikají a ručičky mají,\nčas ti přesně povídají.',
    answer: 'hodiny', distractors: ['kalendář', 'teploměr', 'rádio'],
    hints: ['Často visí na zdi.'],
    explanation: 'Hodiny tikají a ručičkami ukazují čas.',
  },
  {
    key: 'zmrzlina', lvl: 1,
    text: 'V kornoutku bydlí, studená je,\nna sluníčku rychle taje.',
    answer: 'zmrzlina', distractors: ['sníh', 'led', 'limonáda'],
    hints: ['Je sladká a v létě ji rád mlsá každý.'],
    explanation: 'Zmrzlina se dává do kornoutku a v teple rychle taje.',
  },
  {
    key: 'zaba', lvl: 1,
    text: 'Na leknínu sedí, kvá, kvá, zpívá,\nmouchy chytá, když se stmívá.',
    ask: 'Kdo je to?',
    answer: 'žába', distractors: ['ryba', 'vážka', 'rak'],
    hints: ['Umí skákat daleko.'],
    explanation: 'Žába kváká, sedí na leknínu a chytá mouchy.',
  },
  {
    key: 'sova', lvl: 1,
    text: 'Ve dne spí a v noci houká,\nvelkýma očima do tmy kouká.',
    ask: 'Kdo je to?',
    answer: 'sova', distractors: ['netopýr', 'kukačka', 'vrána'],
    hints: ['Je to pták.'],
    explanation: 'Sova v noci houká a má velké oči, aby viděla i ve tmě.',
  },
  {
    key: 'mrkev', lvl: 1,
    text: 'Pod zemí se schovává,\nzelenou nať ven dává.\nZajíček ji rád má,\noranžová je, kdo ji zná?',
    answer: 'mrkev', distractors: ['ředkvička', 'brambora', 'dýně'],
    hints: ['Je to zelenina.', 'Dívej se na barvu.'],
    explanation: 'Mrkev roste pod zemí, nahoře má zelenou nať a je oranžová.',
  },
  {
    key: 'jablko', lvl: 1,
    text: 'Na stromě roste, kulaté a červené,\njadérka v sobě má, kousni – a je snědené!',
    answer: 'jablko', distractors: ['rajče', 'jahoda', 'švestka'],
    hints: ['Je to ovoce.', 'Dělá se z něj mošt.'],
    explanation: 'Jablko roste na stromě, bývá červené a uvnitř má jadérka.',
  },
  {
    key: 'kolo', lvl: 1,
    text: 'Má řídítka, zvonek, pedál,\nkdyž šlapeš, veze tě dál.',
    answer: 'kolo', distractors: ['koloběžka', 'auto', 'sáňky'],
    hints: ['Jezdí se na něm venku.', 'Můžeš na něm jet do školy.'],
    explanation: 'Kolo má řídítka, zvonek a pedály. Když šlapeš, jede.',
  },
  {
    key: 'postel', lvl: 1,
    text: 'Na mně spíš a sny máš,\npod peřinou se schováš.',
    answer: 'postel', distractors: ['vana', 'skříň', 'židle'],
    hints: ['Je to kus nábytku.'],
    explanation: 'V posteli spíš pod peřinou.',
  },
  {
    key: 'klic', lvl: 1,
    text: 'Do zámku mě strčíš, otočíš – cvak!\nA dveře jsou otevřené, je to tak.',
    answer: 'klíč', distractors: ['klika', 'zvonek', 'hřebík'],
    hints: ['Nosíš ho v kapse nebo na kroužku.'],
    explanation: 'Klíč strčíš do zámku, otočíš ho a dveře se odemknou.',
  },
  {
    key: 'bryle', lvl: 1,
    text: 'Na nose sedí, dvě skla mají,\nlépe vidět pomáhají.',
    answer: 'brýle', distractors: ['dalekohled', 'lupa', 'klobouk'],
    hints: ['Nosí je lidé, kteří špatně vidí.'],
    explanation: 'Brýle sedí na nose a jejich skla pomáhají lépe vidět.',
  },
  {
    key: 'slunce', lvl: 1,
    text: 'Z nebe svítí, hřeje nás,\nvečer zajde, ráno vyjde zas.',
    answer: 'slunce', distractors: ['Měsíc', 'hvězda', 'lampa'],
    hints: ['Je vysoko na obloze.', 'Kdy vychází a kdy zapadá?'],
    explanation: 'Slunce nás hřeje, večer zapadá a ráno zase vychází.',
  },
  {
    key: 'vlak', lvl: 1,
    text: 'Dlouhý had po kolejích jede,\nvagony za sebou vede.',
    answer: 'vlak', distractors: ['autobus', 'loď', 'kolo'],
    hints: ['Staví na nádraží.'],
    explanation: 'Vlak jezdí po kolejích a táhne za sebou vagony.',
  },
  {
    key: 'lod', lvl: 1,
    text: 'Po moři pluje, vesla má,\nplachtu do větru napíná.',
    answer: 'loď', distractors: ['ryba', 'kachna', 'most'],
    hints: ['Vikingové na ní jezdili za dobrodružstvím.'],
    explanation: 'Loď pluje po vodě a má vesla i plachtu.',
  },
  {
    key: 'nos', lvl: 1,
    text: 'Uprostřed tváře stojím sám,\nvůni kytek i koláčů znám.',
    answer: 'nos', distractors: ['ucho', 'oko', 'brada'],
    hints: ['Je to část obličeje.'],
    explanation: 'Nos je uprostřed obličeje a čicháš jím vůně.',
  },
  {
    key: 'drak', lvl: 1,
    text: 'Šupiny, křídla, oheň z tlamy,\nnad ostrovy létá s námi.',
    ask: 'Kdo je to?',
    answer: 'drak', distractors: ['pták', 'ještěrka', 'netopýr'],
    hints: ['Na Dračích ostrovech ho potkáš na každém kroku.'],
    explanation: 'Drak má šupiny i křídla a umí chrlit oheň.',
  },

  // --- obtížnost 2 ---------------------------------------------------------
  {
    key: 'hreben', lvl: 2, folk: true,
    text: 'Má zuby, a nekouše.',
    answer: 'hřeben', distractors: ['kartáček', 'nůžky', 'lžíce'],
    hints: ['Používáš ho na vlasy.'],
    explanation: 'Hřeben má zuby, ale nekouše – češe vlasy.',
  },
  {
    key: 'cibule', lvl: 2, folk: true,
    text: 'Sedí panenka v komůrce,\nmá na sobě sto kabátků.\nKdo ji svléká, ten pláče.',
    answer: 'cibule', distractors: ['brambora', 'mrkev', 'paprika'],
    hints: ['Je to zelenina.', 'Proč by někdo plakal? Vzpomeň si na krájení v kuchyni.'],
    explanation: 'Cibule má mnoho slupek jako kabátků a při krájení z ní slzí oči.',
  },
  {
    key: 'rucnik', lvl: 2, folk: true,
    text: 'Čím víc suší, tím je mokřejší.',
    answer: 'ručník', distractors: ['fén', 'vítr', 'slunce'],
    hints: ['Najdeš ho v koupelně.'],
    explanation: 'Ručník tě osuší, a tím sám zmokne.',
  },
  {
    key: 'stul', lvl: 2, folk: true,
    text: 'Čtyři bratři\npod jedním kloboukem stojí.',
    answer: 'stůl', distractors: ['skříň', 'lampa', 'dveře'],
    hints: ['Je to kus nábytku.', 'Bratři jsou tu nohy.'],
    explanation: 'Stůl má čtyři nohy – bratry – a nahoře jednu desku jako klobouk.',
  },
  {
    key: 'oci', lvl: 2, folk: true,
    text: 'Dvě sestřičky přes kopeček bydlí,\na přece se nikdy neuvidí.',
    answer: 'oči', distractors: ['ruce', 'nohy', 'zuby'],
    hints: ['Je to část obličeje.', 'Kopeček je tu nos.'],
    explanation: 'Oči jsou dvě, mezi nimi je nos jako kopeček, a samy sebe nikdy neuvidí.',
  },
  {
    key: 'houba', lvl: 2, folk: true,
    text: 'Má klobouk, a nemá hlavu,\nmá nohu, a nemá botu.',
    answer: 'houba', distractors: ['trpaslík', 'hřebík', 'strom'],
    hints: ['Roste v lese.'],
    explanation: 'Houba má nahoře klobouk a dole nohu, ale hlavu ani boty nemá.',
  },
  {
    key: 'vitr', lvl: 2, folk: true,
    text: 'Bez rukou, bez nohou\nvrata otvírá.',
    answer: 'vítr', distractors: ['kámen', 'pes', 'déšť'],
    hints: ['Nevidíš ho, ale cítíš ho.'],
    explanation: 'Vítr nemá ruce ani nohy, a přece umí otevřít vrata.',
  },
  {
    key: 'hvezdy', lvl: 2,
    text: 'Ve dne spí a v noci svítí,\npo obloze se jako zlatá zrnka třpytí.',
    answer: 'hvězdy', distractors: ['slunce', 'lampy', 'svíčky'],
    hints: ['Jsou na obloze.', 'Je jich tolik, že je nikdo nespočítá.'],
    explanation: 'Hvězdy vidíme v noci na obloze. Z dálky vypadají jako malá zlatá zrnka.',
  },
  {
    key: 'duha', lvl: 2,
    text: 'Po dešti na nebi barevný most,\nkdo ho uvidí, má radosti dost.',
    answer: 'duha', distractors: ['mrak', 'blesk', 'drak'],
    hints: ['Má hodně barev.'],
    explanation: 'Duha je barevný oblouk na obloze. Objeví se, když svítí slunce a prší.',
  },
  {
    key: 'tuzka', lvl: 2,
    text: 'Je jak klacík, uvnitř tuhu má,\npíše, kreslí, gumou se to smazat dá.',
    answer: 'tužka', distractors: ['pero', 'štětec', 'fix'],
    hints: ['Najdeš ji v penálu.'],
    explanation: 'Tužka má uvnitř tuhu. Co s ní napíšeš, můžeš vygumovat.',
  },
  {
    key: 'kniha', lvl: 2,
    text: 'Listy má, a není strom,\nvypráví, a nemá ústa.',
    answer: 'kniha', distractors: ['strom', 'obraz', 'rádio'],
    hints: ['Můžeš si ji přečíst před spaním.'],
    explanation: 'Kniha má listy (stránky) a vypráví příběhy, i když nemá ústa.',
  },
  {
    key: 'nuzky', lvl: 2, folk: true,
    text: 'Dva konce, dva kroužky,\nuprostřed hřebíček.',
    answer: 'nůžky', distractors: ['kleště', 'jehla', 'hřeben'],
    hints: ['Najdeš je v penálu nebo v šuplíku.', 'Do kroužků strčíš prsty.'],
    explanation: 'Nůžky mají dva kroužky na prsty, dva ostré konce a uprostřed šroubek, který je drží pohromadě.',
  },
  {
    key: 'vejce', lvl: 2,
    text: 'Bílá skořápka, žlutý střed,\nslepička ho snesla hned.',
    answer: 'vejce', distractors: ['brambora', 'citron', 'mléko'],
    hints: ['Dá se uvařit natvrdo.'],
    explanation: 'Vejce má skořápku a uvnitř žlutý žloutek.',
  },
  {
    key: 'orech', lvl: 2,
    text: 'Ve tvrdé skořápce jádro spí,\nveverka ho na zimu schová, to se ví.',
    answer: 'ořech', distractors: ['vejce', 'šiška', 'jablko'],
    hints: ['Louskáček by si s ním poradil.'],
    explanation: 'Ořech má tvrdou skořápku a uvnitř jádro. Veverky si ořechy schovávají na zimu.',
  },
  {
    key: 'veverka', lvl: 2,
    text: 'V korunách stromů skáče ráda,\noříšky na zimu si ukládá.',
    ask: 'Kdo je to?',
    answer: 'veverka', distractors: ['liška', 'zajíc', 'ježek'],
    hints: ['Má huňatý ocas.'],
    explanation: 'Veverka skáče po stromech a na zimu si schovává oříšky.',
  },
  {
    key: 'datel', lvl: 2,
    text: 'Ťuky ťuk do stromu buší,\nbroučky pod kůrou vyruší.',
    ask: 'Kdo je to?',
    answer: 'datel', distractors: ['sova', 'kos', 'veverka'],
    hints: ['Je to pták se silným zobákem.'],
    explanation: 'Datel ťuká zobákem do kmene a hledá pod kůrou broučky.',
  },
  {
    key: 'pavouk', lvl: 2,
    text: 'Osm nohou, síť si plete,\nmouchy do ní chytá v létě.',
    ask: 'Kdo je to?',
    answer: 'pavouk', distractors: ['mravenec', 'rybář', 'beruška'],
    hints: ['Není to hmyz, i když je malý.'],
    explanation: 'Pavouk má osm nohou a plete si pavučinu, do které se chytá hmyz.',
  },
  {
    key: 'zrcadlo', lvl: 2,
    text: 'Podíváš se na mě, uvidíš sebe,\nzamrkáš, a já zamrkám na tebe.',
    answer: 'zrcadlo', distractors: ['fotografie', 'obraz', 'kniha'],
    hints: ['Visí často v koupelně nad umyvadlem.'],
    explanation: 'V zrcadle vidíš sebe. Když zamrkáš, zamrká i tvůj obraz v zrcadle.',
  },
  {
    key: 'strom', lvl: 2,
    text: 'Má korunu, a není král,\nna podzim listí rozdá dál.',
    answer: 'strom', distractors: ['princezna', 'houba', 'tráva'],
    hints: ['Roste v parku i v lese.'],
    explanation: 'Strom má korunu z větví a listů. Na podzim z ní padá listí.',
  },
  {
    key: 'snih', lvl: 2,
    text: 'Když je zima, z mraků letí,\nkoulují se v něm všechny děti.',
    answer: 'sníh', distractors: ['déšť', 'led', 'písek'],
    hints: ['Je bílý a studený.'],
    explanation: 'Sníh padá v zimě z mraků a děti z něj dělají koule.',
  },
  {
    key: 'tabule', lvl: 2,
    text: 'Křídou na ni paní učitelka píše,\nhoubou se to smaže, tiše, tiše.',
    answer: 'tabule', distractors: ['sešit', 'lavice', 'nástěnka'],
    hints: ['Je ve třídě a všichni na ni vidí.'],
    explanation: 'Na tabuli se píše křídou a smazat se dá houbou.',
  },
  {
    key: 'penal', lvl: 2,
    text: 'V aktovce spinká, zip má na zádech,\ntužky a pastelky nosí v pěkných řadách.',
    answer: 'penál', distractors: ['sešit', 'svačina', 'kniha'],
    hints: ['Nosíš ho do školy.'],
    explanation: 'Penál nosíš v aktovce a schováváš v něm tužky a pastelky.',
  },
  {
    key: 'jazyk', lvl: 2,
    text: 'V puse bydlí, kosti nemá,\nsladké, kyselé i slané zná.',
    answer: 'jazyk', distractors: ['zub', 'ret', 'nos'],
    hints: ['U lékaře ho ukazuješ, když říkáš „á“.'],
    explanation: 'Jazyk je v puse, nemá kosti a pozná, co je sladké, kyselé nebo slané.',
  },
  {
    key: 'rukavice', lvl: 2,
    text: 'Pět bratříčků v jednom domečku,\nkaždý má svou komůrku.',
    answer: 'rukavice', distractors: ['bota', 'čepice', 'šála'],
    hints: ['Nosíš je v zimě.', 'Bratříčci jsou tu prsty.'],
    explanation: 'V rukavici má každý z pěti prstů svou vlastní komůrku.',
  },
  {
    key: 'mrak', lvl: 2,
    text: 'Bílý beránek po nebi běží,\nkdyž zčerná, prší nebo sněží.',
    answer: 'mrak', distractors: ['ovce', 'drak', 'pták'],
    hints: ['Není to zvíře.', 'Hledej ho na obloze.'],
    explanation: 'Mrak pluje po obloze jako bílý beránek. Když ztmavne, spustí se déšť nebo sníh.',
  },
  {
    key: 'hnizdo', lvl: 2,
    text: 'Z větviček upletený domeček,\nvajíčka v něm hlídá ptáček.',
    answer: 'hnízdo', distractors: ['úl', 'nora', 'bouda'],
    hints: ['Často ho najdeš vysoko na stromě.'],
    explanation: 'Hnízdo si ptáci pletou z větviček a sedí v něm na vajíčkách.',
  },
  {
    key: 'krtek', lvl: 2,
    text: 'Černý kožíšek, pod zemí žije,\nhromádky hlíny na louku vyryje.',
    ask: 'Kdo je to?',
    answer: 'krtek', distractors: ['myš', 'žížala', 'ježek'],
    hints: ['Skoro nic nevidí, ale výborně hrabe.'],
    explanation: 'Krtek ryje chodby pod zemí a nahoru vyhrnuje hromádky hlíny.',
  },

  // --- obtížnost 3 ---------------------------------------------------------
  {
    key: 'jehla', lvl: 3,
    text: 'Má ouško, a neslyší,\nšije, a nemá ruce.',
    answer: 'jehla', distractors: ['hrnek', 'nůžky', 'knoflík'],
    hints: ['Hrnek má taky ouško. Umí ale šít?', 'Používá se s nití.'],
    explanation: 'Jehla má ouško, kterým se provléká nit, a šije se s ní.',
  },
  {
    key: 'stin', lvl: 3,
    text: 'Chodí s tebou, a nemá nohy,\nje na slunci, a nikdy se neopálí.',
    answer: 'stín', distractors: ['vítr', 'mrak', 'pes'],
    hints: ['Vidíš ho na zemi, když svítí slunce.'],
    explanation: 'Stín chodí s tebou všude, kde svítí slunce, ale nemá nohy a neopálí se.',
  },
  {
    key: 'kotva', lvl: 3,
    text: 'Dokud se pluje, na palubě ležím,\nkdyž loď zastaví, ke dnu hned běžím.',
    answer: 'kotva', distractors: ['plachta', 'veslo', 'kormidlo'],
    hints: ['Je těžká a železná.'],
    explanation: 'Kotva se spustí do vody a drží loď na místě, aby neodplula.',
  },
  {
    key: 'plachta', lvl: 3,
    text: 'Vítr do mě fouká, já se nadouvám,\nloď po moři ženu, i když vesla nemám.',
    answer: 'plachta', distractors: ['kotva', 'veslo', 'kormidlo'],
    hints: ['Bývá z látky a visí na stěžni.'],
    explanation: 'Plachta chytá vítr a ten pak žene loď dopředu.',
  },
  {
    key: 'mapa', lvl: 3,
    text: 'Mám hory, a nejsou vysoké,\nmám řeky, a nejsou mokré,\nmám města, a nikdo v nich nebydlí.',
    answer: 'mapa', distractors: ['kompas', 'dalekohled', 'loď'],
    hints: ['Pomáhá najít cestu na výletě.'],
    explanation: 'Na mapě jsou hory, řeky i města jen nakreslené.',
  },
  {
    key: 'srdce', lvl: 3,
    text: 'V hrudi bydlí, ve dne v noci buší,\nkdy odpočívá, nikdo netuší.',
    answer: 'srdce', distractors: ['plíce', 'žaludek', 'hodiny'],
    hints: ['Když běháš, cítíš, jak rychle pracuje.'],
    explanation: 'Srdce bije v hrudi ve dne i v noci a pumpuje krev do celého těla.',
  },
  {
    key: 'supiny', lvl: 3,
    text: 'Drak jich na sobě nosí tisíc,\nblyští se jako mince, víc a víc.',
    ask: 'Co to je?',
    answer: 'šupiny', distractors: ['mince', 'pírka', 'zuby'],
    hints: ['„Jako mince“ znamená, že to mince nejsou.', 'Ryby je mají taky.'],
    explanation: 'Drak má celé tělo pokryté šupinami, které se blyští jako mince.',
  },
  {
    key: 'reka', lvl: 3,
    text: 'Běží, a nemá nohy,\nšumí, a nemá ústa,\nmá koryto, a není prase.',
    answer: 'řeka', distractors: ['vítr', 'hodiny', 'vlak'],
    hints: ['Na mapě ji najdeš jako modrou čáru.'],
    explanation: 'Řeka teče (říkáme, že voda běží), šumí a teče v korytě.',
  },
  {
    key: 'hodiny-chodi', lvl: 3, folk: true,
    text: 'Nemá nohy, a chodí,\nnemá ruce, a ukazuje.',
    answer: 'hodiny', distractors: ['kompas', 'šipka', 'vítr'],
    hints: ['Říkáme, že „jdou“ napřed nebo pozadu.'],
    explanation: 'O hodinách říkáme, že jdou, a ručičkami ukazují čas.',
  },
  {
    key: 'schody', lvl: 3,
    text: 'Vedou nahoru i dolů,\na přitom se nehnou z místa.',
    answer: 'schody', distractors: ['výtah', 'míč', 'houpačka'],
    hints: ['Najdeš je v domě s patry.'],
    explanation: 'Po schodech chodíš nahoru i dolů, ale samy schody se nehýbou.',
  },
  {
    key: 'mesic', lvl: 3,
    text: 'Každou noc jiný: jednou kulatý,\njindy jen tenký srpek,\na přece je to pořád on.',
    answer: 'Měsíc', distractors: ['Slunce', 'hvězda', 'lampa'],
    hints: ['Svítí v noci na obloze.'],
    explanation: 'Měsíc vidíme každou noc trochu jinak – jednou jako kulatý talíř, jindy jako tenký srpek.',
  },
  {
    key: 'vlocka', lvl: 3,
    text: 'Je jako hvězdička, a nesvítí,\npadá z nebe, a nic se jí nestane,\nna dlani ale hned zmizí.',
    answer: 'sněhová vločka', distractors: ['hvězda', 'kapka', 'peříčko'],
    hints: ['Uvidíš ji jen v zimě.'],
    explanation: 'Sněhová vločka má tvar malé hvězdičky, padá z mraků a v teplé dlani roztaje.',
  },
  {
    key: 'dopis', lvl: 3,
    text: 'Cestuje daleko, a nemá nohy,\nmluví, a nemá ústa,\nna sobě nosí známku.',
    answer: 'dopis', distractors: ['pošťák', 'kniha', 'balík'],
    hints: ['Posíláš ho babičce poštou.'],
    explanation: 'Dopis cestuje poštou, nese zprávu, i když nemá ústa, a lepí se na něj známka.',
  },
  {
    key: 'kilo-peri', lvl: 3,
    text: 'Co je těžší: kilo peří,\nnebo kilo železa?',
    ask: 'Vyber správnou odpověď.',
    answer: 'obojí váží stejně', distractors: ['kilo peří', 'kilo železa'],
    hints: ['Přečti si otázku pomalu ještě jednou. Kolik váží každé z nich?'],
    explanation: 'Kilo je kilo – kilogram peří i kilogram železa váží stejně. Peří jen zabere víc místa.',
  },
  {
    key: 'rozbit-vejce', lvl: 3,
    text: 'Co musíš rozbít dřív,\nnež to můžeš použít?',
    ask: 'Vyber správnou odpověď.',
    answer: 'vejce', distractors: ['sklenici', 'talíř', 'tužku'],
    hints: ['Myslí se tu na vaření v kuchyni.'],
    explanation: 'Vejce musíš rozklepnout, tedy rozbít skořápku, a teprve pak ho použiješ.',
  },

  // --- obtížnost 4 ---------------------------------------------------------
  {
    key: 'ozvena', lvl: 4,
    text: 'Nemám ústa, a přece odpovídám,\nco zavoláš, to ti hned zpátky dám.',
    answer: 'ozvěna', distractors: ['telefon', 'zvonek', 'vítr'],
    hints: ['Uslyšíš ji v horách nebo ve velké prázdné místnosti.'],
    explanation: 'Ozvěna je zvuk, který se odrazí od skály nebo zdi a vrátí se k tobě.',
  },
  {
    key: 'dech', lvl: 4,
    text: 'Je lehčí než pírko,\na přece ho nikdo dlouho nezadrží.\nMáš ho pořád u sebe, i když ho nevidíš.',
    answer: 'dech', distractors: ['vítr', 'bublina', 'kámen'],
    hints: ['Souvisí s tím, co děláš nosem a pusou.'],
    explanation: 'Dech je lehký jako nic, a přesto ho nikdo nezadrží déle než chvilku.',
  },
  {
    key: 'dira', lvl: 4, folk: true,
    text: 'Čím víc z ní bereš,\ntím je větší.',
    answer: 'díra', distractors: ['hromada', 'kopec', 'krabice'],
    hints: ['Dělá se lopatou.'],
    explanation: 'Když z díry vybíráš hlínu, díra je čím dál větší.',
  },
  {
    key: 'clovek', lvl: 4, folk: true,
    text: 'Ráno chodí po čtyřech,\nv poledne po dvou\na večer po třech.',
    ask: 'Kdo je to?',
    answer: 'člověk', distractors: ['pes', 'stůl', 'drak'],
    hints: ['Ráno, poledne a večer tu neznamenají jeden den, ale celý život.', 'Kdo leze jako miminko po čtyřech a ve stáří chodí o holi?'],
    explanation: 'Je to člověk: jako miminko leze po čtyřech, pak chodí po dvou a ve stáří si pomáhá holí – třetí nohou.',
  },
  {
    key: 'kosile', lvl: 4,
    text: 'Má rukávy, a nemá ruce,\nmá límec, a nemá krk.',
    answer: 'košile', distractors: ['kalhoty', 'čepice', 'rukavice'],
    hints: ['Je to oblečení.'],
    explanation: 'Košile má rukávy a límec, ale ruce a krk do ní strčíš až ty.',
  },
  {
    key: 'lahev', lvl: 4,
    text: 'Má hrdlo, a nemluví,\nmá břicho, a nejí.',
    answer: 'láhev', distractors: ['sklenice', 'talíř', 'hrnek'],
    hints: ['Často se v ní prodává voda nebo limonáda.'],
    explanation: 'Láhev má úzké hrdlo a baňaté tělo jako bříško, ale nemluví ani nejí.',
  },
  {
    key: 'sopka', lvl: 4,
    text: 'Hora, co chrlí oheň jako drak,\nz vrcholu jí stoupá kouř a mrak.',
    answer: 'sopka', distractors: ['jeskyně', 'komín', 'maják'],
    hints: ['Z jejího nitra může vytékat žhavá láva.'],
    explanation: 'Sopka je hora, ze které může vytékat láva a stoupat kouř.',
  },
  {
    key: 'tma', lvl: 4,
    text: 'Čím víc jí je,\ntím méně vidíš.',
    answer: 'tma', distractors: ['světlo', 'voda', 'vítr'],
    hints: ['Přijde každý večer, když zapadne slunce.'],
    explanation: 'Čím větší je tma, tím méně toho vidíš.',
  },
  {
    key: 'jmeno', lvl: 4,
    text: 'Patří jen tobě,\na přece ho ostatní používají častěji než ty.',
    answer: 'jméno', distractors: ['hračka', 'kolo', 'kartáček'],
    hints: ['Slyšíš ho, když na tebe někdo volá.'],
    explanation: 'Tvoje jméno patří tobě, ale vyslovují ho hlavně ostatní, když tě volají.',
  },
  {
    key: 'ticho', lvl: 4,
    text: 'Stačí ho vyslovit\na už je pryč.',
    answer: 'ticho', distractors: ['tma', 'sen', 'vítr'],
    hints: ['V knihovně se ho snažíme dodržovat.'],
    explanation: 'Ticho zmizí, jakmile cokoli řekneš – i když vyslovíš jen slovo ticho.',
  },
  {
    key: 'slib', lvl: 4,
    text: 'Dá se to rozbít,\ni když se toho nikdo nedotkne.',
    answer: 'slib', distractors: ['sklenice', 'vejce', 'talíř'],
    hints: ['Když ho dodržíš, kamarádi ti budou věřit.'],
    explanation: 'Slib se „rozbije“, když ho nedodržíš – a nemusíš se ho ani dotknout.',
  },
  {
    key: 'zitrek', lvl: 4,
    text: 'Pořád je před tebou,\na nikdy ho neuvidíš.',
    answer: 'zítřek', distractors: ['nos', 'cesta', 'stín'],
    hints: ['Souvisí to s časem.'],
    explanation: 'Zítřek je pořád před námi. Když přijde, je z něj dnešek.',
  },
  {
    key: 'levy-loket', lvl: 4,
    text: 'Co můžeš vzít do pravé ruky,\nale nikdy ne do levé?',
    ask: 'Vyber správnou odpověď.',
    answer: 'levý loket', distractors: ['pravý loket', 'tužku', 'lžíci'],
    hints: ['Zkus to hned teď se svýma rukama.'],
    explanation: 'Pravou rukou chytíš levý loket, ale levou rukou vlastní levý loket nechytíš.',
  },
  {
    key: 'kohoutek', lvl: 4,
    text: 'Kterého kohoutka\nnikdy neuslyšíš kokrhat?',
    ask: 'Vyber správnou odpověď.',
    answer: 'vodovodní kohoutek', distractors: ['mladý kohoutek', 'kohout na dvoře', 'kohout z pohádky'],
    hints: ['Najdeš ho v kuchyni nebo v koupelně.'],
    explanation: 'Vodovodní kohoutek se jmenuje jako malý kohout, ale místo kokrhání z něj teče voda.',
  },
  {
    key: 'jedno-vejce', lvl: 4,
    text: 'Kolik vajec můžeš sníst\nna lačný žaludek?',
    ask: 'Vyber správnou odpověď.',
    answer: 'jedno', distractors: ['dvě', 'pět', 'deset'],
    hints: ['Co znamená jíst na lačno?'],
    explanation: 'Jen jedno. Po prvním vajíčku už nejíš na lačný žaludek.',
  },
  {
    key: 'stin-slona', lvl: 4,
    text: 'Je velký jako slon,\na přitom nic neváží.',
    answer: 'stín slona', distractors: ['velryba', 'slon', 'dům'],
    hints: ['Uvidíš ho, když na slona svítí slunce.'],
    explanation: 'Stín slona je velký jako slon, ale nic neváží.',
  },
  {
    key: 'mesice-28', lvl: 4,
    text: 'Který měsíc v roce\nmá 28 dní?',
    ask: 'Vyber správnou odpověď.',
    answer: 'všechny', distractors: ['únor', 'leden', 'žádný'],
    hints: ['Otázka se neptá, který měsíc má jen 28 dní.'],
    explanation: 'Každý měsíc má aspoň 28 dní. Únor jich má přesně tolik, ostatní ještě víc.',
  },
];

/** Které obtížnosti hádanek patří do úrovně úlohy. */
const WINDOW: Record<1 | 2 | 3 | 4, number[]> = {
  1: [1, 2],
  2: [1, 2, 3],
  3: [2, 3, 4],
  4: [3, 4],
};

function entry(r: Riddle, level: number): Entry {
  const ask = r.ask ?? 'Co je to?';
  return {
    key: r.key,
    build: (rng) => ({
      prompt: ask,
      speak: `${r.text.replace(/\n/g, ' ')} ${ask}`,
      visual: { type: 'reading', title: 'Hádanka', text: r.text },
      answer: choice(rng, r.answer, [...r.distractors]),
      hints: [...r.hints],
      explanation: r.explanation,
      difficulty: relDifficulty(r.lvl, level),
    }),
  };
}

const levels: Level[] = [1, 2, 3, 4];

export const pools: Pools = Object.fromEntries(
  levels.map((l) => [l, RIDDLES.filter((r) => WINDOW[l as 1 | 2 | 3 | 4].includes(r.lvl)).map((r) => entry(r, l))]),
);
assertUniqueKeys(ID, pools);

export const hadanky: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Hádanky',
  description: 'Luští lidové i nové rýmované hádanky a chytáky; učí se číst obrazná pojmenování a pečlivě porovnávat všechny indicie.',
  levels,
  rvp: {
    1: ['ČJL-3-3-01', 'ČJL-3-1-02'],
    2: ['ČJL-3-3-01', 'ČJL-3-1-02'],
    3: ['ČJL-3-3-01', 'ČJL-3-1-02'],
    4: ['ČJL-3-3-01', 'ČJL-3-1-02'],
  },
  ability: 'usuzovani',
  generate: makeGenerator(ID, levels, pools),
};
