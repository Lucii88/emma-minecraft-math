// Soukromí a bezpečí online – co je soukromé a co se sdílet dá, silné heslo,
// neznámí lidé ve hře, odkazy a stahování, co se zveřejní, těžko se maže,
// a oprávnění aplikací ke kameře a mikrofonu. Klidný tón bez strašení.
//
// Vysvětlení je zajímavost (showFact): ukáže se i po správné odpovědi, proto
// nezačíná hodnocením a k důvodu přidá jeden navazující detail.
//
// Tísňová čísla, neznámí lidé na ulici a obecné „neposílej fotku cizímu“ jsou
// na Ostrově těla (telo.bezpeci). Tady jde o digitální soukromí: hry, hesla,
// aplikace a sdílení.

import { bankSkill, type Spec } from '../../core/bank';
import type { KnowledgeCard } from '../../core/types';
import { fixed, q } from './digitalni-common';

const ID = 'dilna.soukromi';

// ---------------------------------------------------------------------------
// Pomůcky

export const SOUKROME = 'Soukromé';
export const MUZU_NAPSAT = 'Můžu napsat';

/** Neznámý hráč se ptá: je to soukromé, nebo mu to můžeš napsat? Klíč `udaj-…`.
 *  U soukromých údajů vysvětlení vždy připomene, ať to hráčka řekne rodičům. */
function udaj(key: string, naCo: string, soukrome: boolean, explain: string): Spec {
  return fixed(`udaj-${key}`, `Neznámý hráč ve hře se ptá${naCo.startsWith(',') ? '' : ' '}${naCo}. Je to soukromé, nebo mu to můžeš napsat?`,
    [SOUKROME, MUZU_NAPSAT], soukrome ? 0 : 1,
    ['Mohl by tě podle toho někdo najít nebo se dostat k tvým věcem?'],
    soukrome ? `${explain} Když se na to někdo ptá, řekni to rodičům.` : explain);
}

export const SILNE = 'Silné';
export const SLABE = 'Slabé';

/** Je heslo silné, nebo slabé? Klíč `heslo-…`, heslo je v zadání. */
function heslo(key: string, pw: string, spoken: string, silne: boolean, explain: string): Spec {
  return fixed(`heslo-${key}`, `Je heslo ${pw} silné, nebo slabé?`, [SILNE, SLABE], silne ? 0 : 1,
    ['Dá se to heslo snadno uhodnout?', 'Silné heslo je dlouhé a není to jméno ani řada čísel.'], explain,
    { speak: `Je heslo ${spoken} silné, nebo slabé?` });
}

export const BEZPECNE = 'Bezpečné';
export const NEBEZPECNE = 'Není bezpečné';

/** Situace: je to bezpečné? Klíč `situace-…`. */
function situace(key: string, text: string, bezpecne: boolean, hint: string, explain: string): Spec {
  return fixed(`situace-${key}`, `${text} Je to bezpečné?`, [BEZPECNE, NEBEZPECNE], bezpecne ? 0 : 1, [hint], explain);
}

export const POTREBUJE = 'Potřebuje';
export const NEPOTREBUJE = 'Nepotřebuje';

/** Oprávnění aplikace: potřebuje ho ke své práci? Klíč `opravneni-…`. */
function opravneni(key: string, text: string, potrebuje: boolean, explain: string): Spec {
  return fixed(`opravneni-${key}`, text, [POTREBUJE, NEPOTREBUJE], potrebuje ? 0 : 1,
    ['K čemu ta aplikace slouží?'], explain);
}

// ---------------------------------------------------------------------------
// L1 – co je soukromé, komu říct heslo, okna s výhrou, stahování

