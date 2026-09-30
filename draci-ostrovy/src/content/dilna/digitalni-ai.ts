// AI, nebo ne? – co je umělá inteligence po dětsku: program, který se naučil
// z mnoha příkladů poznávat nebo tvořit (obrázky, řeč, text), na rozdíl od
// obyčejného stroje, který jen plní pevná pravidla. A také co AI není: nemá
// city, může se splést, neví všechno a umí si vymyslet věc, která zní pravdivě.
//
// Třídění „Používá AI × Nepoužívá AI“ je jen u jednoznačných případů. Hraniční
// věci (robotický vysavač, pračka s nápisem AI, auta) záměrně chybí. Klíče
// `zarizeni-<věc>` kontroluje test proti vlastní tabulce.
//
// Vysvětlení je zajímavost (showFact): ukáže se i po správné odpovědi. Nejdřív
// řekne proč (učila se z příkladů × plní pevné pravidlo), pak přidá jeden
// navazující detail.

import { bankSkill, type Spec } from '../../core/bank';
import type { ChoiceOption, KnowledgeCard } from '../../core/types';
import { fixed, q } from './digitalni-common';

const ID = 'dilna.ai';

export const AI_ANO: ChoiceOption = { label: 'Používá AI', speak: 'Používá umělou inteligenci' };
export const AI_NE: ChoiceOption = { label: 'Nepoužívá AI', speak: 'Nepoužívá umělou inteligenci' };

const OBECNA = 'AI se učila z mnoha příkladů. Obyčejný stroj jen plní pevná pravidla.';

/** Věc k roztřídění: používá AI, nebo jen plní pevná pravidla? */
function vec(key: string, popis: string, usesAi: boolean, hint: string, explain: string): Spec {
  return fixed(`zarizeni-${key}`, `${popis} Používá AI?`, [AI_ANO, AI_NE], usesAi ? 0 : 1, [OBECNA, hint], explain);
}

const PRAVDA = 'Pravda';
const NEPRAVDA = 'Nepravda';

/** Tvrzení o AI: pravda, nebo ne? */
function tvrzeni(key: string, text: string, isTrue: boolean, hint: string, explain: string): Spec {
  return fixed(`tvrzeni-${key}`, `„${text}“ Je to pravda?`, [PRAVDA, NEPRAVDA], isTrue ? 0 : 1, [hint], explain, {
    speak: `${text} Je to pravda?`,
  });
}

const POZNAVA = 'Poznává';
const TVORI = 'Tvoří';

/** Co AI dělá: poznává (přiřadí jméno), nebo tvoří (vyrobí něco nového)? */
function prace(key: string, popis: string, tvori: boolean, explain: string): Spec {
  return fixed(`prace-${key}`, `${popis} Poznává, nebo tvoří?`, [POZNAVA, TVORI], tvori ? 1 : 0,
    ['Vznikne něco nového, nebo stroj jen řekne, co to je?'], explain);
}

// ---------------------------------------------------------------------------
// L1 – známé věci z domova: AI × obyčejný stroj

