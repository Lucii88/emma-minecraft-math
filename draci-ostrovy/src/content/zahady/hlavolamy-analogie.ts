// Analogie: „Doplň podle vzoru: kotě – kočka, štěně – ?“ a obrázkové
// analogie v tabulce 2 × 2 (nahoře vzor, dole obrázek a otazník).
//
// U každé úlohy smí mezi možnostmi sedět právě jedna. Chybné možnosti jsou
// vybrané tak, aby jiný výklad vztahu nedával jinou správnou odpověď (např.
// u „vysoký – ?“ není mezi možnostmi „malý“, u „tužka – ?“ není „kreslit“).

import type { ChoiceSpec, Spec } from '../../core/bank';
import type { Level } from '../../core/types';
import { slug, type Pic } from './hlavolamy-spolecne';

/** Vztahy: jak je popíše vysvětlení („Kotě a kočka – mládě a dospělé zvíře.“). */
const REL = {
  mlade: 'mládě a dospělé zvíře',
  dospele: 'dospělé zvíře a jeho mládě',
  domov: 'zvíře a jeho domov',
  zvuk: 'zvíře a zvuk, který vydává',
  opak: 'slova opačného významu',
  cinnost: 'věc a to, co se s ní dělá',
  nastroj: 'člověk a věc, se kterou pracuje',
  pracoviste: 'člověk a místo, kde pracuje',
  cast: 'část a celek',
  material: 'věc a materiál, ze kterého bývá',
  produkt: 'zvíře a to, co nám dává',
  puvod: 'věc a zvíře, od kterého ji máme',
  skupina: 'věc a skupina, kam patří',
  barva: 'věc a její barva',
  poradi: 'jedno a to, co přijde hned po něm',
  roste: 'plod a rostlina, na které roste',
  ochrana: 'počasí a věc, která před ním chrání',
  obleceni: 'oblečení a část těla, na kterou patří',
  pohon: 'stroj a to, co mu dává sílu',
  palivo: 'to, co dává sílu, a stroj, který ji potřebuje',
  smysl: 'část těla a smysl',
  organ: 'část těla a to, co s ní děláme',
  pokryv: 'zvíře a to, co mu pokrývá tělo',
  pohyb: 'zvíře a část těla, kterou se pohybuje',
  skupinaZvirat: 'jedno zvíře a skupina takových zvířat',
  mnozstvi: 'drobný kousek a obrovský celek z takových kousků',
  mereni: 'přístroj a to, co měří nebo ukazuje',
  jednotka: 'menší jednotka a ta větší, do které se skládá',
  autor: 'tvůrce a to, co vytváří',
  vyvoj: 'dřívější a pozdější podoba téhož',
  teleso: 'rovinný útvar a těleso, které mu odpovídá',
  rohy: 'útvar a počet jeho rohů',
  nohy: 'živočich a počet jeho nohou',
  kola: 'vozidlo a počet jeho kol',
  misto: 'věc a místo, kde ji najdeš',
  prace: 'člověk a to, co dělá',
  potrava: 'zvíře a to, čím se živí',
  nasledek: 'příčina a to, co způsobí',
  vede: 'místo a ten, kdo ho vede',
  vyroba: 'surovina a to, co se z ní vyrobí',
  zCeho: 'výrobek a surovina, ze které se vyrábí',
  synonymum: 'slova podobného významu',
  obecenstvo: 'dílo a ten, kdo si ho užívá',
  pece: 'člověk a ten, o koho se stará',
  kloub: 'končetina a kloub uprostřed ní',
  vyraz: 'projev a pocit, který ukazuje',
} as const;

type Rel = keyof typeof REL;

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);