const L1: Spec[] = [
  udaj('heslo', 'na tvoje heslo do hry', true,
    'Heslo je jako klíč od dveří: kdo ho zná, dostane se do tvého účtu. Znáš ho jen ty a rodiče.'),
  udaj('pin', 'na PIN k tvému tabletu', true,
    'PIN odemyká tablet. Kdo ho zná, dostane se ke všemu, co v tabletu máš – k fotkám i ke zprávám.'),
  udaj('adresa', 'na to, kde bydlíš', true,
    'Adresa je soukromá: podle ní by tě kdokoli našel. Neznámý člověk ze hry ji vědět nemusí.'),
  udaj('telefon', 'na telefonní číslo tvých rodičů', true,
    'Telefonní číslo je soukromé: kdo ho zná, může rodičům volat a psát. Do hry ho nepíšeme.'),
  udaj('cesta-ze-skoly', 'na to, kdy chodíš {sama|sám} ze školy', true,
    'To, kdy a kudy chodíš {sama|sám}, je soukromé. Neznámý hráč to vědět nemusí.'),
  udaj('skola', 'na jméno tvé školy', true,
    'Podle jména školy by tě někdo mohl najít. Je to soukromé.'),
  udaj('kde-jsi', ', kde právě jsi', true,
    'To, kde právě jsi, je soukromé. Neznámý hráč to vědět nemusí.'),
  udaj('prijmeni', 'na tvoje jméno a příjmení', true,
    'Celé jméno je soukromé: podle jména a příjmení by tě někdo mohl dohledat. Ve hře stačí vymyšlená přezdívka.'),
  udaj('barva', 'na tvou oblíbenou barvu', false,
    'Oblíbená barva nic neprozradí o tom, kdo jsi a kde bydlíš. Tu klidně napsat můžeš.'),
  udaj('zvire', 'na tvé oblíbené zvíře', false,
    'Oblíbené zvíře nic neprozradí o tom, kde tě najít. To napsat můžeš.'),
  udaj('pohadka', 'na tvou oblíbenou pohádku', false,
    'Oblíbená pohádka je v pořádku. Nic neprozradí o tom, kdo jsi.'),
  udaj('jidlo', 'na tvé oblíbené jídlo', false,
    'Oblíbené jídlo nic neprozradí o tom, kde bydlíš. To napsat můžeš.'),
  udaj('rocni-obdobi', 'na tvé oblíbené roční období', false,
    'Oblíbené roční období je v pořádku. Nic neprozradí o tom, kdo jsi.'),
  udaj('barva-draka', 'na barvu tvého draka ve hře', false,
    'Barva draka ve hře je v pořádku. Týká se hry, ne toho, kde bydlíš.'),
  q('heslo-komu', 'Komu smíš říct své heslo do hry?', 'Rodičům',
    ['Kamarádce ze třídy', 'Hráči ve hře', 'Komukoli, kdo se zeptá'],
    ['Kdo se stará o tvoje bezpečí?'],
    'Heslo znáš jen ty a rodiče. Neříkáme ho ani nejlepším kamarádům – i kamarád by ho mohl omylem prozradit dál.'),
  q('heslo-kamaradka', 'Kamarádka chce tvoje heslo. Prý ti jen pomůže ve hře. Co uděláš?', 'Heslo jí neřeknu.',
    ['Řeknu jí ho.', 'Napíšu jí ho na papírek.', 'Řeknu ho celé třídě.'],
    ['Komu patří heslo?'],
    'I s nejlepší kamarádkou si můžete hrát a pomáhat bez hesla. Heslo znáš jen ty a rodiče.'),
  q('okno-vyhra', 'Ve hře vyskočí okno: „{Vyhrála|Vyhrál} jsi! Klikni sem.“ Co uděláš?', 'Nekliknu a zavolám rodiče.',
    ['Hned kliknu.', 'Kliknu dvakrát.', 'Napíšu tam své jméno.'],
    ['Opravdu jsi něco {vyhrála|vyhrál}?'],
    'Taková okna chtějí, abys {klikla|klikl}, i když nic nevyhráváš. Často vedou na stránku, která chce tvoje údaje. Neklikej a ukaž to rodičům.'),
  q('stahnout-hru', 'Chceš si stáhnout novou hru. Co uděláš nejdřív?', 'Zeptám se rodičů.',
    ['Stáhnu ji hned.', 'Stáhnu všechny hry najednou.', 'Zeptám se hráče, kterého neznám.'],
    ['Kdo ti pomůže poznat, jestli je hra v pořádku?'],
    'Než si něco stáhneš, zeptej se rodičů. Pomůžou ti poznat, jestli je hra v pořádku a pro děti.'),
  q('nakupy', 'Máma ti půjčí telefon na hraní. Co v něm bez dovolení dělat nebudeš?', 'Nakupovat ve hře',
    ['Hrát hru, kterou mi dovolila', 'Podívat se, kolik je hodin', 'Vrátit jí ho, až dohraju'],
    ['Co by mohlo stát peníze?'],
    'Nákup ve hře stojí opravdové peníze, i když vypadá jako hra. O nákupech rozhodují rodiče.'),
  q('kdo-pomuze', 'Nevíš si rady s něčím v tabletu. Kdo ti pomůže?', 'Rodiče',
    ['Neznámý hráč ve hře', 'Reklama ve hře', 'Nikdo'],
    ['Komu věříš?'],
    'S tabletem ti pomůžou rodiče nebo jiný dospělý, kterému věříš. Neznámé hráče ani reklamy o pomoc nežádáme.'),
  q('osklivy-vzkaz', 'Ve hře ti někdo napíše ošklivou zprávu. Co uděláš?', 'Neodpovím a ukážu to rodičům.',
    ['Napíšu mu ještě ošklivější.', 'Budu to tajit.', 'Budu mu psát dál.'],
    ['Kdo ti může pomoct?'],
    'Na ošklivé zprávy neodpovídáme. Ukaž je rodičům – poradí ti, co dál, a můžete toho hráče zablokovat.'),
];