const L1: Spec[] = [
  vec('hlasovy-asistent', 'Hlasový asistent v telefonu rozumí, na co se ho zeptáš, a odpoví ti.', true,
    'Rozumět různým hlasům je těžké. Musel se to někde naučit?',
    'Hlasový asistent se naučil rozumět řeči z obrovského množství nahrávek, na kterých mluví lidé – proto používá AI. Díky tomu rozumí i lidem, jejichž hlas nikdy předtím neslyšel.'),
  vec('prekladac', 'Překladač přeloží celou větu z češtiny do angličtiny.', true,
    'Umí to podle jednoho jednoduchého pravidla?',
    'Překladač se naučil překládat z milionů vět, které předtím přeložili lidé – proto používá AI. Musí přitom poznat, co slovo ve větě znamená: zámek může být hrad i zámek u dveří.'),
  vec('obliceje', 'Telefon ve fotkách sám najde všechny fotky, na kterých je babička.', true,
    'Jak telefon pozná obličej?',
    'Telefon se naučil poznávat obličeje z mnoha fotek, a proto používá AI. Babičku často pozná i na fotce, kde má čepici nebo je natočená bokem.'),
  vec('doporucovani-videi', 'Aplikace s videi ti sama vybírá nová videa, která by tě mohla bavit.', true,
    'Podle čeho asi vybírá?',
    'Aplikace se učí z toho, co sleduješ ty a spousta dalších lidí – proto používá AI. Když si pustíš pár videí o dracích, začne ti nabízet další draky.'),
  vec('chatbot', 'Chatbot ti na jakoukoli otázku sám napíše odpověď celými větami.', true,
    'Mohl by to program umět podle jednoho pevného pravidla?',
    'Chatbot se naučil psát věty z obrovského množství textů, které napsali lidé – proto je to AI. Skládá slova tak, jak v textech obvykle jdou po sobě, a proto se může splést, i když zní jistě.'),
  vec('poznavani-kytek', 'Aplikace podle fotky pozná, jaká je to kytka.', true,
    'Jak by se stroj naučil poznávat kytky?',
    'Aplikace se to naučila z tisíců fotek kytek, ke kterým lidé napsali jména – proto používá AI. Když vyfotíš kytku, jakou na fotkách nikdy neviděla, může se splést.'),
  vec('kresleni-podle-popisu', 'Program nakreslí obrázek draka podle toho, co mu napíšeš.', true,
    'Jak by program věděl, jak vypadá drak?',
    'Program se učil z mnoha obrázků s popisky, a proto umí nakreslit nový obrázek podle popisu – je to AI. Takový drak předtím nikde nebyl, program ho poskládal z toho, co se naučil.'),
  vec('diktovani', 'Telefon sám napíše zprávu, když mu ji nadiktuješ.', true,
    'Každý mluví trochu jinak. Stačí na to jedno pevné pravidlo?',
    'Telefon se naučil převádět řeč na písmena z mnoha nahrávek – proto používá AI. Musí přitom rozlišit i slova, která zní stejně, třeba led a let. Pozná to podle ostatních slov ve větě.'),
  vec('zpev-ptaku', 'Aplikace podle zpěvu pozná, který pták zpívá.', true,
    'Jak by se stroj naučil poznávat ptáky podle hlasu?',
    'Aplikace se to naučila z mnoha nahrávek ptačího zpěvu – proto používá AI. Pozná ptáka, i když ho vůbec nevidíš, třeba schovaného vysoko v koruně stromu.'),
  vec('automaticke-titulky', 'Pod videem se samy objeví titulky podle toho, co lidé ve videu říkají.', true,
    'Kdo titulky píše, když to není člověk?',
    'Program poslouchá řeč a přepisuje ji na text. Rozumět řeči se naučil z mnoha nahrávek, a proto je to AI. Když lidé mluví jeden přes druhého nebo hraje hlasitá hudba, bývá v titulcích víc chyb.'),
  vec('kalkulacka', 'Kalkulačka sečte dvě čísla.', false,
    'Musí se kalkulačka něco učit, nebo počítá pořád stejně?',
    'Kalkulačka počítá podle pevných pravidel, která do ní vložili lidé, a nic se neučí – AI nepotřebuje. Na stejný příklad odpoví pokaždé stejně, i když ho zadáš tisíckrát.'),
  vec('rychlovarna-konvice', 'Rychlovarná konvice ohřeje vodu a sama se vypne.', false,
    'Kdy se konvice vypne?',
    'Konvice se vypne podle jednoduchého pravidla: když se voda vaří, pára ohřeje kovovou destičku, ta se prohne a cvakne vypínačem. Nic se neučí, a proto AI nepotřebuje.'),
  vec('vypinac', 'Vypínačem na zdi rozsvítíš světlo.', false,
    'Co se stane, když vypínač zmáčkneš?',
    'Vypínač jen spojí dráty a proud poteče do světla – pokaždé stejně. Žádné učení v tom není, a proto AI nepotřebuje.'),
  vec('budik', 'Budík zazvoní v sedm hodin, protože jsi ho tak {nastavila|nastavil}.', false,
    'Dělá budík něco jiného, než co mu nastavíš?',
    'Budík plní jedno pevné pravidlo a nic se neučí. Proto zazvoní v sedm i v sobotu, kdy se nikam nespěchá – sám na to nepřijde.'),
  vec('kolo', 'Kolo jede, když šlapeš do pedálů.', false,
    'Má kolo v sobě počítač?',
    'Kolo je stroj bez počítače: pohánějí ho tvoje nohy přes pedály a řetěz. Nic se neučí, a proto AI nepotřebuje.'),
  vec('zvonek', 'Zvonek u dveří zazvoní, když zmáčkneš tlačítko.', false,
    'Zvoní zvonek pokaždé stejně?',
    'Zvonek plní jedno pevné pravidlo: zmáčkneš tlačítko a zazvoní. Zazvoní stejně pro pošťáka i pro babičku – nepozná, kdo stojí u dveří.'),
  vec('baterka', 'Baterka svítí, když ji zapneš.', false,
    'Co baterka dělá, když ji zapneš?',
    'Baterka jen pustí proud z baterie do světla – pokaždé stejně. Nic se neučí, a proto AI nepotřebuje.'),
  vec('auticko-na-klicek', 'Autíčko na klíček jede, když ho natáhneš.', false,
    'Co autíčko pohání?',
    'Autíčko pohání natažená pružina: jak se povoluje, točí kolečky. Nemá v sobě žádný počítač, natož AI.'),
  vec('presypaci-hodiny', 'Přesýpací hodiny odměří čas, než se přesype písek.', false,
    'Co se v přesýpacích hodinách děje?',
    'Přesýpací hodiny se nic neučí, písek jen padá úzkým hrdlem – a to pořád skoro stejně rychle, ať je ho nahoře hodně, nebo málo. Kdyby v nich byla voda, tekla by čím dál pomaleji.'),
  vec('hraci-skrinka', 'Hrací skříňka zahraje písničku, když ji natáhneš.', false,
    'Hraje skříňka pokaždé jinou písničku?',
    'Hrací skříňka hraje pořád stejnou písničku: kolíčky na otáčejícím se válečku brnkají o kovový hřebínek. Nic se neučí, a proto AI nepotřebuje.'),
  vec('teplomer', 'Teploměr ukáže, jaká je venku teplota.', false,
    'Teploměr jen měří. Musí se k tomu něco učit?',
    'Teploměr jen měří teplotu a nic se neučí, a proto AI nepotřebuje. V obyčejném teploměru se kapalina v teple roztahuje a stoupá, v chladu klesá.'),
];