/** Slovní analogie „A – B, C – …?“ (správně D). */
function w(a: string, b: string, c: string, d: string, wrong: string[], rel: Rel, hint: string, difficulty?: number): ChoiceSpec {
  return {
    key: `${slug(a)}-${slug(b)}-${slug(c)}`,
    prompt: `Doplň podle vzoru: ${a} – ${b}, ${c} – …?`,
    // „Pes štěká. A kočka?“ zní přirozeněji než „Pes a štěká“.
    speak: rel === 'zvuk' ? `Doplň podle vzoru. ${cap(a)} ${b}. A ${c}?` : `Doplň podle vzoru. ${cap(a)} a ${b}. ${cap(c)} a co?`,
    correct: cap(d),
    wrong: wrong.map(cap),
    hints: ['Jak spolu souvisí první dvě slova?', hint],
    explain:
      rel === 'zvuk'
        ? `${cap(a)} ${b} a ${c} ${d} – každé zvíře vydává svůj zvuk.`
        : `${cap(a)} a ${b} – ${REL[rel]}. Stejně tak ${c} a ${d}.`,
    ...(difficulty !== undefined ? { difficulty } : {}),
  };
}

const P = (e: string, name: string): Pic => ({ e, name });

/** Obrázková analogie v tabulce 2 × 2: [A, B / C, ?]. */
function pic(a: Pic, b: Pic, c: Pic, d: Pic, wrong: Pic[], rel: Rel, hint: string, difficulty?: number): ChoiceSpec {
  const prompt = 'Nahoře jsou dva obrázky, které k sobě patří. Co stejně patří k obrázku dole?';
  return {
    key: `obr-${slug(a.name)}-${slug(c.name)}`,
    prompt,
    speak: `${prompt} Nahoře: ${a.name} a ${b.name}. Dole: ${c.name} a otazník.`,
    visual: { type: 'table', cols: 2, cells: [a.e, b.e, c.e, null], ask: 3 },
    correct: { label: d.e, speak: d.name },
    wrong: wrong.map((x) => ({ label: x.e, speak: x.name })),
    hints: ['Jak spolu souvisí obrázky nahoře?', hint],
    explain: `${cap(a.name)} a ${b.name} – ${REL[rel]}. Stejně tak ${c.name} a ${d.name}.`,
    ...(difficulty !== undefined ? { difficulty } : {}),
  };
}

// ---------------------------------------------------------------------------
// L1 – konec 1. třídy: mláďata, domovy, zvuky, protiklady, barvy