// ---------------------------------------------------------------------------
// L2 – silné heslo, neznámí lidé ve hře, co se zveřejní, odkazy

const L2: Spec[] = [
  heslo('1234', '1234', 'jedna dva tři čtyři', false,
    'Heslo 1234 zkoušejí zloději hesel jako první, patří k nejčastějším heslům na světě. Uhodne se hned.'),
  heslo('letopocet', '2019', 'dva tisíce devatenáct', false,
    'Letopočet, třeba rok narození, se snadno uhodne. Jsou to jen čtyři číslice.'),
  heslo('jmeno', 'Ingrid', 'Ingrid', false,
    'Jméno je krátké a snadno se uhodne – kdo zná tebe nebo tvou rodinu, zkusí jména jako první.'),
  heslo('aaaa', 'aaaa', 'á á á á', false,
    'Čtyři stejná písmena se uhodnou velmi rychle. Heslo je krátké a jednoduché.'),
  heslo('12345678', '12345678', 'jedna dva tři čtyři pět šest sedm osm', false,
    'Řada čísel za sebou je jedno z nejčastějších hesel. Uhodne se velmi rychle.'),
  heslo('drak', 'drak', 'drak', false,
    'Jedno krátké slovo se uhodne rychle, zvlášť když máš {ráda|rád} draky.'),
  heslo('zeleny-drak', 'ZelenyDrakTanciNaMesici', 'Zelený drak tančí na Měsíci', true,
    'Věta z pěti slov je dlouhá a těžko ji někdo uhodne. Přitom si ji snadno zapamatuješ.'),
  heslo('zaby', 'TriZabySkacouPresPotok', 'Tři žáby skáčou přes potok', true,
    'Dlouhá věta z několika slov se hádá velmi dlouho. A zapamatuje se snadno.'),
  heslo('kolo', 'MojeKoloMaDvaZvonky', 'Moje kolo má dva zvonky', true,
    'Věta z pěti slov je dlouhá a těžko se uhodne. To je silné heslo.'),
  heslo('sova', 'SovaNosiBryleACteKnihy', 'Sova nosí brýle a čte knihy', true,
    'Dlouhá vtipná věta je silné heslo. Uhodnout ji je skoro nemožné.'),
  q('nejsilnejsi', 'Které heslo je nejsilnější?', { label: 'KockaSpiNaTeplychKamnech', speak: 'Kočka spí na teplých kamnech' },
    [{ label: '1234', speak: 'jedna dva tři čtyři' }, 'Heslo', 'Anna', { label: 'Abcd', speak: 'á bé cé dé' }],
    ['Které heslo je nejdelší?'],
    'Nejsilnější je dlouhá věta z několika slov. Krátká hesla, jména a řady znaků se uhodnou rychle.'),
  q('proc-1234', 'Proč je heslo 1234 špatné?', 'Snadno se uhodne.',
    ['Je moc dlouhé.', 'Má v sobě písmena.', 'Nedá se napsat.'],
    ['Zkusil by ho někdo jako první?'],
    'Heslo 1234 zkoušejí zloději hesel jako první. Je krátké a patří k nejčastějším heslům vůbec.',
    { speak: 'Proč je heslo jedna dva tři čtyři špatné?' }),
  q('dlouhe-heslo', 'Proč je dlouhé heslo lepší než krátké?', 'Dlouhé heslo se hůř uhodne.',
    ['Dlouhé heslo je hezčí.', 'Krátké heslo se nedá napsat.', 'Dlouhé heslo zná každý.'],
    ['Co je těžší uhodnout?'],
    'Čím je heslo delší, tím víc možností musí zloděj hesel vyzkoušet – každé písmeno navíc jich mnohokrát znásobí. Dlouhá věta se proto hádá velmi dlouho.'),
  q('heslo-rodicum', 'Proč smíš heslo říct rodičům?', 'Starají se o mé bezpečí.',
    ['Aby ho řekli všem.', 'Aby ho napsali na dveře.', 'Aby ho mohli prodat.'],
    ['Kdo ti pomáhá, když se něco pokazí?'],
    'Rodiče se starají o tvé bezpečí. Když zapomeneš heslo nebo se něco pokazí, pomůžou ti.'),
  q('fotka-za-mince', 'Hráč, kterého neznáš, ti ve hře napíše: „Pošli mi svou fotku a dám ti zlaté mince.“ Co uděláš?', 'Neodpovím a řeknu to rodičům.',
    ['Pošlu mu fotku.', 'Pošlu mu fotku kamarádky.', 'Napíšu, ať mi dá víc mincí.'],
    ['Stojí mince ve hře za tvoji fotku?'],
    'Za dárky ve hře se fotky neposílají. Neodpovídej a ukaž zprávu rodičům – pomůžou ti.'),
  q('schuzka', 'Hráč, kterého neznáš, ti ve hře napíše, že je taky dítě, a chce se s tebou sejít v parku. Co uděláš?', 'Neodpovím a řeknu to rodičům.',
    ['Půjdu tam {sama|sám}.', 'Napíšu mu, kde bydlím.', 'Domluvím se s ním potají.'],
    ['Víš jistě, kdo ti píše?'],
    'Na internetu nevidíš, kdo píše – napsat se dá cokoli. S lidmi, které znáš jen ze hry, se bez rodičů nescházíme. Řekni to rodičům.'),
  q('psat-jinde', 'Někdo ve hře chce, abyste si psali jinde, kde to rodiče neuvidí. Co uděláš?', 'Řeknu to rodičům.',
    ['Budu mu psát potají.', 'Dám mu své telefonní číslo.', 'Smažu hru a nikomu nic neřeknu.'],
    ['Má po tobě někdo chtít tajemství před rodiči?'],
    'Kdo chce psát tam, kde to rodiče neuvidí, nechová se jako kamarád. Řekni to rodičům – nic špatného jsi {neudělala|neudělal}.'),
  q('fotka-ve-skupine', 'Pošleš fotku do skupiny, kde je hodně lidí. Dá se pak úplně smazat?', 'Těžko, někdo si ji mohl uložit.',
    ['Ano, jedním kliknutím zmizí všude.', 'Ano, stačí vypnout tablet.', 'Ano, když se omluvím.'],
    ['Co mohli s fotkou udělat ostatní?'],
    'Co jednou pošleš, si ostatní mohou uložit nebo poslat dál. Proto si předem rozmysli, co sdílíš.'),
  q('odkaz-od-kamarada', 'Kamarád ti pošle odkaz, že tam jsou hry zdarma. Co uděláš?', 'Než kliknu, zeptám se rodičů.',
    ['Hned kliknu.', 'Pošlu ho všem dál.', 'Napíšu tam své heslo.'],
    ['Víš, kam odkaz vede?'],
    'Odkaz může vést na stránku, která chce heslo nebo stáhne něco nechtěného. I kamarádovi mohl někdo převzít účet a poslat odkaz za něj. Než klikneš, zeptej se rodičů.'),
  q('co-je-soukrome', 'Co z toho je soukromé?', 'Moje adresa',
    ['Moje oblíbená barva', 'Moje oblíbené zvíře', 'Můj oblíbený sport', 'Moje oblíbená pohádka'],
    ['Co by pomohlo někomu tě najít?'],
    'Adresa je soukromá, podle ní by tě někdo mohl najít. Oblíbené věci o tobě nic takového neprozradí.'),
  q('co-muzu-napsat', 'Co z toho můžeš klidně napsat do hry?', 'Moje oblíbená barva',
    ['Moje heslo', 'Můj PIN', 'Moje adresa', 'Telefon na mámu'],
    ['Co o tobě neprozradí nic soukromého?'],
    'Oblíbenou barvu klidně napsat můžeš. Heslo, PIN, adresa a telefon jsou soukromé.'),
];