// ---------------------------------------------------------------------------
// L2 – věci, které vypadají chytře, ale plní pevná pravidla, a méně nápadná AI

const L2: Spec[] = [
  vec('svetlo-s-cidlem', 'Světlo na chodbě se samo rozsvítí, když kolem někdo projde.', false,
    'Rozsvítí se pokaždé stejně, když se něco pohne?',
    'Čidlo zachytí pohyb a světlo se rozsvítí podle pevného pravidla. Vypadá to chytře, ale rozsvítí se stejně pro člověka jako pro kočku – nic se neučí.'),
  vec('automaticke-dvere', 'Dveře v obchodě se samy otevřou, když k nim přijdeš.', false,
    'Co dveřím řekne, že někdo přichází?',
    'Čidlo nad dveřmi zachytí pohyb a dveře se otevřou. Je to pevné pravidlo, ne AI: otevřou se každému, kdo k nim přijde, třeba i psovi.'),
  vec('pokladna', 'Pokladna pípne a ukáže cenu, když prodavač načte čárový kód.', false,
    'Čárový kód je vlastně číslo nakreslené čárami.',
    'Pokladna přečte z čárového kódu číslo a cenu k němu najde v seznamu. Nic se neučí: když někdo do seznamu napíše špatnou cenu, pokladna ji klidně ukáže.'),
  vec('dalkovy-ovladac', 'Dálkovým ovladačem přepneš televizi na jiný program.', false,
    'Co se stane po zmáčknutí tlačítka?',
    'Ovladač pošle televizi neviditelné světlo a ta přepne – pevné pravidlo, žádné učení. Oči to světlo nevidí, ale fotoaparát v telefonu ho často zachytí jako blikání.'),
  vec('kuchynska-vaha', 'Kuchyňská váha ukáže, kolik váží mouka.', false,
    'Váha jen měří. Musí se k tomu něco učit?',
    'Váha jen měří, jak mouka tlačí na misku, a nic se neučí. Pod miskou je kovový díl, který se pod moukou nepatrně prohne, a váha podle toho spočítá hmotnost.'),
  vec('automat-na-piti', 'Automat vydá pití, když vhodíš mince a zmáčkneš tlačítko.', false,
    'Rozhoduje se automat pokaždé jinak?',
    'Automat plní pevná pravidla: spočítá mince a vydá, co jsi {vybrala|vybral}. Nic se neučí – na stejné tlačítko vydá pokaždé stejné pití.'),
  vec('zamek-na-kod', 'Dveře se odemknou, když zadáš správný kód.', false,
    'Co zámek s kódem dělá?',
    'Zámek jen porovná zadaný kód s uloženým – pevné pravidlo, žádná AI. S jedinou špatnou číslicí se neotevře, i když je zbytek kódu dobře.'),
  vec('stopky', 'Stopky změří, jak dlouho ti trvá doběhnout k plotu.', false,
    'Co stopky dělají mezi dvěma zmáčknutími?',
    'Stopky jen počítají čas od zmáčknutí do zmáčknutí a nic se neučí. V elektronických stopkách kmitá malý krystal víc než třicet tisíckrát za sekundu a stopky ty kmity počítají.'),
  vec('rukopis', 'Tablet převede, co napíšeš prstem, na tištěná písmena.', true,
    'Každý píše trochu jinak. Stačí na to jedno pevné pravidlo?',
    'Tablet se naučil číst rukopis z mnoha ukázek psaní různých lidí – proto používá AI. Přečte pak i písmo, které nikdy předtím neviděl, když se aspoň trochu podobá ukázkám.'),
  vec('psi-ve-fotkach', 'Aplikace ve fotkách sama najde všechny fotky, na kterých je pes.', true,
    'Psi vypadají různě. Jak je aplikace pozná?',
    'Aplikace se naučila poznávat psy z mnoha fotek – proto používá AI. Pozná malého jezevčíka i obří dogu, protože v příkladech viděla psy všech velikostí.'),
  vec('preklad-napisu', 'Telefon namíříš na nápis v cizím jazyce a on ti ho přeloží do češtiny.', true,
    'Telefon musí přečíst písmena a pak větu přeložit.',
    'Telefon nejdřív pozná písmena na fotce a pak větu přeloží. Obojí se naučil z mnoha příkladů, a proto používá AI. Překlad umí ukázat přímo na fotce, na místě původního nápisu.'),
  vec('basnicka', 'Program napíše básničku o drakovi, když ho o ni požádáš.', true,
    'Stačí na psaní básniček jedno pevné pravidlo?',
    'Program se naučil psát z obrovského množství textů, a proto je to AI. Básničku poskládá ze slov, která se k sobě hodí a rýmují, i když žádného draka nikdy neviděl.'),
  vec('seznam-pisnicek', 'Aplikace s hudbou ti sama doporučí nové písničky, které se ti nejspíš budou líbit.', true,
    'Podle čeho aplikace písničky vybírá?',
    'Aplikace se učí z toho, co posloucháš ty a jiní lidé – proto používá AI. Když lidé s podobným vkusem jako ty poslouchají novou písničku, nabídne ji i tobě.'),
  q('ktera-pouziva', 'Která z těchto věcí používá AI?', 'Překladač vět',
    ['Kalkulačka', 'Vypínač', 'Zvonek', 'Budík'],
    ['Která z nich se musela učit z mnoha příkladů?'],
    'Překladač se naučil překládat z mnoha přeložených textů, a proto používá AI. Ostatní věci jen plní pevná pravidla, která do nich vložili lidé.'),
  q('ktera-se-ucila', 'Která z těchto věcí se učila z mnoha příkladů?', 'Hlasový asistent',
    ['Rychlovarná konvice', 'Baterka', 'Kolo', 'Stopky'],
    ['Která z nich rozumí řeči?'],
    'Hlasový asistent se naučil rozumět řeči z mnoha nahrávek. Ostatní věci jen plní pevná pravidla a nic se neučí.'),
  q('ktera-nepouziva', 'Která z těchto věcí nepoužívá AI?', 'Kalkulačka',
    ['Chatbot', 'Hlasový asistent', 'Překladač vět', 'Aplikace na kytky'],
    ['Která z nich počítá pořád stejně podle pravidel?'],
    'Kalkulačka počítá podle pevných pravidel, která do ní vložili lidé. Ostatní věci se učily z mnoha příkladů, a proto používají AI.'),
  q('co-je-ai', 'Co je umělá inteligence neboli AI?', 'Program, který se učil z příkladů',
    ['Robot, který má city', 'Kouzlo schované v počítači', 'Každý stroj s tlačítkem'],
    ['Jak se AI dozví, jak vypadá kočka?'],
    'AI je program, který se naučil z mnoha příkladů poznávat nebo tvořit – obrázky, řeč nebo text. City nemá a kouzlo to není. Zkratka AI je z anglického artificial intelligence, česky umělá inteligence.'),
  q('kdo-vyrobil', 'Kdo vyrobil AI?', 'Lidé',
    ['Draci', 'Sama se vyrobila', 'Kouzelníci'],
    ['Kdo vymýšlí a staví počítače a programy?'],
    'AI vymysleli a postavili lidé – vědkyně, vědci, programátorky a programátoři. Na velké AI pracují celé týmy lidí a učí ji na tisících počítačů najednou.'),
  q('co-umi', 'Co z toho umí AI v telefonu?', 'Poznat na fotce kočku',
    ['Uvařit polévku', 'Vyvenčit psa', 'Uklidit pokoj'],
    ['Telefon nemá ruce ani nohy.'],
    'AI v telefonu umí poznávat obrázky, řeč nebo text. Vařit, venčit ani uklízet neumí – telefon nemá ruce ani nohy.'),
  q('proc-kalkulacka', 'Proč kalkulačka nepotřebuje AI?', 'Protože počítá podle pevných pravidel.',
    ['Protože je malá.', 'Protože nemá baterku.', 'Protože umí jen sčítat.'],
    ['Musí se kalkulačka učit, jak se sčítá?'],
    'Pravidla počítání do kalkulačky vložili lidé. Kalkulačka je jen plní a nic se učit nemusí – proto počítá pokaždé stejně.'),
];