const L1: Spec[] = [
  w('kotě', 'kočka', 'štěně', 'pes', ['kráva', 'koza', 'slepice', 'kůň'], 'mlade', 'Čí mládě je štěně?', -0.3),
  w('tele', 'kráva', 'hříbě', 'kůň', ['kráva', 'ovce', 'prase', 'koza'], 'mlade', 'Čí mládě je hříbě?'),
  w('kuřátko', 'slepice', 'kachňátko', 'kachna', ['slepice', 'husa', 'sova', 'kohout'], 'mlade', 'Čí mládě je kachňátko?'),
  w('jehně', 'ovce', 'kůzle', 'koza', ['ovce', 'kráva', 'prase', 'kůň'], 'mlade', 'Čí mládě je kůzle?', 0.2),
  w('pes', 'štěně', 'kočka', 'kotě', ['štěně', 'tele', 'kuřátko', 'hříbě'], 'dospele', 'Jak se říká mláděti kočky?', -0.2),
  w('pes', 'bouda', 'včela', 'úl', ['bouda', 'nora', 'stáj', 'akvárium'], 'domov', 'Kde bydlí včela?'),
  w('pták', 'hnízdo', 'liška', 'nora', ['hnízdo', 'úl', 'bouda', 'stáj'], 'domov', 'Kde bydlí liška?'),
  w('kůň', 'stáj', 'pes', 'bouda', ['úl', 'nora', 'hnízdo', 'akvárium'], 'domov', 'Kde bydlí pes?'),
  w('pes', 'štěká', 'kočka', 'mňouká', ['štěká', 'bučí', 'kokrhá', 'bečí'], 'zvuk', 'Jak dělá kočka?', -0.3),
  w('kráva', 'bučí', 'kohout', 'kokrhá', ['bučí', 'mňouká', 'štěká', 'kváká'], 'zvuk', 'Jak dělá kohout?'),
  w('ovce', 'bečí', 'kachna', 'káchá', ['bečí', 'mňouká', 'bučí', 'štěká'], 'zvuk', 'Jak dělá kachna?'),
  w('velký', 'malý', 'vysoký', 'nízký', ['široký', 'těžký', 'starý', 'dlouhý'], 'opak', 'Jaký je opak slova vysoký?'),
  w('den', 'noc', 'léto', 'zima', ['sníh', 'teplo', 'slunce', 'prázdniny'], 'opak', 'Jaký je opak léta?'),
  w('horký', 'studený', 'suchý', 'mokrý', ['teplý', 'čistý', 'tvrdý', 'studený'], 'opak', 'Jaký je opak slova suchý?'),
  w('nahoře', 'dole', 'vpředu', 'vzadu', ['vedle', 'uprostřed', 'dole', 'venku'], 'opak', 'Jaký je opak slova vpředu?'),
  w('plný', 'prázdný', 'otevřený', 'zavřený', ['prázdný', 'velký', 'rozbitý', 'nový'], 'opak', 'Jaký je opak slova otevřený?'),
  w('nůžky', 'stříhat', 'tužka', 'psát', ['stříhat', 'lepit', 'jíst', 'mýt'], 'cinnost', 'K čemu slouží tužka?'),
  w('lžíce', 'jíst', 'hřeben', 'česat', ['jíst', 'mýt', 'pít', 'šít'], 'cinnost', 'K čemu slouží hřeben?'),
  w('sníh', 'bílý', 'tráva', 'zelená', ['bílá', 'modrá', 'červená', 'černá'], 'barva', 'Jakou barvu má tráva?', -0.2),
  w('citron', 'žlutý', 'pomeranč', 'oranžový', ['žlutý', 'modrý', 'fialový', 'černý'], 'barva', 'Jakou barvu má pomeranč?'),
  pic(P('🐤', 'kuřátko'), P('🐔', 'slepice'), P('🐛', 'housenka'), P('🦋', 'motýl'),
    [P('🐝', 'včela'), P('🐞', 'beruška'), P('🐌', 'šnek')], 'mlade', 'Co bude z housenky, až vyroste?'),
  pic(P('🐔', 'slepice'), P('🥚', 'vejce'), P('🐄', 'kráva'), P('🥛', 'mléko'),
    [P('🍯', 'med'), P('🧶', 'klubko vlny'), P('🥚', 'vejce')], 'produkt', 'Co nám dává kráva?'),
  pic(P('🍎', 'jablko'), P('🌳', 'strom'), P('🥥', 'kokos'), P('🌴', 'palma'),
    [P('🌵', 'kaktus'), P('🌻', 'slunečnice'), P('🌾', 'obilí')], 'roste', 'Na čem roste kokos?'),
  pic(P('🌧️', 'déšť'), P('☂️', 'deštník'), P('☀️', 'slunce'), P('🕶️', 'sluneční brýle'),
    [P('🧤', 'rukavice'), P('🧣', 'šála'), P('⛄', 'sněhulák')], 'ochrana', 'Co tě chrání před ostrým sluncem?'),
];

// ---------------------------------------------------------------------------
// L2 – 2. třída: části a celky, materiály, povolání, další mláďata

