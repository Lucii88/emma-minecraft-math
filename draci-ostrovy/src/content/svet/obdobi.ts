// Roční období: znaky ročních období, měsíce a jejich pořadí, počasí, co dělají
// zvířata a rostliny během roku, délka dne, rovnodennost a slunovrat.
//
// Měsíce k ročním obdobím přiřazujeme jen tam, kde to platí podle kalendáře
// (astronomicky) i podle meteorologů: „celý letní“ je červenec a srpen, ne
// červen nebo září.

import { bankSkill, type Spec } from '../../core/bank';
import { capitalize } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard } from '../../core/types';
import { fixed, num, ord, q, slug, type Extra } from './common';

const ID = 'svet.obdobi';

export const OBDOBI = ['Jaro', 'Léto', 'Podzim', 'Zima'] as const;
const KDY = ['Na jaře', 'V létě', 'Na podzim', 'V zimě'];
const JARO = 0;
const LETO = 1;
const PODZIM = 2;
const ZIMA = 3;

/** Měsíce v kalendářním pořadí (1. pád). */
export const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
/** 6. pád: „po lednu“, „v lednu“. */
const MESICE_6 = ['lednu', 'únoru', 'březnu', 'dubnu', 'květnu', 'červnu', 'červenci', 'srpnu', 'září', 'říjnu', 'listopadu', 'prosinci'];
/** 7. pád: „před lednem“. */
const MESICE_7 = ['lednem', 'únorem', 'březnem', 'dubnem', 'květnem', 'červnem', 'červencem', 'srpnem', 'zářím', 'říjnem', 'listopadem', 'prosincem'];
/** Počet dní v měsíci (únor v obyčejném roce). */
export const DNI_V_MESICI = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const obd = (key: string, prompt: string, correct: number, hints: string[], explain: string, extra: Extra = {}) =>
  fixed(key, prompt, [...OBDOBI], correct, hints, explain, extra);
const kdy = (key: string, prompt: string, correct: number, hints: string[], explain: string, extra: Extra = {}) =>
  fixed(key, prompt, KDY, correct, hints, explain, extra);

// ---------------------------------------------------------------------------
// L1 – znaky ročních období, jejich pořadí, zvířata a oblékání