// ---------------------------------------------------------------------------
// L3 – podvodné zprávy, přezdívka, odhlášení, fotky kamarádů, chatboti

const L3: Spec[] = [
  situace('heslo-v-hlave', 'Heslo si pamatuješ v hlavě a kromě tebe ho znají jen rodiče.', true,
    'Kdo ještě heslo zná?',
    'Heslo v hlavě a u rodičů je v bezpečí. Nikdo jiný se k němu nedostane.'),
  situace('heslo-na-papirku', 'Heslo máš napsané na papírku nalepeném na tabletu.', false,
    'Kdo všechno ten papírek uvidí?',
    'Papírek na tabletu přečte každý, kdo tablet vezme do ruky. Heslo patří do hlavy, zapsané ho můžou mít schované rodiče.'),
  situace('fotka-babicce', 'Posíláš fotku babičce, kterou dobře znáš, a rodiče o tom vědí.', true,
    'Znáš toho, komu fotku posíláš?',
    'Babičku dobře znáš a rodiče o tom vědí. To je v pořádku.'),
  situace('prezdivka', 'Ve hře používáš přezdívku, která neprozradí tvé jméno.', true,
    'Pozná někdo z přezdívky, kdo jsi?',
    'Vymyšlená přezdívka je chytrá: ve hře tě pozná jen ten, komu to řekneš.'),
  situace('stahovani', 'Než si stáhneš novou hru, zeptáš se rodičů.', true,
    'Kdo ti pomůže poznat, jestli je hra v pořádku?',
    'Zeptat se rodičů před stažením je chytré. Pomůžou ti vybrat bezpečnou hru.'),
  situace('cizi-odkaz', 'Klikneš na odkaz ve zprávě od někoho, koho neznáš.', false,
    'Víš, kam odkaz vede?',
    'Odkaz od neznámého může vést na podvodnou stránku. Neklikej a ukaž ho rodičům.'),
  situace('odhlaseni', 'Po hraní na školním počítači se odhlásíš.', true,
    'Kdo si sedne k počítači po tobě?',
    'Když se odhlásíš, další člověk u počítače se do tvého účtu nedostane.'),
  situace('heslo-kamaradce', 'Řekneš heslo kamarádce, aby ti pomohla ve hře.', false,
    'Komu patří heslo?',
    'Heslo znáš jen ty a rodiče. Kamarádka ti může pomoct i bez něj.'),
  situace('dovolena', 'Do chatu ve hře napíšeš, kdy odjíždíte na dovolenou.', false,
    'Co by se z toho dalo poznat o vašem domově?',
    'Z toho se dá poznat, kdy budete pryč z domova. Takové věci do chatu nepíšeme.'),
  q('zprava-heslo', 'Přijde ti zpráva: „Napiš sem své heslo, jinak ti zmizí všechny body.“ Co to je?', 'Podvod',
    ['Pomoc od hry', 'Dárek', 'Pozvánka na oslavu'],
    ['Chtějí opravdové hry heslo ve zprávě?'],
    'Je to podvod. Žádná hra po tobě heslo ve zprávě nechce. Nic nepiš a ukaž zprávu rodičům.'),
  q('vyhra-tablet', 'Zpráva říká: „{Vyhrála|Vyhrál} jsi tablet! Napiš adresu a číslo na mámu.“ Co uděláš?', 'Nic nevyplním a ukážu to rodičům.',
    ['Napíšu adresu i číslo.', 'Napíšu jen adresu.', 'Pošlu to i kamarádům.'],
    ['{Soutěžila|Soutěžil} jsi o tablet?'],
    'Kdo nic nesoutěžil, nic nevyhrál. Takové zprávy chtějí vylákat osobní údaje. Ukaž ji rodičům.'),
  q('video-spoluzak', 'Spolužák chce do třídní skupiny poslat video, na kterém někdo ze třídy zakopne. Co je správné?', 'Bez svolení ho neposílat.',
    ['Poslat ho, je vtipné.', 'Poslat ho všem, ať se smějí.', 'Dát ho na internet.'],
    ['Jak by bylo tomu, kdo je na videu?'],
    'Video s někým jiným patří i jemu. Bez jeho svolení ho neposíláme – mohlo by mu to být líto.'),
  q('fotka-kamaradky', 'Máš vtipnou fotku kamarádky. Smíš ji dát na internet?', 'Jen když to ona i rodiče dovolí.',
    ['Ano, kdykoli.', 'Ano, když je vtipná.', 'Ano, když ji podepíšu.'],
    ['Komu fotka patří?'],
    'Fotka kamarádky je její soukromá věc. Na internet ji dáš, jen když to dovolí ona i její rodiče.'),
  q('prezdivka-vyber', 'Jakou přezdívku si dáš do hry?', 'Vymyšlenou, bez mého jména',
    ['Celé jméno a příjmení', 'Jméno a třídu', 'Jméno a ulici'],
    ['Co by přezdívka neměla prozradit?'],
    'Vymyšlená přezdívka nic neprozradí o tom, kdo jsi a kde bydlíš. Třeba „Zelená jiskra“ nebo „Dračí {jezdkyně|jezdec}“.'),
  q('neprozradis', 'Co z toho neprozradíš neznámému hráči?', 'Kdy budeme na dovolené',
    ['Že mám {ráda|rád} draky', 'Že se mi líbí modrá', 'Že {ráda|rád} kreslím'],
    ['Co by mohl někdo zneužít?'],
    'Z toho, kdy budete na dovolené, se dá poznat, kdy u vás nikdo nebude doma. Že máš {ráda|rád} draky nebo modrou, klidně napsat můžeš.'),
  q('rozmyslet', 'Proč si předem rozmýšlíme, co pošleme na internet?', 'Co se jednou pošle, těžko se maže.',
    ['Protože internet se rychle unaví.', 'Protože zprávy jsou drahé.', 'Protože internet všechno za den smaže.'],
    ['Co mohou s tvou zprávou udělat ostatní?'],
    'Co jednou pošleš, si někdo může uložit nebo poslat dál. Proto sdílej jen to, co by klidně mohl vidět kdokoli.'),
  q('vylekalo', 'Na internetu uvidíš něco, co tě vyleká. Co uděláš?', 'Řeknu to rodičům.',
    ['Nikomu to neřeknu.', 'Pošlu to kamarádům.', 'Budu se na to dívat dál.'],
    ['Kdo ti pomůže, když se lekneš?'],
    'Když tě na internetu něco vyleká, řekni to rodičům nebo jinému dospělému, kterému věříš. Nic špatného jsi {neudělala|neudělal}.'),
  q('dlouhe-heslo-pamatovat', 'Jak si nejlépe zapamatuješ dlouhé heslo?', 'Představím si ho jako větu s obrázkem.',
    ['Napíšu si ho na ruku.', 'Řeknu ho kamarádce, ať si ho pamatuje.', 'Použiju radši 1234.'],
    ['Co se pamatuje líp – náhodná písmena, nebo příběh?'],
    'Věta s obrázkem v hlavě se pamatuje nejlíp, třeba „Tři žáby skáčou přes potok“. Na ruku ani kamarádce heslo nepatří.'),
  q('zamykani', 'Proč si zamykáme tablet nebo telefon?', 'Aby se do něj nedostal nikdo cizí.',
    ['Aby se nerozbil.', 'Aby se rychleji nabíjel.', 'Aby hrál hudbu.'],
    ['Co je v tabletu uložené?'],
    'V tabletu jsou fotky, zprávy a hry. Zámek s PINem je chrání před cizíma očima.'),
  q('chatbot-adresa', 'Chatbot se tě zeptá, kde bydlíš. Co uděláš?', 'Nenapíšu mu to.',
    ['Napíšu celou adresu.', 'Napíšu aspoň ulici.', 'Pošlu mu fotku našeho domu.'],
    ['Patří adresa do chatu?'],
    'Ani chatbotovi osobní údaje nepíšeme. Co mu napíšeš, se může uložit a nevíš, kdo to uvidí. Když se tě na něco takového ptá, řekni to rodičům.'),
];