const L2: Spec[] = [
  w('hříbě', 'kůň', 'sele', 'prase', ['kůň', 'ovce', 'kráva', 'koza'], 'mlade', 'Čí mládě je sele?'),
  w('kůzle', 'koza', 'housátko', 'husa', ['koza', 'kachna', 'slepice', 'krocan'], 'mlade', 'Čí mládě je housátko?', 0.1),
  w('prst', 'ruka', 'stránka', 'kniha', ['písmeno', 'papír', 'obrázek', 'tužka'], 'cast', 'Čeho je stránka částí?'),
  w('zub', 'pusa', 'řasa', 'oko', ['nos', 'ucho', 'vlasy', 'pusa'], 'cast', 'Kde najdeš řasy?'),
  w('stůl', 'dřevo', 'okno', 'sklo', ['látka', 'vlna', 'papír', 'kámen'], 'material', 'Z čeho bývá okenní tabule?'),
  w('svetr', 'vlna', 'láhev', 'sklo', ['vlna', 'papír', 'kámen', 'dřevo'], 'material', 'Z čeho bývá láhev?', 0.1),
  w('lékař', 'nemocnice', 'učitel', 'škola', ['obchod', 'pošta', 'nemocnice', 'nádraží'], 'pracoviste', 'Kde pracuje učitel?', -0.2),
  w('kuchař', 'kuchyně', 'pilot', 'letadlo', ['vlak', 'kuchyně', 'škola', 'autobus'], 'pracoviste', 'Kde pracuje pilot?'),
  w('malíř', 'štětec', 'kadeřník', 'nůžky', ['kladivo', 'lopata', 'pila', 'hrábě'], 'nastroj', 'S čím pracuje kadeřník?'),
  w('zahradník', 'hrábě', 'rybář', 'prut', ['hrábě', 'štětec', 'lžíce', 'kladivo'], 'nastroj', 'S čím pracuje rybář?'),
  w('jablko', 'jabloň', 'hruška', 'hrušeň', ['jabloň', 'dub', 'lípa', 'bříza'], 'roste', 'Na jakém stromě roste hruška?'),
  w('klíč', 'odemykat', 'koště', 'zametat', ['odemykat', 'vařit', 'šít', 'psát'], 'cinnost', 'K čemu slouží koště?'),
  w('jehla', 'šít', 'pila', 'řezat', ['šít', 'kopat', 'psát', 'malovat'], 'cinnost', 'K čemu slouží pila?'),
  w('rychle', 'pomalu', 'nahlas', 'potichu', ['rychle', 'vesele', 'dlouho', 'hezky'], 'opak', 'Jaký je opak slova nahlas?'),
  w('vyhrát', 'prohrát', 'najít', 'ztratit', ['hledat', 'vzít', 'koupit', 'prohrát'], 'opak', 'Jaký je opak slova najít?'),
  w('čepice', 'hlava', 'šála', 'krk', ['ruka', 'noha', 'hlava', 'ucho'], 'obleceni', 'Kam si dáváš šálu?', -0.2),
  pic(P('🐑', 'ovce'), P('🧶', 'klubko vlny'), P('🐝', 'včela'), P('🍯', 'med'),
    [P('🌸', 'květ'), P('🥛', 'mléko'), P('🥚', 'vejce')], 'produkt', 'Co nám dává včela?'),
  pic(P('👟', 'bota'), P('🦶', 'chodidlo'), P('🧤', 'rukavice'), P('✋', 'ruka'),
    [P('👂', 'ucho'), P('👃', 'nos'), P('🦵', 'noha')], 'obleceni', 'Kam si dáváš rukavice?'),
  pic(P('🍯', 'med'), P('🐝', 'včela'), P('🥛', 'mléko'), P('🐄', 'kráva'),
    [P('🐔', 'slepice'), P('🐷', 'prase'), P('🐶', 'pes')], 'puvod', 'Od kterého zvířete máme mléko?'),
  pic(P('🐝', 'včela'), P('🌸', 'květ'), P('🐰', 'králík'), P('🥕', 'mrkev'),
    [P('🦴', 'kost'), P('🧀', 'sýr'), P('🍯', 'med')], 'potrava', 'Co rád chroupe králík?', 0.1),
];

// ---------------------------------------------------------------------------
// L3 – 3. třída: nadřazená slova, pořadí, těla zvířat, smysly