const L1: Spec[] = [
  obd('po-zime', 'Které roční období přichází po zimě?', JARO,
    ['Po zimě začíná tát sníh a kvetou první květiny.'],
    'Po zimě přichází jaro. Dny se prodlužují, sníh taje a rozkvétají první květiny.'),
  obd('pred-letem', 'Které roční období je před létem?', JARO,
    ['Léto přichází po období, kdy všechno raší a kvete.'],
    'Před létem je jaro. Roční období se střídají dokola: jaro, léto, podzim, zima.'),
  obd('po-lete', 'Které roční období přichází po létě?', PODZIM,
    ['Po létě začíná škola a listí na stromech žloutne.'],
    'Po létě přichází podzim. Začíná škola, ochlazuje se a listí žloutne.'),
  obd('po-podzimu', 'Které roční období přichází po podzimu?', ZIMA,
    ['Po podzimu bývá mráz a někdy napadne sníh.'],
    'Po podzimu přichází zima. Bývá mráz, sníh a nejkratší dny v roce.'),
  ord('od-jara', 'Seřaď roční období tak, jak jdou po sobě. Začni jarem.', ['Jaro', 'Léto', 'Podzim', 'Zima'],
    ['Co přichází po jaru?', 'Po létě začíná škola.'],
    'Roční období jdou za sebou: jaro, léto, podzim, zima. Pak zase jaro.'),
  kdy('snehulak', 'Kdy si nejčastěji postavíš sněhuláka?', ZIMA,
    ['Na sněhuláka potřebuješ hodně sněhu.'],
    'Sníh u nás padá hlavně v zimě, a tak se sněhuláci stavějí v zimě.'),
  kdy('listi', 'Kdy listí na stromech žloutne, červená a opadává?', PODZIM,
    ['Je to v době, kdy začíná škola a sbírají se kaštany.'],
    'Na podzim listy mění barvu a opadávají. Stromy se tak chystají na zimu.'),
  obd('snezenky', 'Sněženky a bledule kvetou mezi prvními květinami. Které roční období ohlašují?', JARO,
    ['Kvetou, když ještě občas leží sníh, ale už se otepluje.'],
    'Sněženky a bledule ohlašují jaro. Kvetou brzy, jakmile se po zimě začne oteplovat.'),
  kdy('prazdniny', 'Kdy jsou velké prázdniny?', LETO,
    ['Je to nejteplejší část roku.'],
    'Velké prázdniny jsou v létě, v červenci a srpnu.'),
  kdy('vanoce', 'Kdy slavíme Vánoce?', ZIMA,
    ['Vánoce jsou v prosinci, na konci roku.'],
    'Vánoce slavíme v prosinci, na začátku zimy.'),
  q('jezek', 'Co dělá ježek v zimě?', 'Spí zimním spánkem',
    ['Odletí do teplých krajin', 'Sbírá v lese jahody', 'Staví si hnízdo na stromě'],
    ['V zimě je málo potravy. Jak to ježek vyřeší?'],
    'Ježek se na podzim vykrmí a celou zimu prospí v pelíšku z listí. Říká se tomu zimní spánek.'),
  q('cap', 'Kam se na zimu poděje čáp?', 'Odletí do teplých krajin',
    ['Zahrabe se do listí', 'Přespí zimu v kurníku', 'Schová se v noře'],
    ['Čáp je pták s velkými křídly.'],
    'Čáp odlétá na zimu až do Afriky, kde je teplo a dost potravy. Na jaře se vrací.'),
  q('mraz', 'Venku mrzne. Co si oblečeš?', 'Čepici a rukavice',
    ['Plavky', 'Kraťasy a tričko', 'Sandály'],
    ['Co zahřeje hlavu a ruce?'],
    'Když mrzne, chrání nás teplé oblečení: čepice, rukavice, bunda a zimní boty.'),
  kdy('draci', 'Kdy se pouštějí papíroví draci a sbírají kaštany?', PODZIM,
    ['Kaštany padají ze stromů, když dozrají.'],
    'Na podzim fouká silnější vítr, který unese papírového draka, a ze stromů padají zralé kaštany.'),
  kdy('koupani', 'Kdy se nejčastěji koupeme venku v rybníce?', LETO,
    ['Voda v rybníce musí být teplá.'],
    'V létě je teplo a voda v rybnících se ohřeje. Koupat se chodíme jen s dospělým.'),
  kdy('zamrzly-rybnik', 'Kdy bývá rybník zamrzlý?', ZIMA,
    ['Voda zamrzá, když je mráz.'],
    'Rybník bývá zamrzlý v zimě, když je dlouho mráz. Na led smíš jen s dospělým, když je dost silný.'),
  kdy('mladata', 'Kdy se rodí a líhne nejvíc mláďat, třeba jehňátek a ptáčat?', JARO,
    ['Mláďata potřebují teplo a hodně čerstvé potravy.'],
    'Na jaře se otepluje, roste čerstvá tráva a přibývá hmyzu. Proto se tehdy rodí a líhne nejvíc mláďat.'),
  obd('nejtepleji', 'Které roční období bývá u nás nejteplejší?', LETO,
    ['V tomhle období se koupeme venku.'],
    'Nejtepleji bývá v létě. Slunce je vysoko na obloze a svítí dlouho.'),
  obd('nejchladneji', 'Které roční období bývá u nás nejstudenější?', ZIMA,
    ['V tomhle období padá sníh.'],
    'Nejstudeněji bývá v zimě. Dny jsou krátké a Slunce je nízko nad obzorem.'),
  kdy('kvetou-stromy', 'Kdy kvetou jabloně a třešně?', JARO,
    ['Z květů později vyrostou plody.'],
    'Ovocné stromy kvetou na jaře. Z opylených květů pak v létě a na podzim dozrají plody.'),
  kdy('bourky', 'Kdy u nás bývá nejvíc bouřek?', LETO,
    ['Bouřky přicházejí hlavně po horkých dnech.'],
    'Nejvíc bouřek bývá v létě. Horký vzduch rychle stoupá a vytvoří bouřkové mraky.'),
  kdy('vlastovky', 'Kdy se k nám vracejí vlaštovky?', JARO,
    ['Vlaštovky se vracejí, když už zase létá hodně hmyzu.'],
    'Vlaštovky se vracejí na jaře. Živí se létajícím hmyzem a toho je na jaře zase dost.'),
  num('pocet-obdobi', 'Kolik ročních období má rok?', 4,
    ['Zkus je vyjmenovat a počítej na prstech.'],
    'Rok má čtyři roční období: jaro, léto, podzim a zimu.'),
  num('pocet-mesicu', 'Kolik měsíců má rok?', 12,
    ['Začni lednem a počítej až do prosince.'],
    'Rok má dvanáct měsíců, od ledna do prosince.'),
  kdy('zne', 'Kdy kombajny sklízejí obilí z polí?', LETO,
    ['Obilí musí nejdřív dozrát a zezlátnout.'],
    'Obilí dozrává v létě, hlavně v červenci a srpnu. Sklizni obilí se říká žně.'),
  kdy('krmitko', 'Kdy ptákům nejvíc pomůže krmítko?', ZIMA,
    ['Kdy je těžké najít semínka a hmyz?'],
    'V zimě leží sníh a hmyz není vidět. Ptákům, kteří u nás zůstávají, pak krmítko pomůže.'),
];

// ---------------------------------------------------------------------------
// L2 – měsíce, tažní a stálí ptáci, zimní spánek, počasí

