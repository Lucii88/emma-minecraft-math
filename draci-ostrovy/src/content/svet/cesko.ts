// Česko a Evropa: hlavní město, sousedé, řeky, hory, kraje a krajská města,
// státní symboly (vlajka popsaná slovy, hymna), státy a hlavní města Evropy
// včetně severských zemí Vikingů, Alpy.

import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard } from '../../core/types';
import { fixed, num, pickSome, q, slug } from './common';

const ID = 'svet.cesko';

// ---------------------------------------------------------------------------
// Tabulky

/** Stát: 1. pád, 2. pád, 7. pád i s předložkou („se Slovenskem“), hlavní město, soused Česka?, zajímavost. */
type Stat = { nom: string; gen: string; ins: string; capital: string; neighbor: boolean; fact?: string };

/** Hlavní a krajská města v množném čísle („Helsinky jsou“, „Pardubice jsou“). */
const PLURAL = new Set(['Helsinky', 'Atény', 'České Budějovice', 'Karlovy Vary', 'Pardubice']);
const je = (capital: string) => (PLURAL.has(capital) ? 'jsou' : 'je');

const s = (nom: string, gen: string, ins: string, capital: string, neighbor = false, fact?: string): Stat => ({ nom, gen, ins, capital, neighbor, fact });

export const STATY_L4: Stat[] = [
  s('Německo', 'Německa', 's Německem', 'Berlín', true, 'Stojí tam slavná Braniborská brána.'),
  s('Polsko', 'Polska', 's Polskem', 'Varšava', true, 'Protéká jí řeka Visla.'),
  s('Slovensko', 'Slovenska', 'se Slovenskem', 'Bratislava', true, 'Protéká jí Dunaj.'),
  s('Rakousko', 'Rakouska', 's Rakouskem', 'Vídeň', true, 'Protéká jí Dunaj.'),
  s('Norsko', 'Norska', 's Norskem', 'Oslo', false, 'Norsko je severská země Vikingů s mnoha fjordy.'),
  s('Švédsko', 'Švédska', 'se Švédskem', 'Stockholm', false, 'Stockholm stojí na mnoha ostrovech.'),
  s('Dánsko', 'Dánska', 's Dánskem', 'Kodaň', false, 'V přístavu tam sedí socha Malé mořské víly.'),
  s('Island', 'Islandu', 's Islandem', 'Reykjavík', false, 'Je to nejsevernější hlavní město státu na světě.'),
  s('Finsko', 'Finska', 's Finskem', 'Helsinky', false),
  s('Francie', 'Francie', 's Francií', 'Paříž', false, 'Stojí tam Eiffelova věž.'),
  s('Itálie', 'Itálie', 's Itálií', 'Řím', false, 'Stojí tam starověké Koloseum.'),
  s('Maďarsko', 'Maďarska', 's Maďarskem', 'Budapešť', false, 'Protéká jí Dunaj.'),
  s('Španělsko', 'Španělska', 'se Španělskem', 'Madrid', false),
  s('Spojené království', 'Spojeného království', 'se Spojeným královstvím', 'Londýn', false, 'Protéká jím řeka Temže.'),
];

export const STATY_L5: Stat[] = [
  ...STATY_L4,
  s('Portugalsko', 'Portugalska', 's Portugalskem', 'Lisabon'),
  s('Řecko', 'Řecka', 's Řeckem', 'Atény', false, 'Nad městem stojí starověká Akropole.'),
  s('Nizozemsko', 'Nizozemska', 's Nizozemskem', 'Amsterdam', false, 'Město je plné kanálů.'),
  s('Belgie', 'Belgie', 's Belgií', 'Brusel'),
  s('Irsko', 'Irska', 's Irskem', 'Dublin'),
  s('Švýcarsko', 'Švýcarska', 'se Švýcarskem', 'Bern'),
  s('Chorvatsko', 'Chorvatska', 's Chorvatskem', 'Záhřeb'),
  s('Slovinsko', 'Slovinska', 'se Slovinskem', 'Lublaň'),
  s('Rumunsko', 'Rumunska', 's Rumunskem', 'Bukurešť'),
  s('Bulharsko', 'Bulharska', 's Bulharskem', 'Sofie'),
  s('Litva', 'Litvy', 's Litvou', 'Vilnius'),
  s('Lotyšsko', 'Lotyšska', 's Lotyšskem', 'Riga'),
  s('Estonsko', 'Estonska', 's Estonskem', 'Tallinn'),
];