const L3: Spec[] = [
  w('jablko', 'ovoce', 'mrkev', 'zelenina', ['ovoce', 'pečivo', 'koření', 'maso'], 'skupina', 'Do jaké skupiny patří mrkev?', -0.2),
  w('pes', 'zvíře', 'růže', 'květina', ['zvíře', 'strom', 'zelenina', 'ovoce'], 'skupina', 'Do jaké skupiny patří růže?'),
  w('vrabec', 'pták', 'kapr', 'ryba', ['pták', 'savec', 'hmyz', 'plaz'], 'skupina', 'Do jaké skupiny zvířat patří kapr?'),
  w('kladivo', 'nářadí', 'talíř', 'nádobí', ['nářadí', 'nábytek', 'oblečení', 'hračka'], 'skupina', 'Do jaké skupiny věcí patří talíř?'),
  w('leden', 'únor', 'jaro', 'léto', ['zima', 'podzim', 'březen', 'duben'], 'poradi', 'Které roční období přijde po jaru?'),
  w('pondělí', 'úterý', 'první', 'druhý', ['poslední', 'třetí', 'úterý', 'jediný'], 'poradi', 'Co přijde hned po prvním?', -0.1),
  w('otevřít', 'zavřít', 'rozsvítit', 'zhasnout', ['zapnout', 'svítit', 'zavřít', 'otevřít'], 'opak', 'Jaký je opak slova rozsvítit?'),
  w('radost', 'smutek', 'smích', 'pláč', ['vtip', 'úsměv', 'zábava', 'hra'], 'opak', 'Jaký je opak smíchu?'),
  w('sešit', 'papír', 'hřebík', 'kov', ['dřevo', 'papír', 'sklo', 'látka'], 'material', 'Z čeho bývá hřebík?'),
  w('písmeno', 'slovo', 'slovo', 'věta', ['slabika', 'písmeno', 'čárka', 'hláska'], 'cast', 'Co se skládá ze slov?', 0.2),
  w('minuta', 'hodina', 'den', 'týden', ['noc', 'ráno', 'hodina', 'poledne'], 'cast', 'Čeho je den částí?', 0.2),
  w('kniha', 'knihovna', 'obraz', 'galerie', ['kino', 'knihovna', 'zoo', 'nádraží'], 'misto', 'Kde visí obrazy, aby se na ně lidé chodili dívat?', 0.2),
  w('oko', 'vidět', 'ucho', 'slyšet', ['vidět', 'čichat', 'chutnat', 'mluvit'], 'organ', 'Co děláme ušima?', -0.2),
  w('spisovatel', 'psát', 'malíř', 'malovat', ['psát', 'zpívat', 'stavět', 'vařit'], 'prace', 'Co dělá malíř?', -0.2),
  w('pilot', 'letadlo', 'kapitán', 'loď', ['vlak', 'auto', 'letiště', 'kolo'], 'pracoviste', 'Co řídí kapitán?'),
  w('voda', 'pít', 'chléb', 'jíst', ['pít', 'mýt', 'šít', 'plavat'], 'cinnost', 'Co děláme s chlebem?', -0.3),
  // Ne „ploutve“: pták létá s pomocí peří a ryba plave s pomocí ploutví – to by šlo obhájit.
  w('pták', 'peří', 'ryba', 'šupiny', ['srst', 'peří', 'krunýř', 'bodliny'], 'pokryv', 'Co pokrývá tělo ryby?'),
  w('ryba', 'ploutev', 'pták', 'křídlo', ['zobák', 'šupina', 'oko', 'ucho'], 'pohyb', 'Čím se pták pohybuje ve vzduchu?', 0.1),
  w('motorka', 'dvě', 'auto', 'čtyři', ['dvě', 'tři', 'šest', 'jedno'], 'kola', 'Kolik kol má auto?', -0.3),
  pic(P('🚗', 'auto'), P('⛽', 'benzín'), P('🔦', 'baterka'), P('🔋', 'baterie'),
    [P('💡', 'žárovka'), P('🔥', 'oheň'), P('💧', 'voda')], 'pohon', 'Co dává baterce sílu svítit?', 0.2),
  pic(P('🧤', 'rukavice'), P('✋', 'ruka'), P('🧦', 'ponožka'), P('🦶', 'chodidlo'),
    [P('👂', 'ucho'), P('👃', 'nos'), P('👀', 'oči')], 'obleceni', 'Kam si oblékáš ponožky?', -0.2),
  pic(P('🧶', 'klubko vlny'), P('🐑', 'ovce'), P('🥚', 'vejce'), P('🐔', 'slepice'),
    [P('🐄', 'kráva'), P('🐑', 'ovce'), P('🐝', 'včela')], 'puvod', 'Kdo snáší vejce?'),
];

// ---------------------------------------------------------------------------
// L4 – 4. třída: skupiny zvířat, smysly, měření, abstraktnější vztahy