const L2: Spec[] = [
  q('prvni-mesic', 'Který měsíc je v roce první?', 'Leden',
    ['Únor', 'Březen', 'Prosinec', 'Září'],
    ['Vzpomeň si, kdy slavíme Silvestra a Nový rok.'],
    'Rok začíná 1. ledna. Leden je první měsíc, prosinec poslední.'),
  q('posledni-mesic', 'Který měsíc je v roce poslední?', 'Prosinec',
    ['Leden', 'Listopad', 'Říjen', 'Srpen'],
    ['Ve kterém měsíci jsou Vánoce a Silvestr?'],
    'Poslední měsíc roku je prosinec. Po něm začíná nový rok lednem.'),
  q('vanoce-mesic', 'Ve kterém měsíci jsou Vánoce?', 'V prosinci',
    ['V listopadu', 'V lednu', 'V říjnu', 'V únoru'],
    ['Vánoce jsou kousek před koncem roku.'],
    'Štědrý den je 24. prosince. Vánoce jsou tedy v prosinci, na konci roku.'),
  q('prazdniny-mesice', 'Ve kterých měsících jsou velké prázdniny?', 'V červenci a srpnu',
    ['V lednu a únoru', 'V dubnu a květnu', 'V říjnu a listopadu'],
    ['Velké prázdniny jsou v létě.'],
    'Velké prázdniny trvají celý červenec a srpen. Do školy se jde zase v září.'),
  q('skola-zari', 'Ve kterém měsíci začíná školní rok?', 'V září',
    ['V srpnu', 'V říjnu', 'V lednu', 'V červnu'],
    ['Je to hned po velkých prázdninách.'],
    'Školní rok začíná v září, hned po velkých prázdninách.'),
  q('zimni-spanek', 'Které zvíře spí v zimě zimním spánkem?', 'Ježek',
    ['Sýkora', 'Vrabec', 'Liška', 'Veverka'],
    ['Zimním spánkem spí zvířata, která by v zimě nenašla potravu.', 'Hledej zvíře, které se živí hmyzem a žížalami.'],
    'Zimním spánkem spí ježek, netopýr, sysel nebo plch. Sýkora, vrabec, liška i veverka jsou v zimě vzhůru.'),
  q('netopyr', 'Kde přečká zimu netopýr?', 'Spí v jeskyni nebo ve sklepě',
    ['Odletí do Afriky', 'Celou zimu létá po lese', 'Plave pod ledem v rybníce'],
    ['Netopýr se živí létajícím hmyzem. Ten v zimě nenajde.'],
    'Netopýři spí zimním spánkem v jeskyních, štolách nebo sklepech. Často přitom visí hlavou dolů.'),
  q('tazny', 'Který pták na zimu odlétá do teplých krajin?', 'Vlaštovka',
    ['Sýkora', 'Vrabec', 'Straka', 'Strakapoud'],
    ['Hledej ptáka, který se živí jen létajícím hmyzem.'],
    'Vlaštovka odlétá na zimu do Afriky. Sýkora, vrabec, straka i strakapoud u nás zůstávají i v zimě.'),
  q('staly', 'Který pták u nás zůstává i v zimě?', 'Sýkora',
    ['Čáp', 'Vlaštovka', 'Kukačka', 'Jiřička'],
    ['Který z nich chodí v zimě na krmítko?'],
    'Sýkora u nás zůstává celý rok a v zimě ráda chodí na krmítko. Čáp, vlaštovka, kukačka i jiřička na zimu odlétají.'),
  q('vlastovka-potrava', 'Čím se živí vlaštovky, že u nás nemohou zůstat přes zimu?', 'Létajícím hmyzem',
    ['Semínky', 'Zrním z krmítka', 'Jeřabinami'],
    ['Vlaštovky se živí za letu, přímo ve vzduchu.'],
    'Vlaštovky se živí jen hmyzem, který létá ve vzduchu. V zimě u nás skoro žádný nelétá, a tak odlétají do Afriky.'),
  q('medved', 'Kde tráví zimu medvěd?', 'Spí v brlohu',
    ['Staví si hnízdo v koruně stromu', 'Odejde do teplých krajin', 'Celou zimu plave v řece'],
    ['V zimě je v lese málo potravy.'],
    'Medvěd se na podzim vykrmí a v zimě spí v brlohu. Medvědici se tam v zimě rodí i mláďata.'),
  q('snih', 'Co padá z mraků, když je v zimě mráz?', 'Sníh',
    ['Teplý déšť', 'Rosa', 'Velké kroupy'],
    ['Z čeho se staví sněhulák?'],
    'Když je v mracích i u země mráz, padají z mraků sněhové vločky.'),
  q('kroupy', 'Kdy nejčastěji padají kroupy?', 'Při letní bouřce',
    ['Při zimní chumelenici', 'Za jasné noci', 'Při ranní mlze'],
    ['Kroupy vznikají v obřích bouřkových mracích.'],
    'Kroupy jsou kousky ledu. Vznikají vysoko v bouřkových mracích, a proto padají nejčastěji při letních bouřkách.'),
  q('duha', 'Kdy můžeš na obloze uvidět duhu?', 'Když prší a přitom svítí slunce',
    ['Když je hustá mlha a tma', 'Za tmavé noci', 'Když sněží a je zataženo'],
    ['Duha vzniká ze slunečního světla a kapek vody.'],
    'Duha vznikne, když sluneční světlo prosvítí dešťové kapky. Slunce přitom musíš mít za zády.'),
  kdy('nejdelsi-dny', 'Kdy jsou dny nejdelší?', LETO,
    ['Kdy si můžeš hrát venku dlouho do večera?'],
    'Nejdelší dny jsou v létě. Kolem 21. června je u nás světlo asi 16 hodin.'),
  kdy('nejkratsi-dny', 'Kdy jsou dny nejkratší a brzy se stmívá?', ZIMA,
    ['Kdy se rozsvěcejí lampy už odpoledne?'],
    'Nejkratší dny jsou v zimě. Kolem 21. prosince je u nás světlo jen asi 8 hodin.'),
  q('listnate-podzim', 'Co dělají listnaté stromy na podzim?', 'Shazují listí',
    ['Rozkvétají', 'Pučí jim nové listy', 'Rostou jim jehlice'],
    ['Co na podzim šustí v parku pod nohama?'],
    'Na podzim listnaté stromy shazují listí. V zimě by jim listy byly k ničemu – jen by ztrácely vodu.'),
  kdy('seti', 'Kdy zahradníci sejí a sázejí nejvíc rostlin?', JARO,
    ['Rostliny potřebují celé teplé období, aby vyrostly.'],
    'Na jaře se otepluje a půda rozmrzne. Rostliny pak mají celé léto na růst.'),
  q('veverka', 'Spí veverka zimním spánkem?', 'Ne, v zimě hledá své zásoby',
    ['Ano, spí až do jara', 'Ano, ale jen v noře pod zemí', 'Ne, odchází do teplých krajin'],
    ['Proč si veverka na podzim schovává oříšky?'],
    'Veverka zimním spánkem nespí. V zimě běhá po stromech a hledá oříšky a semínka, které si na podzim schovala.'),
  q('mesic-leto', 'Který měsíc je celý letní?', 'Červenec',
    ['Leden', 'Duben', 'Listopad', 'Únor'],
    ['Hledej měsíc velkých prázdnin.'],
    'Léto začíná v červnu, takže celý červenec už je letní.'),
  q('mesic-zima', 'Který měsíc je celý zimní?', 'Leden',
    ['Červenec', 'Květen', 'Říjen', 'Srpen'],
    ['Hledej měsíc, kterým začíná nový rok.'],
    'Zima začíná v prosinci, takže celý leden už je zimní.'),
  q('mesic-podzim', 'Který měsíc je celý podzimní?', 'Říjen',
    ['Leden', 'Červenec', 'Duben', 'Srpen'],
    ['Hledej měsíc hned po září.'],
    'Podzim začíná v září, takže celý říjen už je podzimní.'),
  q('mesic-jaro', 'Který měsíc je celý jarní?', 'Duben',
    ['Leden', 'Červenec', 'Říjen', 'Srpen'],
    ['Hledej měsíc hned po březnu.'],
    'Jaro začíná v březnu, takže celý duben už je jarní.'),
  num('mesice-obdobi', 'Kolik měsíců zhruba trvá jedno roční období?', 3,
    ['Rok má 12 měsíců a 4 roční období.'],
    'Dvanáct měsíců rozdělených do čtyř ročních období dá zhruba tři měsíce na každé.'),
  q('sneh-taje', 'Proč na jaře taje sníh?', 'Slunce hřeje víc a otepluje se',
    ['Mrzne víc než v zimě', 'Dny jsou kratší než v zimě', 'Slunce svítí méně než v zimě'],
    ['Jak se na jaře mění dny a počasí?'],
    'Na jaře je Slunce výš a svítí déle. Vzduch i zem se oteplí a sníh roztaje.'),
];