// ---------------------------------------------------------------------------
// L3 – co AI je a není: nemá city, plete se, neví všechno, vyrobili ji lidé

const L3: Spec[] = [
  q('city-radost', 'Chatbot napíše: „Mám radost, že tě vidím!“ Cítí opravdu radost?', 'Ne, AI nemá city.',
    ['Ano, moc se těší.', 'Ano, ale jen ráno.', 'Ano, když svítí obrazovka.'],
    ['Kdo ta slova napsal – člověk, nebo program?'],
    'AI nic necítí, ani radost. Naučila se, že lidé si v rozhovoru píšou milá slova, a tak je píše taky. Radost opravdu cítí lidé a zvířata.'),
  q('muze-se-splest', 'Může se AI splést?', 'Ano, i když odpovídá jistě.',
    ['Ne, nikdy.', 'Ne, počítače se nepletou.', 'Jen když je vypnutá.'],
    ['Vzpomeň si na Hugina z dílny.'],
    'AI se může splést, i když zní úplně jistě. Proto její odpovědi ověřujeme – v knize, měřením nebo u odborníka.'),
  q('vi-vsechno', 'Ví AI úplně všechno?', 'Ne, a někdy si i vymýšlí.',
    ['Ano, ví všechno.', 'Ano, protože je na internetu.', 'Ano, když se jí zeptáš hezky.'],
    ['Z čeho se AI učila?'],
    'AI zná jen část věcí – to, co bylo v textech, ze kterých se učila. Občas si vymyslí odpověď, která zní pravdivě, ale není. Proto je dobré ji ověřit.'),
  q('proc-overovat', 'Proč je dobré odpověď od AI ověřit?', 'Může si vymyslet něco, co zní pravdivě.',
    ['AI vždycky lže.', 'AI je zlá.', 'Ověřovat není potřeba.'],
    ['Plete se AI schválně, nebo omylem?'],
    'AI někdy napíše nepravdu tak, že zní jako pravda. Nedělá to schválně – jen se splete. Proto se odpovědi ověřují.'),
  q('kamarad', 'Hugin je mechanický havran z dílny. Může ti nahradit kamarády?', 'Ne, je to užitečný stroj.',
    ['Ano, je to můj nejlepší kamarád.', 'Ano, má mě rád.', 'Ano, těší se na mě.'],
    ['Má stroj city?'],
    'Hugin je stroj. Umí pomoct, ale nic necítí, a tak kamaráda nenahradí. Kamarádi jsou lidé – a ve hře máš i svého draka.'),
  q('smutno', 'Je ti smutno. S kým si o tom nejlépe promluvíš?', 'S rodiči nebo s kamarády',
    ['Jen s chatbotem', 'S kalkulačkou', 'S rychlovarnou konvicí'],
    ['Kdo tě má rád a rozumí tomu, jak ti je?'],
    'Když je ti smutno, pomůže člověk, který tě má rád. Chatbot city nemá, nerozumí ti jako člověk a obejmout tě neumí.'),
  q('u-more', 'Chatbot napíše básničku o moři. Byl někdy u moře?', 'Ne, nikdy nikde nebyl.',
    ['Ano, loni v létě.', 'Ano, jezdí tam na prázdniny.', 'Ano, s kamarády z dílny.'],
    ['Má chatbot tělo?'],
    'Chatbot nemá tělo ani zážitky. Básničku složil ze slov z textů, které napsali lidé – ti u moře opravdu byli.'),
  q('psat-cesky', 'Jak se chatbot naučil psát česky?', 'Učil se z mnoha českých textů.',
    ['Naučila ho to paní učitelka ve škole.', 'Umí to odjakživa.', 'Vyčetl to z hvězd.'],
    ['Z čeho se AI učí?'],
    'Chatbot se učil z obrovského množství textů, které napsali lidé – i z českých. Tak se naučil, jak česká slova jdou po sobě.'),
  q('clovek-v-telefonu', 'Hlasový asistent ti odpoví hezkým hlasem. Je v telefonu schovaný člověk?', 'Ne, odpovídá program.',
    ['Ano, malý človíček.', 'Ano, paní z rádia.', 'Ano, telefonní operátorka.'],
    ['Vejde se do telefonu člověk?'],
    'Odpovídá program, který se naučil mluvit z mnoha nahrávek lidských hlasů. Žádný člověk v telefonu schovaný není.'),
  q('jak-vypada-kocka', 'Odkud AI ví, jak vypadá kočka?', 'Viděla mnoho fotek koček.',
    ['Má doma kočku.', 'Pohladila si kočku.', 'Zdálo se jí o kočce.'],
    ['Z čeho se AI učí?'],
    'AI žádnou kočku nepohladila ani neviděla naživo. Naučila se to z mnoha fotek, u kterých lidé napsali, že je na nich kočka.'),
  q('vysledek-prikladu', 'AI ti napíše výsledek příkladu z matematiky. Co uděláš?', 'Zkontroluji ho {sama|sám}.',
    ['Opíšu ho bez kontroly.', 'Zeptám se jí, jestli si je jistá.', 'Věřím mu, když zní chytře.'],
    ['Může se AI v počítání splést?'],
    'Výsledek zkontroluješ {sama|sám}, třeba zkouškou. AI se v počítání může splést a otázka „jsi si jistá?“ nic neověří.'),
  q('pavouk-od-ai', 'AI ti napíše, že pavouk má šest nohou. Co uděláš?', 'Ověřím to v atlasu zvířat.',
    ['Uvěřím jí, AI se nemýlí.', 'Hned to napíšu do úkolu.', 'Zeptám se jí, jestli si je jistá.'],
    ['Kde se dá spolehlivě zjistit, kolik nohou má pavouk?'],
    'V atlasu zvířat zjistíš, že pavouk má osm nohou – AI se spletla. Otázka „jsi si jistá?“ nic neověří.'),
  tvrzeni('spi', 'AI potřebuje v noci spát.', false, 'Je AI živý tvor, nebo program?',
    'AI je program. Nespí, nejí a neunaví se – běží v počítači, dokud je zapnutý.'),
  tvrzeni('city', 'AI má city.', false, 'Může program cítit radost nebo smutek?',
    'AI nemá city. Může psát milá slova, ale nic necítí – slova jen skládá podle toho, jak je píšou lidé.'),
  tvrzeni('elektrina', 'AI potřebuje k práci elektřinu.', true, 'Kde AI běží?',
    'AI je program, který běží v počítači nebo v telefonu, a bez elektřiny by nefungovala. Velké AI běží v obřích halách plných počítačů, které spotřebují hodně elektřiny.'),
  tvrzeni('vyrobili-lide', 'AI vyrobili lidé.', true, 'Kdo staví počítače a píše programy?',
    'AI vymysleli a postavili lidé: vědkyně, vědci, programátorky a programátoři. Sama od sebe nevznikla.'),
  tvrzeni('kalkulacka', 'Kalkulačka se učí z příkladů stejně jako AI.', false, 'Musí se kalkulačka učit, jak se sčítá?',
    'Kalkulačka počítá podle pevných pravidel, která do ní vložili lidé. Z příkladů se neučí.'),
  tvrzeni('vymysli', 'AI si umí vymyslet věc, která zní pravdivě.', true, 'Vzpomeň si na Hugina.',
    'AI někdy napíše nepravdu tak, že zní jako pravda. Nedělá to schválně, jen skládá slova, která k sobě pasují. Proto se odpovědi ověřují.'),
  tvrzeni('ziva', 'AI je živá jako zvíře.', false, 'Dýchá AI? Roste? Potřebuje jíst?',
    'AI je program v počítači, ne živý tvor. Nedýchá, neroste a nejí.'),
  tvrzeni('priklady', 'AI se učí z mnoha příkladů.', true, 'Jak se AI naučí poznávat kočky?',
    'AI se učí z mnoha příkladů – třeba z tisíců fotek, textů nebo nahrávek.'),
  tvrzeni('jista-odpoved', 'Když AI odpoví jistě, je to určitě pravda.', false, 'Může se AI splést, i když zní jistě?',
    'I jistě znějící odpověď může být chybná. Pravdu ověříš jinde – v knize, měřením nebo u odborníka.'),
];

