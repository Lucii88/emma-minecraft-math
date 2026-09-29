// Práce a výdělek – povolání a co přinášejí ostatním, odkud se berou
// peníze, příjem a výdaj, neplacená práce doma, stánek s limonádou
// (náklady, tržba, zisk) a jednoduše o daních: kdo platí školy a silnice.

import { count, formatNumber as f, type Forms } from '../../core/czech';
import { bankSkill, type FixedSpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import { PEOPLE, PRIJEM_VYDAJ, fx, kc, mix, nm, ord, pkey, q, v, type Attempt } from './common';

const ID = 'trh.prace';

/** Příjem, nebo výdaj? Stálá tlačítka. */
function pv(key: string, what: string, forWhom: string, income: boolean, hint: string, explain: string): FixedSpec {
  return fx(
    `${income ? 'prijem' : 'vydaj'}-${key}`,
    `${what} Je to ${forWhom} příjem, nebo výdaj?`,
    PRIJEM_VYDAJ,
    income ? 0 : 1,
    ['Peníze přibudou, nebo ubudou?', hint],
    `${income ? 'Příjem' : 'Výdaj'}. ${explain}`,
  );
}

// ---------------------------------------------------------------------------
// L1 – kdo co dělá a odkud jsou peníze

const L1: Spec[] = [
  q('pekarka', 'Kdo peče chléb a rohlíky?', 'Pekařka',
    ['Hasička', 'Zubařka', 'Pošťačka'],
    ['Pracuje brzy ráno u horké pece.'],
    'Pekařka peče chléb, rohlíky i koláče. Často začíná pracovat, když ostatní ještě spí, aby bylo ráno pečivo čerstvé.'),
  q('lekar', 'Kdo léčí nemocné lidi?', 'Lékař',
    ['Kovář', 'Zedník', 'Rybář'],
    ['Chodíš za ním, když tě bolí v krku.'],
    'Lékař zjistí, co člověku je, a poradí, jak se uzdravit. Na lékaře se studuje mnoho let.'),
  q('hasicka', 'Kdo hasí požáry a pomáhá při povodních?', 'Hasička',
    ['Kuchařka', 'Prodavačka', 'Učitelka'],
    ['Jezdí červeným autem se žebříkem.'],
    'Hasiči a hasičky hasí požáry a pomáhají při povodních i nehodách.'),
  q('zemedelec', 'Kdo pěstuje obilí a brambory a chová krávy?', 'Zemědělec',
    ['Programátor', 'Kadeřník', 'Pilot'],
    ['Pracuje na poli a na statku.'],
    'Zemědělec pěstuje plodiny a chová zvířata. Bez něj bychom neměli mouku, mléko ani brambory.'),
  q('kovar', 'Kdo vyrábí věci ze železa v kovárně?', 'Kovář',
    ['Pekař', 'Krejčí', 'Zahradník'],
    ['Buší kladivem do rozžhaveného železa.'],
    'Kovář rozžhaví železo v ohni a tvaruje ho kladivem na kovadlině. U Vikingů byl velmi vážený.'),
  q('programatorka', 'Kdo píše programy pro počítače a mobily?', 'Programátorka',
    ['Zahradnice', 'Rybářka', 'Kuchařka'],
    ['Pracuje u počítače a píše mu přesné pokyny.'],
    'Programátorka píše pro počítač přesné pokyny – programy. Díky nim fungují hry, mapy i bankovní aplikace.'),
  q('ucitelka', 'Kdo učí děti ve škole?', 'Učitelka',
    ['Řidič autobusu', 'Kadeřnice', 'Zedník'],
    ['Stojí u tabule.'],
    'Učitelka připravuje hodiny, vysvětluje a pomáhá dětem objevovat, jak svět funguje.'),
  q('kadernice', 'Kdo stříhá a češe vlasy?', 'Kadeřnice',
    ['Zubařka', 'Kuchař', 'Hasič'],
    ['Pracuje s nůžkami a hřebenem.'],
    'Kadeřnice stříhá, myje a češe vlasy. S nůžkami musí zacházet opatrně a přesně.'),
  q('postacka', 'Kdo nosí dopisy a balíky?', 'Pošťačka',
    ['Lékařka', 'Pekař', 'Zahradník'],
    ['Chodí od domu k domu s velkou taškou.'],
    'Pošťačka doručuje dopisy a balíky. Díky ní dorazí pohled od babičky až do schránky.'),
  q('ridic', 'Kdo řídí autobus plný cestujících?', 'Řidič autobusu',
    ['Pilot', 'Kovář', 'Pekař'],
    ['Jezdí po silnici a zastavuje na zastávkách.'],
    'Řidič autobusu vozí lidi do školy, do práce i na výlety. Musí jezdit opatrně, protože veze hodně cestujících.'),
  q('zubar', 'Kdo se stará o zdravé zuby?', 'Zubař',
    ['Kovář', 'Pošťák', 'Kuchař'],
    ['Sedíš u něj v křesle s otevřenou pusou.'],
    'Zubař prohlíží a opravuje zuby. Chodíme k němu na prohlídku, i když nic nebolí.'),
  q('veterinarka', 'Kdo léčí nemocná zvířata?', 'Veterinářka',
    ['Programátorka', 'Prodavačka', 'Kadeřnice'],
    ['Chodí za ní pejsci i kočky.'],
    'Veterinářka je lékařka pro zvířata. Léčí psy, kočky, krávy i koně.'),
  q('rybar', 'Kdo chytá ryby a prodává je na trhu?', 'Rybář',
    ['Pekař', 'Zedník', 'Hasič'],
    ['Vyplouvá s lodí na moře.'],
    'Rybář chytá ryby do sítí nebo na prut. U Vikingů byly ryby důležitým jídlem.'),
  q('zednik', 'Kdo staví zdi domů?', 'Zedník',
    ['Zubař', 'Učitel', 'Pošťák'],
    ['Pracuje s cihlami a maltou.'],
    'Zedník staví zdi z cihel a tvárnic. Bez něj by nebyly domy, školy ani nemocnice.'),
  q('kucharka', 'Kdo vaří obědy ve školní jídelně?', 'Kuchařka',
    ['Hasička', 'Pošťačka', 'Zubařka'],
    ['Pracuje u velkých hrnců.'],
    'Kuchařky ve školní jídelně uvaří každý den oběd pro spoustu dětí.'),
  q('popelari', 'Kdo odváží odpadky z popelnic?', 'Popeláři',
    ['Hasiči', 'Pekaři', 'Zubaři'],
    ['Jezdí velkým autem, které odpadky lisuje.'],
    'Popeláři odvážejí odpadky, aby ulice a domy zůstaly čisté.'),
  q('prodavac', 'Kdo ti na trhu prodá jablka a vrátí drobné?', 'Prodavač',
    ['Lékař', 'Pilot', 'Zedník'],
    ['Stojí za pultem nebo u stánku.'],
    'Prodavač nabízí zboží, bere peníze a vrací drobné. Poradí taky, co vybrat.'),
  q('krejci', 'Kdo šije oblečení na míru?', 'Krejčí',
    ['Kovář', 'Zedník', 'Zubař'],
    ['Pracuje s jehlou, nití a látkou.'],
    'Krejčí změří postavu a ušije oblečení přesně na míru.'),
  q('odkud-penize', 'Odkud mají rodiče většinou peníze na nákup?', 'Vydělají je prací',
    ['Rostou na stromě', 'Tisknou si je doma', 'Bankomat je dává každému'],
    ['Kam rodiče chodí přes den?'],
    'Většina dospělých dostává peníze za svou práci. Bankomat vydá jen peníze, které už člověk má na svém účtu.'),
  q('za-praci', 'Co lidé za práci v zaměstnání většinou dostávají?', 'Výplatu',
    ['Nic', 'Bonbony', 'Vysvědčení'],
    ['Z čeho rodina platí jídlo a bydlení?'],
    'Za práci lidé dostávají peníze – výplatu. Z ní platí bydlení, jídlo a další věci.'),
];

// ---------------------------------------------------------------------------
// L2 – co práce přináší ostatním, příjem a výdaj, jak věci vznikají

const L2: Spec[] = [
  pv('vyplata', 'Máma dostala výplatu.', 'pro rodinu', true, 'Dostala peníze, nebo je dala?',
    'Výplata jsou peníze, které do rodiny přibudou.'),
  pv('najem', 'Táta zaplatil nájem za byt.', 'pro rodinu', false, 'Peníze od rodiny odešly, nebo přišly?',
    'Za bydlení se platí a peníze z rodinného rozpočtu ubudou.'),
  pv('kapesne', 'Dostala jsi kapesné.', 'pro tebe', true, 'Máš teď víc, nebo méně peněz?',
    'Kapesné jsou peníze, které ti přibudou.'),
  pv('obedy', 'Rodiče zaplatili obědy ve škole.', 'pro rodinu', false, 'Peníze přišly, nebo odešly?',
    'Za obědy se platí, takže peníze ubudou.'),
  pv('prodej-kola', 'Prodali jste staré kolo.', 'pro rodinu', true, 'Kdo komu dal peníze?',
    'Kupec vám za kolo zaplatil, takže peníze přibyly.'),
  pv('kino', 'Koupila sis lístek do kina.', 'pro tebe', false, 'Peníze přišly, nebo odešly?',
    'Za lístek jsi zaplatila, peníze ti ubyly.'),
  pv('duchod', 'Babička dostala důchod.', 'pro babičku', true, 'Babička peníze dostala, nebo dala?',
    'Důchod jsou peníze, které lidé pravidelně dostávají ve stáří.'),
  pv('elektrina', 'Rodina zaplatila za elektřinu.', 'pro rodinu', false, 'Peníze přišly, nebo odešly?',
    'Za elektřinu se platí a peníze z rozpočtu ubudou.'),
  pv('darek-deda', 'Od dědy jsi k narozeninám dostala 200 Kč.', 'pro tebe', true, 'Máš teď víc, nebo méně peněz?',
    'Dar od dědy jsou peníze, které ti přibyly.'),
  pv('oprava-auta', 'Rodiče zaplatili opravu auta.', 'pro rodinu', false, 'Peníze přišly, nebo odešly?',
    'Oprava stála peníze, které z rozpočtu ubyly.'),
  q('popelari-tyden', 'Co by se stalo, kdyby popeláři týden nejezdili?', 'Hromadily by se odpadky',
    ['Nic by se nestalo', 'Ulice by byly čistší', 'Popelnice by se samy vysypaly'],
    ['Kam by se poděly odpadky?'],
    'Bez popelářů by se odpadky hromadily a zapáchaly. Jejich práce je pro všechny moc důležitá.'),
  q('kovar-nastroje', 'Co potřebuje kovář ke své práci?', 'Kladivo a kovadlinu',
    ['Fonendoskop', 'Nůžky na vlasy', 'Pánev a vařečku'],
    ['Čím se tvaruje rozžhavené železo?'],
    'Kovář tvaruje rozžhavené železo kladivem na kovadlině.'),
  q('lekar-nastroj', 'Čím lékař poslouchá srdce a plíce?', 'Fonendoskopem',
    ['Kladivem', 'Hřebenem', 'Metrem'],
    ['Nosí ho často kolem krku.'],
    'Fonendoskop přenáší zvuky srdce a dechu do uší lékaře.'),
  q('pekari-v-noci', 'Proč pekaři často začínají pracovat už v noci?', 'Aby bylo ráno čerstvé pečivo',
    ['Protože ve dne se péct nesmí', 'Aby měli volno na oběd', 'Protože v noci je tma'],
    ['Kdy chceš mít rohlík ke snídani?'],
    'Těsto musí vykynout a upéct se. Aby bylo pečivo ráno v obchodech čerstvé, pekaři začínají brzy.'),
  q('hra-v-mobilu', 'Díky komu funguje hra v mobilu?', 'Díky programátorům',
    ['Díky pekařům', 'Díky hasičům', 'Díky zedníkům'],
    ['Kdo píše počítači pokyny?'],
    'Hry, mapy i aplikace píší programátoři a programátorky. Často na jedné hře pracuje velký tým.'),
  ord('chleb', 'Seřaď, jak se chléb dostane na stůl.', ['Zemědělec zaseje obilí', 'Mlynář semele mouku', 'Pekařka upeče chléb', 'Prodavač chléb prodá'],
    ['Co musí být dřív: mouka, nebo chléb?'],
    'Nejdřív zemědělec zaseje a sklidí obilí, mlynář z něj semele mouku, pekařka upeče chléb a prodavač ho prodá. Na jednom bochníku pracuje spousta lidí.'),
  ord('svetr', 'Seřaď, jak vzniká vlněný svetr.', ['Ovci naroste vlna', 'Farmář ovci ostříhá', 'Z vlny se upřede příze', 'Z příze se uplete svetr'],
    ['Na začátku je zvíře.'],
    'Ovci naroste vlna, farmář ji ostříhá, z vlny se upřede příze a z příze se uplete svetr.'),
];

// ---------------------------------------------------------------------------
// L3 – neplacená práce, dobrovolníci, mzda, řemesla

const L3: Spec[] = [
  q('prace-doma', 'Rodiče doma vaří, perou a uklízejí. Dostanou za to výplatu?', 'Ne, ale je to důležitá práce',
    ['Ano, každý den', 'Ano, od obchodu', 'Ne, protože to není práce'],
    ['Kdo by to dělal, kdyby to nedělali rodiče?'],
    'Za práci doma se neplatí, ale má velkou hodnotu. Kdyby ji za rodinu dělal někdo jiný, museli by mu zaplatit.'),
  q('platit-za-domacnost', 'Co by se stalo, kdyby rodina platila někomu cizímu za vaření a úklid?', 'Utratila by hodně peněz',
    ['Nic by to nestálo', 'Dostala by peníze', 'Byla by bohatší'],
    ['Pracuje cizí člověk zadarmo?'],
    'Vaření a úklid dají hodně práce. Kdyby je dělal někdo za peníze, stálo by to rodinu hodně – proto má práce doma velkou hodnotu.'),
  q('pomoc-doma', 'Jak můžeš s prací doma pomoct ty?', 'Prostřít stůl a uklidit hračky',
    ['Nechat všechno na rodičích', 'Schovat se', 'Rozházet prádlo'],
    ['Co zvládneš už teď?'],
    'I malá pomoc se počítá. Když rodina pracuje společně, zbude víc času na hraní.'),
  q('dobrovolnici', 'Jak se říká lidem, kteří pomáhají druhým bez nároku na peníze?', 'Dobrovolníci',
    ['Podnikatelé', 'Zákazníci', 'Prodavači'],
    ['Dělají to ze své vůle.'],
    'Dobrovolníci pomáhají zdarma: sázejí stromy, hrají si s dětmi v nemocnici nebo hasí požáry ve sborech dobrovolných hasičů.'),
  q('mzda', 'Jak se říká penězům, které člověk dostává za práci v zaměstnání?', 'Mzda nebo plat',
    ['Kapesné', 'Úrok', 'Sleva'],
    ['Dostává je každý měsíc od zaměstnavatele.'],
    'Za práci v zaměstnání dostává člověk mzdu, u státu a obcí se jí říká plat. Běžně se oběma říká výplata.'),
  q('brigada', 'Studentka v létě na pár týdnů pomáhá v cukrárně za peníze. Jak se tomu říká?', 'Brigáda',
    ['Dovolená', 'Prázdniny', 'Výlet'],
    ['Je to práce jen na krátkou dobu.'],
    'Brigáda je krátkodobá práce, třeba o prázdninách. Studenti si tak přivydělají a vyzkoušejí různé profese.'),
  q('lekar-studium', 'Proč se lékaři učí tak dlouho?', 'Musí hodně znát, aby léčili bezpečně',
    ['Aby nemuseli pracovat', 'Protože nikam nespěchají', 'Aby byli nejstarší'],
    ['Co všechno musí lékař znát?'],
    'Na lékaře se v Česku studuje šest let na vysoké škole a pak se ještě léta učí v nemocnici. Musí znát lidské tělo i léky.'),
  q('hrnciri', 'Na vikingském trhu prodává řemeslnice hliněné hrnce. Jak se jejímu řemeslu říká?', 'Hrnčířství',
    ['Kovářství', 'Pekařství', 'Rybářství'],
    ['Z čeho jsou hrnce?'],
    'Hrnčířka tvaruje hlínu a vypaluje ji v peci. Hliněné nádoby archeologové nacházejí i ve vikingských osadách.'),
  q('zelezo', 'Kovář na trhu prodává zámky a hřebíky. Z čeho je vyrábí?', 'Ze železa',
    ['Z hlíny', 'Z vlny', 'Z mouky'],
    ['Musí ho rozžhavit v ohni.'],
    'Kovář vyrábí věci ze železa. Vikingské lodě držely pohromadě železné nýty, které vyráběli kováři.'),
  q('bavi-ji', 'Freja chce být veterinářkou, protože má ráda zvířata. Co je dobré na práci, která člověka baví?', 'Dělá ji rád a dobře',
    ['Nemusí se nic učit', 'Nedostane za ni peníze', 'Nikdy není unavený'],
    ['Jak se ti dělá věc, která tě baví?'],
    'Práce, která člověka baví, se mu dělá lépe. I tak se ale musí hodně učit a zvládnout i těžší dny.'),
  q('bankomat', 'Odkud se berou peníze, které táta vybere z bankomatu?', 'Z jeho účtu, kam přišla výplata',
    ['Bankomat si je tiskne', 'Jsou zadarmo pro každého', 'Rostou uvnitř bankomatu'],
    ['Co se stane na účtu, když si peníze vybereš?'],
    'Bankomat vydá jen peníze, které má člověk na svém účtu. Na účet mu je poslal zaměstnavatel jako výplatu.'),
  q('vymena', 'Jak mohli lidé získat, co potřebovali, i bez peněz?', 'Vyměnit si věci',
    ['Stáhnout si je z internetu', 'Zaplatit kartou', 'Vytisknout si je'],
    ['Co si můžou vyměnit dvě kamarádky?'],
    'Lidé si odedávna věci vyměňovali, třeba vlnu za sýr. Peníze výměnu usnadnily, protože nemusíš hledat někoho, kdo chce právě tvoji věc.'),
  q('kazdy-jinou', 'Proč je dobře, že každý dělá jinou práci?', 'Navzájem si pomáháme',
    ['Aby nikdo nic neuměl', 'Aby se lidé nepotkávali', 'Aby všechno stálo víc'],
    ['Kdo peče chléb pro lékaře a kdo léčí pekařku?'],
    'Pekařka peče chléb pro lékaře a lékař léčí pekařku. Když každý umí něco jiného, společně toho zvládneme víc.'),
  q('tkadlena', 'Kdo na vikingském trhu utkal látku na teplý plášť?', 'Tkadlena',
    ['Kovářka', 'Rybářka', 'Pekařka'],
    ['Pracuje u tkalcovského stavu.'],
    'Tkadlena tkala látku z vlněné příze na stavu. U Vikingů to byla důležitá a časově náročná práce – na jeden plášť bylo potřeba spoustu příze.'),
  q('pomaha-zdarma', 'Soused seká trávu staré paní a nechce za to žádné peníze. Co dělá?', 'Pomáhá zdarma',
    ['Podniká', 'Pracuje za mzdu', 'Nakupuje'],
    ['Dostane soused něco zaplaceno?'],
    'Soused pomáhá zdarma. I práce bez peněz má velkou hodnotu – paní ušetří námahu a má radost.'),
  q('kdo-ma-vyplatu', 'Kdo z nich dostává za svou práci výplatu?', 'Prodavačka v obchodě',
    ['Táta, když doma vaří', 'Dobrovolnice v útulku', 'Soused, který pomáhá zdarma'],
    ['Kdo má zaměstnavatele?'],
    'Prodavačka pracuje pro obchod a dostává mzdu. Vaření doma a dobrovolná pomoc jsou práce bez výplaty – a přesto moc cenné.'),
  q('ucetni', 'Kdo pracuje hlavně s čísly a hlídá, kolik firma utratila a vydělala?', 'Účetní',
    ['Kuchař', 'Zahradnice', 'Kadeřník'],
    ['Pracuje s tabulkami, účtenkami a fakturami.'],
    'Účetní zapisuje každý příjem a výdaj firmy. Díky tomu je vidět, jestli se firmě daří.'),
  q('ochranne-pomucky', 'Proč nosí svářeč nebo zedník ochranné brýle a rukavice?', 'Aby se nezranili',
    ['Aby vypadali hezky', 'Protože je jim zima', 'Aby je nikdo nepoznal'],
    ['Co by se mohlo stát bez nich?'],
    'Ochranné pomůcky chrání oči a ruce při práci. Bezpečnost je v každé práci na prvním místě.'),
  ord('hracka', 'Seřaď, jak vzniká dřevěná hračka na trhu.', ['Lesník vybere strom', 'Dřevo se nařeže a usuší', 'Řezbář vyřeže koníka', 'Prodavačka ho prodá na trhu'],
    ['Na začátku je les.'],
    'Lesník vybere strom, dřevo se nařeže a usuší, řezbář vyřeže koníka a prodavačka ho prodá. Cena hračky platí práci všech.'),
  q('uceni', 'Proč se vyplatí učit se nové věci?', 'Můžeš pak dělat víc druhů práce',
    ['Učení nic nepřináší', 'Za učení se platí pokuta', 'Aby nebyl čas na hraní'],
    ['Co všechno můžeš dělat, když umíš číst, počítat a programovat?'],
    'Co se naučíš, to ti zůstane. Kdo umí víc, může si vybírat z více druhů práce.'),
];

// ---------------------------------------------------------------------------
// L4 – stánek: tržba, náklady, zisk; zaměstnanec a podnikatel

const L4: Spec[] = [
  q('trzba', 'Jak se říká všem penězům, které stánek za den dostane od zákazníků?', 'Tržba',
    ['Zisk', 'Náklady', 'Úrok'],
    ['Není to ještě to, co zbude po zaplacení nákladů.'],
    'Tržba jsou všechny peníze od zákazníků. Zisk je to, co zbude, když zaplatíš náklady.'),
  q('naklady', 'Co jsou náklady stánku s limonádou?', 'Peníze za citrony a kelímky',
    ['Peníze od zákazníků', 'Peníze, které zbudou', 'Peníze v prasátku'],
    ['Co musíš zaplatit, než začneš prodávat?'],
    'Náklady jsou peníze, které musíš utratit, abys mohla prodávat: za citrony, cukr, vodu a kelímky.'),
  q('zisk', 'Co je zisk?', 'Co zbude z tržby po nákladech',
    ['Všechny peníze od zákazníků', 'Peníze za citrony', 'Sleva pro kamarády'],
    ['Co zůstane, když se zaplatí všechno potřebné?'],
    'Zisk je tržba minus náklady. Když prodáš za 300 Kč a náklady byly 100 Kč, zisk je 200 Kč.'),
  pv('citrony', 'Koupila jsi citrony na limonádu.', 'pro stánek', false, 'Peníze stánku přibyly, nebo ubyly?',
    'Citrony jsi zaplatila, takže peníze ubyly. Je to náklad.'),
  pv('zakaznik', 'Zákazník zaplatil za dvě limonády.', 'pro stánek', true, 'Peníze stánku přibyly, nebo ubyly?',
    'Peníze od zákazníka přibyly do pokladny. Jsou součástí tržby.'),
  q('podnikatel', 'Jak se říká člověku, který si založí vlastní obchod nebo dílnu?', 'Podnikatel',
    ['Zaměstnanec', 'Důchodce', 'Zákazník'],
    ['Pracuje sám na sebe a nese riziko.'],
    'Podnikatel si založí vlastní obchod nebo dílnu. Když se daří, vydělá, ale když ne, může prodělat.'),
  q('zamestnankyne', 'Pekařka pracuje v cizí pekárně a každý měsíc dostává mzdu. Jak se jí říká?', 'Zaměstnankyně',
    ['Majitelka pekárny', 'Zákaznice', 'Dobrovolnice'],
    ['Pracuje pro někoho jiného.'],
    'Zaměstnankyně pracuje pro zaměstnavatele a každý měsíc dostává mzdu.'),
  q('prselo', 'Tove otevřela stánek, ale celý den pršelo a nikdo nepřišel. Co se stalo?', 'Prodělala na nákladech',
    ['Vydělala hodně peněz', 'Nic ji to nestálo', 'Dostala mzdu'],
    ['Musela Tove za suroviny zaplatit, i když nic neprodala?'],
    'Suroviny zaplatila předem, ale nic neprodala. Podnikání je riziko, a proto si podnikatelé dobře plánují.'),
  q('cena-limonady', 'Jak může Runa rozumně určit, za kolik prodávat limonádu?', 'Podle nákladů a cen jinde',
    ['Hodí si kostkou', 'Vezme co nejvyšší číslo', 'Dá ji všem zadarmo'],
    ['Co musí cena pokrýt?'],
    'Cena musí pokrýt náklady a něco navíc. Zároveň se vyplatí podívat, za kolik prodávají ostatní, aby zákazníci přišli.'),
  q('co-je-prijem', 'Co z toho je pro rodinu příjem?', 'Mámina výplata',
    ['Nájem', 'Nákup jídla', 'Účet za vodu'],
    ['Které peníze do rodiny přicházejí?'],
    'Výplata do rodiny přichází, proto je to příjem. Nájem, jídlo a voda jsou výdaje.'),
  q('co-je-vydaj', 'Co z toho je pro rodinu výdaj?', 'Účet za elektřinu',
    ['Tátova výplata', 'Dárek od dědy', 'Peníze za prodané kolo'],
    ['Za co rodina platí?'],
    'Za elektřinu rodina platí, peníze odcházejí. Ostatní možnosti jsou příjmy.'),
];

// ---------------------------------------------------------------------------
// L5 – daně jednoduše, důchod, podnikání

const L5: Spec[] = [
  q('dane', 'Z čeho se platí školy a silnice?', 'Z daní, které platíme všichni',
    ['Z kapesného dětí', 'Z peněz, které si každý natiskne', 'Z pokut za pozdní příchod'],
    ['Kdo do společné pokladny přispívá?'],
    'Lidé a firmy platí daně do společné pokladny. Z ní se platí věci pro všechny: školy, silnice, hasiči i policie.'),
  q('dph', 'Když si v obchodě koupíš zmrzlinu, v její ceně je i kousek daně. Kdo ji nakonec dostane?', 'Stát',
    ['Zmrzlinář navíc', 'Kamarádka', 'Nikdo'],
    ['Kam jdou daně?'],
    'V ceně většiny věcí v obchodech je daň z přidané hodnoty. Obchod ji odvede státu a z daní se pak platí věci pro všechny.'),
  q('vyplata-mene', 'Z výplaty se část peněz strhne dřív, než přijde na účet. Proč?', 'Platí se z ní daně a pojištění',
    ['Zaměstnavatel si ji nechá', 'Je to trest', 'Banka ji ztratí'],
    ['Z čeho se platí nemocnice a důchody?'],
    'Z výplaty se platí daň a pojištění na zdraví a na důchod. Na účet pak přijde menší částka než celá mzda.'),
  q('zastupitele', 'Kdo rozhoduje, na co obec použije peníze z daní?', 'Zastupitelé, které lidé zvolí',
    ['Každý sám za sebe', 'Nejbohatší člověk v obci', 'Losování'],
    ['Kdo se v obci volí?'],
    'Obyvatelé si ve volbách vyberou zastupitele. Ti schvalují rozpočet obce – na co se peníze použijí.'),
  q('hasici-plat', 'Kdo platí výplatu profesionálním hasičům?', 'Stát z daní',
    ['Ten, komu hoří', 'Sousedé z kasičky', 'Nikdo'],
    ['Kdo platí věci, které chrání všechny?'],
    'Profesionální hasiče platí stát z daní. Proto při požáru nebo nehodě pomůžou každému, kdo je potřebuje.'),
  q('duchod', 'Z čeho dostávají peníze lidé v důchodu?', 'Z pojištění, které platí pracující',
    ['Z kapesného vnoučat', 'Z prodeje starých věcí', 'Z výher v loterii'],
    ['Kdo platí pojištění z výplaty?'],
    'Pracující lidé platí z výplaty důchodové pojištění. Hlavně z těchto peněz stát vyplácí důchody.'),
  q('ucitelka-plat', 'Kdo platí výplatu paní učitelce ve státní škole?', 'Stát z daní',
    ['Rodiče každý den', 'Děti z kapesného', 'Nikdo'],
    ['Platíš ve škole vstupné?'],
    'Učitelům ve státních školách platí stát z daní. Proto do základní školy chodí děti zadarmo.'),
  q('osvetleni', 'Která z těchto věcí se platí hlavně z daní?', 'Osvětlení na ulici',
    ['Tvoje zmrzlina', 'Nová hračka', 'Lístek do kina'],
    ['Co slouží všem, kdo jdou kolem?'],
    'Pouliční osvětlení slouží všem, a proto ho platí obec ze společných peněz. Zmrzlinu, hračku i kino si platí každý sám.'),
  q('podnikatelka-prijem', 'Proč podnikatelka nemá každý měsíc stejný příjem jako zaměstnankyně?', 'Záleží, kolik prodá',
    ['Protože nechce', 'Protože podnikat se nesmí', 'Protože má moc peněz'],
    ['Kdo jí platí, když nepřijdou zákazníci?'],
    'Podnikatelka vydělá jen tolik, kolik prodá, a náklady platí sama. Některý měsíc se daří víc, jiný méně.'),
];

// ---------------------------------------------------------------------------
// Stánek: tržba, zisk, kdy se vrátí náklady, zisk, nebo ztráta?

interface Product {
  key: string;
  /** Co se nakoupí (4. pád). */
  inputs: string;
  /** Tvary pro počet (4. pád): ['limonádu', 'limonády', 'limonád']. */
  acc: Forms;
  /** „Limonády (prodává po 10 Kč)“ (4. pád množného čísla) a 2. pád množného čísla. */
  each: string;
  gen: string;
  prices: number[];
}

const PRODUCTS: Product[] = [
  { key: 'limonada', inputs: 'citrony, cukr a kelímky', acc: ['limonádu', 'limonády', 'limonád'], each: 'Limonády', gen: 'limonád', prices: [5, 10, 15, 20] },
  { key: 'pernicky', inputs: 'mouku, med a koření', acc: ['perníček', 'perníčky', 'perníčků'], each: 'Perníčky', gen: 'perníčků', prices: [5, 10, 15] },
  { key: 'naramky', inputs: 'korálky a gumičky', acc: ['náramek', 'náramky', 'náramků'], each: 'Náramky', gen: 'náramků', prices: [10, 15, 20, 25, 30] },
  { key: 'svicky', inputs: 'vosk a knoty', acc: ['svíčku', 'svíčky', 'svíček'], each: 'Svíčky', gen: 'svíček', prices: [20, 25, 30, 40] },
];

type Variant = 'zisk' | 'trzba' | 'navrat' | 'bilance';

function stanek(level: 4 | 5): Attempt {
  return (rng: Rng) => {
    const variant: Variant = level === 4 ? rng.pick(['zisk', 'zisk', 'trzba', 'navrat'] as const) : rng.pick(['zisk', 'navrat', 'bilance', 'bilance'] as const);
    const p = rng.pick(PEOPLE);
    const prod = rng.pick(PRODUCTS);
    const price = rng.pick(prod.prices);
    const costs = rng.int(level === 4 ? 6 : 8, level === 4 ? 20 : 40) * 10 + (level === 5 ? rng.pick([0, 5]) : 0);
    const bought = `${p.name} ${v(p, 'koupil', 'koupila')} ${prod.inputs} za ${kc(costs)}.`;
    const key = `${variant}-${pkey(p)}-${prod.key}-${costs}-${price}`;
    if (variant === 'navrat') {
      const n = Math.ceil(costs / price);
      if (level === 4 && costs % price !== 0) return null;
      if (n < 3 || n > 40) return null;
      const exact = costs % price === 0;
      return nm(
        key,
        `${bought} ${prod.each} prodává po ${kc(price)}. Kolik ${prod.gen} musí prodat, aby se ${v(p, 'mu', 'jí')} vrátily náklady?`,
        n,
        ['Kolikrát se cena jednoho kusu vejde do nákladů?', 'Když to nevyjde přesně, musí prodat ještě o kus víc.'],
        exact
          ? `${f(costs)} : ${price} = ${n}. Když prodá ${count(n, prod.acc)}, má zpátky přesně ${kc(costs)}.`
          : `Za ${count(n - 1, prod.acc)} dostane ${kc((n - 1) * price)}, to ještě nestačí. Za ${count(n, prod.acc)} dostane ${kc(n * price)}, a to už náklady pokryje.`,
        { difficulty: level === 5 ? 0.2 : 0.3 },
      );
    }
    // U otázky „zisk, nebo ztráta?“ se prodá kolem tolika kusů, kolik pokryje náklady.
    const n = variant === 'bilance' ? Math.max(2, Math.round(costs / price) + rng.int(-3, 3)) : rng.int(level === 4 ? 5 : 3, level === 4 ? 30 : 40);
    const income = n * price;
    const sold = `Pak ${v(p, 'prodal', 'prodala')} ${count(n, prod.acc)} po ${kc(price)}.`;
    if (variant === 'trzba') {
      return nm(
        key + `-${n}`,
        `${bought} ${sold} Kolik korun ${v(p, 'utržil', 'utržila')}?`,
        income,
        ['Tržba jsou všechny peníze od zákazníků.', `Vynásob počet kusů cenou: ${n} × ${price}.`],
        `${n} × ${price} = ${kc(income)}. Tržba nezávisí na nákladech.`,
        { unit: 'Kč', difficulty: -0.2 },
      );
    }
    const profit = income - costs;
    if (variant === 'zisk') {
      if (profit <= 0) return null;
      return nm(
        key + `-${n}`,
        `${bought} ${sold} Kolik korun ${v(p, 'vydělal', 'vydělala')} po odečtení nákladů?`,
        profit,
        ['Nejdřív spočítej tržbu – všechny peníze od zákazníků.', 'Od tržby odečti náklady.'],
        `Tržba: ${n} × ${price} = ${kc(income)}. Zisk: ${f(income)} − ${f(costs)} = ${kc(profit)}.`,
        { unit: 'Kč', difficulty: level === 5 ? 0 : 0.1 },
      );
    }
    const correct = profit > 0 ? 0 : profit < 0 ? 1 : 2;
    return fx(
      key + `-${n}`,
      `${bought} ${sold} Je to zisk, nebo ztráta?`,
      ['Zisk', 'Ztráta', 'Vyšlo to nastejno'],
      correct,
      ['Spočítej tržbu a porovnej ji s náklady.'],
      `Tržba: ${n} × ${price} = ${kc(income)}, náklady ${kc(costs)}. ${correct === 0 ? `Zbude ${kc(profit)}, to je zisk.` : correct === 1 ? `Chybí ${kc(-profit)}, to je ztráta.` : 'Tržba je stejná jako náklady, vyšlo to nastejno.'}`,
      { difficulty: 0.1 },
    );
  };
}

// ---------------------------------------------------------------------------

export const prace = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Práce a výdělek',
  description: 'Povolání a co přinášejí ostatním, odkud se berou peníze, příjem a výdaj, neplacená práce doma, stánek (náklady, tržba, zisk) a daně jednoduše.',
  rvp: { 1: ['ČJS-3-2-02'], 2: ['ČJS-3-2-02'], 3: ['ČJS-3-2-02'], 4: ['ČJS-5-2-03'], 5: ['ČJS-5-2-03'] },
  ability: 'znalosti',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 },
  genShare: 0.4,
  gen: {
    4: mix(ID, [[1, stanek(4)]]),
    5: mix(ID, [[1, stanek(5)]]),
  },
});