/** „Který měsíc přichází po…?“ / „Který měsíc je před…?“ */
function sousedniMesic(rng: Rng): Spec {
  const i = rng.int(0, 11);
  const after = rng.chance(0.5);
  const at = (d: number) => capitalize(MESICE[(i + d + 12) % 12]);
  if (after) {
    const target = MESICE[(i + 1) % 12];
    return q(`po-${slug(MESICE[i])}`, `Který měsíc přichází po ${MESICE_6[i]}?`, at(1), [at(-1), at(2), at(3)],
      ['Řekni si měsíce popořadě od ledna.'],
      i === 11
        ? 'Po prosinci přichází leden a s ním nový rok.'
        : `Po ${MESICE_6[i]} přichází ${target}. Měsíce jdou za sebou pořád stejně.`);
  }
  const target = MESICE[(i + 11) % 12];
  return q(`pred-${slug(MESICE[i])}`, `Který měsíc je před ${MESICE_7[i]}?`, at(-1), [at(1), at(-2), at(-3)],
    ['Řekni si měsíce popořadě od ledna.'],
    i === 0
      ? 'Před lednem je prosinec – poslední měsíc starého roku.'
      : `Před ${MESICE_7[i]} je ${target}. Měsíce jdou za sebou pořád stejně.`);
}

/** Seřazení čtyř měsíců od začátku roku. */
function radaMesicu(rng: Rng): Spec {
  const idx = rng.shuffle([...Array(12).keys()]).slice(0, 4).sort((a, b) => a - b);
  const names = idx.map((i) => capitalize(MESICE[i]));
  return ord(`rada-${idx.map((i) => i + 1).join('-')}`, 'Seřaď měsíce od začátku roku.', names,
    ['Který z nich je v roce nejdřív?', 'Řekni si měsíce popořadě od ledna.'],
    `V roce jdou za sebou takto: ${idx.map((i) => MESICE[i]).join(', ')}.`);
}

// ---------------------------------------------------------------------------
// L3 – kalendář, strategie zvířat v zimě, jevy počasí, jak to víme