// ---------------------------------------------------------------------------
// L4 – hlubší porozumění: data, chyby, vymyšlené obrázky, odpovědnost

const L4: Spec[] = [
  prace('obrazek', 'Program podle popisu nakreslí nový obrázek.', true,
    'Program vytvořil obrázek, který předtím neexistoval, a proto tvoří. Poskládal ho z toho, co se naučil z mnoha jiných obrázků.'),
  prace('kytka', 'Aplikace podle fotky řekne, jak se kytka jmenuje.', false,
    'Aplikace fotce jen přiřadí jméno kytky a nic nového nevznikne – taková AI poznává.'),
  prace('pohadka', 'Chatbot napíše novou pohádku o drakovi.', true,
    'Vznikla pohádka, která předtím nebyla, a proto chatbot tvoří. Slova k ní poskládal podle pohádek, které napsali lidé.'),
  prace('obliceje', 'Telefon najde ve fotkách všechny fotky dědy.', false,
    'Telefon v každé fotce hledá známý obličej a nic nového nevyrobí – taková AI poznává.'),
  prace('pisnicka', 'Program složí novou písničku.', true,
    'Vznikla písnička, která předtím nebyla, a proto program tvoří. Naučil se to z mnoha písniček, které složili lidé.'),
  prace('ptak', 'Aplikace podle zpěvu určí, jaký pták zpívá.', false,
    'Aplikace nahrávce jen přiřadí jméno ptáka a nový zpěv nevymyslí – taková AI poznává.'),
  prace('slova', 'Telefon zjistí, která slova říkáš.', false,
    'Telefon v řeči rozpozná slova, která říkáš, a nic nového nevymyslí – taková AI poznává.'),
  q('data-s-chybami', 'AI se učila z textů, ve kterých bylo hodně chyb. Co se může stát?', 'Bude chyby opakovat.',
    ['Všechny chyby sama opraví.', 'Zapomene všechno.', 'Začne mluvit jen anglicky.'],
    ['AI se naučí to, co je v příkladech.'],
    'AI se naučí to, co je v příkladech – i chyby. Proto záleží na tom, z čeho se učí.'),
  q('drak-nad-prahou', 'Na internetu je fotka draka, který chrlí oheň nad Prahou. Co je nejspíš pravda?', 'Obrázek je upravený nebo vyrobený.',
    ['V Praze opravdu žijí ohniví draci.', 'Fotoaparát si draka vymyslel.', 'Drak se vyfotil sám.'],
    ['Chrlí někde na světě opravdový drak oheň?'],
    'Draci, kteří chrlí oheň, jsou jen v pohádkách a hrách. Takový obrázek někdo upravil nebo ho vyrobila AI. Ta dnes umí obrázky, které vypadají jako skutečné fotky.'),
  q('houba-z-aplikace', 'Aplikace podle fotky řekne, že houba je jedlá. Smíš ji sníst?', 'Ne, musí ji zkontrolovat houbař.',
    ['Ano, aplikace se nemýlí.', 'Ano, když je fotka ostrá.', 'Ano, ale jen kousek.'],
    ['Může se aplikace splést?'],
    'Aplikace se může splést a u hub by chyba mohla ublížit. Nasbírané houby musí vždycky zkontrolovat zkušený dospělý houbař.'),
  q('turing', 'Matematik Alan Turing v roce 1950 položil slavnou otázku. Jakou?', 'Může stroj myslet?',
    ['Kolik je na nebi hvězd?', 'Proč je nebe modré?', 'Umějí draci létat?'],
    ['Turing se zajímal o počítače.'],
    'Alan Turing v roce 1950 napsal článek, který začíná otázkou, jestli stroje mohou myslet. Vědci o ní přemýšlejí dodnes.'),
  q('halucinace', 'Jak se říká tomu, když si AI vymyslí nepravdu, která zní jako pravda?', 'Halucinace',
    ['Aktualizace', 'Nabíjení', 'Restart'],
    ['Stejné slovo se používá, když člověk vidí něco, co tam není.'],
    'Říká se tomu halucinace. AI složí slova, která k sobě pasují, i když nejsou pravdivá. Proto se odpovědi ověřují.'),
  q('kdo-odpovida', 'AI ti do úkolu napíše špatný výsledek. Kdo za úkol odpovídá?', 'Já, protože ho odevzdávám',
    ['AI', 'Nikdo', 'Počítač, na kterém píšu'],
    ['Čí jméno je na úkolu?'],
    'Za úkol odpovídá ten, kdo ho odevzdá. AI může pomoct, ale výsledek je potřeba zkontrolovat.'),
  q('detske-hlasy', 'Hlasový asistent se učil hlavně z nahrávek dospělých. Komu může rozumět hůř?', 'Dětem',
    ['Dospělým', 'Nikomu, rozumí všem stejně', 'Hlasatelům v rádiu'],
    ['Čeho bylo v příkladech málo?'],
    'AI nejlépe zvládne to, čeho bylo v příkladech nejvíc. Dětské hlasy zní jinak, a když jich bylo v příkladech málo, rozumí jim asistent hůř.'),
  q('fotka-co-nebyla', 'Umí AI vyrobit fotku něčeho, co se nikdy nestalo?', 'Ano, umí.',
    ['Ne, fotka je vždycky pravdivá.', 'Jen když je tma.', 'Jen černobílou.'],
    ['Vzpomeň si, co umí programy na kreslení podle popisu.'],
    'AI dnes umí vytvořit obrázky, které vypadají jako skutečné fotky. Proto se u překvapivých fotek ptáme, odkud jsou.'),
  q('jista-odpoved', 'Chatbot odpoví velmi sebejistě. Znamená to, že má pravdu?', 'Ne, i jistá odpověď může být chybná.',
    ['Ano, jistota znamená pravdu.', 'Ano, chatboti se nepletou.', 'Ano, když je odpověď dlouhá.'],
    ['Může se splést i někdo, kdo mluví jistě?'],
    'Jak jistě odpověď zní, nic neříká o tom, jestli je pravdivá. Pravdu ověříš v jiném zdroji.'),
  q('co-bylo-vcera', 'Chatbot se učil z textů, které lidé napsali před více než rokem. Ví, co se stalo včera?', 'Nemusí to vědět.',
    ['Ano, ví všechno.', 'Ano, zdálo se mu to.', 'Ano, pošeptal mu to Měsíc.'],
    ['Z čeho se chatbot učil?'],
    'Chatbot zná hlavně texty, ze kterých se učil. O včerejšku se z nich nedozví – pokud mu to někdo neřekne nebo to nevyhledá.'),
  q('proc-hodne-prikladu', 'Proč AI potřebuje k učení hodně příkladů?', 'Aby zvládla i nové případy.',
    ['Aby se nenudila.', 'Aby měla plnou paměť.', 'Aby byla těžší.'],
    ['Co má AI umět s obrázkem, který nikdy neviděla?'],
    'Z mnoha různých příkladů se AI naučí, co mají společného. Pak si častěji poradí i s obrázkem nebo větou, které nikdy neviděla.'),
  q('ai-a-kalkulacka', 'Čím se liší AI od kalkulačky?', 'AI se učila z příkladů.',
    ['AI je vždycky větší.', 'Kalkulačka se také učí.', 'AI nemá žádný program.'],
    ['Jak se kalkulačka dozvěděla, jak se sčítá?'],
    'Kalkulačka plní pevná pravidla, která do ní vložili lidé. AI se svou práci naučila z mnoha příkladů.'),
  q('napodobit-hlas', 'Může AI napodobit hlas člověka?', 'Ano, umí to.',
    ['Ne, nikdy.', 'Jen hlasy zvířat.', 'Jen když zpívá.'],
    ['AI se učí z nahrávek.'],
    'AI umí napodobit hlas podle nahrávek. Když tě hlas v telefonu o něco žádá, raději si to ověř u rodičů.'),
];

export const aiSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'AI, nebo ne?',
  description: 'Dítě rozlišuje, které stroje používají umělou inteligenci a které jen plní pevná pravidla, a zjišťuje, že AI je stroj, který nemá city a může se mýlit.',
  rvp: {
    1: ['ČJS-3-3-03'],
    2: ['ČJS-3-3-03'],
    3: ['ČJS-3-3-03'],
    4: ['I-5-1-01', 'I-5-4-03'],
  },
  ability: 'znalosti',
  showFact: true,
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
});

export const aiCards: KnowledgeCard[] = [
  {
    id: 'dilna.ai.hugin-a-munin',
    skillId: ID,
    level: 1,
    emoji: '🐦',
    title: 'Hugin a Munin',
    text: 'V severských bájích měl bůh Odin dva havrany. Jméno Hugin znamená „myšlenka“ a Munin „paměť“. Každý den prý létali po světě a nosili Odinovi zprávy.',
  },
  {
    id: 'dilna.ai.nema-city',
    skillId: ID,
    level: 3,
    emoji: '💭',
    title: 'Stroj, který mluví, necítí',
    text: 'AI umí napsat „mám radost“, ale nic necítí. Slova skládá podle příkladů z textů, které napsali lidé. City mají lidé a zvířata.',
    fix: {
      before: 'Počítač, který mluví jako člověk, taky myslí a cítí jako člověk.',
      evidence: 'Vědci, kteří AI staví, vysvětlují, že AI skládá slova podle vzorů z obrovského množství textů. Když napíše „mám radost“, napodobuje, jak o radosti píšou lidé.',
    },
  },
  {
    id: 'dilna.ai.turing',
    skillId: ID,
    level: 4,
    emoji: '🧠',
    title: 'Může stroj myslet?',
    text: 'V roce 1950 napsal matematik Alan Turing článek, který začíná otázkou, jestli stroje mohou myslet. Navrhl hru: poznáš, jestli si píšeš s člověkem, nebo se strojem?',
  },
];