// ---------------------------------------------------------------------------
// L4 – oprávnění aplikací, stopy na internetu, převzatý účet, veřejný profil

const L4: Spec[] = [
  opravneni('kalkulacka-mikrofon', 'Kalkulačka chce přístup k mikrofonu. Potřebuje ho?', false,
    'Kalkulačka počítá čísla, která zadáš. Mikrofon k tomu nepotřebuje.'),
  opravneni('videohovor-kamera', 'Aplikace na videohovory s babičkou chce přístup ke kameře. Potřebuje ho?', true,
    'Při videohovoru tě babička vidí díky kameře. Tady je přístup ke kameře potřeba.'),
  opravneni('baterka-kontakty', 'Aplikace na svícení baterkou chce vidět tvoje kontakty. Potřebuje to?', false,
    'Na svícení nejsou kontakty potřeba. Takový přístup nepovolujeme.'),
  opravneni('mapa-poloha', 'Mapa chce vědět, kde jsi, aby tě navigovala. Potřebuje to?', true,
    'Navigace musí vědět, kde jsi, jinak by tě nedovedla k cíli.'),
  opravneni('puzzle-mikrofon', 'Hra s puzzle chce přístup k mikrofonu. Potřebuje ho?', false,
    'Skládání puzzle mikrofon nepotřebuje. Takový přístup nepovolujeme.'),
  opravneni('zpev-mikrofon', 'Aplikace na nahrávání zpěvu chce přístup k mikrofonu. Potřebuje ho?', true,
    'Bez mikrofonu by zpěv nahrát nešlo. Tady je přístup potřeba.'),
  opravneni('budik-kamera', 'Budík chce přístup ke kameře. Potřebuje ho?', false,
    'Budík jen zvoní v nastavený čas. Kameru nepotřebuje.'),
  opravneni('fotoaparat-kamera', 'Aplikace na focení chce přístup ke kameře. Potřebuje ho?', true,
    'Fotit se bez kamery nedá. Tady je přístup potřeba.'),
  q('omalovanky', 'Omalovánky v tabletu chtějí přístup ke kameře a mikrofonu. Co uděláš?', 'Nepovolím to, omalovánky to nepotřebují.',
    ['Povolím všechno, ať to rychle běží.', 'Povolím to a nikomu nic neřeknu.', 'Povolím to, stejně to nevadí.'],
    ['Co potřebují omalovánky ke kreslení?'],
    'Omalovánky kameru ani mikrofon nepotřebují. Přístup nepovol a klidně se poraď s rodiči.'),
  q('potrebuje-mikrofon', 'Která aplikace opravdu potřebuje mikrofon?', 'Nahrávání písniček',
    ['Kalkulačka', 'Omalovánky', 'Puzzle', 'Hodiny'],
    ['Která aplikace pracuje se zvukem?'],
    'Mikrofon potřebuje aplikace, která nahrává zvuk. Ostatní aplikace ho ke své práci nepotřebují, a tak jim ho nepovolujeme.'),
  q('potrebuje-kameru', 'Která aplikace opravdu potřebuje kameru?', 'Fotoaparát',
    ['Kalkulačka', 'Kniha pohádek', 'Hra s kostkami', 'Budík'],
    ['Která aplikace pracuje s obrazem z kamery?'],
    'Kameru potřebuje fotoaparát. Ostatní aplikace ji ke své práci nepotřebují.'),
  q('potrebuje-polohu', 'Která aplikace opravdu potřebuje vědět, kde jsi?', 'Mapa s navigací',
    ['Omalovánky', 'Kalkulačka', 'Pexeso', 'Čtení pohádek'],
    ['Která aplikace tě někam vede?'],
    'Poloha je potřeba jen tam, kde aplikace ukazuje cestu nebo místo. Ostatní aplikace ji ke své práci nepotřebují.'),
  q('co-je-mikrofon', 'Co znamená, když aplikace smí používat mikrofon?', 'Může slyšet, co se kolem říká.',
    ['Může hrát hlasitěji.', 'Může se rychleji nabíjet.', 'Může měnit barvy.'],
    ['K čemu slouží mikrofon?'],
    'Mikrofon zachytí zvuk kolem tabletu. Proto ho povolujeme jen aplikacím, které ho opravdu potřebují.'),
  q('smazana-fotka', '{Smazala|Smazal} jsi fotku, kterou jsi předtím {poslala|poslal} do skupiny. Kde ještě může být?', 'U lidí, kteří si ji uložili',
    ['Nikde, zmizela úplně', 'Jen v mém koši', 'Jen u paní učitelky'],
    ['Co mohli s fotkou udělat ostatní ve skupině?'],
    'I když fotku smažeš, kdo si ji mezitím uložil nebo přeposlal, má ji dál.'),
  q('divna-kamaradka', 'Kamarádka ti ve hře napíše, ať jí pošleš heslo. Píše ale divně, jinak než obvykle. Co uděláš?', 'Ověřím si to u ní osobně.',
    ['Pošlu jí heslo.', 'Pošlu jí heslo i PIN.', 'Napíšu heslo do chatu všem.'],
    ['Píše to opravdu ona?'],
    'Možná jí někdo převzal účet. Ověř si to u ní osobně nebo telefonem, heslo neposílej nikomu a řekni to rodičům.'),
  q('stejne-heslo', 'Proč nepoužíváme stejné heslo do všech her?', 'Kdo ho zjistí, dostane se do všech.',
    ['Protože se heslo opotřebuje.', 'Protože hry se hádají.', 'Protože to hry zakazují.'],
    ['Co se stane, když někdo zjistí jedno heslo?'],
    'Kdo zjistí heslo, které máš všude, dostane se do všech tvých účtů. Různá hesla chrání aspoň ty ostatní.'),
  q('verejny-profil', 'Co znamená, že je profil ve hře veřejný?', 'Může ho vidět kdokoli.',
    ['Vidí ho jen rodiče.', 'Nevidí ho nikdo.', 'Vidí ho jen paní učitelka.'],
    ['Co znamená slovo veřejný?'],
    'Veřejný profil může vidět kdokoli na internetu. Proto na něj nepatří osobní údaje ani fotky.'),
  q('nez-zverejnis', 'Než něco zveřejníš, která otázka ti pomůže?', 'Nevadí mi, když to uvidí kdokoli?',
    ['Dostanu za to hodně srdíček?', 'Uvidí to co nejvíc lidí?', 'Je to rychlejší než psát?'],
    ['Kdo všechno to pak může vidět?'],
    'Co se zveřejní, může vidět kdokoli a těžko se maže. Když by ti vadilo, že to uvidí cizí lidé, raději to nezveřejňuj.'),
  q('asistent-posloucha', 'Hlasový asistent čeká, až řekneš jeho jméno. Co to znamená?', 'Mikrofon je zapnutý a poslouchá.',
    ['Asistent spí a nic neslyší.', 'Asistent je rozbitý.', 'Asistent čte myšlenky.'],
    ['Jak by asistent poznal své jméno?'],
    'Aby asistent poznal své jméno, musí mít zapnutý mikrofon. Proto s rodiči rozhodněte, kde a kdy ho mít zapnutý.'),
  q('chatbot-tajemstvi', 'Můžeš chatbotovi svěřit tajemství, které nechceš nikomu říct?', 'Raději ne, konverzace se může uložit.',
    ['Ano, chatbot nic neukládá.', 'Ano, chatbot je můj nejlepší kamarád.', 'Ano, chatbot tajemství zapomene.'],
    ['Kam se ukládá, co chatbotovi napíšeš?'],
    'Co chatbotovi napíšeš, se může uložit a mohou to vidět lidé, kteří ho provozují. Když tě něco trápí, svěř se rodičům nebo jinému dospělému, kterému věříš.'),
];

