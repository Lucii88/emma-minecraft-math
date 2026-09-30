// Nadřazená a podřazená slova, „co sem nepatří“. Tři typy úloh:
//  a) Co z toho je ovoce?            (jeden člen skupiny + tři slova odjinud)
//  b) Které slovo sem nepatří?        (tři členové skupiny + jeden vetřelec)
//  c) Jak jedním slovem nazveš: …?   (nadřazené slovo)
// Skupiny jsou volené tak, aby měla úloha jen jednu obhajitelnou odpověď.

import { capitalize, choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.skupiny';

interface Cat {
  /** Nadřazené slovo (odpověď v úloze c, množné číslo v úloze b). */
  label: string;
  /** „X je …“ */
  sg: string;
  /** Otázka pro úlohu a. */
  a?: string;
}

const CAT: Record<string, Cat> = {
  ovoce: { label: 'ovoce', sg: 'ovoce', a: 'Co z toho je ovoce?' },
  zelenina: { label: 'zelenina', sg: 'zelenina', a: 'Co z toho je zelenina?' },
  nabytek: { label: 'nábytek', sg: 'nábytek', a: 'Co z toho je nábytek?' },
  obleceni: { label: 'oblečení', sg: 'oblečení', a: 'Co z toho je oblečení?' },
  hracky: { label: 'hračky', sg: 'hračka', a: 'Co z toho je hračka?' },
  doprava: { label: 'dopravní prostředky', sg: 'dopravní prostředek', a: 'Co z toho je dopravní prostředek?' },
  nadobi: { label: 'nádobí', sg: 'nádobí', a: 'Co z toho je nádobí?' },
  naradi: { label: 'nářadí', sg: 'nářadí', a: 'Co z toho je nářadí?' },
  barvy: { label: 'barvy', sg: 'barva', a: 'Co z toho je barva?' },
  telo: { label: 'části těla', sg: 'část těla', a: 'Co z toho je část těla?' },
  zvirata: { label: 'zvířata', sg: 'zvíře', a: 'Co z toho je zvíře?' },
  napoje: { label: 'nápoje', sg: 'nápoj', a: 'Co z toho je nápoj?' },
  hudba: { label: 'hudební nástroje', sg: 'hudební nástroj', a: 'Co z toho je hudební nástroj?' },
  stromy: { label: 'stromy', sg: 'strom', a: 'Co z toho je strom?' },
  kvetiny: { label: 'květiny', sg: 'květina', a: 'Co z toho je květina?' },
  povolani: { label: 'povolání', sg: 'povolání', a: 'Co z toho je povolání?' },
  dny: { label: 'dny v týdnu', sg: 'den v týdnu', a: 'Co z toho je den v týdnu?' },
  mesice: { label: 'měsíce v roce', sg: 'měsíc v roce' },
  obdobi: { label: 'roční období', sg: 'roční období' },
  pecivo: { label: 'pečivo', sg: 'pečivo', a: 'Co z toho je pečivo?' },
  domaci: { label: 'domácí zvířata', sg: 'domácí zvíře' },
  ptaci: { label: 'ptáci', sg: 'pták', a: 'Kdo z nich je pták?' },
  savci: { label: 'savci', sg: 'savec', a: 'Kdo z nich je savec?' },
  ryby: { label: 'ryby', sg: 'ryba', a: 'Kdo z nich je ryba?' },
  hmyz: { label: 'hmyz', sg: 'hmyz', a: 'Kdo z nich je hmyz?' },
  plazi: { label: 'plazi', sg: 'plaz', a: 'Kdo z nich je plaz?' },
  obojzivelnici: { label: 'obojživelníci', sg: 'obojživelník', a: 'Kdo z nich je obojživelník?' },
  jehlicnate: { label: 'jehličnaté stromy', sg: 'jehličnatý strom', a: 'Který strom je jehličnatý?' },
  listnate: { label: 'listnaté stromy', sg: 'listnatý strom', a: 'Který strom je listnatý?' },
  reky: { label: 'řeky', sg: 'řeka', a: 'Co z toho je řeka?' },
  hory: { label: 'hory', sg: 'hora', a: 'Co z toho je hora?' },
  utvary: { label: 'rovinné útvary', sg: 'rovinný útvar', a: 'Co z toho je rovinný útvar?' },
  planety: { label: 'planety', sg: 'planeta', a: 'Co z toho je planeta?' },
  hvezdy: { label: 'hvězdy', sg: 'hvězda', a: 'Co z toho je hvězda?' },
  vodni: { label: 'vodní dopravní prostředky', sg: 'vodní dopravní prostředek' },
  strunne: { label: 'strunné nástroje', sg: 'strunný nástroj' },
  dechove: { label: 'dechové nástroje', sg: 'dechový nástroj' },
  bici: { label: 'bicí nástroje', sg: 'bicí nástroj' },
  delka: { label: 'jednotky délky', sg: 'jednotka délky', a: 'Co z toho je jednotka délky?' },
  hmotnost: { label: 'jednotky hmotnosti', sg: 'jednotka hmotnosti', a: 'Co z toho je jednotka hmotnosti?' },
  cas: { label: 'jednotky času', sg: 'jednotka času' },
  svetadily: { label: 'světadíly', sg: 'světadíl', a: 'Co z toho je světadíl?' },
  oceany: { label: 'oceány', sg: 'oceán' },
  organy: { label: 'vnitřní orgány', sg: 'vnitřní orgán' },
  smysly: { label: 'smysly', sg: 'smysl' },
};

type A = ['a', string, string, [string, string, string], string?];

/** Pomnožná jména (kalhoty, housle…): „jsou“ místo „je“. */
const PLURAL = new Set(['kalhoty', 'housle', 'kostky', 'brýle', 'nůžky', 'kleště', 'dveře']);
type B = ['b', string, [string, string, string], string, string];
type C = ['c', string, [string, string, string], [string, string, string]];
type Spec = A | B | C;

function build(spec: Spec): Entry {
  if (spec[0] === 'a') {
    const [, cat, member, ds, note] = spec;
    const c = CAT[cat];
    if (!c?.a) throw new Error(`skupiny: kategorie ${cat} nemá otázku`);
    return {
      key: `co-je-${cat}-${slug(member)}`,
      build: (rng) => ({
        prompt: c.a!,
        answer: choice(rng, member, ds),
        hints: [`U každého slova se zeptej: Je to ${c.sg}?`, 'Tři slova patří do úplně jiných skupin.'],
        explanation: `${capitalize(member)} ${PLURAL.has(member) ? 'jsou' : 'je'} ${c.sg}.${note ? ` ${note}` : ''}`,
      }),
    };
  }
  if (spec[0] === 'b') {
    const [, cat, [m1, m2, m3], odd, oddDesc] = spec;
    const c = CAT[cat];
    return {
      key: `nepatri-${cat}-${slug(odd)}`,
      build: (rng) => ({
        prompt: 'Které slovo sem nepatří?',
        answer: choice(rng, odd, [m1, m2, m3]),
        hints: ['Najdi, co mají tři slova společného.', 'Jedno slovo patří do jiné skupiny. Jak by se ta skupina jmenovala?'],
        explanation: `${capitalize(m1)}, ${m2} a ${m3} jsou ${c.label}. ${capitalize(odd)} je ${oddDesc}.`,
      }),
    };
  }
  const [, cat, [m1, m2, m3], wrong] = spec;
  const c = CAT[cat];
  return {
    key: `nazev-${cat}-${slug(m1)}`,
    build: (rng) => ({
      prompt: `Jak jedním slovem nazveš: ${m1}, ${m2}, ${m3}?`,
      answer: choice(rng, c.label, wrong),
      hints: ['Co mají všechna tři slova společného?', 'Hledej slovo, které je pojmenuje všechna najednou.'],
      explanation: `${capitalize(m1)}, ${m2} a ${m3} jsou ${c.label}.`,
    }),
  };
}

const L1: Spec[] = [
  ['a', 'ovoce', 'jablko', ['židle', 'auto', 'tričko']],
  ['a', 'ovoce', 'banán', ['kolo', 'postel', 'čepice']],
  ['a', 'zelenina', 'mrkev', ['míč', 'stůl', 'bunda']],
  ['a', 'zelenina', 'okurka', ['hrnek', 'vlak', 'svetr']],
  ['a', 'nabytek', 'stůl', ['hruška', 'letadlo', 'šála']],
  ['a', 'nabytek', 'postel', ['jahoda', 'autobus', 'panenka']],
  ['a', 'obleceni', 'kalhoty', ['mrkev', 'skříň', 'loď']],
  ['a', 'obleceni', 'svetr', ['švestka', 'židle', 'tramvaj']],
  ['a', 'hracky', 'panenka', ['cibule', 'gauč', 'bunda']],
  ['a', 'doprava', 'autobus', ['třešeň', 'křeslo', 'rukavice']],
  ['a', 'barvy', 'červená', ['kočka', 'stůl', 'chléb']],
  ['a', 'telo', 'koleno', ['polštář', 'jablko', 'vlak']],
  ['a', 'napoje', 'čaj', ['chléb', 'stůl', 'míč']],
  ['a', 'zvirata', 'koza', ['kolo', 'hrnek', 'tráva']],
  ['b', 'ovoce', ['jablko', 'hruška', 'švestka'], 'mrkev', 'zelenina'],
  ['b', 'zvirata', ['pes', 'kočka', 'kráva'], 'židle', 'nábytek'],
  ['b', 'doprava', ['auto', 'vlak', 'letadlo'], 'jablko', 'ovoce'],
  ['b', 'obleceni', ['tričko', 'sukně', 'svetr'], 'stůl', 'nábytek'],
  ['b', 'barvy', ['modrá', 'zelená', 'žlutá'], 'kočka', 'zvíře'],
  ['b', 'nabytek', ['židle', 'skříň', 'postel'], 'banán', 'ovoce'],
  ['b', 'hracky', ['panenka', 'míč', 'kostky'], 'kladivo', 'nářadí'],
  ['b', 'telo', ['ruka', 'noha', 'hlava'], 'čepice', 'oblečení'],
  ['b', 'zelenina', ['mrkev', 'cibule', 'okurka'], 'hruška', 'ovoce'],
  ['b', 'nadobi', ['talíř', 'hrnek', 'hrnec'], 'kolo', 'dopravní prostředek'],
  ['c', 'ovoce', ['jablko', 'hruška', 'švestka'], ['zelenina', 'nábytek', 'hračky']],
  ['c', 'zelenina', ['mrkev', 'cibule', 'okurka'], ['ovoce', 'nádobí', 'oblečení']],
  ['c', 'nabytek', ['stůl', 'židle', 'skříň'], ['nádobí', 'nářadí', 'ovoce']],
  ['c', 'doprava', ['auto', 'vlak', 'autobus'], ['hračky', 'nábytek', 'zvířata']],
  ['c', 'obleceni', ['tričko', 'kalhoty', 'svetr'], ['nábytek', 'ovoce', 'hračky']],
  ['c', 'zvirata', ['pes', 'kočka', 'kráva'], ['ptáci', 'hračky', 'nábytek']],
  ['c', 'hracky', ['panenka', 'míč', 'kostky'], ['oblečení', 'nádobí', 'ovoce']],
  ['c', 'telo', ['ruka', 'noha', 'hlava'], ['oblečení', 'zvířata', 'nábytek']],
  ['c', 'barvy', ['červená', 'modrá', 'žlutá'], ['tvary', 'ovoce', 'hračky']],
  ['c', 'nadobi', ['talíř', 'hrnek', 'hrnec'], ['nářadí', 'nábytek', 'oblečení']],
];

const L2: Spec[] = [
  ['a', 'ovoce', 'meruňka', ['mrkev', 'cibule', 'hrášek']],
  ['a', 'zelenina', 'paprika', ['broskev', 'jahoda', 'švestka']],
  ['a', 'naradi', 'kladivo', ['talíř', 'hrnec', 'pánev']],
  ['a', 'nadobi', 'pánev', ['pila', 'šroubovák', 'kleště']],
  ['a', 'hudba', 'housle', ['kladivo', 'talíř', 'deštník']],
  ['a', 'stromy', 'bříza', ['tulipán', 'růže', 'pampeliška']],
  ['a', 'kvetiny', 'tulipán', ['dub', 'smrk', 'buk']],
  ['a', 'povolani', 'hasič', ['hadice', 'oheň', 'helma']],
  ['a', 'dny', 'středa', ['leden', 'jaro', 'ráno']],
  ['a', 'napoje', 'mléko', ['chléb', 'sýr', 'máslo']],
  ['a', 'pecivo', 'rohlík', ['mléko', 'sýr', 'jablko']],
  ['b', 'ovoce', ['jahoda', 'malina', 'borůvka'], 'hrášek', 'zelenina'],
  ['b', 'naradi', ['kladivo', 'pila', 'kleště'], 'vidlička', 'příbor, se kterým jíme'],
  ['b', 'nadobi', ['hrnec', 'pánev', 'talíř'], 'lopata', 'nářadí'],
  ['b', 'hudba', ['kytara', 'housle', 'harfa'], 'štětec', 'věc na malování'],
  ['b', 'stromy', ['dub', 'lípa', 'javor'], 'tulipán', 'květina'],
  ['b', 'kvetiny', ['růže', 'tulipán', 'sedmikráska'], 'smrk', 'strom'],
  ['b', 'povolani', ['kuchař', 'pekař', 'zedník'], 'rohlík', 'pečivo'],
  ['b', 'dny', ['pondělí', 'úterý', 'čtvrtek'], 'březen', 'měsíc v roce'],
  ['b', 'mesice', ['leden', 'únor', 'březen'], 'pátek', 'den v týdnu'],
  ['b', 'obdobi', ['jaro', 'léto', 'zima'], 'sobota', 'den v týdnu'],
  ['b', 'pecivo', ['rohlík', 'chléb', 'houska'], 'sýr', 'mléčný výrobek'],
  ['b', 'domaci', ['kráva', 'ovce', 'koza'], 'liška', 'lesní zvíře'],
  ['c', 'naradi', ['kladivo', 'pila', 'šroubovák'], ['nádobí', 'nábytek', 'hračky']],
  ['c', 'nadobi', ['talíř', 'hrnec', 'pánev'], ['nářadí', 'nábytek', 'oblečení']],
  ['c', 'hudba', ['housle', 'kytara', 'buben'], ['nářadí', 'hračky', 'nádobí']],
  ['c', 'stromy', ['dub', 'bříza', 'smrk'], ['květiny', 'keře', 'houby']],
  ['c', 'kvetiny', ['tulipán', 'růže', 'fialka'], ['stromy', 'zelenina', 'ovoce']],
  ['c', 'dny', ['pondělí', 'středa', 'pátek'], ['měsíce v roce', 'roční období', 'barvy']],
  ['c', 'mesice', ['leden', 'duben', 'září'], ['dny v týdnu', 'roční období', 'planety']],
  ['c', 'obdobi', ['jaro', 'léto', 'podzim'], ['měsíce v roce', 'dny v týdnu', 'barvy']],
  ['c', 'povolani', ['hasič', 'lékař', 'učitelka'], ['sporty', 'nářadí', 'hračky']],
  ['c', 'pecivo', ['rohlík', 'chléb', 'houska'], ['ovoce', 'nápoje', 'zelenina']],
  ['c', 'domaci', ['kráva', 'ovce', 'koza'], ['lesní zvířata', 'ptáci', 'ryby']],
  ['c', 'napoje', ['čaj', 'mléko', 'džus'], ['pečivo', 'ovoce', 'nádobí']],
];

const L3: Spec[] = [
  ['a', 'ptaci', 'čáp', ['netopýr', 'veverka', 'motýl']],
  ['a', 'savci', 'netopýr', ['vrabec', 'sova', 'čáp'], 'Umí sice létat, ale mláďata krmí mlékem.'],
  ['a', 'hmyz', 'mravenec', ['pavouk', 'šnek', 'žížala'], 'Hmyz má šest nohou. Pavouk má osm.'],
  ['a', 'ryby', 'kapr', ['žába', 'kachna', 'rak']],
  ['a', 'jehlicnate', 'smrk', ['dub', 'buk', 'lípa']],
  ['a', 'listnate', 'javor', ['smrk', 'jedle', 'borovice']],
  ['a', 'reky', 'Vltava', ['Sněžka', 'Praha', 'Šumava']],
  ['a', 'hory', 'Sněžka', ['Vltava', 'Brno', 'Labe']],
  ['a', 'utvary', 'trojúhelník', ['kružítko', 'pravítko', 'guma']],
  ['a', 'savci', 'velryba', ['žralok', 'kapr', 'štika'], 'Žije v moři, ale dýchá vzduch a mláďata krmí mlékem.'],
  ['b', 'ptaci', ['vrabec', 'sýkora', 'kos'], 'netopýr', 'savec'],
  ['b', 'savci', ['pes', 'kůň', 'medvěd'], 'čáp', 'pták'],
  ['b', 'hmyz', ['včela', 'moucha', 'motýl'], 'pavouk', 'pavoukovec – má osm nohou, hmyz má šest'],
  ['b', 'ryby', ['kapr', 'štika', 'pstruh'], 'rak', 'korýš'],
  ['b', 'jehlicnate', ['smrk', 'jedle', 'borovice'], 'buk', 'listnatý strom'],
  ['b', 'listnate', ['dub', 'buk', 'bříza'], 'smrk', 'jehličnatý strom'],
  ['b', 'reky', ['Vltava', 'Labe', 'Odra'], 'Sněžka', 'hora'],
  ['b', 'hory', ['Sněžka', 'Praděd', 'Ještěd'], 'Ohře', 'řeka'],
  ['b', 'vodni', ['loď', 'ponorka', 'plachetnice'], 'vrtulník', 'vzdušný dopravní prostředek'],
  ['b', 'strunne', ['housle', 'kytara', 'harfa'], 'trubka', 'dechový nástroj'],
  ['b', 'utvary', ['kruh', 'čtverec', 'obdélník'], 'krychle', 'těleso'],
  ['b', 'planety', ['Mars', 'Venuše', 'Jupiter'], 'Měsíc', 'přirozená družice Země – obíhá kolem Země, ne přímo kolem Slunce'],
  ['c', 'ptaci', ['vrabec', 'čáp', 'sova'], ['savci', 'ryby', 'hmyz']],
  ['c', 'hmyz', ['včela', 'mravenec', 'beruška'], ['ptáci', 'pavouci', 'savci']],
  ['c', 'ryby', ['kapr', 'štika', 'sumec'], ['ptáci', 'obojživelníci', 'plazi']],
  ['c', 'jehlicnate', ['smrk', 'jedle', 'borovice'], ['listnaté stromy', 'keře', 'květiny']],
  ['c', 'listnate', ['dub', 'lípa', 'javor'], ['jehličnaté stromy', 'keře', 'houby']],
  ['c', 'reky', ['Vltava', 'Labe', 'Odra'], ['hory', 'města', 'jezera']],
  ['c', 'hory', ['Sněžka', 'Praděd', 'Říp'], ['řeky', 'města', 'rybníky']],
  ['c', 'strunne', ['housle', 'kytara', 'kontrabas'], ['dechové nástroje', 'bicí nástroje', 'nářadí']],
  ['c', 'dechove', ['flétna', 'trubka', 'klarinet'], ['strunné nástroje', 'bicí nástroje', 'nádobí']],
  ['c', 'utvary', ['kruh', 'čtverec', 'trojúhelník'], ['tělesa', 'čísla', 'barvy']],
  ['c', 'planety', ['Merkur', 'Mars', 'Saturn'], ['hvězdy', 'měsíce', 'komety']],
];

const L4: Spec[] = [
  ['a', 'plazi', 'ještěrka', ['mlok', 'čolek', 'žába']],
  ['a', 'obojzivelnici', 'mlok', ['ještěrka', 'had', 'želva']],
  ['a', 'savci', 'delfín', ['žralok', 'tuňák', 'losos'], 'Dýchá vzduch a mláďata krmí mlékem.'],
  ['a', 'ptaci', 'tučňák', ['tuleň', 'lachtan', 'mrož'], 'Neumí sice létat, ale má peří a snáší vejce.'],
  ['a', 'hmyz', 'čmelák', ['pavouk', 'klíště', 'stonožka']],
  ['a', 'planety', 'Neptun', ['Slunce', 'Měsíc', 'Polárka']],
  ['a', 'hvezdy', 'Slunce', ['Země', 'Mars', 'Měsíc'], 'Ze všech hvězd je nám nejblíž.'],
  ['a', 'delka', 'kilometr', ['kilogram', 'litr', 'hodina']],
  ['a', 'hmotnost', 'gram', ['metr', 'litr', 'minuta']],
  ['a', 'svetadily', 'Afrika', ['Praha', 'Dunaj', 'Alpy']],
  ['b', 'savci', ['velryba', 'delfín', 'kosatka'], 'žralok', 'ryba'],
  ['b', 'ptaci', ['pštros', 'tučňák', 'orel'], 'netopýr', 'savec'],
  ['b', 'plazi', ['had', 'ještěrka', 'želva'], 'žába', 'obojživelník'],
  ['b', 'hmyz', ['včela', 'mravenec', 'kobylka'], 'pavouk', 'pavoukovec – má osm nohou'],
  ['b', 'planety', ['Země', 'Mars', 'Saturn'], 'Slunce', 'hvězda'],
  ['b', 'delka', ['metr', 'centimetr', 'kilometr'], 'kilogram', 'jednotka hmotnosti'],
  ['b', 'cas', ['sekunda', 'minuta', 'hodina'], 'litr', 'jednotka objemu'],
  ['b', 'obdobi', ['jaro', 'léto', 'podzim'], 'prosinec', 'měsíc v roce'],
  ['b', 'svetadily', ['Evropa', 'Afrika', 'Asie'], 'Dunaj', 'řeka'],
  ['b', 'bici', ['buben', 'činely', 'triangl'], 'trubka', 'dechový nástroj'],
  ['b', 'listnate', ['dub', 'buk', 'javor'], 'modřín', 'jehličnatý strom, i když na zimu jehličí shazuje'],
  ['b', 'organy', ['srdce', 'plíce', 'játra'], 'loket', 'kloub na ruce, ne vnitřní orgán'],
  ['b', 'oceany', ['Tichý oceán', 'Atlantský oceán', 'Indický oceán'], 'Středozemní moře', 'moře'],
  ['b', 'smysly', ['chuť', 'hmat', 'zrak'], 'spánek', 'odpočinek, ne smysl'],
  ['c', 'plazi', ['had', 'ještěrka', 'želva'], ['obojživelníci', 'savci', 'ryby']],
  ['c', 'obojzivelnici', ['žába', 'mlok', 'čolek'], ['plazi', 'ryby', 'hmyz']],
  ['c', 'savci', ['velryba', 'delfín', 'netopýr'], ['ryby', 'ptáci', 'plazi']],
  ['c', 'planety', ['Merkur', 'Venuše', 'Země'], ['hvězdy', 'měsíce', 'souhvězdí']],
  ['c', 'delka', ['metr', 'centimetr', 'kilometr'], ['jednotky hmotnosti', 'jednotky času', 'jednotky objemu']],
  ['c', 'hmotnost', ['gram', 'kilogram', 'tuna'], ['jednotky délky', 'jednotky času', 'jednotky objemu']],
  ['c', 'cas', ['sekunda', 'minuta', 'hodina'], ['jednotky délky', 'jednotky hmotnosti', 'jednotky objemu']],
  ['c', 'svetadily', ['Evropa', 'Afrika', 'Asie'], ['státy', 'oceány', 'města']],
  ['c', 'organy', ['srdce', 'plíce', 'ledviny'], ['kosti', 'svaly', 'smysly']],
  ['c', 'bici', ['buben', 'činely', 'triangl'], ['strunné nástroje', 'dechové nástroje', 'nářadí']],
];

const levels: Level[] = [1, 2, 3, 4];

export const SPECS: Record<1 | 2 | 3 | 4, Spec[]> = { 1: L1, 2: L2, 3: L3, 4: L4 };

export const pools: Pools = {
  1: L1.map(build),
  2: L2.map(build),
  3: L3.map(build),
  4: L4.map(build),
};
assertUniqueKeys(ID, pools);

export const skupiny: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Co k sobě patří',
  description: 'Třídí slova do skupin, hledá nadřazené slovo a to, co do skupiny nepatří; rozvíjí pojmové myšlení a slovní zásobu.',
  levels,
  rvp: {
    1: ['ČJL-3-2-02'],
    2: ['ČJL-3-2-02'],
    3: ['ČJL-3-2-02'],
    4: ['ČJL-3-2-02'],
  },
  ability: 'usuzovani',
  testLike: 'co-nepatri',
  generate: makeGenerator(ID, levels, pools),
};