function hlavniMesto(pool: Stat[]) {
  return (rng: Rng): Spec => {
    const st = rng.pick(pool);
    const wrong = pickSome(rng, pool.filter((x) => x !== st).map((x) => x.capital), 3);
    return q(`mesto-${slug(st.nom)}`, `Jak se jmenuje hlavní město ${st.gen}?`, st.capital, wrong,
      ['Vzpomeň si na mapu Evropy.', 'Hlavní město bývá největší město státu.'],
      `Hlavním městem ${st.gen} ${je(st.capital)} ${st.capital}.${st.fact ? ` ${st.fact}` : ''}`);
  };
}

function kteryStat(pool: Stat[]) {
  return (rng: Rng): Spec => {
    const st = rng.pick(pool);
    const wrong = pickSome(rng, pool.filter((x) => x !== st).map((x) => x.nom), 3);
    return q(`stat-${slug(st.capital)}`, `Hlavním městem kterého státu ${je(st.capital)} ${st.capital}?`, st.nom, wrong,
      ['Vzpomeň si na mapu Evropy.'],
      `${st.capital} ${je(st.capital)} hlavním městem ${st.gen}.${st.fact ? ` ${st.fact}` : ''}`);
  };
}

/** Sousedí Česko s…? (sousedé a státy, které se jim podobají polohou) */
const SOUSEDI_OTAZKA: Stat[] = [
  ...STATY_L4.filter((x) => ['Německo', 'Polsko', 'Slovensko', 'Rakousko', 'Maďarsko', 'Itálie', 'Francie', 'Dánsko'].includes(x.nom)),
  ...STATY_L5.filter((x) => ['Švýcarsko', 'Slovinsko', 'Chorvatsko', 'Nizozemsko', 'Belgie'].includes(x.nom)),
];

function sousedi(rng: Rng): Spec {
  const st = rng.pick(SOUSEDI_OTAZKA);
  return fixed(`soused-${slug(st.nom)}`, `Sousedí Česko ${st.ins}?`, ['Ano, sousedí', 'Ne, nesousedí'], st.neighbor ? 0 : 1,
    ['Česko má jen čtyři sousedy: na západě, na severu, na východě a na jihu.'],
    st.neighbor
      ? `Ano. ${st.nom} je jedním ze čtyř sousedů Česka.`
      : `Ne. Česko sousedí jen s Německem, Polskem, Slovenskem a Rakouskem.`);
}

/** Hory: [vrchol, pohoří v 6. pádě s předložkou]. */
const HORY: [string, string, string][] = [
  ['Sněžka', 'V Krkonoších', 'Sněžka je nejvyšší hora Krkonoš i celého Česka.'],
  ['Praděd', 'V Jeseníkách', 'Praděd je nejvyšší hora Jeseníků. Leží na pomezí Moravy a Slezska.'],
  ['Lysá hora', 'V Beskydech', 'Lysá hora je nejvyšší hora Moravskoslezských Beskyd.'],
  ['Radhošť', 'V Beskydech', 'Radhošť je známá hora v Beskydech.'],
  ['Klínovec', 'V Krušných horách', 'Klínovec je nejvyšší hora Krušných hor.'],
  ['Plechý', 'Na Šumavě', 'Plechý je nejvyšší hora české části Šumavy.'],
  ['Boubín', 'Na Šumavě', 'Boubín je hora na Šumavě s pralesem na úbočí.'],
];
const POHORI = ['V Krkonoších', 'V Jeseníkách', 'V Beskydech', 'V Krušných horách', 'Na Šumavě'];

function kdeJeHora(rng: Rng): Spec {
  const [hora, pohori, explain] = rng.pick(HORY);
  return q(`hora-${slug(hora)}`, `Ve kterých horách leží ${hora}?`, pohori, pickSome(rng, POHORI, 3, [pohori]),
    ['Podívej se na mapu Česka: kde jsou která pohoří?'],
    explain);
}