const L3: Spec[] = [
  ord('od-podzimu', 'Seřaď roční období. Začni podzimem.', ['Podzim', 'Zima', 'Jaro', 'Léto'],
    ['Co přichází po podzimu?'],
    'Po podzimu je zima, pak jaro a léto. Roční období se střídají pořád dokola.'),
  ord('od-zimy', 'Seřaď roční období. Začni zimou.', ['Zima', 'Jaro', 'Léto', 'Podzim'],
    ['Co přichází po zimě?'],
    'Po zimě je jaro, pak léto a podzim. Potom zase zima.'),
  ord('jablon', 'Seřaď, jak se mění jabloň během roku. Začni jarem.',
    ['Kvete', 'Má malá zelená jablíčka', 'Jablka dozrávají', 'Stojí bez listí'],
    ['Z čeho vyrostou jablka?', 'Kdy stojí stromy holé?'],
    'Na jaře jabloň kvete, v létě rostou zelená jablíčka, na podzim jablka dozrávají a v zimě strom stojí bez listí.'),
  q('zimni-spanek-ne', 'Které z těchto zvířat nespí zimním spánkem?', 'Veverka',
    ['Ježek', 'Netopýr', 'Sysel', 'Plch'],
    ['Které zvíře si na podzim schovává zásoby na zimu?'],
    'Veverka je v zimě vzhůru a hledá schované oříšky. Ježek, netopýr, sysel i plch zimu prospí – plch až sedm měsíců.'),
  q('jezek-tuk', 'Proč ježek na podzim tolik jí?', 'Ze zásob tuku žije celou zimu',
    ['Aby mu narostly delší bodliny', 'Aby mohl v zimě běhat po sněhu', 'Aby mohl odletět na jih'],
    ['Co ježek jí, když celou zimu spí?'],
    'Během zimního spánku ježek nejí. Žije ze zásob tuku, které si na podzim vytvořil.'),
  q('spanek-telo', 'Co se děje s tělem ježka při zimním spánku?', 'Vychladne a srdce bije pomalu',
    ['Zahřeje se a srdce bije rychle', 'Rostou mu nové bodliny', 'Nic, ježek jen zavře oči'],
    ['Tělo šetří co nejvíc sil.'],
    'Při zimním spánku ježkovi vychladne tělo a srdce bije mnohem pomaleji. Tak mu zásoby tuku vydrží do jara. Vědci to zjistili měřením teploty a tepu.'),
  q('zaby-zima', 'Jak přečkají zimu žáby?', 'Strnulé v bahně nebo v úkrytu',
    ['Odletí s čápy do Afriky', 'Skáčou po sněhu', 'Schovají se v ptačí budce'],
    ['Žáby nemají srst ani peří, které by je hřálo.'],
    'Žáby v zimě strnou – zahrabou se do bahna nebo se schovají pod listí a kameny. Na jaře se zase proberou.'),
  q('krouzkovani', 'Jak ornitologové zjistili, kam vlaštovky na zimu letí?', 'Dávali jim na nohy kroužky',
    ['Našli je spící v bahně', 'Sledovali je dalekohledem až do Afriky', 'Uhodli to podle počasí'],
    ['Jak poznáš ptáka, kterého už někdo jednou viděl?'],
    'Ornitologové dávají ptákům na nohu lehký kroužek s číslem. Když kroužkovanou vlaštovku někdo najde v Africe, víme, kam letěla. Poprvé se to podařilo v roce 1912.'),
  q('unor', 'Který měsíc má nejméně dní?', 'Únor',
    ['Leden', 'Duben', 'Září', 'Listopad'],
    ['Tento měsíc má jen 28 dní, někdy 29.'],
    'Únor má 28 dní, v přestupném roce 29. Všechny ostatní měsíce mají 30 nebo 31 dní.'),
  num('unor-prestupny', 'Kolik dní má únor v přestupném roce?', 29,
    ['Obyčejný únor má 28 dní. V přestupném roce jeden den přibude.'],
    'V přestupném roce se k únoru přidává jeden den navíc, 29. února.'),
  num('mesice-31', 'Kolik měsíců v roce má 31 dní?', 7,
    ['Počítej na kloubech pěsti: každý kloub je měsíc s 31 dny.'],
    '31 dní mají leden, březen, květen, červenec, srpen, říjen a prosinec – to je sedm měsíců.',
    { difficulty: 0.3 }),
  q('jinovatka', 'Jak se jmenují křehké ledové jehličky, které za mlhy a silného mrazu narostou na větvích stromů?', 'Jinovatka',
    ['Rosa', 'Kroupy', 'Náledí'],
    ['Rosa je z kapiček vody. Tohle jsou ale jehličky ledu.'],
    'Jinovatka vzniká za silného mrazu, hlavně při mlze. Vodní pára ze vzduchu zmrzne přímo na větvičkách a narůstají z ní ledové jehličky. Stromy pak vypadají jako pocukrované.'),
  q('naledi', 'Jak se jmenuje led na chodníku, když prší na zmrzlou zem?', 'Náledí',
    ['Jinovatka', 'Kroupy', 'Rampouch', 'Rosa'],
    ['Chodník je pak kluzký jako kluziště.'],
    'Když prší a zem je zmrzlá, kapky na ní hned zmrznou. Vznikne náledí a chodníky kloužou.'),
  q('leto-vecer', 'Proč si u nás v létě můžeš hrát venku dlouho do večera?', 'Slunce zapadá později',
    ['Večer jasně svítí hvězdy', 'Hodiny v létě jdou pomaleji', 'Měsíc v létě svítí jako Slunce'],
    ['Kdy se v létě začne stmívat?'],
    'V létě Slunce vychází brzy ráno a zapadá pozdě večer. V červnu je u nás světlo až 16 hodin denně.'),
  q('tma-rano', 'Ve kterém z těchto měsíců je ráno nejdéle tma?', 'V prosinci',
    ['V červnu', 'V září', 'V dubnu'],
    ['Kdy jsou dny nejkratší?'],
    'V prosinci jsou dny nejkratší. Slunce u nás vychází až kolem osmé hodiny ráno.'),
  kdy('slunce-vysoko', 'Kdy je Slunce v poledne na obloze nejvýš?', LETO,
    ['Kdy Slunce nejvíc hřeje?'],
    'V létě vystoupá Slunce v poledne nejvýš. Proto víc hřeje a dny jsou dlouhé.'),
  q('vcely', 'Co dělají včely v zimě?', 'Tisknou se k sobě v úlu a hřejí se',
    ['Odletí do teplých krajin', 'Létají po sněhu pro nektar', 'Každá spí sama v jiné květině'],
    ['V zimě žádné květy nekvetou.'],
    'Včely zůstávají v zimě v úlu. Tisknou se k sobě do chomáče, třesou svaly a tím se zahřívají. Živí se medem, který si v létě připravily z nektaru.'),
  q('veverka-orisky', 'Proč veverka na podzim schovává oříšky?', 'Aby měla v zimě co jíst',
    ['Aby z nich postavila hnízdo', 'Aby si s nimi hrála na jaře', 'Aby jí nepadaly ze stromu'],
    ['V zimě na stromech žádné oříšky nerostou.'],
    'Veverka si na podzim dělá zásoby a v zimě je hledá. Z oříšků, na které zapomene, někdy vyroste nový strom.'),
  q('ryby-led', 'Kde jsou ryby, když rybník zamrzne?', 'Ve vodě pod ledem, u dna',
    ['Zamrznou v ledu', 'Odplavou do moře', 'Vyskočí na břeh'],
    ['Zamrzne celý rybník, nebo jen jeho hladina?'],
    'Rybník zamrzá odshora. Pod ledem zůstává voda a u dna má i v zimě kolem 4 stupňů. Tam ryby v klidu přečkají zimu.'),
  q('zacatek-jara', 'Ve kterém měsíci začíná jaro?', 'V březnu',
    ['V únoru', 'V dubnu', 'V květnu', 'V lednu'],
    ['Jaro začíná ve třetím měsíci roku.'],
    'Jaro začíná v březnu, podle kalendáře kolem 20. března.'),
  q('zacatek-leta', 'Ve kterém měsíci začíná léto?', 'V červnu',
    ['V květnu', 'V červenci', 'V srpnu', 'V dubnu'],
    ['Léto začíná ještě před prázdninami.'],
    'Léto začíná v červnu, podle kalendáře kolem 21. června. Tehdy je nejdelší den v roce.'),
  q('zacatek-podzimu', 'Ve kterém měsíci začíná podzim?', 'V září',
    ['V srpnu', 'V říjnu', 'V listopadu', 'V červenci'],
    ['Podzim začíná ve stejném měsíci jako škola.'],
    'Podzim začíná v září, podle kalendáře kolem 22. září.'),
  q('zacatek-zimy', 'Ve kterém měsíci začíná zima?', 'V prosinci',
    ['V listopadu', 'V lednu', 'V únoru', 'V říjnu'],
    ['Zima začíná těsně před Vánoci.'],
    'Zima začíná v prosinci, podle kalendáře kolem 21. prosince. Tehdy je nejkratší den v roce.'),
];

/** „Má duben 30, nebo 31 dní?“ – únor vynecháváme, ten má svou otázku. */
function dniVMesici(rng: Rng): Spec {
  const i = rng.pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const days = DNI_V_MESICI[i];
  return fixed(`dni-${slug(MESICE[i])}`, `Má ${MESICE[i]} 30, nebo 31 dní?`, ['30 dní', '31 dní'], days === 30 ? 0 : 1,
    ['Počítej na kloubech pěsti: kloub znamená 31 dní, důlek mezi klouby méně.'],
    `${capitalize(MESICE[i])} má ${days} dní. Na kloubech pěsti vycházejí měsíce s 31 dny na klouby a kratší měsíce do důlků.`);
}

// ---------------------------------------------------------------------------
// L4 – slunovrat, rovnodennost, délka dne, polokoule, přestupný rok

const L4: Spec[] = [
  q('letni-slunovrat', 'Kdy je letní slunovrat, nejdelší den v roce?', 'Kolem 21. června',
    ['Kolem 21. prosince', 'Kolem 21. března', 'Kolem 1. května', 'Kolem 1. září'],
    ['Je to na začátku léta.'],
    'Letní slunovrat je kolem 21. června. Slunce je v poledne nejvýš a u nás svítí asi 16 hodin.'),
  q('zimni-slunovrat', 'Kdy je zimní slunovrat, nejkratší den v roce?', 'Kolem 21. prosince',
    ['Kolem 21. června', 'Kolem 23. září', 'Kolem 1. února', 'Kolem 1. listopadu'],
    ['Je to na začátku zimy, pár dní před Vánoci.'],
    'Zimní slunovrat je kolem 21. prosince. Slunce je v poledne nejníž a u nás svítí jen asi 8 hodin. Potom se dny zase prodlužují.'),
  q('rovnodennost', 'Co platí o dni a noci v době rovnodennosti?', 'Jsou zhruba stejně dlouhé',
    ['Den je dvakrát delší než noc', 'Noc trvá celý den', 'Den je nejkratší v roce'],
    ['Napoví ti samo slovo: rovno-dennost.'],
    'O rovnodennosti trvá den i noc asi 12 hodin. Bývá dvakrát do roka – na jaře a na podzim.'),
  q('jarni-rovnodennost', 'Ve kterém měsíci je jarní rovnodennost?', 'V březnu',
    ['V červnu', 'V září', 'V prosinci', 'V květnu'],
    ['Jarní rovnodennost je začátek jara podle kalendáře.'],
    'Jarní rovnodennost je kolem 20. března. Tím začíná astronomické jaro.'),
  q('podzimni-rovnodennost', 'Ve kterém měsíci je podzimní rovnodennost?', 'V září',
    ['V březnu', 'V červnu', 'V prosinci', 'V listopadu'],
    ['Podzimní rovnodennost je začátek podzimu podle kalendáře.'],
    'Podzimní rovnodennost je kolem 22. září. Tím začíná astronomický podzim.'),
  ord('ctyri-body', 'Seřaď, jak jdou za sebou během roku. Začni jarní rovnodenností.',
    ['Jarní rovnodennost', 'Letní slunovrat', 'Podzimní rovnodennost', 'Zimní slunovrat'],
    ['Každý z nich začíná jedno roční období.'],
    'Jarní rovnodennost je v březnu, letní slunovrat v červnu, podzimní rovnodennost v září a zimní slunovrat v prosinci.'),
  ord('den-roste', 'Seřaď data podle délky dne u nás. Začni nejkratším dnem.',
    ['21. prosince', '1. února', '21. března', '1. května', '21. června'],
    ['Kdy je nejkratší den v roce?', 'Od zimního slunovratu se dny prodlužují až do letního.'],
    'Od 21. prosince se dny prodlužují: v únoru je světla víc, kolem 21. března trvá den asi jako noc a 21. června je den nejdelší.'),
  ord('den-klesa', 'Seřaď data podle délky dne u nás. Začni nejdelším dnem.',
    ['21. června', '1. srpna', '23. září', '1. listopadu', '21. prosince'],
    ['Kdy je nejdelší den v roce?', 'Od letního slunovratu se dny zkracují až do zimního.'],
    'Po 21. červnu se dny zkracují: v srpnu jsou ještě dlouhé, kolem 23. září trvá den asi jako noc a 21. prosince je nejkratší.'),
  q('den-leto-hodiny', 'Jak dlouho u nás svítí Slunce o letním slunovratu?', 'Asi 16 hodin',
    ['Asi 8 hodin', 'Asi 12 hodin', 'Celých 24 hodin'],
    ['Slunce vychází kolem páté ráno a zapadá kolem deváté večer.'],
    'V Česku vychází Slunce o letním slunovratu kolem 5. hodiny ráno a zapadá kolem 21. hodiny. Den trvá asi 16 hodin.'),
  q('den-zima-hodiny', 'Jak dlouho u nás svítí Slunce o zimním slunovratu?', 'Asi 8 hodin',
    ['Asi 16 hodin', 'Asi 12 hodin', 'Vůbec nevyjde'],
    ['Slunce vychází kolem osmé ráno a zapadá kolem čtvrté odpoledne.'],
    'V Česku vychází Slunce 21. prosince kolem 8. hodiny a zapadá kolem 16. hodiny. Den trvá jen asi 8 hodin.'),
  q('pulnocni-slunce', 'V severním Norsku v létě Slunce celou noc nezapadne. Jak se tomu říká?', 'Půlnoční slunce',
    ['Polární noc', 'Zatmění Slunce', 'Rovnodennost', 'Polární záře'],
    ['Pomysli, v kolik hodin tam Slunce svítí, když u nás je tma.'],
    'Za severním polárním kruhem v létě Slunce nezapadá ani o půlnoci. Říká se tomu půlnoční slunce.'),
  q('polarni-noc', 'Jak se říká době, kdy za polárním kruhem Slunce celý den nevyjde?', 'Polární noc',
    ['Půlnoční slunce', 'Rovnodennost', 'Zatmění Měsíce', 'Polární záře'],
    ['Když Slunce vůbec nevyjde, je pořád tma jako v noci.'],
    'V zimě za polárním kruhem Slunce celé dny vůbec nevyjde. Této době se říká polární noc.'),
  q('leto-teplo', 'Proč je u nás v létě tepleji než v zimě?', 'Slunce je výš a svítí déle',
    ['Země je v létě blíž Slunci', 'Slunce v létě víc hoří', 'V létě nefouká vítr'],
    ['Porovnej, jak vysoko je Slunce v poledne v létě a v zimě.'],
    'V létě je Slunce vysoko, jeho paprsky dopadají strměji a svítí asi 16 hodin denně. Blízkostí Slunce to není – nejblíž mu je Země začátkem ledna.'),
  q('stin', 'Kdy je tvůj stín v poledne nejdelší?', 'V zimě',
    ['V létě', 'Na jaře', 'Je pořád stejně dlouhý'],
    ['Čím níž je Slunce, tím delší je stín.'],
    'V zimě je Slunce v poledne nízko nad obzorem, a proto vrhá dlouhé stíny. V létě je vysoko a stíny jsou krátké.'),
  num('dni-v-roce', 'Kolik dní má obyčejný rok, který není přestupný?', 365,
    ['Je to víc než 300 a méně než 400.', 'Tolik dní trvá, než Země oběhne Slunce.'],
    'Obyčejný rok má 365 dní. Přestupný rok má 366, protože má navíc 29. února.'),
  q('prestupny-proc', 'Proč máme přestupné roky s 29. únorem?', 'Země oběhne Slunce za 365 a čtvrt dne',
    ['Únor je moc krátký', 'Aby byly delší prázdniny', 'Měsíc oběhne Zemi za 29 dní'],
    ['Kolik přesně trvá, než Země oběhne Slunce?'],
    'Oběh Země kolem Slunce trvá asi 365 dní a 6 hodin. Za čtyři roky se nasbírá celý den navíc a ten přidáme jako 29. února.'),
  q('prestupny-kdy', 'Jak často bývá přestupný rok?', 'Obvykle každý čtvrtý rok',
    ['Každý rok', 'Každý druhý rok', 'Jednou za sto let'],
    ['Za kolik let se nasbírá celý den, když každý rok přibude čtvrt dne?'],
    'Každý rok se nasbírá čtvrt dne navíc, takže za čtyři roky je to celý den. Přestupný byl třeba rok 2024 a další bude 2028.'),
  q('australie', 'Když je u nás léto, jaké roční období je v Austrálii?', 'Zima',
    ['Také léto', 'Jaro', 'Podzim'],
    ['Austrálie leží na jižní polokouli Země.'],
    'Na jižní polokouli jsou roční období opačně. Když je u nás léto, v Austrálii je zima.'),
  q('vanoce-australie', 'Jaké počasí mívají o Vánocích v Sydney v Austrálii?', 'Letní teplo',
    ['Sníh a mráz', 'Polární noc', 'Jarní tání sněhu'],
    ['V prosinci je u nás zima. A na druhé polokouli?'],
    'V Austrálii je v prosinci léto. Hodně lidí tam o Vánocích jde k moři.'),
  q('listi-barva', 'Proč listy na podzim zežloutnou?', 'Zelené barvivo v listu se rozloží',
    ['Listy natře mráz', 'Listy spálí slunce', 'Listy obarví déšť'],
    ['Proč jsou listy v létě zelené?'],
    'Listy jsou zelené díky barvivu chlorofylu. Na podzim se rozloží a ukážou se žluté a oranžové barvy, které v listu byly schované.'),
  q('slunce-kameny', 'Jak lidé už před mnoha tisíci lety poznali, že se blíží jaro nebo zima?', 'Pozorovali, kde vychází Slunce',
    ['Podívali se do mobilu', 'Poslouchali zprávy v rádiu', 'Počítali mraky'],
    ['Neměli ještě kalendáře ani hodinky. Co ale mohli pozorovat každé ráno?'],
    'Slunce vychází během roku na různých místech obzoru. Lidé si ta místa značili kameny a podle nich poznali slunovraty a rovnodennosti.'),
  q('vychod-leto', 'Kde u nás vychází Slunce v létě?', 'Na severovýchodě',
    ['Na jihovýchodě', 'Na západě', 'Na jihu'],
    ['V létě je den dlouhý a Slunce opisuje po obloze velký oblouk.'],
    'V létě vychází Slunce na severovýchodě a zapadá na severozápadě. V zimě vychází na jihovýchodě.'),
  q('vychod-zima', 'Kde u nás vychází Slunce v zimě?', 'Na jihovýchodě',
    ['Na severovýchodě', 'Na západě', 'Na severu'],
    ['V zimě je den krátký a Slunce opisuje malý oblouk nízko nad jihem.'],
    'V zimě vychází Slunce na jihovýchodě, zůstává nízko nad jihem a zapadá na jihozápadě.'),
];

export const obdobi = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Roční období',
  description: 'Pozorování proměn přírody během roku: měsíce, počasí, zvířata v zimě, délka dne, rovnodennost a slunovrat.',
  rvp: {
    1: ['ČJS-3-4-01', 'ČJS-3-3-01'],
    2: ['ČJS-3-4-01', 'ČJS-3-3-01'],
    3: ['ČJS-3-4-01', 'ČJS-3-3-01'],
    4: ['ČJS-5-4-02'],
  },
  ability: 'znalosti',
  testLike: 'vedomosti',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
  gen: {
    2: (rng) => (rng.chance(0.5) ? sousedniMesic(rng) : radaMesicu(rng)),
    3: dniVMesici,
  },
  genShare: 0.4,
});

export const obdobiCards: KnowledgeCard[] = [
  {
    id: `${ID}.zimni-spanek`,
    skillId: ID,
    level: 1,
    emoji: '🦔',
    title: 'Ježek šetří na zimu',
    text: 'Při zimním spánku ježkovi vychladne tělo a srdce mu bije mnohem pomaleji. Díky tomu mu zásoby tuku vydrží až do jara.',
  },
  {
    id: `${ID}.vlastovky`,
    skillId: ID,
    level: 3,
    emoji: '🐦',
    title: 'Kam mizí vlaštovky',
    text: 'Vlaštovky každý podzim odlétají až do Afriky a na jaře se vracejí. Často hnízdí na stejném místě jako loni.',
    fix: {
      before: 'Dřív si i učenci mysleli, že vlaštovky přezimují schované v bahně na dně rybníků.',
      evidence: 'Ornitologové dávali ptákům na nohy lehké kroužky s čísly. V roce 1912 se vlaštovka kroužkovaná v Anglii našla až v jižní Africe. Dnes pomáhají i drobné přístroje na zádech ptáků.',
    },
  },
  {
    id: `${ID}.slunovrat`,
    skillId: ID,
    level: 4,
    emoji: '🌞',
    title: 'Nejdelší a nejkratší den',
    text: 'O letním slunovratu kolem 21. června svítí u nás Slunce asi 16 hodin, o zimním jen asi 8. Za polárním kruhem Slunce v létě celé dny vůbec nezapadá.',
  },
];