export const soukromiSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Soukromí a bezpečí online',
  description: 'Dítě se učí chránit své soukromí online: co je soukromé, jak vypadá silné heslo, co dělat, když píše neznámý člověk, a k čemu jsou oprávnění aplikací.',
  rvp: {
    1: ['ČJS-3-5-03', 'ČJS-3-5-02'],
    2: ['ČJS-3-5-03', 'ČJS-3-5-02'],
    3: ['ČJS-3-5-03', 'ČJS-3-5-02'],
    4: ['I-5-4-03', 'I-5-4-02'],
  },
  ability: 'znalosti',
  showFact: true,
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
});

export const soukromiCards: KnowledgeCard[] = [
  {
    id: 'dilna.soukromi.heslo-veta',
    skillId: ID,
    level: 2,
    emoji: '🔑',
    title: 'Heslo jako věta',
    text: 'Silné heslo je dlouhé, třeba věta z několika slov, kterou si snadno zapamatuješ. Takové heslo se hádá mnohem déle než krátké jako 1234.',
  },
  {
    id: 'dilna.soukromi.internet-si-pamatuje',
    skillId: ID,
    level: 3,
    emoji: '🗑️',
    title: 'Internet si pamatuje',
    text: 'Co jednou pošleš na internet, si někdo může uložit nebo poslat dál. Proto sdílej jen to, co by klidně mohl vidět kdokoli.',
    fix: {
      before: 'Když fotku smažu, zmizí z internetu navždy.',
      evidence: 'Lidé zjistili, že smazané fotky se dál objevovaly jinde – někdo si je stihl uložit nebo poslat kamarádům.',
    },
  },
  {
    id: 'dilna.soukromi.kamera',
    skillId: ID,
    level: 4,
    emoji: '📷',
    title: 'Aplikace se musí zeptat',
    text: 'Telefon i tablet se zeptají, jestli aplikace smí používat kameru nebo mikrofon. Když je aplikace nepotřebuje, můžete s rodiči přístup nepovolit.',
  },
];