/** Krajská města (bez Středočeského kraje, jehož úřad sídlí v Praze). */
export const KRAJE: [string, string][] = [
  ['Jihočeského kraje', 'České Budějovice'],
  ['Plzeňského kraje', 'Plzeň'],
  ['Karlovarského kraje', 'Karlovy Vary'],
  ['Ústeckého kraje', 'Ústí nad Labem'],
  ['Libereckého kraje', 'Liberec'],
  ['Královéhradeckého kraje', 'Hradec Králové'],
  ['Pardubického kraje', 'Pardubice'],
  ['kraje Vysočina', 'Jihlava'],
  ['Jihomoravského kraje', 'Brno'],
  ['Olomouckého kraje', 'Olomouc'],
  ['Zlínského kraje', 'Zlín'],
  ['Moravskoslezského kraje', 'Ostrava'],
];

function krajskeMesto(rng: Rng): Spec {
  const [kraj, mesto] = rng.pick(KRAJE);
  const wrong = pickSome(rng, KRAJE.map(([, m]) => m), 3, [mesto]);
  return q(`kraj-${slug(mesto)}`, `Které město je krajským městem ${kraj}?`, mesto, wrong,
    ['Podívej se na mapu krajů Česka.', 'Krajské město často dalo kraji jméno.'],
    `Krajským městem ${kraj} ${je(mesto)} ${mesto}.`);
}

// ---------------------------------------------------------------------------
// L2 – Praha, sousedé, řeky, Sněžka, vlajka a hymna

