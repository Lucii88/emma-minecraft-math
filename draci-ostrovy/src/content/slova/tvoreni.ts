// Tvořivé psaní: otevřené úlohy bez správné odpovědi. Každé zadání má rozsah
// úrovní; úroveň přidá požadavek na délku nebo formu (přímá řeč, pohled jiné
// postavy…). Úlohy na nápady (countIdeas) procvičují divergentní myšlení.

import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, type Entry, type Pools } from './common';

const ID = 'slova.tvoreni';

type Kind = 'pribeh' | 'jmeno' | 'napady' | 'kdyby' | 'popis' | 'basen' | 'dopis' | 'hadanka' | 'navod';

interface Prompt {
  key: string;
  kind: Kind;
  from: Level;
  to: Level;
  text: string;
  /** Jeden až tři nápady na rozjezd. */
  hints: string[];
  /** Vlastní požadavek podle úrovně (místo společného podle druhu úlohy). */
  frame?: Partial<Record<Level, string>>;
}

const pr = (
  key: string,
  kind: Kind,
  from: Level,
  to: Level,
  text: string,
  hints: string[],
  frame?: Partial<Record<Level, string>>,
): Prompt => ({ key, kind, from, to, text, hints, frame });

export const PROMPTS: Prompt[] = [
  // --- příběhy -------------------------------------------------------------
  pr('drak-rano', 'pribeh', 1, 6, 'Dokonči příběh: Můj drak jednoho rána zjistil, že…', [
    'Třeba zjistil, že mu přes noc narostlo třetí křídlo.', 'Nebo že umí mluvit s rybami.',
  ]),
  pr('truhla', 'pribeh', 1, 6, 'Dokonči příběh: Když Ingrid otevřela starou truhlu na půdě, uvnitř našla…', [
    'Třeba mapu s červeným křížkem.', 'Nebo malé dračí vajíčko, které se začalo kolébat.',
  ]),
  pr('plaminek-dort', 'pribeh', 1, 5, 'Dokonči příběh: Dráček Plamínek chtěl upéct dort, ale místo ohně mu z tlamy vyletěly…', [
    'Třeba mýdlové bubliny.', 'Nebo barevné motýly.',
  ]),
  pr('bez-ohne', 'pribeh', 2, 6, 'Vymysli příběh o dráčkovi, který neumí chrlit oheň, ale umí něco jiného.', [
    'Co kdyby uměl foukat sníh?', 'Jak jeho zvláštní schopnost jednou pomohla celé vesnici?',
  ]),
  pr('zelena-svetla', 'pribeh', 2, 6, 'Napiš příběh, který začíná větou: Tu noc se nad ostrovem rozzářila zelená světla.', [
    'Kdo se na světla šel podívat jako první?', 'Co když to byla polární záře a draci pod ní tančili?',
  ]),
  pr('frida-zahada', 'pribeh', 3, 6, 'Napiš příběh, ve kterém Frída vyřeší záhadu jen tím, že pozorně přemýšlí.', [
    'Co se ve vesnici ztratilo?', 'Jaké drobnosti si Frída všimla, které ostatní přehlédli?',
  ]),
  pr('tepla-vejce', 'pribeh', 1, 4, 'Dokonči příběh: Knut našel v lese vejce, které bylo teplé a…', [
    'Třeba tiše pípalo.', 'Nebo se na něm objevila malá prasklina.',
  ]),
  pr('draci-skola', 'pribeh', 2, 6, 'Napiš, jak by vypadal jeden den v dračí škole.', [
    'Jaké předměty se tam učí? Třeba přistávání nebo foukání kouřových kroužků.', 'Kdo je tam učitel?',
  ]),
  pr('ponozka', 'pribeh', 3, 6, 'Vymysli příběh, ve kterém hlavní roli hraje ztracená ponožka.', [
    'Kam se ponožka vydala?', 'Koho cestou potkala?',
  ]),
  pr('pohled-draka', 'pribeh', 4, 6, 'Napiš příběh z pohledu draka, který poprvé v životě vidí člověka.', [
    'Co se drakovi na člověku zdá zvláštní? Třeba že nemá ocas.', 'Jak si drak vysvětlí, k čemu jsou boty?',
  ]),
  pr('kouzelny-trh', 'pribeh', 1, 6, 'Dokonči příběh: Na trhu prodával starý obchodník kouzelné…', [
    'Třeba kouzelné tužky, které kreslí samy.', 'Nebo boty, ve kterých se chodí po vodě.',
  ]),
  pr('vymena', 'pribeh', 2, 6, 'Vymysli, co se stalo, když se draci na jeden den vyměnili s lidmi.', [
    'Jak by drak zvládl školu?', 'Co by dělal člověk, kdyby měl najednou křídla?',
  ]),
  pr('boty-olaf', 'pribeh', 1, 4, 'Dokonči příběh: Olaf si ráno obul boty a zjistil, že…', [
    'Třeba že v nich spí malý dráček.', 'Nebo že ho boty samy vedou na výlet.',
  ]),
  pr('ostrov-slov', 'pribeh', 1, 4, 'Dokonči příběh: Na Ostrově slov se dnes stalo něco zvláštního…', [
    'Třeba se písmena rozutekla z knížek.', 'Nebo začala slova mluvit sama.',
  ]),
  pr('hracky-ozily', 'kdyby', 1, 5, 'Co by se stalo, kdyby tvoje hračky v noci ožily?', [
    'Která hračka by se probudila první?', 'Co by spolu v noci podnikly?',
  ]),
  pr('ryby-povidaji', 'pribeh', 1, 4, 'Vymysli, o čem si povídají ryby v moři.', [
    'Třeba o tom, kdo má nejlesklejší šupiny.', 'Nebo o vikingské lodi, která nad nimi proplula.',
  ]),
  pr('ponozky-supliku', 'pribeh', 3, 6, 'Vymysli, co si povídají dvě ponožky v šuplíku.', [
    'Jedna je čistá a druhá byla včera na výletě.', 'Která z nich zažila větší dobrodružství?',
  ]),
  pr('slunce-mesic', 'pribeh', 4, 6, 'Napiš rozhovor mezi Sluncem a Měsícem.', [
    'Na co by se Měsíc chtěl Slunce zeptat?', 'Co vidí Slunce ve dne a co Měsíc v noci?',
  ], { 4: 'Napiš aspoň šest vět rozhovoru.', 5: 'Napiš aspoň osm vět rozhovoru a použij uvozovky.', 6: 'Napiš delší rozhovor, ve kterém se oba dozvědí něco nového.' }),
  pr('prekvapivy-konec', 'pribeh', 4, 6, 'Napiš příběh jen v pěti větách, ale tak, aby měl překvapivý konec.', [
    'Nejdřív si vymysli konec a pak k němu napiš začátek.', 'Překvapení může být třeba v tom, kdo je kdo.',
  ], { 4: '', 5: '', 6: '' }),
  pr('abeceda', 'pribeh', 5, 6, 'Napiš příběh, ve kterém každá věta začíná dalším písmenem abecedy: A, B, C…', [
    'První věta třeba: Až zapadne slunce…', 'Druhá: Bjorn vyleze na kopec…',
  ], { 5: 'Zkus dojít aspoň k písmenu H.', 6: 'Zkus dojít co nejdál, třeba až k písmenu M.' }),
  pr('velika-repa', 'pribeh', 5, 6, 'Přepiš pohádku O veliké řepě tak, aby při tahání řepy pomáhali draci.', [
    'Který drak přiletí první a který poslední?', 'Co když je řepa nakonec tak veliká, že z ní bude dračí domeček?',
  ], { 5: 'Napiš aspoň šest vět a použij i přímou řeč.', 6: 'Napiš delší příběh a nech každého draka říct aspoň jednu větu.' }),
  // --- jména a vynálezy ----------------------------------------------------
  pr('jmeno-zpev', 'jmeno', 1, 6, 'Vymysli nové jméno pro draka, který umí zpívat.', [
    'Jméno může znít jako písnička.', 'Nebo může připomínat nějaký hudební nástroj.',
  ]),
  pr('jmeno-ostrov', 'jmeno', 1, 6, 'Vymysli jméno pro ostrov, kde žijí jen malí dráčci.', [
    'Jak ten ostrov vypadá?', 'Co tam malí dráčci celý den dělají?',
  ]),
  pr('novy-druh', 'popis', 2, 6, 'Vymysli nový dračí druh. Jak se jmenuje, jak vypadá a co umí?', [
    'Třeba drak, který svítí ve tmě jako světluška.', 'Kde takový drak žije a co jí?',
  ]),
  pr('letajici-lod', 'jmeno', 1, 5, 'Vymysli jméno pro vikingskou loď, která umí létat.', [
    'Jméno může říkat, jak loď vypadá.', 'Nebo kam nejraději létá.',
  ]),
  pr('draci-svatek', 'popis', 3, 6, 'Vymysli nový svátek pro draky. Jak se jmenuje a jak se slaví?', [
    'Co se ten den jí?', 'Jaké hry se hrají?',
  ]),
  pr('kocka-leta', 'jmeno', 1, 4, 'Vymysli jméno pro kočku, která umí létat.', [
    'Jméno může připomínat mráček nebo vítr.',
  ]),
  pr('jmeno-lodka', 'jmeno', 1, 3, 'Vymysli jméno pro malou loďku.', [
    'Jakou má loďka barvu?', 'Kam by se s ní dalo doplout?',
  ]),
  pr('draci-pisnicka', 'jmeno', 1, 3, 'Vymysli, jak by se mohla jmenovat dračí písnička.', [
    'O čem by písnička byla?', 'Kdo by ji zpíval?',
  ]),
  pr('hadanka-doma', 'hadanka', 4, 6, 'Vymysli hádanku o nějaké věci z domova. Nesmíš v ní použít název té věci.', [
    'Popiš, jak ta věc vypadá a k čemu slouží.', 'Zkus to říct obrazně, třeba „má zuby, a nekouše“.',
  ]),
  // --- nápady (countIdeas) -------------------------------------------------
  pr('supina', 'napady', 1, 6, 'Vymysli co nejvíc způsobů, jak využít dračí šupinu.', [
    'Třeba jako zrcátko.', 'Nebo jako lopatku na písek.', 'Co kdyby se z ní dala udělat střecha pro myšku?',
  ]),
  pr('lzice', 'napady', 1, 6, 'Co všechno se dá dělat s obyčejnou lžící? Vymysli co nejvíc nápadů.', [
    'Dá se s ní bubnovat.', 'Nebo v ní nosit malého brouka na procházku.',
  ]),
  pr('kulate', 'napady', 1, 6, 'Vymysli co nejvíc věcí, které jsou kulaté.', [
    'Rozhlédni se po kuchyni.', 'A co na obloze?',
  ]),
  pr('potok', 'napady', 1, 6, 'Jak by se dalo přejít potok, když tam není most? Vymysli co nejvíc způsobů.', [
    'Třeba po kamenech.', 'Nebo na zádech draka.',
  ]),
  pr('drak-prsi', 'napady', 2, 6, 'Co všechno může drak dělat, když prší? Vymysli co nejvíc nápadů.', [
    'Může dělat kouřem obrázky na mokrém okně.', 'Nebo si vyrobit deštník z velkého listu.',
  ]),
  pr('slova-d', 'napady', 1, 6, 'Vymysli co nejvíc slov, která začínají na písmeno D.', [
    'Třeba drak.', 'Rozhlédni se kolem sebe.',
  ]),
  pr('rozesmat', 'napady', 2, 6, 'Vymysli co nejvíc způsobů, jak někoho rozesmát.', [
    'Třeba vtipem.', 'Nebo legrační chůzí jako tučňák.',
  ]),
  pr('plachta', 'napady', 3, 6, 'Co by se dalo vyrobit ze staré plachty z lodi? Vymysli co nejvíc nápadů.', [
    'Třeba stan.', 'Nebo obří papírového draka.',
  ]),
  pr('otazky-drakovi', 'napady', 2, 6, 'Vymysli co nejvíc otázek, na které by ti mohl odpovědět drak.', [
    'Třeba jak vysoko umí vyletět.', 'Nebo co se mu zdá, když spí.',
  ]),
  pr('lehke-velke', 'napady', 4, 6, 'Vymysli co nejvíc věcí, které jsou velké, ale lehké.', [
    'Třeba nafukovací balón.', 'Co takhle papírový drak?',
  ]),
  pr('plavou', 'napady', 1, 6, 'Vymysli co nejvíc zvířat, která umějí plavat.', [
    'Vzpomeň si na rybník.', 'A na moře.',
  ]),
  pr('ryby-rybnik', 'napady', 3, 6, 'Jak by se dalo zjistit, kolik je v rybníce ryb? Vymysli co nejvíc způsobů.', [
    'Dalo by se to odhadnout?', 'Koho by se dalo zeptat?',
  ]),
  pr('cervene', 'napady', 1, 4, 'Vymysli co nejvíc věcí, které jsou červené.', [
    'Třeba jahoda.', 'Podívej se, co máš na sobě.',
  ]),
  pr('rym-drak', 'napady', 1, 4, 'Vymysli co nejvíc slov, která se rýmují se slovem drak.', [
    'Co je na obloze a někdy z něj prší?', 'Na čem se jezdí po kolejích?',
  ]),
  pr('snih', 'napady', 1, 5, 'Vymysli co nejvíc věcí, které se dají dělat ve sněhu.', [
    'Třeba andělíčka.', 'Nebo hledat stopy zvířat.',
  ]),
  // --- co by se stalo, kdyby… ---------------------------------------------
  pr('draci-cesky', 'kdyby', 2, 6, 'Co by se stalo, kdyby draci uměli mluvit česky?', [
    'Co by ti drak řekl jako první?', 'Na co by si draci stěžovali?',
  ]),
  pr('bez-a', 'kdyby', 3, 6, 'Co by se stalo, kdyby na jeden den zmizela všechna písmena A?', [
    'Jak by se četla slova jako tatínek, kapr nebo pampeliška?', 'Jak by se lidé domlouvali?',
  ]),
  pr('zmrzlina-dest', 'kdyby', 1, 6, 'Co by se stalo, kdyby místo deště padala zmrzlina?', [
    'Co by lidé nosili místo deštníku?', 'Jakou příchuť by měla bouřka?',
  ]),
  pr('lide-leti', 'kdyby', 3, 6, 'Co by se stalo, kdyby lidé uměli létat jako draci?', [
    'Jak by vypadala cesta do školy?', 'Byly by ještě potřeba schody?',
  ]),
  pr('vlastni-drak', 'kdyby', 1, 5, 'Kdyby ti patřil vlastní drak, co byste spolu dělali jako první?', [
    'Kam byste spolu letěli?', 'Co bys mu {ukázala|ukázal}?',
  ]),
  pr('byt-drakem', 'kdyby', 1, 3, 'Doplň větu: Kdyby ze mě {byla|byl} {dračice|drak}, …', [
    'Jakou bys {měla|měl} barvu?', 'Co bys {dělala|dělal} jako první?',
  ]),
  // --- popis a pocity ------------------------------------------------------
  pr('vysneny-drak', 'popis', 1, 6, 'Popiš svého vysněného draka: jakou má barvu, jak je velký a co má rád.', [
    'Jaké má oči a křídla?', 'Co mu nejvíc chutná?',
  ]),
  pr('trh', 'popis', 2, 6, 'Popiš vikingský trh: co tam vidíš, slyšíš a cítíš?', [
    'Jak voní čerstvý chléb a uzené ryby?', 'Co vykřikují prodavači?',
  ]),
  pr('nejmilejsi-den', 'popis', 3, 6, 'Popiš svůj nejoblíbenější den v roce tak, aby si ho ostatní dokázali představit.', [
    'Co se ten den děje od rána do večera?', 'Jak to voní a jak to zní?',
  ]),
  pr('z-okna', 'popis', 1, 4, 'Namaluj slovy obrázek: co vidíš, když se podíváš z okna?', [
    'Co je blízko a co daleko?', 'Jaké barvy tam vidíš?',
  ]),
  pr('bavi-me', 'popis', 1, 3, 'Doplň větu: Nejvíc mě baví…', [
    'Co děláš nejraději venku?', 'A co doma?',
  ]),
  pr('snidane', 'popis', 1, 3, 'Vymysli, co by mohl drak snídat.', [
    'Něco pálivého?', 'Nebo spíš sladké pečené kaštany?',
  ]),
  pr('darek-drakovi', 'popis', 1, 3, 'Vymysli dárek k narozeninám pro draka.', [
    'Co by se drakovi hodilo?', 'Co by ho rozesmálo?',
  ]),
  // --- básně a dopisy ------------------------------------------------------
  pr('basen-drak', 'basen', 3, 6, 'Napiš básničku o drakovi. Aspoň dva řádky se musí rýmovat.', [
    'Na drak se rýmuje mrak, vlak, rak.', 'Na let se rýmuje třeba svět, květ nebo pět.',
  ]),
  pr('basen-zima', 'basen', 3, 6, 'Napiš básničku o zimě, ve které použiješ slova sníh, saních a smích.', [
    'Sníh, saních a smích se rýmují – můžou být na koncích řádků.', 'Kdo v básničce jezdí na saních?',
  ]),
  pr('dopis-drakovi', 'dopis', 3, 6, 'Napiš dopis drakovi, který bydlí na vedlejším ostrově. Pozvi ho na návštěvu.', [
    'Začni oslovením, třeba Milý draku.', 'Napiš mu, co spolu budete dělat.',
  ]),
  pr('navod-dracek', 'navod', 4, 6, 'Napiš návod: Jak se starat o malého dráčka.', [
    'Co dráček jí a kdy spí?', 'Na co si dát pozor, když kýchá jiskry?',
  ]),
  pr('prani-jiskra', 'dopis', 2, 6, 'Napiš přání k narozeninám pro dračici Jiskru.', [
    'Co Jiskře přeješ?', 'Nezapomeň na podpis.',
  ]),
];