const L4: Spec[] = [
  w('kapka', 'moře', 'zrnko písku', 'poušť', ['kámen', 'hora', 'sklo', 'moře'], 'mnozstvi', 'Kde najdeš písku tolik jako vody v moři?', 0.2),
  w('ovce', 'stádo', 'vlk', 'smečka', ['hejno', 'roj', 'stádo', 'hnízdo'], 'skupinaZvirat', 'Jak se říká skupině vlků?'),
  w('včela', 'roj', 'pták', 'hejno', ['roj', 'smečka', 'stádo', 'hnízdo'], 'skupinaZvirat', 'Jak se říká skupině ptáků?'),
  w('oko', 'zrak', 'nos', 'čich', ['sluch', 'chuť', 'hmat', 'zrak'], 'smysl', 'Který smysl máme v nose?'),
  w('jazyk', 'chuť', 'kůže', 'hmat', ['zrak', 'sluch', 'čich', 'chuť'], 'smysl', 'Který smysl máme v kůži?', 0.1),
  w('teploměr', 'teplota', 'hodiny', 'čas', ['délka', 'hmotnost', 'teplota', 'rychlost'], 'mereni', 'Co měří hodiny?', -0.2),
  w('váha', 'hmotnost', 'pravítko', 'délka', ['čas', 'teplota', 'hmotnost', 'rychlost'], 'mereni', 'Co měří pravítko?'),
  w('mouka', 'chléb', 'mléko', 'sýr', ['mouka', 'med', 'cukr', 'džem'], 'vyroba', 'Co se vyrábí z mléka?'),
  w('kapitán', 'loď', 'strojvedoucí', 'vlak', ['loď', 'letadlo', 'autobus', 'kolo'], 'pracoviste', 'Co řídí strojvedoucí?'),
  w('pravda', 'lež', 'odvaha', 'strach', ['síla', 'pravda', 'radost', 'hrdina'], 'opak', 'Jaký je opak odvahy?', 0.2),
  w('začátek', 'konec', 'první', 'poslední', ['druhý', 'jediný', 'konec', 'prostřední'], 'opak', 'Jaký je opak slova první?'),
  w('vždy', 'nikdy', 'všechno', 'nic', ['něco', 'hodně', 'všichni', 'málo'], 'opak', 'Jaký je opak slova všechno?', 0.1),
  // Ne „den“ ani „týden“: i ty se skládají z minut a chytré dítě by je obhájilo.
  w('sekunda', 'minuta', 'minuta', 'hodina', ['sekunda', 'metr', 'litr', 'kilogram'], 'jednotka', 'Co trvá právě 60 minut?', -0.1),
  w('centimetr', 'metr', 'gram', 'kilogram', ['metr', 'litr', 'sekunda', 'kilometr'], 'jednotka', 'V čem vážíme větší věci než gram?', 0.2),
  w('housenka', 'motýl', 'pulec', 'žába', ['ryba', 'had', 'motýl', 'ještěrka'], 'mlade', 'Co vyroste z pulce?'),
  w('trojúhelník', 'tři', 'čtverec', 'čtyři', ['tři', 'pět', 'šest', 'dva'], 'rohy', 'Kolik rohů má čtverec?', -0.2),
  // Ne „dva“: pavouk mívá i osm očí a mravenec dvě velké oči.
  w('pavouk', 'osm', 'mravenec', 'šest', ['osm', 'čtyři', 'deset', 'dvanáct'], 'nohy', 'Kolik nohou má hmyz?', 0.2),
  w('lékař', 'pacient', 'učitel', 'žák', ['škola', 'třída', 'ředitel', 'lékař'], 'pece', 'O koho se stará učitel?'),
  w('noha', 'koleno', 'ruka', 'loket', ['prst', 'dlaň', 'nehet', 'koleno'], 'kloub', 'Kde se ruka ohýbá uprostřed?', 0.1),
  // Ne „křídla“ ani „zobák“ (typická část těla) a ne „šupiny“ (ptáci je mají na nohách).
  w('pes', 'srst', 'pták', 'peří', ['srst', 'krunýř', 'bodliny', 'ulita'], 'pokryv', 'Co pokrývá tělo ptáka?', -0.2),
  pic(P('🔋', 'baterie'), P('🔦', 'baterka'), P('⛽', 'benzín'), P('🚗', 'auto'),
    [P('🚲', 'kolo'), P('⛵', 'plachetnice'), P('🛷', 'sáně')], 'palivo', 'Co jezdí na benzín?', 0.2),
];