const L2: Spec[] = [
  q('praha', 'Jak se jmenuje hlavní město Česka?', 'Praha',
    ['Brno', 'Ostrava', 'Plzeň', 'Olomouc'],
    ['Je to největší město Česka.'],
    'Hlavní město Česka je Praha. Sídlí v ní prezident, vláda i parlament.'),
  q('vltava-praha', 'Která řeka protéká Prahou?', 'Vltava',
    ['Labe', 'Morava', 'Odra', 'Dyje'],
    ['Přes tuto řeku vede Karlův most.'],
    'Prahou protéká Vltava. Vede přes ni i slavný Karlův most.'),
  q('snezka', 'Jak se jmenuje nejvyšší hora Česka?', 'Sněžka',
    ['Říp', 'Lysá hora', 'Praděd', 'Ještěd'],
    ['Leží v Krkonoších a sníh tam bývá i na jaře.'],
    'Nejvyšší horou Česka je Sněžka v Krkonoších. Měří přes 1 600 metrů.'),
  q('snezka-hory', 'Ve kterých horách je Sněžka?', 'V Krkonoších',
    ['Na Šumavě', 'V Jeseníkách', 'V Beskydech'],
    ['Tyto hory jsou na severu Česka u hranic s Polskem.'],
    'Sněžka je v Krkonoších, přímo na hranici s Polskem.'),
  q('hymna', 'Jak se jmenuje česká státní hymna?', 'Kde domov můj',
    ['Ach synku, synku', 'Holka modrooká', 'Skákal pes'],
    ['Hraje se třeba na sportovních zápasech, když vyhraje Česko.'],
    'Česká hymna se jmenuje Kde domov můj. Když hraje, stojíme.'),
  q('vlajka', 'Jak vypadá česká vlajka?', 'Bílý a červený pruh a modrý klín',
    ['Bílý a červený pruh bez klínu', 'Tři svislé pruhy', 'Modrý kříž na bílém'],
    ['Česká vlajka má tři barvy.'],
    'Česká vlajka má nahoře bílý pruh, dole červený a od žerdi modrý klín. Bílo-červenou vlajku bez klínu má Polsko.'),
  num('sousede-pocet', 'S kolika státy sousedí Česko?', 4,
    ['Obejdi na mapě hranici Česka dokola.'],
    'Česko sousedí se čtyřmi státy: s Německem, Polskem, Slovenskem a Rakouskem.'),
  q('soused', 'Který z těchto států sousedí s Českem?', 'Polsko',
    ['Maďarsko', 'Itálie', 'Francie', 'Švýcarsko'],
    ['Česko má čtyři sousedy: na západě, na severu, na východě a na jihu.'],
    'Polsko sousedí s Českem na severu. Maďarsko, Itálie, Francie ani Švýcarsko s námi hranici nemají.'),
  q('ceskoslovensko', 'Se kterým státem tvořilo Česko do roku 1993 Československo?', 'Se Slovenskem',
    ['S Polskem', 'S Německem', 'S Maďarskem'],
    ['Napoví ti samotné slovo Česko-slovensko.'],
    'Česko a Slovensko tvořily společný stát Československo. Od 1. ledna 1993 jsou to dva samostatné státy.'),
  q('more', 'Má Česko moře?', 'Ne, nemá',
    ['Ano, na severu', 'Ano, na jihu', 'Ano, u Prahy'],
    ['Podívej se na mapu Evropy. Dotýká se Česko moře?'],
    'Česko moře nemá, je to vnitrozemský stát. K moři se jezdí přes sousední státy.'),
  q('svetadil', 'Ve kterém světadílu leží Česko?', 'V Evropě',
    ['V Asii', 'V Africe', 'V Americe'],
    ['Leží tam i Německo a Polsko.'],
    'Česko leží ve střední Evropě.'),
  q('krkonose', 'Kde v Česku leží Krkonoše?', 'Na severu u hranic s Polskem',
    ['Na jihu u Rakouska', 'Uprostřed u Prahy', 'Na východě u Slovenska'],
    ['Je tam nejvyšší hora Česka.'],
    'Krkonoše leží na severu Česka, na hranici s Polskem. Je v nich Sněžka.'),
  q('soused-jih', 'Který soused leží na jih od Česka?', 'Rakousko',
    ['Polsko', 'Německo', 'Maďarsko'],
    ['Jeho hlavní město je Vídeň.'],
    'Na jihu sousedí Česko s Rakouskem. Na severu je Polsko, na západě Německo a na východě Slovensko. Maďarsko s námi nesousedí.'),
  q('soused-zapad', 'Který soused leží na západ od Česka?', 'Německo',
    ['Polsko', 'Slovensko', 'Rakousko'],
    ['Jeho hlavní město je Berlín.'],
    'Na západě sousedí Česko s Německem. S Německem sousedíme i na severozápadě.'),
  q('soused-vychod', 'Který soused leží na východ od Česka?', 'Slovensko',
    ['Německo', 'Rakousko', 'Maďarsko'],
    ['Jeho hlavní město je Bratislava.'],
    'Na východě sousedí Česko se Slovenskem. Maďarsko s námi nesousedí.'),
  q('soused-sever', 'Který soused leží na sever od Česka?', 'Polsko',
    ['Rakousko', 'Slovensko', 'Maďarsko'],
    ['Jeho hlavní město je Varšava.'],
    'Na severu sousedí Česko s Polskem. Na severozápadě je ještě Německo.'),
  q('labe-mesto', 'Kterým městem protéká Labe?', 'Ústí nad Labem',
    ['Brno', 'Plzeň', 'Ostrava'],
    ['Pozorně si přečti jména měst.'],
    'Labe protéká Ústím nad Labem, ale také Hradcem Králové, Pardubicemi a Děčínem.'),
  q('karluv-most', 'Přes kterou řeku vede Karlův most?', 'Přes Vltavu',
    ['Přes Labe', 'Přes Moravu', 'Přes Odru'],
    ['Karlův most je v Praze.'],
    'Karlův most v Praze vede přes Vltavu. Postavit ho dal král Karel IV.'),
  q('orloj', 'Ve kterém městě je slavný orloj na Staroměstské radnici?', 'V Praze',
    ['V Brně', 'V Ostravě', 'V Plzni'],
    ['Staroměstské náměstí je v hlavním městě.'],
    'Pražský orloj je jeden z nejstarších orlojů na světě, které ještě fungují. Ukazuje čas i polohu Slunce a Měsíce.'),
];

// ---------------------------------------------------------------------------
// L3 – kraje, řeky a kam tečou, pohoří

const L3: Spec[] = [
  num('kraje', 'Kolik krajů má Česko, i s Prahou?', 14,
    ['Praha je sama o sobě také kraj.'],
    'Česko má 14 krajů. Jedním z nich je hlavní město Praha.'),
  q('kraj-co', 'Co je kraj?', 'Velká část státu s krajským městem',
    ['Jedna ulice ve městě', 'Hora na hranici', 'Jiný název pro řeku'],
    ['Česko je rozdělené na čtrnáct takových částí.'],
    'Kraj je velká část státu. Má své krajské město, kde sídlí krajský úřad.'),
  q('zeme', 'Ze kterých tří historických zemí se skládá Česko?', 'Čechy, Morava a Slezsko',
    ['Čechy, Morava a Slovensko', 'Čechy, Bavorsko a Morava', 'Morava, Slezsko a Tatry'],
    ['Slovensko je dnes samostatný stát.'],
    'Česko tvoří Čechy, Morava a část Slezska. Proto jsou ve velkém státním znaku český lev, moravská a slezská orlice.'),
  q('labe-kam', 'Kam až teče Labe?', 'Přes Německo do Severního moře',
    ['Do Černého moře', 'Do Středozemního moře', 'Do Vltavy'],
    ['Labe opouští Česko u Hřenska.'],
    'Labe teče z Krkonoš přes Německo až do Severního moře. Voda z Vltavy tak nakonec doteče do moře.'),
  q('morava-kam', 'Do které řeky se vlévá řeka Morava?', 'Do Dunaje',
    ['Do Labe', 'Do Vltavy', 'Do Odry'],
    ['Je to velká evropská řeka, která teče i Vídní.'],
    'Morava se vlévá do Dunaje. Dunaj pak teče až do Černého moře.'),
  q('odra-kam', 'Do kterého moře teče Odra?', 'Do Baltského moře',
    ['Do Severního moře', 'Do Černého moře', 'Do Středozemního moře'],
    ['Odra teče z Česka přes Polsko na sever.'],
    'Odra pramení v Oderských vrších, teče přes Polsko a vlévá se do Baltského moře.'),
  q('dyje', 'Do které řeky se vlévá Dyje?', 'Do Moravy',
    ['Do Vltavy', 'Do Labe', 'Do Odry'],
    ['Dyje teče na jižní Moravě.'],
    'Dyje se vlévá do Moravy na hranici s Rakouskem a Slovenskem. Jejich voda pak teče přes Dunaj do Černého moře.'),
  q('vltava-kam', 'Do které řeky se vlévá Vltava?', 'Do Labe',
    ['Do Moravy', 'Do Dunaje', 'Do Odry'],
    ['Stane se to u Mělníka.'],
    'Vltava se u Mělníka vlévá do Labe. Odtud voda pokračuje jako Labe.'),
  q('vltava-nejdelsi', 'Která řeka je nejdelší z těch, které tečou celé po našem území?', 'Vltava',
    ['Labe', 'Morava', 'Odra'],
    ['Labe, Odra i Morava odtékají do sousedních států.'],
    'Vltava je nejdelší řeka, která teče celá po našem území. Labe je sice delší, ale větší část jeho toku je v Německu.'),
  q('sumava', 'Které hory jsou na jihozápadě Čech u hranic s Německem a Rakouskem?', 'Šumava',
    ['Krkonoše', 'Jeseníky', 'Beskydy'],
    ['Pramení tam Vltava.'],
    'Šumava leží na jihozápadě Čech. Pramení v ní Vltava.'),
  q('beskydy', 'Které hory jsou na východě Moravy u hranic se Slovenskem?', 'Beskydy',
    ['Šumava', 'Krkonoše', 'Krušné hory'],
    ['Je tam Lysá hora a Radhošť.'],
    'Beskydy leží na východě Moravy. Jsou tam hory Lysá hora a Radhošť.'),
  q('krusne-hory', 'Které hory tvoří hranici s Německem na severozápadě Čech?', 'Krušné hory',
    ['Beskydy', 'Jeseníky', 'Bílé Karpaty'],
    ['Jmenují se podle rudy, která se tam kdysi těžila.'],
    'Krušné hory leží na severozápadě Čech na hranici s Německem. Kdysi se v nich těžila ruda a podle ní dostaly jméno.'),
  q('praded', 'Jak se jmenuje nejvyšší hora Moravy?', 'Praděd',
    ['Sněžka', 'Říp', 'Ještěd'],
    ['Stojí v Jeseníkách.'],
    'Praděd v Jeseníkách je nejvyšší hora Moravy i českého Slezska – leží přímo na jejich pomezí. Sněžka je vyšší, ale leží v Krkonoších na hranici Čech s Polskem.'),
  q('rip', 'Na kterou horu podle pověsti vystoupil praotec Čech?', 'Na Říp',
    ['Na Sněžku', 'Na Praděd', 'Na Ještěd'],
    ['Je to osamělá hora uprostřed roviny u Roudnice.'],
    'Podle staré pověsti vystoupil praotec Čech na horu Říp a rozhlédl se po zemi. Je to pověst, ne doložená historie.'),
  q('prezident', 'Kde sídlí prezident republiky?', 'Na Pražském hradě',
    ['Na Karlštejně', 'Na Špilberku', 'Na Hluboké'],
    ['Hrad stojí nad Vltavou v hlavním městě.'],
    'Prezident republiky sídlí na Pražském hradě. Když tam je, vlaje nad hradem jeho vlajka.'),
  q('brno', 'Které je druhé největší město Česka?', 'Brno',
    ['Ostrava', 'Plzeň', 'Olomouc', 'Liberec'],
    ['Je to největší město na Moravě.'],
    'Druhé největší město Česka je Brno, největší město Moravy. Po něm následuje Ostrava.'),
  q('praha-kraj', 'Je hlavní město Praha zároveň krajem?', 'Ano, je samostatným krajem',
    ['Ne, patří do Středočeského kraje', 'Ne, nepatří do žádného kraje', 'Jen o prázdninách'],
    ['Kolik krajů má Česko a je mezi nimi Praha?'],
    'Praha je hlavní město i samostatný kraj. Středočeský kraj ji obklopuje ze všech stran.'),
  q('narodni-park', 'Který národní park v Česku je nejstarší?', 'Krkonošský národní park',
    ['Národní park Šumava', 'Národní park Podyjí', 'České Švýcarsko'],
    ['Chrání hory se Sněžkou.'],
    'Krkonošský národní park vznikl v roce 1963 jako první v Česku. Chrání vzácné horské louky, rašeliniště i zvířata.'),
];