const STORY_FRAME: Record<Level, string> = {
  1: 'Stačí jedna nebo dvě věty.',
  2: 'Napiš aspoň dvě věty.',
  3: 'Napiš aspoň čtyři věty.',
  4: 'Napiš aspoň pět vět. Ať má příběh začátek, prostředek a konec.',
  5: 'Napiš aspoň šest vět a použij i přímou řeč – co postavy říkají.',
  6: 'Napiš delší příběh. Zkus překvapivý konec nebo vyprávění z pohledu jiné postavy.',
};

const IDEA_FRAME: Record<Level, string> = {
  1: 'Zkus jich vymyslet aspoň tři.',
  2: 'Zkus jich vymyslet aspoň pět.',
  3: 'Zkus jich vymyslet aspoň sedm.',
  4: 'Zkus jich vymyslet aspoň osm.',
  5: 'Zkus jich vymyslet aspoň deset.',
  6: 'Zkus jich vymyslet aspoň dvanáct. Aspoň jeden nápad ať je úplně nečekaný.',
};

const NAME_FRAME: Record<Level, string> = {
  1: 'Stačí jméno a jedna věta, proč.',
  2: 'Napiš jméno a aspoň jednu větu, proč právě tak.',
  3: 'Napiš jméno a aspoň dvě věty, proč právě tak.',
  4: 'Vymysli aspoň dvě jména a napiš, které se ti líbí víc a proč.',
  5: 'Vymysli aspoň tři jména, porovnej je a vyber to nejlepší. Napiš proč.',
  6: 'Vymysli aspoň tři jména a u každého napiš, co prozrazuje. Pak vyber to nejlepší.',
};