// ---------------------------------------------------------------------------
// L5 – 5. třída: tvůrci a díla, tělesa, výroba, slova podobného významu

const L5: Spec[] = [
  w('spisovatel', 'kniha', 'sochař', 'socha', ['obraz', 'píseň', 'kniha', 'dům'], 'autor', 'Co vytváří sochař?', -0.2),
  w('malíř', 'obraz', 'skladatel', 'skladba', ['kniha', 'socha', 'obraz', 'báseň'], 'autor', 'Co vytváří skladatel?'),
  w('čtverec', 'krychle', 'kruh', 'koule', ['kvádr', 'jehlan', 'trojúhelník', 'krychle'], 'teleso', 'Které těleso je kulaté ze všech stran?', 0.1),
  // Ne „jehlan“: jehlan se čtvercovou podstavou by šlo obhájit.
  w('obdélník', 'kvádr', 'čtverec', 'krychle', ['koule', 'válec', 'kruh', 'kužel'], 'teleso', 'Které těleso má všechny stěny čtvercové?', 0.1),
  w('papír', 'dřevo', 'sklo', 'písek', ['voda', 'dřevo', 'železo', 'papír'], 'zCeho', 'Z čeho se vyrábí sklo?', 0.3),
  w('teploměr', 'teplota', 'kompas', 'směr', ['čas', 'rychlost', 'délka', 'teplota'], 'mereni', 'K čemu je kompas?'),
  w('rychlý', 'hbitý', 'krásný', 'nádherný', ['ošklivý', 'velký', 'rychlý', 'chytrý'], 'synonymum', 'Které slovo znamená skoro totéž co krásný?'),
  w('mluvit', 'hovořit', 'dívat se', 'hledět', ['poslouchat', 'mluvit', 'spát', 'zavřít oči'], 'synonymum', 'Které slovo znamená skoro totéž co dívat se?'),
  w('slzy', 'smutek', 'smích', 'radost', ['strach', 'vztek', 'únava', 'smutek'], 'vyraz', 'Co cítí člověk, který se směje?', 0.1),
  w('začátek', 'konec', 'vchod', 'východ', ['dveře', 'vstup', 'chodba', 'začátek'], 'opak', 'Kudy se z budovy odchází?', 0.2),
  w('levý', 'pravý', 'sever', 'jih', ['východ', 'západ', 'zima', 'levý'], 'opak', 'Která světová strana je naproti severu?'),
  w('tón', 'melodie', 'barva', 'obraz', ['štětec', 'malíř', 'papír', 'zvuk'], 'cast', 'Co vznikne, když se sejde víc barev na plátně?', 0.3),
  w('hvězda', 'souhvězdí', 'ostrov', 'souostroví', ['poloostrov', 'pevnina', 'moře', 'přístav'], 'cast', 'Jak se říká skupině ostrovů?', 0.3),
  w('kniha', 'čtenář', 'film', 'divák', ['herec', 'režisér', 'kino', 'čtenář'], 'obecenstvo', 'Kdo se dívá na film?', 0.2),
  w('housenka', 'motýl', 'poupě', 'květ', ['list', 'kořen', 'semínko', 'motýl'], 'vyvoj', 'Co vznikne z poupěte?'),
  w('déšť', 'mokro', 'mráz', 'led', ['vítr', 'pára', 'mokro', 'teplo'], 'nasledek', 'Co udělá mráz s vodou?', 0.3),
  w('vesnice', 'starosta', 'škola', 'ředitel', ['učitel', 'žák', 'kuchař', 'starosta'], 'vede', 'Kdo vede školu?', 0.1),
];

export const ANALOGIE_BANKS: Partial<Record<Level, Spec[]>> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };
