// Peníze na kartě a v mobilu – peníze z karty jsou skutečné, PIN je
// tajný, placení mobilem, nákupy ve hrách, předplatné, podvodné zprávy,
// výpis z účtu a od 4. úrovně půjčky, úrok a splátky. Klidně a bez
// strašení: když si nejsi jistá, zeptej se rodiče.

import { count, formatNumber as f, type Forms } from '../../core/czech';
import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import { PEOPLE, kc, korun, mix, nm, pkey, q, sum, v } from './common';

const ID = 'trh.digitalni';

// ---------------------------------------------------------------------------
// L2 – karta, PIN, placení mobilem, nákupy ve hrách

const L2: Spec[] = [
  q('karta-skutecne', 'Máma zaplatila v obchodě kartou. Zaplatila skutečnými penězi?', 'Ano, ubydou jí z účtu',
    ['Ne, karta je jen hra', 'Ne, platí to obchod', 'Ne, karta peníze vyrábí'],
    ['Co se stane na mámině účtu?'],
    'Karta je klíč k penězům na účtu. Po zaplacení tam peníze opravdu ubydou, stejně jako z peněženky – jen je u toho nevidíš.'),
  q('pin-co', 'Co je PIN?', 'Tajné číslo ke kartě',
    ['Jméno banky', 'Číslo domu', 'Cena v obchodě'],
    ['Zadává se na klávesnici, když se platí nebo vybírá.'],
    'PIN je tajné číslo, kterým majitel karty potvrdí platbu nebo výběr z bankomatu. Když ho někdo zadá třikrát špatně, karta se zablokuje – zkoušením se tak uhodnout nedá.'),
  q('pin-spoluzak', 'Spolužák chce vědět PIN k tvé kartě. Co uděláš?', 'Neřeknu mu ho',
    ['Řeknu mu ho, je to kamarád', 'Napíšu mu ho na papírek', 'Řeknu mu jen půlku'],
    ['Komu patří peníze na tvém účtu?'],
    'PIN se neříká ani kamarádům – kdo zná PIN a má kartu, může platit tvými penězi. Proto je dobré při zadávání PINu zakrýt klávesnici rukou.'),
  q('volani-banka', 'Někdo volá, že je z banky, a chce tvůj PIN. Co uděláš?', 'Zavěsím a řeknu to rodičům',
    ['Řeknu ho, když je z banky', 'Pošlu mu ho zprávou', 'Řeknu mu jen první číslo'],
    ['Potřebuje banka znát tvůj PIN?'],
    'Banka se na PIN nikdy neptá – ani telefonem, ani zprávou. Kdo ho chce, chce podvádět, a tak je nejlepší klidně zavěsit.'),
  q('pin-kde', 'Kde je PIN nejlíp schovaný?', 'V hlavě',
    ['Napsaný na kartě', 'Na papírku v peněžence', 'Na lístečku na lednici'],
    ['Kde ho nikdo cizí nenajde?'],
    'Nejbezpečnější je PIN si pamatovat. Kdyby byl napsaný u karty, zloděj by našel obojí najednou.'),
  q('bankomat', 'Co udělá bankomat, když si vybereš peníze?', 'Vydá peníze z tvého účtu',
    ['Vytiskne nové peníze', 'Dá ti peníze někoho jiného', 'Prodá ti svačinu'],
    ['Co se potom stane s penězi na účtu?'],
    'Bankomat vydá bankovky a stejná částka ubude z tvého účtu. Nové peníze nevyrábí – bankovky do něj musí někdo nejdřív naložit.'),
  q('mobil-platba', 'Táta zaplatil mobilem. Odkud se vzaly peníze?', 'Z jeho účtu v bance',
    ['Z mobilu, ten je vyrábí', 'Od obchodu', 'Z internetu zadarmo'],
    ['Co je v mobilu propojené s účtem?'],
    'V mobilu může být uložená platební karta. Když táta zaplatí mobilem, peníze mu ubydou z účtu stejně jako kartou – mobil si s terminálem povídá úplně stejně jako bezkontaktní karta.'),
  q('hra-kostym', 'Ve hře si můžeš koupit třpytivý kostým pro draka za 99 Kč. Jsou to skutečné peníze?', 'Ano, skutečné',
    ['Ne, jsou jen ve hře', 'Ne, platí to hra', 'Jen trochu'],
    ['Odkud by se těch 99 Kč vzalo?'],
    'Nákup ve hře se zaplatí skutečnými penězi z účtu – stejnými, za které by se daly koupit třeba dva kopečky zmrzliny. Proto se vždycky nejdřív zeptej rodiče.'),
  q('hra-zdarma', 'Hra je zdarma, ale prodává drahokamy za peníze. Jak na ní tvůrci vydělávají?', 'Prodávají věci ve hře',
    ['Nijak, dělají ji zadarmo', 'Platí jim za to škola', 'Drahokamy rostou samy'],
    ['Kdo platí za drahokamy?'],
    'Hry zdarma často vydělávají na nákupech ve hře a na reklamách. Proto tě lákají, abys něco {koupila|koupil} – třeba blikajícími nabídkami nebo odměnami na zkoušku.'),
  q('balicek', 'Hra ti nabízí koupit balíček s překvapením. Co uděláš?', 'Zeptám se rodiče',
    ['Hned kliknu na koupit', 'Zkusím to potají', 'Kliknu desetkrát'],
    ['Kdo platí za nákupy v mobilu?'],
    'Nákupy ve hrách stojí skutečné peníze, proto o nich rozhoduje rodič. U balíčku s překvapením navíc předem nevíš, co v něm bude – můžeš zaplatit a nedostat nic, co chceš.'),
  q('ktere-skutecne', 'Které peníze jsou skutečné: mince v peněžence, nebo peníze na účtu?', 'Obojí',
    ['Jen mince', 'Jen peníze na účtu', 'Ani jedny'],
    ['Dá se zaplatit mincemi i kartou?'],
    'Obojí jsou skutečné peníze. Jedny držíš v ruce, druhé jsou jen čísla v počítači banky – a přesto se jimi dá zaplatit kartou nebo mobilem.'),
  q('pipnuti', 'Máma přiloží kartu k terminálu a ten pípne. Co se stalo?', 'Zaplatila',
    ['Karta se nabila', 'Terminál ji pozdravil', 'Nic, byla to hra'],
    ['K čemu je terminál u pokladny?'],
    'Pípnutí obvykle znamená, že platba proběhla: peníze z mámina účtu putují obchodu. U plateb nad 500 Kč chce terminál ještě PIN.'),
  q('ztracena-karta', 'Tove ztratila kartu. Co má udělat?', 'Hned to říct rodičům',
    ['Nic, najde se', 'Počkat do příštího měsíce', 'Koupit si novou v obchodě'],
    ['Kdo pomůže kartu zablokovat?'],
    'Ztracenou kartu je potřeba rychle zablokovat, aby s ní nikdo nemohl platit. Rodiče to zvládnou v aplikaci banky nebo telefonem, klidně i v noci.'),
  q('ucet-co', 'Co je bankovní účet?', 'Místo v bance pro tvoje peníze',
    ['Účtenka z obchodu', 'Pokladna na trhu', 'Hra v mobilu'],
    ['Kde má banka zapsané, kolik peněz máš?'],
    'Účet je jako neviditelná peněženka v bance. Každý účet má své číslo, a tak banka přesně ví, komu které peníze patří.'),
  q('karta-stejne', 'Rohlík stojí 5 Kč. Kolik za něj zaplatíš kartou?', 'Taky 5 Kč',
    ['Nic, karta je zadarmo', '10 Kč', 'Jen polovinu'],
    ['Mění se cena podle toho, čím platíš?'],
    'Kartou zaplatíš stejnou cenu jako mincemi, peníze se jen nevezmou z peněženky, ale z účtu. Obchod si za placení kartou dokonce nesmí účtovat žádný příplatek.'),
  q('komu-patri', 'Máma platí kartou ke svému účtu. Komu patří peníze, kterými platí?', 'Mámě',
    ['Obchodu', 'Kartě', 'Nikomu'],
    ['Čí je účet, ke kterému karta patří?'],
    'Peníze na účtu patří mámě. Karta jí jen umožní zaplatit bez bankovek a mincí – sama karta žádné peníze nemá.'),
  q('kde-zustatek', 'Kde máma uvidí, kolik peněz jí na účtu zbylo?', 'V aplikaci banky nebo na výpisu',
    ['Na kartě', 'V peněžence', 'Na účtence z obchodu'],
    ['Kdo vede o účtu přesné záznamy?'],
    'Kolik je na účtu, ukáže aplikace banky nebo výpis. Na kartě ani na účtence to napsané není – karta je jen klíč k účtu.'),
  q('karta-klic', 'Platební karta je jako klíč. K čemu?', 'K penězům na účtu',
    ['K domu', 'K autu', 'K pokladně obchodu'],
    ['Odkud se berou peníze, když platíš kartou?'],
    'Karta odemyká cestu k penězům na účtu a PIN je jako tajný kód k tomu klíči. Proto se o kartu staráme a PIN nikomu neříkáme.'),
  q('karta-dojde', 'Dá se dětskou kartou platit pořád, i když na účtu nic není?', 'Ne, peníze dojdou',
    ['Ano, karta je nekonečná', 'Ano, banka to zaplatí', 'Ano, když karta svítí'],
    ['Odkud karta bere peníze?'],
    'Dětskou kartou se dá utratit jen to, co je na účtu. Když peníze dojdou, terminál platbu nepřijme.'),
];

// ---------------------------------------------------------------------------
// L3 – předplatné, podvodné zprávy, bezkontaktní placení, převody

const L3: Spec[] = [
  q('predplatne', 'Co je předplatné?', 'Platba, která se pravidelně opakuje',
    ['Jednorázový nákup', 'Dárek zdarma', 'Sleva na jeden den'],
    ['Jak často se platí časopis nebo aplikace na předplatné?'],
    'Předplatné se platí pravidelně, třeba každý měsíc, dokud ho někdo nezruší. I malá částka se tak časem nasčítá – 100 Kč měsíčně je za rok 1200 Kč.'),
  nm('predplatne-rok', 'Hra na předplatné stojí 50 Kč měsíčně. Kolik zaplatíš za celý rok?', 600,
    ['Kolik měsíců má rok?', 'Kolikrát zaplatíš 50 Kč?'],
    '12 × 50 = 600 Kč. Malá měsíční platba je za rok docela velká částka – za 600 Kč by se daly koupit třeba dvě nové knížky.',
    { unit: 'Kč' }),
  q('zkusebni', 'Aplikace je první týden zdarma a pak se začne platit sama. Na co je dobré myslet?', 'Včas zrušit předplatné, když ho nechceš',
    ['Na nic, je přece zdarma', 'Stáhnout ji ještě jednou', 'Poslat ji kamarádům'],
    ['Co se stane po prvním týdnu?'],
    'Zkušební verze se často sama změní na placené předplatné. Pozor: když aplikaci jen smažeš, předplatné tím nezrušíš – ruší se v nastavení účtu, třeba s rodičem.'),
  q('vyhrala-telefon', 'Na mobilu ti vyskočí: „{Vyhrála|Vyhrál} jsi telefon! Zadej číslo karty.“ Co uděláš?', 'Nic nezadám a ukážu to rodiči',
    ['Hned zadám číslo karty', 'Pošlu to kamarádům', 'Zadám jen půlku čísla'],
    ['Byla nějaká soutěž o telefon?'],
    'Je to podvod – kdo opravdu vyhraje, nemusí zadávat číslo karty. Podvodníci slibují velké výhry schválně, aby lidé v radosti nepřemýšleli.'),
  q('sms-odkaz', 'Přijde SMS: „Váš účet bude zablokován, klikněte na odkaz.“ Co uděláš?', 'Nekliknu a ukážu ji rodiči',
    ['Hned kliknu', 'Odpovím a pošlu PIN', 'Přepošlu ji všem'],
    ['Posílá banka odkazy, na které se má hned klikat?'],
    'Takové zprávy posílají podvodníci a strašením nutí lidi ke spěchu. Na odkaz neklikej – rodič to může v klidu ověřit v aplikaci banky.'),
  q('bezkontaktne', 'Jak blízko musí být karta u terminálu, aby se zaplatilo bezkontaktně?', 'Jen pár centimetrů',
    ['Přes celý obchod', 'Z druhé strany ulice', 'Z vedlejšího města'],
    ['Proč se karta k terminálu přikládá?'],
    'Karta si s terminálem povídá rádiovými vlnami, ale jen na vzdálenost pár centimetrů. Proto se musí přiložit a nikdo s ní nezaplatí z druhého konce obchodu.'),
  q('hra-kdo-plati', 'Kdo zaplatí, když dítě ve hře koupí balíček drahokamů?', 'Rodina ze svého účtu',
    ['Hra to zaplatí sama', 'Nikdo, je to jen hra', 'Škola'],
    ['Odkud jdou peníze za nákup v mobilu?'],
    'Nákup ve hře se strhne z účtu, ke kterému je mobil připojený. Platí ho tedy rodina – i když se kupují jen drahokamy pro postavičku.'),
  q('nakupy-v-aplikaci', 'Jak poznáš, že hra zdarma prodává věci za peníze?', 'Obchod s hrami to u ní uvádí',
    ['Podle barvy ikony', 'Nijak, hry zdarma nic neprodávají', 'Podle jména hry'],
    ['Kde si hru stahuješ?'],
    'V obchodech s aplikacemi bývá u hry napsané, že nabízí nákupy v aplikaci. Rodič pak může nákupy vypnout nebo nastavit, že je musí schválit.'),
  q('vypis', 'Co je výpis z účtu?', 'Přehled plateb na účtu',
    ['Seznam hraček', 'Dopis od kamarádky', 'Rozvrh hodin'],
    ['Kde najdeš, kam peníze z účtu odešly?'],
    'Výpis ukazuje každou platbu: kolik peněz přišlo, kolik odešlo a kam. Díky němu je vidět, že placení kartou je opravdové.'),
  q('karta-snaz', 'Proč se kartou často utrácí snáz než mincemi?', 'Peníze nevidíš ubývat',
    ['Karta je zadarmo', 'Kartou se platí méně', 'Mince se nesmí utrácet'],
    ['Co vidíš, když platíš mincemi?'],
    'Mince a bankovky vidíš ubývat, u karty jen pípne terminál. V jednom pokusu proto lidé nabízeli za lístky na basketbal skoro dvakrát víc, když mohli platit kartou.'),
  q('zamek-mobil', 'Proč má mít mobil, kterým se platí, zámek obrazovky?', 'Aby s ním nikdo cizí neplatil',
    ['Aby rychleji svítil', 'Aby hrál hezčí hudbu', 'Aby se nevybil'],
    ['Co by se stalo, kdyby mobil někdo našel?'],
    'Zámek obrazovky chrání mobil i peníze. Kdo ho najde, nemůže bez odemčení nic zaplatit – platba se potvrzuje kódem, otiskem prstu nebo obličejem.'),
  q('prevod', 'Babička poslala Knutovi 200 Kč na účet. Musela mu přinést bankovky?', 'Ne, poslala je převodem',
    ['Ano, jinak to nejde', 'Ano, přinesl je pošťák', 'Ne, vytiskla je'],
    ['Dají se peníze poslat z účtu na účet?'],
    'Peníze se dají poslat z účtu na účet převodem. Bankovky se nikam nenosí – banka jen odečte částku na babiččině účtu a přičte ji na Knutově.'),
  q('reklamy-ve-hre', 'Proč hry zdarma ukazují reklamy?', 'Firmy platí hře za reklamu',
    ['Aby byla hra pomalejší', 'Protože musí', 'Aby ses {nudila|nudil}'],
    ['Kdo za reklamu platí?'],
    'Firmy platí tvůrcům hry za to, že ukážou jejich reklamu. Čím víc lidí hru hraje, tím víc reklam se ukáže – a tím víc hra vydělá.'),
  q('schvalit-nakup', 'Máma nastavila, že každý nákup ve hře musí schválit. Proč?', 'Aby se omylem neutratily peníze',
    ['Aby byla hra těžší', 'Aby byla hra rychlejší', 'Aby se hra smazala'],
    ['Co se může stát, když se omylem klikne na koupit?'],
    'Schvalování nákupů je pojistka. Omylem kliknout se může stát každému, a tak o nákupu rozhodne rodič.'),
  q('predplatne-konec', 'Předplatné hry stojí 100 Kč měsíčně. Kdy se přestane platit?', 'Až ho někdo zruší',
    ['Samo za měsíc', 'Až tě hra omrzí', 'Nikdy, ani po zrušení'],
    ['Co se stane, když na předplatné zapomeneš?'],
    'Předplatné se platí dál, dokud ho někdo nezruší – i když hru už nikdo nehraje. Proto je dobré si předplatná zapsat a občas je zkontrolovat.'),
  q('obedy-prevodem', 'Jak se dá zaplatit za obědy ve škole bez bankovek?', 'Převodem z účtu',
    ['Poslat bankovku e-mailem', 'Nakreslit peníze', 'Zaplatit pozdravem'],
    ['Jak se posílají peníze z účtu na účet?'],
    'Rodiče můžou poslat peníze z účtu na účet školní jídelny. Tomu se říká převod a peníze tak dorazí, aniž by někdo vzal do ruky jedinou minci.'),
  q('zkontrolovat-castku', 'Než přiložíš kartu nebo mobil, ukáže terminál částku. Proč ji zkontrolovat?', 'Aby se nezaplatilo víc, než se má',
    ['Aby byl mobil rychlejší', 'Protože se musí přečíst nahlas', 'Aby se částka zmenšila'],
    ['Co když je na terminálu jiné číslo, než čekáš?'],
    'U pokladny se může stát chyba, třeba překlep v částce. Když ji předem zkontroluješ, nezaplatíš víc – vracení peněz po zaplacení je mnohem složitější.'),
  q('qr-platba', 'Táta platí účet tak, že mobilem vyfotí QR kód. Co v QR kódu je?', 'Údaje k platbě',
    ['Obrázek pro zábavu', 'Hra', 'Peníze'],
    ['Co musí banka vědět, aby peníze poslala správně?'],
    'QR kód obsahuje číslo účtu, částku a další údaje k platbě, takže je táta nemusí opisovat. České banky tak umožňují platit od roku 2012.'),
  q('drahokamy-misto-korun', 'Hra prodává věci za drahokamy, a ne přímo za koruny. Proč asi?', 'Aby nebylo hned vidět, kolik to stojí',
    ['Koruny ve hře nefungují', 'Aby hra byla levnější', 'Drahokamy jsou zadarmo'],
    ['Víš hned, kolik korun stojí 500 drahokamů?'],
    'Když platíš drahokamy, těžko se pozná, kolik je to korun. Vyplatí se to s rodičem přepočítat na skutečné peníze.'),
];

// ---------------------------------------------------------------------------
// L4 – půjčky a dluhy, kreditní a debetní karta, výpis

const L4: Spec[] = [
  q('kamaradka-pujcka', 'Kamarádka si od tebe půjčila 20 Kč. Co by měla udělat?', 'Vrátit je, jak slíbila',
    ['Nechat si je', 'Vrátit jen polovinu', 'Zapomenout na to'],
    ['Čí ty peníze jsou?'],
    'Půjčené peníze se vracejí. Kdo vrací včas, tomu ostatní rádi půjčí i příště – u půjček je nejdůležitější důvěra.'),
  q('proc-banka-pujcuje', 'Proč banka půjčuje peníze?', 'Vydělá na úroku',
    ['Protože je hodná', 'Má peníze zadarmo', 'Protože musí'],
    ['Vrací se bance stejně peněz, jako půjčila?'],
    'Kdo si od banky půjčí, vrací víc, než dostal. Ten rozdíl je úrok a na něm banka vydělává – část z něj pak přidává lidem, kteří u ní spoří.'),
  q('dluh', 'Co je dluh?', 'Peníze, které musíš vrátit',
    ['Dárek', 'Kapesné', 'Výhra'],
    ['Co se stane s půjčenými penězi?'],
    'Dluh vznikne, když si půjčíš. Dokud peníze nevrátíš, dlužíš je – a u půjčky od banky k dluhu ještě přibývá úrok.'),
  q('na-co-pujcit', 'Na co si rodiny obvykle berou největší půjčku?', 'Na bydlení',
    ['Na sladkosti', 'Na hru do mobilu', 'Na zbytečné dárky'],
    ['Co je tak drahé, že na to skoro nikdo nenašetří hned?'],
    'Byt nebo dům stojí tolik, že si na něj lidé většinou půjčí a půjčku pak splácejí mnoho let. Na menší věci a přání se vyplatí spíš šetřit.'),
  q('kreditka', 'Čí peníze utrácíš kreditní kartou?', 'Peníze banky, které vrátíš',
    ['Svoje úspory', 'Peníze obchodu', 'Peníze, které se nevracejí'],
    ['Kreditní karta je vlastně půjčka.'],
    'Kreditní karta je půjčka od banky. Co utratíš, musíš vrátit – a když to nestihneš včas, platíš úrok.'),
  q('debetka', 'Čí peníze utrácíš obyčejnou platební kartou k účtu?', 'Svoje peníze z účtu',
    ['Peníze banky', 'Peníze obchodu', 'Peníze kamarádů'],
    ['Odkud peníze ubydou?'],
    'Obyčejná (debetní) karta bere peníze přímo z tvého účtu. Utrácíš tedy svoje peníze, ne půjčku od banky – a když na účtu nic není, nezaplatíš.'),
  q('na-splatky', 'Mobil se dá koupit „na splátky“. Co to znamená?', 'Platíš postupně a často víc',
    ['Mobil je zadarmo', 'Zaplatíš méně', 'Platí ho obchod'],
    ['Kolikrát se splátka platí?'],
    'Na splátky platíš po kouscích každý měsíc. Často ale dohromady zaplatíš víc, než kdybys {platila|platil} najednou – ten rozdíl je cena za to, že věc máš hned.'),
  q('kontrola-vypisu', 'Proč je dobré kontrolovat výpis z účtu?', 'Abys {viděla|viděl}, kam peníze šly',
    ['Aby banka dala slevu', 'Aby se peníze zdvojnásobily', 'Není to k ničemu'],
    ['Co všechno je na výpisu vidět?'],
    'Na výpisu uvidíš každou platbu. Poznáš, za co utrácíš nejvíc, a všimneš si i platby, kterou nikdo nečekal.'),
  q('neznama-platba', 'Na výpisu je platba za hru, kterou nikdo z rodiny nekupoval. Co je dobré udělat?', 'Ozvat se bance',
    ['Nic, to se stává', 'Koupit hru znovu', 'Smazat výpis'],
    ['Kdo může pomoct zjistit, co se stalo?'],
    'Neznámou platbu je dobré hned nahlásit bance. Čím dřív se to stane, tím spíš jde peníze získat zpátky – a banka kartu případně zablokuje.'),
  q('vracet-vcas', 'Proč je důležité vracet dluhy včas?', 'Jinak to stojí víc a ztratíš důvěru',
    ['Protože dluhy zmizí samy', 'Na tom nezáleží', 'Aby se dluh zvětšil'],
    ['Co se stane, když splátku nezaplatíš?'],
    'Za opožděné splátky se platí poplatky a úroky navíc. A kdo vrací včas, tomu lidé i banky věří – banky si to dokonce zapisují do registrů.'),
  q('kdy-vrati-pujcku', 'Spolužák si chce půjčit 100 Kč a vrátit je „někdy“. Co je rozumné?', 'Domluvit se, kdy přesně je vrátí',
    ['Půjčit a nic neříkat', 'Půjčit všechno, co mám', 'Vzít si za to jeho svačinu'],
    ['Co když si každý představí „někdy“ jinak?'],
    'U půjčky je dobré se předem domluvit, kolik a kdy se vrátí. Předejdete tak nedorozumění – „někdy“ může pro každého znamenat něco jiného.'),
  q('aplikace-banky', 'Co uvidíš v aplikaci banky?', 'Kolik je na účtu a kam šly platby',
    ['Kolik je hodin v Číně', 'Kdo stojí u pokladny', 'Kolik bonbonů je v obchodě'],
    ['K čemu slouží bankovní aplikace?'],
    'Aplikace banky ukazuje, kolik je na účtu, a každou platbu. Dá se v ní i poslat převod nebo zablokovat kartu, když se ztratí.'),
];

// ---------------------------------------------------------------------------
// L5 – úroky, hypotéka, rychlé půjčky, podvodné stránky

const L5: Spec[] = [
  q('vraci-vic', 'Kdo si půjčí od banky 1000 Kč, vrací víc. Proč?', 'Platí úrok za půjčení',
    ['Protože se spletl', 'Protože peníze zdražily', 'Kvůli razítku'],
    ['Co banka za půjčení chce?'],
    'Úrok je cena za půjčení peněz. Kdo si půjčí 1000 Kč a platí úrok 10 Kč z každé stovky, vrátí za rok 1100 Kč.'),
  q('rychla-pujcka', 'Reklama slibuje: „Půjčka hned, bez otázek!“ Proč si dát pozor?', 'Bývá hodně drahá',
    ['Protože je zadarmo', 'Protože se nemusí vracet', 'Protože je pomalá'],
    ['Co se stane, když se půjčka nedá splácet?'],
    'Rychlé půjčky mívají vysoké úroky a poplatky. Dospělí proto před podpisem porovnávají, kolik celkem vrátí, a ne jen kolik dostanou hned.'),
  q('dluh-na-dluh', 'Kdo nemá na splátku, vezme si na ni další drahou půjčku. Co se často stane?', 'Dluh ještě naroste',
    ['Dluhy tím zmizí', 'Banka dluh odpustí', 'Všechno se samo vyřeší'],
    ['Kolik budeš dlužit, když na každou půjčku platíš úrok?'],
    'Nová drahá půjčka má svůj úrok a poplatky, takže když se jí splácí stará, dluh se nezmenší, ale často roste. Dospělí proto v takové chvíli hledají radu, třeba v dluhové poradně.'),
  q('hypoteka', 'Jak se jmenuje půjčka na byt nebo dům, kterou lidé splácejí mnoho let?', 'Hypotéka',
    ['Kapesné', 'Předplatné', 'Záloha'],
    ['Tohle slovo rodiče používají, když mluví o splácení bytu nebo domu.'],
    'Hypotéka je velká půjčka na bydlení a splácí se třeba 20 nebo 30 let. Za tu dobu zaplatí rodina bance na úrocích klidně i statisíce korun.'),
  q('podvodna-stranka', 'Stránka vypadá jako tvoje banka, ale má divnou adresu a chce PIN. Co to je?', 'Podvodná stránka',
    ['Nová banka', 'Hra', 'Sleva'],
    ['Ptá se banka někdy na PIN?'],
    'Podvodníci dělají stránky, které vypadají jako banka, ale mají jinou adresu. Pravá banka po tobě PIN na internetu nikdy nechce – nic nevyplňuj a řekni to dospělému.'),
  q('uspory-nebo-pujcka', 'Leif chce herní konzoli. Může si na ni našetřit, nebo si hned půjčit a vrátit to i s úrokem. Co ho vyjde levněji?', 'Našetřit si na ni',
    ['Půjčit si na ni', 'Vyjde to stejně', 'Půjčit si na delší dobu'],
    ['Kdo platí úrok – ten, kdo šetří, nebo ten, kdo si půjčí?'],
    'Kdo si půjčí, vrací půjčené peníze i s úrokem, a tak zaplatí víc. Kdo šetří, zaplatí jen cenu konzole – a na spořicím účtu může úrok ještě dostat. Půjčka má jen tu výhodu, že věc máš hned.'),
  q('smlouva', 'Proč je dobré přečíst si smlouvu o půjčce, než ji dospělí podepíšou?', 'Aby věděli, kolik zaplatí',
    ['Aby byla delší', 'Aby banka byla veselá', 'Nemá to smysl'],
    ['Co všechno je ve smlouvě napsané?'],
    'Ve smlouvě je napsaný úrok, poplatky a kolik se celkem vrátí. Důležité věci bývají i drobným písmem, a proto se vyplatí přečíst celou.'),
  q('kontrola-splatek', 'Rodina splácí půjčku. Co jí pomůže, aby nezapomněla na splátku?', 'Trvalý příkaz v bance',
    ['Schovat výpisy', 'Doufat, že si banka nevšimne', 'Platit, až bude chuť'],
    ['Jak se dá zařídit, aby platba odešla sama?'],
    'Trvalý příkaz pošle stejnou částku každý měsíc sám. Na splátku se tak nezapomene – jen je potřeba hlídat, aby na účtu bylo dost peněz.'),
];

// ---------------------------------------------------------------------------
// Generátory: úrok z půjčky, splátky, výpis z účtu

const LOANS = [
  { key: 'pracka', text: 'na novou pračku', min: 60, max: 150 },
  { key: 'kolo', text: 'na kolo', min: 50, max: 120 },
  { key: 'lednice', text: 'na ledničku', min: 80, max: 200 },
  { key: 'auto', text: 'na opravu auta', min: 100, max: 400 },
];

const BORROWERS = [
  { key: 'rodina', who: 'Rodina', took: 'si půjčila' },
  { key: 'teta', who: 'Teta', took: 'si půjčila' },
  { key: 'stryc', who: 'Strýc', took: 'si půjčil' },
  { key: 'soused', who: 'Soused', took: 'si půjčil' },
];

function pujcka(level: 4 | 5) {
  return (rng: Rng): Spec | null => {
    const loan = rng.pick(LOANS);
    const amount = rng.int(loan.min, loan.max) * 100;
    const { key: whoKey, who, took } = rng.pick(BORROWERS);
    if (level === 4) {
      const interest = rng.int(2, 20) * 50;
      return nm(
        `pujcka-${loan.key}-${whoKey}-${amount}-${interest}`,
        `${who} ${took} ${loan.text} ${kc(amount)}. Za půjčení chce banka úrok ${kc(interest)}. Kolik korun bance vrátí?`,
        amount + interest,
        ['Vrací se půjčená částka i úrok.', 'Sečti obě částky.'],
        `Vrátí půjčených ${kc(amount)} a k tomu úrok ${kc(interest)}: ${f(amount)} + ${f(interest)} = ${kc(amount + interest)}. Úrok je cena za půjčení peněz.`,
        { unit: 'Kč', difficulty: -0.1 },
      );
    }
    const r = rng.pick([5, 6, 8, 10, 12, 15]);
    const interest = (amount / 100) * r;
    return nm(
      `pujckar-${loan.key}-${whoKey}-${amount}-${r}`,
      `${who} ${took} ${loan.text} ${kc(amount)}. Banka chce za rok úrok ${kc(r)} z každých 100 Kč. Kolik korun vrátí po roce?`,
      amount + interest,
      [`Kolik stovek ${took}?`, `Za každou stovku se platí ${kc(r)} navíc.`],
      `${kc(amount)} je ${amount / 100}krát 100 Kč. Úrok: ${amount / 100} × ${r} = ${kc(interest)}. Vrátí ${f(amount)} + ${f(interest)} = ${kc(amount + interest)}. Čím víc si kdo půjčí, tím víc zaplatí na úroku.`,
      { unit: 'Kč', difficulty: 0.2 },
    );
  };
}

const SPLATKY: Forms = ['splátku', 'splátky', 'splátek'];

/** `it` = zájmeno ve 4. pádě („Na splátky ho / ji můžeš mít…“). */
const DEVICES = [
  { key: 'mobil', nom: 'Mobil', it: 'ho', min: 30, max: 120 },
  { key: 'tablet', nom: 'Tablet', it: 'ho', min: 40, max: 150 },
  { key: 'konzole', nom: 'Herní konzole', it: 'ji', min: 80, max: 150 },
  { key: 'televize', nom: 'Televize', it: 'ji', min: 60, max: 200 },
];

function splatky(rng: Rng): Spec | null {
  const d = rng.pick(DEVICES);
  const price = rng.int(d.min, d.max) * 100;
  const n = rng.pick([6, 10, 12, 20, 24]);
  const markup = rng.int(1, 15) * 100;
  const each = (price + markup) / n;
  if (!Number.isInteger(each)) return null;
  const total = n * each;
  const askMore = rng.chance(0.6);
  return nm(
    `splatky-${d.key}-${price}-${n}-${each}-${askMore ? 'vic' : 'celkem'}`,
    `${d.nom} stojí ${kc(price)}. Na splátky ${d.it} můžeš mít za ${count(n, SPLATKY)} po ${kc(each)}. ${askMore ? 'O kolik korun zaplatíš víc než najednou?' : 'Kolik zaplatíš na splátkách celkem?'}`,
    askMore ? total - price : total,
    ['Kolik zaplatíš za všechny splátky dohromady?', ...(askMore ? ['Porovnej to s cenou při placení najednou.'] : [])],
    `${n} × ${f(each)} = ${kc(total)}. To je o ${f(total)} − ${f(price)} = ${kc(total - price)} víc než najednou – to je cena za to, že věc máš hned.`,
    { unit: 'Kč', difficulty: askMore ? 0.3 : 0.1 },
  );
}

const MOVES_IN = [
  { key: 'kapesne', label: 'Kapesné', min: 10, max: 50 },
  { key: 'babicka', label: 'Od babičky', min: 10, max: 30 },
];
const MOVES_OUT = [
  { key: 'kino', label: 'Kino', min: 10, max: 20 },
  { key: 'knizka', label: 'Knížka', min: 15, max: 35 },
  { key: 'bazen', label: 'Bazén', min: 8, max: 12 },
  { key: 'hra', label: 'Hra do mobilu', min: 5, max: 20 },
  { key: 'zmrzlina', label: 'Zmrzlina', min: 3, max: 8 },
];

/** Výpis z účtu: kolik tam je na konci měsíce? */
function vypis(rng: Rng): Spec | null {
  const p = rng.pick(PEOPLE);
  const start = rng.int(5, 40) * 10;
  const ins = [rng.pick(MOVES_IN)];
  const outs = [...rng.shuffle(MOVES_OUT).slice(0, rng.int(2, 3))];
  const moves = [...ins, ...outs].map((m, i) => ({ ...m, amount: rng.int(m.min, m.max) * 10 * (i < ins.length ? 1 : -1) }));
  const end = start + sum(moves.map((m) => m.amount));
  if (end < 0) return null;
  const sign = (n: number) => (n > 0 ? `+${kc(n)}` : `−${kc(-n)}`);
  const cells = ['Platba', 'Částka', ...moves.flatMap((m) => [m.label, sign(m.amount)])];
  const lead = `Na účtu ${v(p, 'měl', 'měla')} ${p.name} na začátku měsíce ${kc(start)}. Tady je výpis z účtu.`;
  const ask = 'Kolik korun je na účtu na konci měsíce?';
  return nm(
    `vypis-${pkey(p)}-${start}-${moves.map((m) => `${m.key}${m.amount}`).join('-')}`,
    `${lead} ${ask}`,
    end,
    ['Plus znamená, že peníze přišly, mínus, že odešly.', 'Začni od stavu na začátku měsíce a postupně přičítej a odečítej.'],
    `${f(start)} ${moves.map((m) => (m.amount > 0 ? `+ ${f(m.amount)}` : `− ${f(-m.amount)}`)).join(' ')} = ${kc(end)}. Na výpisu je vidět každá platba, a tak se dá vždycky dohledat, kam peníze šly.`,
    {
      unit: 'Kč',
      visual: { type: 'table', cols: 2, cells },
      speak: `${lead} Přišlo: ${moves.filter((m) => m.amount > 0).map((m) => `${m.label.toLowerCase()} ${korun(m.amount)}`).join(', ')}. Odešlo: ${moves.filter((m) => m.amount < 0).map((m) => `${m.label.toLowerCase()} ${korun(-m.amount)}`).join(', ')}. ${ask}`,
      difficulty: 0.1,
    },
  );
}

// ---------------------------------------------------------------------------

export const digitalni = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Peníze na kartě a v mobilu',
  description: 'Peníze na kartě, v mobilu a ve hrách jsou skutečné: PIN, podvodné zprávy, předplatné, výpis z účtu a od 4. úrovně půjčky, úrok a splátky.',
  rvp: { 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03'], 5: ['ČJS-5-2-03'] },
  ability: 'znalosti',
  showFact: true,
  banks: { 2: L2, 3: L3, 4: L4, 5: L5 },
  genShare: 0.35,
  gen: {
    4: mix(ID, [[1, pujcka(4)], [1, vypis]]),
    5: mix(ID, [[1, pujcka(5)], [1.5, splatky]]),
  },
});