const DESC_FRAME: Record<Level, string> = {
  1: 'Stačí jedna nebo dvě věty.',
  2: 'Napiš aspoň dvě věty.',
  3: 'Napiš aspoň čtyři věty.',
  4: 'Napiš aspoň pět vět.',
  5: 'Napiš aspoň šest vět a použij co nejvíc slov, která říkají, jaké co je.',
  6: 'Napiš delší text a zapoj všechny smysly: zrak, sluch, čich, chuť i hmat.',
};

const WHATIF_FRAME: Record<Level, string> = {
  1: 'Stačí jedna nebo dvě věty.',
  2: 'Napiš aspoň dvě věty.',
  3: 'Napiš aspoň čtyři věty.',
  4: 'Napiš aspoň pět vět.',
  5: 'Napiš aspoň šest vět. Co by na tom bylo dobré a co by bylo těžší?',
  6: 'Napiš delší text. Domysli, co by se změnilo za den, za týden a za rok.',
};

const LETTER_FRAME: Record<Level, string> = {
  1: 'Stačí jedna nebo dvě věty.',
  2: 'Napiš aspoň dvě věty a nezapomeň na oslovení.',
  3: 'Napiš aspoň čtyři věty, oslovení i pozdrav.',
  4: 'Napiš aspoň pět vět, oslovení i pozdrav.',
  5: 'Napiš aspoň šest vět, oslovení i pozdrav. Na něco se adresáta zeptej.',
  6: 'Napiš delší dopis s oslovením, pozdravem a aspoň jednou otázkou.',
};

const POEM_FRAME: Record<Level, string> = {
  1: 'Stačí dva řádky.',
  2: 'Stačí dva řádky.',
  3: 'Stačí čtyři řádky.',
  4: 'Napiš aspoň čtyři řádky.',
  5: 'Napiš aspoň šest řádků.',
  6: 'Napiš aspoň dvě sloky.',
};

const RIDDLE_FRAME: Record<Level, string> = {
  1: 'Stačí dva řádky.',
  2: 'Stačí dva řádky.',
  3: 'Stačí dva až čtyři řádky.',
  4: 'Stačí dva až čtyři řádky.',
  5: 'Zkus hádanku napsat tak, aby se rýmovala.',
  6: 'Zkus hádanku napsat tak, aby se rýmovala a měla aspoň čtyři řádky.',
};

const GUIDE_FRAME: Record<Level, string> = {
  1: 'Stačí dvě rady.',
  2: 'Napiš aspoň tři rady.',
  3: 'Napiš aspoň čtyři rady.',
  4: 'Napiš aspoň pět rad ve správném pořadí.',
  5: 'Napiš aspoň šest rad a seřaď je od nejdůležitější.',
  6: 'Ať je návod podrobný a má aspoň osm rad.',
};

const FRAMES: Record<Kind, Record<Level, string>> = {
  pribeh: STORY_FRAME,
  jmeno: NAME_FRAME,
  napady: IDEA_FRAME,
  kdyby: WHATIF_FRAME,
  popis: DESC_FRAME,
  basen: POEM_FRAME,
  dopis: LETTER_FRAME,
  hadanka: RIDDLE_FRAME,
  navod: GUIDE_FRAME,
};

const NOTE: Record<Kind, string> = {
  pribeh: 'I spisovatelé začínají jednou větou a pak příběh vylepšují. Zkus si ho přečíst nahlas.',
  jmeno: 'Dobré jméno často vznikne z toho, co postava umí nebo jak vypadá.',
  napady: 'Každý nápad se počítá – i ten ztřeštěný. Nejlepší nápady často přijdou až po těch prvních.',
  kdyby: 'U otázky „Co by se stalo, kdyby…“ neexistuje špatná odpověď. Zkus domyslet, co by z toho vyplynulo dál.',
  popis: 'Když popisuješ, zapoj všechny smysly: co vidíš, slyšíš, cítíš a na co si můžeš sáhnout.',
  basen: 'Básničku můžeš klidně několikrát přepsat, než zní tak, jak chceš. Básníci to tak dělají taky.',
  dopis: 'Dopis má oslovení, hlavní část a pozdrav na konci. Adresát bude mít radost.',
  hadanka: 'Dobrá hádanka popisuje věc obrazně. Vyzkoušej ji na někom doma!',
  navod: 'Dobrý návod má kroky ve správném pořadí, aby se podle něj dalo opravdu postupovat.',
};

const MIN_LENGTH: Partial<Record<Level, number>> = { 2: 10, 3: 30, 4: 50, 5: 80, 6: 100 };

function entry(p: Prompt, level: Level): Entry {
  const ideas = p.kind === 'napady';
  const minLength = MIN_LENGTH[level];
  return {
    key: p.key,
    build: () => ({
      prompt: [p.text, p.frame ? p.frame[level] : FRAMES[p.kind][level]].filter(Boolean).join(' '),
      answer: ideas
        ? { kind: 'open', countIdeas: true }
        : minLength !== undefined
          ? { kind: 'open', minLength }
          : { kind: 'open' },
      hints: p.hints,
      explanation: NOTE[p.kind],
    }),
  };
}

const levels: Level[] = [1, 2, 3, 4, 5, 6];

export const pools: Pools = Object.fromEntries(
  levels.map((l) => [l, PROMPTS.filter((p) => p.from <= l && l <= p.to).map((p) => entry(p, l))]),
);
assertUniqueKeys(ID, pools);

export const tvoreni: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Tvořivé psaní',
  description: 'Vymýšlí a píše vlastní příběhy, jména, básničky a co nejvíc nápadů; úlohy nemají správnou odpověď a slouží k rozvoji fantazie a psaní.',
  levels,
  rvp: {
    1: ['ČJL-3-3-04'],
    2: ['ČJL-3-3-04'],
    3: ['ČJL-3-3-04'],
    4: ['ČJL-5-3-02'],
    5: ['ČJL-5-3-02'],
    6: ['ČJL-5-3-02'],
  },
  ability: 'tvorivost',
  open: true,
  generate: makeGenerator(ID, levels, pools),
};