// ---------------------------------------------------------------------------
// L4 – Evropa, severské země, Alpy, státní symboly

const L4: Spec[] = [
  q('alpy', 'Ve kterém sousedním státě leží velká část Alp?', 'V Rakousku',
    ['V Polsku', 'Na Slovensku', 'V Dánsku'],
    ['Je to jižní soused Česka.'],
    'Alpy jsou nejvyšší hory v naší části Evropy. Velká část z nich leží v Rakousku, dál třeba ve Švýcarsku, Itálii a Francii.'),
  q('mont-blanc', 'Jak se jmenuje nejvyšší hora Alp?', 'Mont Blanc',
    ['Sněžka', 'Gerlachovský štít', 'Olymp'],
    ['Leží na hranici Francie a Itálie.'],
    'Nejvyšší horou Alp je Mont Blanc na hranici Francie a Itálie. Měří přes 4 800 metrů.'),
  q('tatry', 'Kde leží Vysoké Tatry?', 'Na Slovensku a v Polsku',
    ['V Rakousku', 'V Německu', 'V Česku'],
    ['Jsou to velehory kousek na východ od Česka.'],
    'Vysoké Tatry leží na hranici Slovenska a Polska. Nejvyšší je Gerlachovský štít na Slovensku.'),
  q('dunaj', 'Která velká řeka protéká Vídní, Bratislavou i Budapeští?', 'Dunaj',
    ['Labe', 'Rýn', 'Vltava'],
    ['Vlévá se do ní i naše Morava.'],
    'Dunaj protéká mnoha státy a hlavními městy, třeba Vídní, Bratislavou, Budapeští a Bělehradem. Končí v Černém moři.'),
  q('vikingove', 'Ze kterých dnešních zemí pocházeli Vikingové?', 'Z Norska, Švédska a Dánska',
    ['Z Itálie, Řecka a Španělska', 'Z Česka a Polska', 'Z Francie a Belgie'],
    ['Jsou to severské země.'],
    'Vikingové pocházeli ze severu Evropy, z dnešního Norska, Švédska a Dánska. Na lodích doplouvali až na Island a do Severní Ameriky.'),
  q('island', 'Který severský stát je ostrov se sopkami a gejzíry?', 'Island',
    ['Dánsko', 'Švédsko', 'Finsko'],
    ['Jeho jméno znamená Ledová země.'],
    'Island je ostrov v severním Atlantiku. Jsou na něm sopky, gejzíry i ledovce. Osídlili ho Vikingové.'),
  q('fjordy', 'Která země je známá fjordy – dlouhými mořskými zálivy mezi skalami?', 'Norsko',
    ['Maďarsko', 'Rakousko', 'Nizozemsko'],
    ['Je to severská země s dlouhým pobřežím.'],
    'Norsko má dlouhé pobřeží plné fjordů. Vznikly tam, kde ledovce vyhloubily údolí a pak je zalilo moře.'),
  q('vlajka-polsko', 'Která země má vlajku se dvěma pruhy, bílým nahoře a červeným dole?', 'Polsko',
    ['Česko', 'Rakousko', 'Německo'],
    ['Česká vlajka má ještě modrý klín.'],
    'Polská vlajka má bílý pruh nahoře a červený dole. Česká vlajka má navíc modrý klín.'),
  q('klin', 'Kam sahá modrý klín na české vlajce?', 'Od žerdi do poloviny vlajky',
    ['Přes celou vlajku', 'Jen do rohu', 'Není tam žádný klín'],
    ['Představ si vlajku na stožáru.'],
    'Modrý klín vede od žerdi a jeho špička sahá přesně do poloviny délky vlajky.'),
  q('lev', 'Jaký lev je v malém státním znaku Česka?', 'Stříbrný dvouocasý lev',
    ['Zlatý lev s jedním ocasem', 'Černý lev s křídly', 'Zelený lev s mečem'],
    ['Kolik ocasů má český lev?'],
    'V malém státním znaku je stříbrný dvouocasý lev se zlatou korunou na červeném štítě.'),
  q('symboly', 'Co patří mezi státní symboly Česka?', 'Státní vlajka a hymna',
    ['Karlův most', 'Pražský orloj', 'Sněžka'],
    ['Státní symboly popisuje ústava.'],
    'Státní symboly jsou velký a malý státní znak, státní barvy, státní vlajka, vlajka prezidenta, státní pečeť a hymna. Karlův most, orloj i Sněžka jsou slavná místa.'),
  q('stredni-evropa', 'Ve které části Evropy leží Česko?', 'Ve střední Evropě',
    ['V severní Evropě', 'V jižní Evropě', 'Na Pyrenejském poloostrově'],
    ['Podívej se, kde je Česko na mapě Evropy.'],
    'Česko leží uprostřed Evropy, ve střední Evropě. Na sever je Skandinávie, na jih Itálie a Balkán.'),
  q('mena', 'Jakou měnou platíme v Česku?', 'Korunou',
    ['Eurem', 'Zlotým', 'Forintem'],
    ['Na mincích je napsáno Kč.'],
    'V Česku platíme českou korunou. Euro mají třeba Slovensko, Rakousko a Německo.'),
];

// ---------------------------------------------------------------------------
// L5 – státní symboly do hloubky, Evropská unie

const L5: Spec[] = [
  num('symboly-pocet', 'Kolik státních symbolů má Česko podle ústavy?', 7,
    ['Vzpomeň si na znaky, vlajky, barvy, pečeť a hymnu.', 'Znaky jsou dva a vlajky také dvě.'],
    'Státních symbolů je sedm: velký státní znak, malý státní znak, státní barvy, státní vlajka, vlajka prezidenta republiky, státní pečeť a státní hymna.'),
  q('barvy', 'Jaké jsou státní barvy Česka?', 'Bílá, červená a modrá',
    ['Červená a bílá', 'Modrá a žlutá', 'Zelená, bílá a červená'],
    ['Najdeš je na státní vlajce.'],
    'Státní barvy jsou bílá, červená a modrá – stejné jako na vlajce.'),
  q('prezident-vlajka', 'Co je napsáno na vlajce prezidenta republiky?', 'Pravda vítězí',
    ['Kde domov můj', 'Svoboda a mír', 'Česko je nejlepší'],
    ['Kde domov můj jsou první slova hymny.', 'Heslo vychází ze slov Mistra Jana Husa.'],
    'Na vlajce prezidenta je heslo Pravda vítězí. Vychází ze slov Jana Husa. Když je prezident na Pražském hradě, vlaje nad Hradem jeho vlajka.'),
  q('hymna-hudba', 'Kdo složil hudbu české hymny?', 'František Škroup',
    ['Bedřich Smetana', 'Antonín Dvořák', 'Leoš Janáček'],
    ['Hudbu složil ke hře Fidlovačka.'],
    'Hudbu k písni Kde domov můj složil František Škroup, slova napsal Josef Kajetán Tyl.'),
  q('hymna-hra', 'Z které divadelní hry pochází píseň Kde domov můj?', 'Z Fidlovačky',
    ['Z Prodané nevěsty', 'Z Rusalky', 'Z Babičky'],
    ['Hru napsal Josef Kajetán Tyl.'],
    'Píseň Kde domov můj zazněla poprvé v roce 1834 ve hře Fidlovačka. Dnes je to naše hymna.'),
  q('eu', 'Do kterého společenství států patří Česko od roku 2004?', 'Do Evropské unie',
    ['Do Spojených států amerických', 'Do Africké unie', 'Do Arabské ligy'],
    ['Patří do něj i Německo, Rakousko a Slovensko.'],
    'Od roku 2004 je Česko členem Evropské unie. Její občané mohou snadno cestovat, studovat a pracovat v ostatních státech unie.'),
  q('vlajka-rok', 'Kdy byla zavedena vlajka s modrým klínem?', 'V roce 1920',
    ['V roce 1620', 'V roce 1993', 'V roce 2004'],
    ['Bylo to krátce po vzniku Československa.'],
    'Vlajka s modrým klínem se stala vlajkou Československa v roce 1920. Po rozdělení v roce 1993 si ji ponechalo Česko.'),
  q('znak-velky', 'Co je ve velkém státním znaku Česka?', 'Český lev, moravská a slezská orlice',
    ['Jen jeden lev', 'Dva meče a koruna', 'Lípa a slunce'],
    ['Velký znak spojuje všechny tři historické země.'],
    'Velký státní znak má čtyři pole: dvakrát českého lva, moravskou orlici a slezskou orlici.'),
  q('skandinavie', 'Který z těchto států leží na Skandinávském poloostrově?', 'Norsko',
    ['Itálie', 'Španělsko', 'Řecko'],
    ['Skandinávie je na severu Evropy.'],
    'Na Skandinávském poloostrově leží Norsko, Švédsko a kousek Finska. Itálie, Španělsko a Řecko jsou na jihu Evropy.'),
];

export const cesko = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Česko a Evropa',
  description: 'Česko na mapě a v Evropě: hlavní město, sousedé, řeky, hory, kraje, státní symboly a hlavní města evropských států.',
  rvp: {
    2: ['ČJS-3-1-02'],
    3: ['ČJS-3-1-02'],
    4: ['ČJS-5-1-03', 'ČJS-5-1-06'],
    5: ['ČJS-5-1-03', 'ČJS-5-1-06'],
  },
  ability: 'znalosti',
  testLike: 'vedomosti',
  banks: { 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: {
    2: sousedi,
    3: kdeJeHora,
    4: (rng) => (rng.chance(0.65) ? hlavniMesto(STATY_L4)(rng) : krajskeMesto(rng)),
    5: (rng) => (rng.chance(0.5) ? hlavniMesto(STATY_L5)(rng) : kteryStat(STATY_L5)(rng)),
  },
  genShare: 0.45,
});

export const ceskoCards: KnowledgeCard[] = [
  {
    id: `${ID}.snezka`,
    skillId: ID,
    level: 2,
    emoji: '🏔️',
    title: 'Sněžka',
    text: 'Sněžka v Krkonoších je nejvyšší hora Česka, měří přes 1 600 metrů. Na vrcholu často silně fouká a sníh tam leží i na jaře.',
  },
  {
    id: `${ID}.vltava`,
    skillId: ID,
    level: 3,
    emoji: '🌊',
    title: 'Kam teče Vltava',
    text: 'Vltava je nejdelší řeka, která teče celá po našem území. U Mělníka se vlévá do Labe a její voda pak doteče až do Severního moře.',
  },
  {
    id: `${ID}.vlajka`,
    skillId: ID,
    level: 4,
    emoji: '🎨',
    title: 'Česká vlajka',
    text: 'Česká vlajka má bílý pruh nahoře, červený dole a modrý klín od žerdi. Bílá a červená jsou staré barvy Čech, modrý klín přibyl v roce 1920.',
  },
  {
    id: `${ID}.vikingove`,
    skillId: ID,
    level: 5,
    emoji: '⛵',
    title: 'Vikingové a Island',
    text: 'Vikingové z Norska, Švédska a Dánska se plavili po celé Evropě. Osídlili Island a asi před tisíci lety dopluli až do Severní Ameriky.',
  },
];
