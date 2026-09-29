// Postupy a algoritmy: seřazení každodenních postupů, podmínky („Když prší,
// vezmi si deštník.“), opakování (kolikrát robot tleskne?), zkrácený zápis
// s opakováním (→ → → ↑ ↑ = 3× →, 2× ↑) a robot, který bere pokyny doslova.

import { bankSkill, type ChoiceSpec, type NumberSpec, type OrderSpec, type Spec } from '../../core/bank';
import { count } from '../../core/czech';
import { MOVE_WORD } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, KnowledgeCard, Move } from '../../core/types';
import { TIMES_WORD, arrowsSpeak, arrowsText, joinA, speakTimes } from './algoritmy-mrizka';

const ID = 'dilna.postupy';

// ---------------------------------------------------------------------------
// Banka: seřazení, podmínky, doslovný robot

function order(key: string, prompt: string, correct: string[], hints: string[], explain: string): OrderSpec {
  return { kind: 'order', key: `poradi-${key}`, prompt, correct, hints, explain };
}

function kdyz(key: string, prompt: string, correct: string, wrong: string[], hints: string[], explain: string): ChoiceSpec {
  return { key: `kdyz-${key}`, prompt, correct, wrong, hints, explain };
}

function kdyzCislo(key: string, prompt: string, correct: number, hints: string[], explain: string): NumberSpec {
  return { kind: 'number', key: `kdyz-${key}`, prompt, correct, hints, explain };
}

function doslova(key: string, prompt: string, correct: string, wrong: string[], hints: string[], explain: string): ChoiceSpec {
  return { key: `doslova-${key}`, prompt, correct, wrong, hints, explain };
}

const L1: Spec[] = [
  order('zuby', 'Seřaď, jak si robot čistí zuby.', ['Nanes pastu na kartáček', 'Čisti si zuby', 'Vypláchni si pusu'],
    ['Co musí být na kartáčku, než začneš?'],
    'Nejdřív pasta na kartáček, pak čištění a nakonec vypláchnutí pusy.'),
  order('seminko', 'Seřaď, jak robot sází semínko.', ['Udělej v hlíně důlek', 'Vlož do důlku semínko', 'Zasyp semínko hlínou', 'Zalij zasypané semínko'],
    ['Kam se semínko vkládá?'],
    'Nejdřív se udělá důlek, do něj se vloží semínko, zasype se hlínou a nakonec se zalije.'),
  order('chleba', 'Seřaď, jak si robot dělá svačinu.', ['Vezmi krajíc chleba', 'Namaž ho máslem', 'Sněz ho'],
    ['Co se dělá nakonec?'],
    'Krajíc si robot nejdřív vezme, pak ho namaže a nakonec sní.'),
  order('ruce', 'Seřaď, jak si robot myje ruce.', ['Namoč si ruce', 'Namydli si je', 'Opláchni mýdlo', 'Utři si ruce'],
    ['Co se dělá s mýdlem, než si ruce utřeš?'],
    'Ruce se namočí, namydlí, mýdlo se opláchne a nakonec se ruce utřou.'),
  order('obleceni', 'Venku mrzne. Seřaď, jak se robot obléká.', ['Obleč si tričko', 'Obleč si svetr', 'Obleč si bundu'],
    ['Co nosíš nejblíž u těla?'],
    'Nejblíž u těla je tričko, přes něj svetr a navrch bunda.'),
  order('drak', 'Seřaď, jak robot krmí draka.', ['Naber ryby do kyblíku', 'Dones kyblík k drakovi', 'Dej drakovi ryby'],
    ['Co musí robot mít, než jde k drakovi?'],
    'Robot nejdřív nabere ryby, donese je k drakovi a pak mu je dá.'),
  order('boty', 'Seřaď, jak se robot obouvá.', ['Natáhni si ponožky', 'Obuj si boty', 'Zavaž si tkaničky'],
    ['Co je v botě nejblíž u nohy?'],
    'Nejdřív ponožky, pak boty a nakonec se zavážou tkaničky.'),
  order('kakao', 'Seřaď, jak robot připraví kakao.', ['Nasyp kakao do hrnku', 'Zalij ho mlékem', 'Zamíchej'],
    ['Co musí být v hrnku, než přiliješ mléko?'],
    'Kakao se nasype do hrnku, zalije mlékem a nakonec se zamíchá.'),
  order('balonek', 'Seřaď, jak si robot hraje s balonkem.', ['Nafoukni balonek', 'Zavaž ho', 'Hraj si s ním'],
    ['Co by se stalo, kdyby balonek nebyl zavázaný?'],
    'Balonek se nejdřív nafoukne, pak zaváže, aby z něj neutekl vzduch, a pak si s ním robot hraje.'),
  kdyz('destnik', 'Robot má pravidlo: Když prší, vezmi si deštník. Venku prší. Co robot udělá?', 'Vezme si deštník',
    ['Nevezme si deštník', 'Vezme si plavky', 'Lehne si do postele'],
    ['Platí podmínka „když prší“?'],
    'Venku prší, takže podmínka platí a robot si vezme deštník.'),
  kdyz('zelena', 'Robot má pravidlo: Když svítí zelená, jdi. Na semaforu svítí zelená. Co robot udělá?', 'Půjde',
    ['Bude stát', 'Otočí se a odejde domů', 'Sedne si na zem'],
    ['Co svítí na semaforu?'],
    'Svítí zelená, podmínka platí, a tak robot půjde.'),
  kdyz('hlad', 'Robot má pravidlo: Když je drak hladový, dej mu rybu. Drak hladový není. Co robot udělá?', 'Rybu mu nedá',
    ['Dá mu rybu', 'Dá mu dvě ryby', 'Sní rybu sám'],
    ['Platí podmínka?'],
    'Podmínka neplatí – drak hladový není. Robot mu proto rybu nedá.'),
  kdyz('tma', 'Robot má pravidlo: Když je tma, rozsviť lampu. Je poledne a svítí slunce. Co robot udělá?', 'Lampu nerozsvítí',
    ['Rozsvítí lampu', 'Rozsvítí dvě lampy', 'Zhasne slunce'],
    ['Je v poledne tma?'],
    'V poledne tma není, podmínka neplatí, a tak robot lampu nerozsvítí.'),
  kdyz('budik', 'Robot má pravidlo: Když zazvoní budík, vstaň. Budík právě zvoní. Co robot udělá?', 'Vstane',
    ['Spí dál', 'Zavře oči', 'Schová budík pod polštář'],
    ['Zvoní budík?'],
    'Budík zvoní, podmínka platí, a tak robot vstane.'),
  kdyz('hlina', 'Robot má pravidlo: Když je hlína suchá, zalij květinu. Hlína je mokrá. Co robot udělá?', 'Nezalije květinu',
    ['Zalije květinu', 'Zalije ji dvakrát', 'Vysype hlínu'],
    ['Je hlína suchá?'],
    'Hlína je mokrá, podmínka neplatí, a tak robot květinu nezalije.'),
  doslova('mleko', 'Robot dostal pokyn: Nalij mléko. Nalil ho rovnou na stůl! Co v pokynu chybělo?', 'Kam má mléko nalít',
    ['Jakou barvu má mléko', 'Kolik je hodin', 'Jak se jmenuje kráva'],
    ['Kam se mléko obvykle nalévá?'],
    'Robot nevěděl, kam má mléko nalít. Lepší pokyn je: Nalij mléko do hrnku.'),
  doslova('maslo', 'Robot dostal pokyn: Namaž chleba. Stojí a neví, co dělat. Co v pokynu chybělo?', 'Čím má chleba namazat',
    ['Kdo chleba upekl', 'Jak je chleba starý', 'Kolik váží robot'],
    ['Co se na chleba maže?'],
    'Robot nevěděl, čím má chleba namazat. Lepší pokyn je: Namaž chleba máslem.'),
  doslova('ven', 'Robot dostal pokyn: Jdi ven. Vyšel bos a bez bundy do sněhu. Co v pokynu chybělo?', 'Že se má obout a obléct',
    ['Kolik je venku stromů', 'Jak se jmenuje soused', 'Jakou barvu má sníh'],
    ['Co si bereš na sebe, než jdeš v zimě ven?'],
    'Robot udělal přesně to, co slyšel. Lepší pokyn je: Obuj se, obleč si bundu a jdi ven.'),
  doslova('kvetina', 'Robot dostal pokyn: Zalij květinu. Vylil na ni celou vanu vody. Co v pokynu chybělo?', 'Kolik vody má nalít',
    ['Jak se květina jmenuje', 'Kdo květinu koupil', 'Kolik je hodin'],
    ['Kolik vody květina potřebuje?'],
    'Robot nevěděl, kolik vody má nalít. Lepší pokyn je: Zalij květinu jednou sklenicí vody.'),
];

const L2: Spec[] = [
  order('seminko', 'Seřaď, jak robot sází semínko do květináče.',
    ['Nasyp do květináče hlínu', 'Udělej v hlíně důlek', 'Vlož do důlku semínko', 'Zasyp semínko hlínou', 'Zalij zasypané semínko'],
    ['Co musí být v květináči jako první?'],
    'Nejdřív se do květináče nasype hlína, pak se udělá důlek, vloží semínko, zasype se a nakonec zalije.'),
  order('zima', 'Seřaď, jak se robot obléká ven do zimy.',
    ['Obleč si tričko', 'Obleč si svetr', 'Obleč si bundu', 'Zapni si bundu', 'Jdi ven'],
    ['Co je nejblíž u těla a co navrchu?'],
    'Oblékáme se od těla: tričko, svetr, bunda. Bundu je potřeba zapnout a pak se může ven.'),
  order('caj', 'Seřaď, jak robot vaří čaj.',
    ['Nalij vodu do konvice', 'Uvař vodu', 'Zalij čaj horkou vodou', 'Nech čaj vychladnout', 'Napij se'],
    ['Kdy se dá čaj pít?'],
    'Voda se nalije do konvice a uvaří, pak se zalije čaj, nechá se vychladnout a nakonec se pije.'),
  order('dopis', 'Seřaď, jak robot posílá dopis.',
    ['Napiš dopis', 'Vlož ho do obálky', 'Zalep obálku', 'Hoď dopis do schránky'],
    ['Co se s dopisem dělá nakonec?'],
    'Dopis se napíše, vloží do obálky, obálka se zalepí a pak se hodí do schránky.'),
  order('snehulak', 'Seřaď, jak robot staví sněhuláka.',
    ['Uválej velkou kouli', 'Polož na ni prostřední kouli', 'Nahoru dej nejmenší kouli', 'Přidej nos z mrkve'],
    ['Která koule je dole?'],
    'Sněhulák se staví odspodu: velká koule, prostřední, nejmenší a nakonec nos na hlavu.'),
  order('pernicky', 'Seřaď, jak robot peče perníčky.',
    ['Uhněť těsto', 'Vyválej těsto', 'Vykrajuj perníčky', 'Upeč je v troubě', 'Nazdob je polevou'],
    ['Co se dělá s perníčky až po upečení?'],
    'Těsto se uhněte, vyválí, vykrajují se perníčky, upečou se a nakonec se nazdobí.'),
  order('drak', 'Seřaď, jak robot krmí draka.',
    ['Otevři sklep s rybami', 'Naber ryby do kyblíku', 'Dones kyblík k drakovi', 'Vysyp ryby do misky', 'Umyj prázdný kyblík'],
    ['Kde robot ryby vezme?'],
    'Robot otevře sklep, nabere ryby, donese je k drakovi, vysype je do misky a prázdný kyblík umyje.'),
  order('kolo-zamek', 'Seřaď, jak robot jezdí na kole.',
    ['Nasaď si přilbu', 'Rozjeď se', 'Zabrzdi', 'Sesedni z kola', 'Zamkni kolo'],
    ['Co je potřeba udělat ještě před jízdou?'],
    'Nejdřív přilba, pak se robot rozjede, zabrzdí, sesedne a nakonec kolo zamkne.'),
  order('knihovna', 'Seřaď, jak si robot půjčí knížku.',
    ['Vyber si knížku', 'Dones ji k pultu', 'Knihovnice ji zapíše', 'Odnes si ji domů'],
    ['Co musí knihovnice udělat, než si knížku odneseš?'],
    'Robot si knížku vybere, donese ji k pultu, knihovnice ji zapíše a pak si ji robot odnese domů.'),
  order('konev', 'Seřaď, jak robot zalévá květinu.',
    ['Naplň konev vodou', 'Dones konev ke květině', 'Zalij květinu', 'Vrať konev na místo'],
    ['Co musí být v konvi?'],
    'Konev se naplní, donese ke květině, zalévá se a nakonec se konev vrátí na místo.'),
  kdyz('ksiltovka', 'Pravidlo: Když prší, vezmi si deštník, jinak si vezmi kšiltovku. Svítí sluníčko. Co si robot vezme?', 'Kšiltovku',
    ['Deštník', 'Deštník i kšiltovku', 'Nic'],
    ['Prší?'],
    'Neprší, takže platí část „jinak“ a robot si vezme kšiltovku.'),
  kdyz('sude', 'Pravidlo: Když je číslo sudé, tleskni, jinak dupni. Robot dostal číslo 7. Co udělá?', 'Dupne',
    ['Tleskne', 'Tleskne i dupne', 'Nic'],
    ['Je 7 sudé číslo?'],
    'Číslo 7 je liché, takže robot dupne.'),
  kdyz('semafor', 'Pravidlo: Když svítí červená, stůj, jinak jdi. Na semaforu svítí zelená. Co robot udělá?', 'Půjde',
    ['Bude stát', 'Rozběhne se zpátky', 'Sedne si'],
    ['Svítí červená?'],
    'Červená nesvítí, takže platí „jinak jdi“ a robot půjde.'),
  kdyz('smutny', 'Pravidlo: Když je drak smutný, pohlaď ho, jinak si s ním hraj. Drak se směje. Co robot udělá?', 'Bude si s ním hrát',
    ['Pohladí ho', 'Odejde', 'Schová se'],
    ['Je drak smutný?'],
    'Drak se směje, takže smutný není. Platí „jinak“ a robot si s ním bude hrát.'),
  kdyz('rukavice', 'Pravidlo: Když je pod nulou, vezmi si rukavice. Teploměr ukazuje 5 stupňů pod nulou. Co robot udělá?', 'Vezme si rukavice',
    ['Nevezme si rukavice', 'Vezme si plavky', 'Sundá si boty'],
    ['Je pod nulou?'],
    'Pět stupňů pod nulou je mráz, podmínka platí, a tak si robot vezme rukavice.'),
  kdyz('miska', 'Pravidlo: Když je v misce méně než 3 ryby, přidej rybu. V misce je 5 ryb. Co robot udělá?', 'Rybu nepřidá',
    ['Přidá rybu', 'Přidá tři ryby', 'Sní jednu rybu'],
    ['Je 5 méně než 3?'],
    'Pět ryb není méně než tři, podmínka neplatí, a tak robot rybu nepřidá.'),
  doslova('hracky', 'Robot dostal pokyn: Ukliď hračky. Naházel je do koše na odpadky. Co v pokynu chybělo?', 'Kam hračky patří',
    ['Jaké mají hračky barvy', 'Kolik je v pokoji oken', 'Kdo hračky koupil'],
    ['Kam se hračky uklízejí?'],
    'Robot nevěděl, kam hračky patří. Lepší pokyn je: Dej hračky do krabice na hračky.'),
  doslova('ponozky', 'Robot dostal pokyn: Obleč se. Ponožky si natáhl na ruce. Co v pokynu chybělo?', 'Co si má obléct a kam',
    ['Jakou barvu mají ponožky', 'Jak se jmenuje obchod', 'Kdo ušil ponožky'],
    ['Ví robot, kam patří ponožky?'],
    'Robot nevěděl, co si má kam obléct. Lepší pokyn je: Natáhni si ponožky na nohy.'),
  doslova('dvere', 'Robot dostal pokyn: Zavři dveře. Zavřel lednici, ale vchodové dveře nechal otevřené. Co v pokynu chybělo?', 'Které dveře má zavřít',
    ['Jak jsou dveře těžké', 'Kolik je v bytě oken', 'Kdo dveře vyrobil'],
    ['Kolik dveří je v bytě?'],
    'Dveří je v bytě hodně a robot nevěděl, které má zavřít. Lepší pokyn je: Zavři vchodové dveře.'),
  doslova('napit', 'Robot dostal pokyn: Dej drakovi napít. Dal mu jen jednu kapku. Co v pokynu chybělo?', 'Kolik vody mu má dát',
    ['Jak se drak jmenuje', 'Kolik je hodin', 'Jakou barvu má drak'],
    ['Kolik vody drak potřebuje?'],
    'Robot nevěděl, kolik vody má drakovi dát. Lepší pokyn je: Dej drakovi plný kyblík vody.'),
];

const L3: Spec[] = [
  order('dum', 'Seřaď, jak robot staví dům.',
    ['Nakresli plán domu', 'Vykopej základy', 'Postav zdi', 'Dej na dům střechu', 'Nastěhuj se'],
    ['Co musí stát, než se dá položit střecha?'],
    'Nejdřív plán, pak základy, zdi, střecha a nakonec stěhování.'),
  order('chleba', 'Seřaď, jak robot peče chleba.',
    ['Smíchej mouku s vodou', 'Nech těsto v míse vykynout', 'Vytvaruj bochník', 'Upeč ho v peci', 'Nech ho vychladnout', 'Nakrájej ho'],
    ['Co se musí stát s těstem, než se z něj udělá bochník?'],
    'Těsto se smíchá a nechá v míse vykynout, pak se vytvaruje bochník, upeče se, vychladne a nakonec se krájí.'),
  order('vlak', 'Seřaď, jak robot jede vlakem na výlet.',
    ['Dojdi na nádraží', 'Kup si jízdenku u pokladny', 'Nastup do vlaku', 'Ukaž jízdenku průvodčímu', 'Vystup v cílové stanici'],
    ['Kde průvodčí kontroluje jízdenky?'],
    'Robot dojde na nádraží, u pokladny si koupí jízdenku, nastoupí, ve vlaku ji ukáže průvodčímu a v cíli vystoupí.'),
  order('poklad', 'Seřaď pokyny na mapě pokladu.',
    ['Vyjdi ze dveří', 'Jdi k velkému dubu', 'U dubu se otoč doleva', 'Udělej deset kroků', 'Kopej'],
    ['Kde se robot otáčí?'],
    'Robot vyjde ze dveří, dojde k dubu, tam se otočí doleva, udělá deset kroků a kope.'),
  order('fotka', 'Seřaď, jak robot fotí draka.',
    ['Zapni foťák', 'Namiř ho na draka', 'Zmáčkni spoušť', 'Prohlédni si fotku'],
    ['Co se dá udělat až po zmáčknutí spouště?'],
    'Foťák se zapne, namíří na draka, zmáčkne se spoušť a pak si robot fotku prohlédne.'),
  order('dort', 'Seřaď, jak robot dělá dort.',
    ['Upeč korpus', 'Nech ho vychladnout', 'Potři ho krémem', 'Ozdob ho jahodami', 'Nakrájej dort'],
    ['Může se krém mazat na horký korpus?'],
    'Korpus se upeče a nechá vychladnout, pak se potře krémem, ozdobí jahodami a nakonec krájí.'),
  order('pradlo', 'Seřaď, jak robot pere prádlo.',
    ['Dej prádlo do pračky', 'Zavři dvířka', 'Zapni pračku', 'Vyndej vyprané prádlo', 'Pověs ho na šňůru'],
    ['Co se dělá s prádlem až po vyprání?'],
    'Prádlo se dá do pračky, zavřou se dvířka, pračka se zapne, vyprané prádlo se vyndá a pověsí.'),
  kdyz('vitr', 'Pravidlo: Když prší a zároveň fouká vítr, zůstaň doma, jinak jdi ven. Prší, ale nefouká. Co robot udělá?', 'Půjde ven',
    ['Zůstane doma', 'Půjde ven a hned se vrátí', 'Bude čekat na vítr'],
    ['Platí obě části podmínky najednou?'],
    'Doma má robot zůstat, jen když prší a zároveň fouká. Nefouká, takže podmínka neplatí a robot půjde ven.'),
  kdyzCislo('vetsi-nez-5', 'Pravidlo: Když je číslo větší než 5, tleskni, jinak dupni. Robot dostal čísla 3, 8 a 6. Kolikrát tleskne?', 2,
    ['Projdi čísla jedno po druhém.'],
    'Větší než 5 jsou čísla 8 a 6, takže robot tleskne dvakrát. U trojky dupne.'),
  kdyzCislo('jablka', 'Robot třídí jablka: červená dává do košíku, zelená do mísy. Na stole jsou 3 červená a 4 zelená jablka. Kolik jablek bude v míse?', 4,
    ['Která jablka patří do mísy?'],
    'Do mísy patří zelená jablka a ta jsou čtyři.'),
  kdyz('nedele', 'Pravidlo: Když je sobota nebo neděle, spi do osmi, jinak vstávej v sedm. Dnes je neděle. Kdy robot vstane?', 'V osm',
    ['V sedm', 'V poledne', 'Vůbec nevstane'],
    ['Stačí, aby platila jedna část podmínky?'],
    'Podmínka se slovem „nebo“ platí, když platí aspoň jedna část. Je neděle, a tak robot spí do osmi.'),
  kdyz('zizen', 'Pravidlo: Když má drak hlad nebo žízeň, zavolej jezdce. Drak má žízeň, ale hlad nemá. Co robot udělá?', 'Zavolá jezdce',
    ['Nezavolá jezdce', 'Dá drakovi rybu', 'Půjde spát'],
    ['Stačí, aby platila jedna část podmínky?'],
    'U podmínky se slovem „nebo“ stačí jedna část. Drak má žízeň, a tak robot zavolá jezdce.'),
  kdyz('vetrak', 'Pravidlo: Když je teplota vyšší než 30 stupňů, zapni větrák. Teploměr ukazuje 25 stupňů. Co robot udělá?', 'Větrák nezapne',
    ['Zapne větrák', 'Zapne topení', 'Otevře lednici'],
    ['Je 25 víc než 30?'],
    '25 stupňů není víc než 30, podmínka neplatí, a tak robot větrák nezapne.'),
  doslova('kocka', 'Robot dostal pokyn: Nakresli kočku. Nakreslil ji velkou jako celá zeď. Co v pokynu chybělo?', 'Jak velká má kočka být',
    ['Jak se kočka jmenuje', 'Kolik je kočce let', 'Kde kočka spí'],
    ['Jak velké obrázky obvykle kreslíš?'],
    'Robot nevěděl, jak velká má kočka být. Lepší pokyn je: Nakresli malou kočku na tento papír.'),
  doslova('skakani', 'Robot dostal pokyn: Opakuj: skoč. Skáče už hodinu a nemůže přestat. Co potřebuje vědět, aby přestal?', 'Kolikrát má skočit',
    ['Jak vysoko má skočit', 'Jakou má mít barvu', 'Kolik je hodin'],
    ['Kdy má opakování skončit?'],
    'Opakování potřebuje konec. Lepší pokyn je: Opakuj 5×: skoč.'),
  doslova('piti', 'Robot dostal pokyn: Přines mi něco k pití. Přinesl kbelík vody z louže. Co v pokynu chybělo?', 'Co přesně má přinést',
    ['Kolik je hodin', 'Jak se jmenuje louže', 'Jakou barvu má kbelík'],
    ['Co všechno může znamenat něco k pití?'],
    'Robot nevěděl, co přesně má přinést. Lepší pokyn je: Přines mi sklenici vody z kuchyně.'),
];

const L4: Spec[] = [
  order('stromky', 'Seřaď program: robot má zasadit tři stromky do řady.',
    ['Vezmi lopatu a stromky', 'Opakuj 3×: vykopej jámu a zasaď stromek', 'Zalij všechny stromky'],
    ['Co musí robot mít, než začne kopat?'],
    'Robot si vezme lopatu a stromky, třikrát vykope jámu a zasadí stromek a nakonec je všechny zalije.'),
  order('nakup', 'Seřaď program: robot jde nakupovat podle seznamu.',
    ['Dojdi do obchodu', 'Opakuj pro každou věc: dej ji do košíku', 'Zaplať u pokladny', 'Odnes nákup domů'],
    ['Kdy se u pokladny platí?'],
    'Robot dojde do obchodu, dá do košíku všechno ze seznamu, zaplatí a odnese nákup domů.'),
  order('ctverec', 'Seřaď program: robot má nakreslit čtverec.',
    ['Polož tužku na papír', 'Opakuj 4×: čára a otočka doprava', 'Zvedni tužku'],
    ['Kdy robot tužku zvedne?'],
    'Tužka se položí na papír, čtyřikrát se nakreslí čára s otočkou a pak se tužka zvedne.'),
  kdyzCislo('kyblik', 'Program: Opakuj, dokud není kyblík plný: přilij hrnek vody. Do kyblíku se vejdou 4 hrnky. Kolikrát robot přilije?', 4,
    ['Kdy se kyblík naplní?'],
    'Po čtvrtém hrnku je kyblík plný a opakování skončí. Robot tedy přilije čtyřikrát.'),
  kdyzCislo('bonbony', 'Program: Dokud je v misce víc než 2 bonbony, sněz jeden. V misce je 7 bonbonů. Kolik bonbonů zůstane?', 2,
    ['Kdy robot přestane jíst?'],
    'Robot jí, dokud je v misce víc než 2 bonbony. Když zbudou 2, podmínka neplatí a robot přestane.'),
  kdyzCislo('zdvojnasob', 'Program: Začni na čísle 1. Dokud je číslo menší než 20, zdvojnásob ho. Na jakém čísle robot skončí?', 32,
    ['Zkus program projít: 1, 2, 4…'],
    'Čísla jdou 1, 2, 4, 8, 16. Šestnáct je pořád menší než 20, a tak se zdvojnásobí na 32. Pak robot skončí.'),
  kdyzCislo('schody', 'Program: Začni dole pod schody. Dokud nejsi na 10. schodu, skoč o 2 schody výš. Kolikrát robot skočí?', 5,
    ['Na kterých schodech robot přistane?'],
    'Robot přistane na schodech 2, 4, 6, 8 a 10. To je pět skoků.'),
  kdyzCislo('zed', 'Program: Jdi rovně, dokud nenarazíš na zeď. Pak se otoč doprava. Ke zdi je to 6 kroků. Kolik kroků robot udělá, než se otočí?', 6,
    ['Kdy opakování skončí?'],
    'Robot jde, dokud nedojde ke zdi, a to je po šesti krocích. Pak se otočí.'),
  order('vez', 'Seřaď program: robot staví věž ze tří kostek s vlaječkou.',
    ['Polož na zem první kostku', 'Opakuj 2×: polož navrch další kostku', 'Na vršek dej vlaječku'],
    ['Co musí ležet dole?'],
    'Nejdřív první kostka na zemi, pak se dvakrát položí další kostka navrch a nakonec vlaječka.'),
  kdyz('ctverec-kde', 'Program: Opakuj čtyřikrát: udělej krok dopředu a otoč se doprava. Kde robot skončí?', 'Tam, kde začal',
    ['O čtyři kroky dál', 'O krok vpravo', 'O dva kroky vlevo'],
    ['Zkus program projít po pokoji.', 'Jaký tvar robot obejde?'],
    'Robot obejde malý čtverec: čtyři kroky a čtyři otočky doprava ho vrátí tam, kde začal.'),
  kdyzCislo('rozdavani', 'Program: Robot má 10 bonbonů. Dokud nějaké má, dá kamarádovi 2 bonbony. Kolikrát bonbony rozdá?', 5,
    ['Kolik bonbonů robotovi zbude po každém rozdání?'],
    'Bonbonů ubývá po dvou: 10, 8, 6, 4, 2, 0. Robot tedy rozdává pětkrát.'),
  kdyz('desaty', 'Robot tančí pořád dokola: tleskni, dupni, dupni. Co udělá jako desátý pohyb?', 'Tleskne',
    ['Dupne', 'Skočí', 'Zamává'],
    ['Tanec se opakuje po třech pohybech.', 'Který pohyb je 1., 4. a 7.?'],
    'Tlesknutí je na 1., 4., 7. a 10. místě, protože se tanec opakuje po třech pohybech. Desátý pohyb je tedy tlesknutí.'),
  kdyzCislo('tabule', 'Program: Na tabuli je 0. Opakuj pro čísla od 1 do 5: přičti číslo k tabuli. Jaké číslo bude nakonec na tabuli?', 15,
    ['Přičítej postupně: 0 + 1, pak + 2…'],
    'Na tabuli postupně bude 1, 3, 6, 10 a 15. Na konci je tam 15.'),
];

// ---------------------------------------------------------------------------
// Generátor: kolikrát robot…? (opakování)

interface Akce {
  code: string;
  cmd: string;
  question: string;
  result: (n: number) => string;
}

const AKCE: Akce[] = [
  { code: 't', cmd: 'tleskni', question: 'Kolikrát robot tleskne?', result: (n) => `Robot tedy tleskne ${n}krát.` },
  { code: 'd', cmd: 'dupni', question: 'Kolikrát robot dupne?', result: (n) => `Robot tedy dupne ${n}krát.` },
  { code: 's', cmd: 'skoč', question: 'Kolikrát robot skočí?', result: (n) => `Robot tedy skočí ${n}krát.` },
  { code: 'z', cmd: 'zamávej', question: 'Kolikrát robot zamává?', result: (n) => `Robot tedy zamává ${n}krát.` },
  { code: 'o', cmd: 'otoč se', question: 'Kolikrát se robot otočí?', result: (n) => `Robot se tedy otočí ${n}krát.` },
];

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);

/** L1–L2: Opakuj N×: tělo. Kolikrát robot…? */
function opakujJednoduse(rng: Rng, level: 1 | 2): NumberSpec {
  const n = rng.int(2, level === 1 ? 4 : 5);
  const size = level === 1 ? rng.int(1, 2) : rng.int(2, 3);
  const asked = rng.pick(AKCE);
  const others = rng.shuffle(AKCE.filter((a) => a !== asked));
  // Na L2 je hledaný pokyn v těle někdy dvakrát.
  const k = level === 2 && size === 3 && rng.chance(0.6) ? 2 : 1;
  const body = rng.shuffle([...Array(k).fill(asked), ...others.slice(0, size - k)]) as Akce[];
  const bodyText = body.map((a) => a.cmd).join(', ');
  const program = `Opakuj ${n}×: ${bodyText}.`;
  const total = n * k;
  return {
    kind: 'number',
    key: `opakuj-${n}-${body.map((a) => a.code).join('')}-${asked.code}`,
    prompt: `Robot dostal program: ${program} ${asked.question}`,
    speak: `Robot dostal program: ${speakTimes(program)} ${asked.question}`,
    correct: total,
    hints: ['Všechno za dvojtečkou robot udělá při každém opakování.', `Kolikrát je pokyn „${asked.cmd}“ za dvojtečkou?`],
    explain: k === 1
      ? `Pokyn „${asked.cmd}“ je za dvojtečkou jednou a opakuje se ${TIMES_WORD[n]}. ${asked.result(total)}`
      : `Pokyn „${asked.cmd}“ je za dvojtečkou dvakrát a opakuje se ${TIMES_WORD[n]}: 2 × ${n} = ${total}. ${asked.result(total)}`,
    difficulty: level === 1 ? (size === 2 ? 0.2 : -0.2) : (k === 2 ? 0.3 : -0.1),
  };
}

/** L3: pokyn před opakováním, opakování, pokyn po něm. */
function opakujProgram(rng: Rng): NumberSpec {
  const asked = rng.pick(AKCE);
  const others = rng.shuffle(AKCE.filter((a) => a !== asked));
  const n = rng.int(2, 5);
  const body = rng.shuffle([asked, others[0]]);
  const before = rng.chance(0.5) ? asked : others[1];
  const after = before === asked ? others[2] : asked;
  const steps = [cap(before.cmd), `Opakuj ${n}×: ${body[0].cmd} a ${body[1].cmd}`, cap(after.cmd)];
  const total = n + 1;
  return {
    kind: 'number',
    key: `program-${before.code}-${n}${body.map((a) => a.code).join('')}-${after.code}-${asked.code}`,
    prompt: `Robot má tento program. ${asked.question}`,
    speak: `Robot má program: ${speakTimes(steps.join('. '))}. ${asked.question}`,
    visual: { type: 'steps', title: 'Program', steps },
    correct: total,
    hints: ['Spočítej zvlášť opakování a zvlášť pokyny mimo něj.', `Pokyn „${asked.cmd}“ je v programu na dvou místech.`],
    explain: `V opakování je pokyn „${asked.cmd}“ ${TIMES_WORD[n]} a jednou ještě mimo opakování: ${n} + 1 = ${total}. ${asked.result(total)}`,
    difficulty: n >= 4 ? 0.2 : -0.2,
  };
}

/** L4: dvě opakování za sebou, nebo opakování v opakování. */
function opakujSlozite(rng: Rng): NumberSpec {
  const asked = rng.pick(AKCE);
  const other = rng.pick(AKCE.filter((a) => a !== asked));
  const a = rng.int(2, 4);
  const b = rng.int(2, 4);
  if (rng.chance(0.5)) {
    // Dvě opakování za sebou: v prvním je hledaný pokyn dvakrát, ve druhém jednou.
    const steps = [`Opakuj ${a}×: ${asked.cmd}, ${asked.cmd}, ${other.cmd}`, `Opakuj ${b}×: ${other.cmd}, ${asked.cmd}`];
    const total = 2 * a + b;
    return {
      kind: 'number',
      key: `dve-${a}${asked.code}${asked.code}${other.code}-${b}${other.code}${asked.code}-${asked.code}`,
      prompt: `Robot má tento program. ${asked.question}`,
      speak: `Robot má program: ${speakTimes(steps.join('. '))}. ${asked.question}`,
      visual: { type: 'steps', title: 'Program', steps },
      correct: total,
      hints: ['Spočítej každé opakování zvlášť a pak to sečti.', `V prvním opakování je pokyn „${asked.cmd}“ dvakrát.`],
      explain: `První opakování: 2 × ${a} = ${2 * a}. Druhé opakování: ${b}. Dohromady ${2 * a} + ${b} = ${total}. ${asked.result(total)}`,
      difficulty: 0.1,
    };
  }
  // Opakování v opakování.
  const steps = [`Opakuj ${a}×: (opakuj ${b}×: ${asked.cmd}), ${other.cmd}`, 'Ukloň se'];
  const total = a * b;
  return {
    kind: 'number',
    key: `vnorene-${a}-${b}${asked.code}-${other.code}-${asked.code}`,
    prompt: `Robot má tento program. ${asked.question}`,
    speak: `Robot má program: opakuj ${TIMES_WORD[a]}: opakuj ${TIMES_WORD[b]} ${asked.cmd}, potom ${other.cmd}. Pak se ukloň. ${asked.question}`,
    visual: { type: 'steps', title: 'Program', steps },
    correct: total,
    hints: ['Kolikrát robot udělá vnitřní opakování v závorce?', 'Při každém vnějším opakování proběhne celé vnitřní.'],
    explain: `Vnitřní opakování udělá ${TIMES_WORD[b]} „${asked.cmd}“ a samo se zopakuje ${TIMES_WORD[a]}: ${a} × ${b} = ${total}. ${asked.result(total)}`,
    difficulty: 0.3,
  };
}

// ---------------------------------------------------------------------------
// Generátor: zkrácený zápis s opakováním (→ → → ↑ ↑ = 3× →, 2× ↑)

type Run = [Move, number];

const DIRS: Move[] = ['U', 'R', 'D', 'L'];
const expand = (runs: Run[]): Move[] => runs.flatMap(([m, n]) => Array(n).fill(m) as Move[]);
const runsLabel = (runs: Run[]) => runs.map(([m, n]) => `${n}× ${arrowsText([m])}`).join(', ');
const runsSpeak = (runs: Run[]) => runs.map(([m, n]) => `${TIMES_WORD[n]} ${MOVE_WORD[m]}`).join(', ');
const runsOption = (runs: Run[]): ChoiceOption => ({ label: runsLabel(runs), speak: runsSpeak(runs) });
const seqOption = (p: Move[]): ChoiceOption => ({ label: arrowsText(p), speak: arrowsSpeak(p) });
const seqKey = (p: Move[]) => p.join('').toLowerCase();

function randomRuns(rng: Rng, count: number, max: number): Run[] {
  const runs: Run[] = [];
  for (let i = 0; i < count; i++) {
    const prev = runs[i - 1]?.[0];
    const m = rng.pick(DIRS.filter((d) => d !== prev));
    runs.push([m, rng.int(1, max)]);
  }
  return runs;
}

/** Chybné zápisy: prohozené počty, počet o jedna jinak, prohozené pořadí. */
function wrongRuns(runs: Run[]): Run[][] {
  const out: Run[][] = [];
  for (let i = 0; i < runs.length; i++) {
    for (const d of [1, -1]) {
      const n = runs[i][1] + d;
      if (n >= 1) out.push(runs.map((r, j) => (j === i ? [r[0], n] : r)));
    }
    for (let j = i + 1; j < runs.length; j++) {
      if (runs[i][1] !== runs[j][1]) out.push(runs.map((r, k) => (k === i ? [r[0], runs[j][1]] : k === j ? [r[0], runs[i][1]] : r)));
    }
  }
  if (runs.length >= 2) out.push([runs[1], runs[0], ...runs.slice(2)]);
  const target = seqKey(expand(runs));
  const seen = new Set<string>([target]);
  return out.filter((w) => {
    const k = seqKey(expand(w));
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** L3: zkrať program, nebo rozbal zkrácený zápis. */
function zkratka(rng: Rng): ChoiceSpec {
  const shorten = rng.chance(0.5);
  let runs = randomRuns(rng, rng.int(2, 3), 4);
  // Zkracovat má smysl, jen když se šipky opakují: aspoň o dvě šipky víc než skupin.
  while (shorten && expand(runs).length < runs.length + 2) runs = randomRuns(rng, runs.length, 4);
  const seq = expand(runs);
  const wrong = wrongRuns(runs);
  if (shorten) {
    return {
      key: `zkrat-${seqKey(seq)}`,
      prompt: `Robot má program ${arrowsText(seq)}. Jak ho zapíšeš zkráceně?`,
      speak: `Robot má program: ${arrowsSpeak(seq)}. Jak ho zapíšeš zkráceně?`,
      correct: runsOption(runs),
      wrong: wrong.map(runsOption),
      hints: ['Spočítej, kolik stejných šipek jde za sebou.', 'Pořadí skupin musí zůstat stejné.'],
      explain: `Za sebou jde ${joinA(runs.map(([m, n]) => `${TIMES_WORD[n]} ${MOVE_WORD[m]}`))}, a to se zapíše ${runsLabel(runs)}.`,
      difficulty: runs.length === 3 ? 0.2 : -0.2,
    };
  }
  return {
    key: `rozbal-${seqKey(seq)}`,
    prompt: `Co udělá robot podle programu ${runsLabel(runs)}?`,
    speak: `Co udělá robot podle programu ${runsSpeak(runs)}?`,
    correct: seqOption(seq),
    wrong: wrong.map((w) => seqOption(expand(w))),
    hints: ['Číslo před šipkou říká, kolikrát se šipka opakuje.', 'Spočítej šipky v každé možnosti.'],
    explain: `Program ${runsLabel(runs)} znamená ${joinA(runs.map(([m, n]) => `${TIMES_WORD[n]} ${MOVE_WORD[m]}`))}: ${arrowsText(seq)}.`,
    difficulty: runs.length === 3 ? 0.2 : -0.2,
  };
}

/** L4: najdi opakující se vzor („→ ↑ → ↑ → ↑“ = Opakuj 3×: → ↑). */
function vzor(rng: Rng): Spec {
  let pattern: Move[];
  do {
    pattern = Array.from({ length: rng.int(2, 3) }, () => rng.pick(DIRS));
  } while (new Set(pattern).size === 1 || pattern.some((m, i) => i > 0 && m === pattern[i - 1]) || pattern[0] === pattern[pattern.length - 1]);
  const k = rng.int(2, 4);
  const seq = Array.from({ length: k }, () => pattern).flat();
  const loop = (times: number, p: Move[]): ChoiceOption => ({
    label: `Opakuj ${times}×: ${arrowsText(p)}`,
    speak: `Opakuj ${TIMES_WORD[times]}: ${arrowsSpeak(p)}`,
  });
  if (rng.chance(0.3)) {
    return {
      kind: 'number',
      key: `sipky-${k}-${seqKey(pattern)}`,
      prompt: `Robot má program Opakuj ${k}×: ${arrowsText(pattern)}. Kolik kroků udělá?`,
      speak: `Robot má program: opakuj ${TIMES_WORD[k]}: ${arrowsSpeak(pattern)}. Kolik kroků udělá?`,
      correct: k * pattern.length,
      hints: ['Kolik šipek je za dvojtečkou?', 'Kolikrát se opakují?'],
      explain: `Za dvojtečkou jsou ${pattern.length === 2 ? 'dvě šipky' : 'tři šipky'} a opakují se ${TIMES_WORD[k]}: ${k} × ${pattern.length} = ${count(k * pattern.length, ['krok', 'kroky', 'kroků'])}.`,
      difficulty: 0,
    };
  }
  const rotated = [...pattern.slice(1), pattern[0]];
  const candidates: { opt: ChoiceOption; seq: Move[] }[] = [
    { opt: loop(k + 1, pattern), seq: Array.from({ length: k + 1 }, () => pattern).flat() },
    { opt: loop(k - 1, pattern), seq: Array.from({ length: k - 1 }, () => pattern).flat() },
    { opt: loop(k, rotated), seq: Array.from({ length: k }, () => rotated).flat() },
    { opt: loop(k, [...pattern].reverse()), seq: Array.from({ length: k }, () => [...pattern].reverse()).flat() },
    { opt: runsOption(pattern.map((m) => [m, k] as Run)), seq: expand(pattern.map((m) => [m, k] as Run)) },
  ];
  const target = seqKey(seq);
  const seen = new Set([target]);
  const wrong = candidates.filter((c) => {
    const key = seqKey(c.seq);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    key: `vzor-${k}-${seqKey(pattern)}`,
    prompt: `Robot má program ${arrowsText(seq)}. Jak ho zapíšeš s opakováním?`,
    speak: `Robot má program: ${arrowsSpeak(seq)}. Jak ho zapíšeš s opakováním?`,
    correct: loop(k, pattern),
    wrong: wrong.map((c) => c.opt),
    hints: ['Hledej skupinu šipek, která se opakuje pořád dokola.', 'Kolikrát se ta skupina opakuje?'],
    explain: `Skupina ${arrowsText(pattern)} se opakuje ${TIMES_WORD[k]}, takže program je Opakuj ${k}×: ${arrowsText(pattern)}.`,
    difficulty: pattern.length === 3 ? 0.3 : 0,
  };
}

// ---------------------------------------------------------------------------
// Generátor: podmínka v opakování (L3 vybraná čísla, L4 čísla od 1 do N)

interface Podminka {
  code: string;
  /** „Když je číslo …“ */
  text: string;
  /** „Která čísla jsou …“ */
  plural: string;
  test: (x: number) => boolean;
}

function podminky(level: 3 | 4, rng: Rng): Podminka {
  const k = rng.int(4, 9);
  const all: Podminka[] = [
    { code: `vetsi${k}`, text: `větší než ${k}`, plural: `větší než ${k}`, test: (x) => x > k },
    { code: `mensi${k}`, text: `menší než ${k}`, plural: `menší než ${k}`, test: (x) => x < k },
    { code: 'sude', text: 'sudé', plural: 'sudá', test: (x) => x % 2 === 0 },
    { code: 'liche', text: 'liché', plural: 'lichá', test: (x) => x % 2 === 1 },
  ];
  if (level === 4) {
    all.push({ code: 'nasobek3', text: 'násobkem tří', plural: 'násobky tří', test: (x) => x % 3 === 0 });
    all.push({ code: 'nasobek5', text: 'násobkem pěti', plural: 'násobky pěti', test: (x) => x % 5 === 0 });
  }
  return rng.pick(all);
}

function cislaPodminka(level: 3 | 4, rng: Rng): NumberSpec {
  const cond = podminky(level, rng);
  if (level === 3) {
    const nums = rng.shuffle(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, rng.int(4, 5));
    const yes = nums.filter(cond.test).length;
    if (yes === 0 || yes === nums.length) return cislaPodminka(level, rng);
    const clap = rng.chance(0.5);
    const list = joinA(nums.map(String));
    const hits = nums.filter(cond.test);
    return {
      kind: 'number',
      key: `cisla-${cond.code}-${nums.join('-')}-${clap ? 't' : 'd'}`,
      prompt: `Pravidlo: Když je číslo ${cond.text}, tleskni, jinak dupni. Robot dostal čísla ${list}. ${clap ? 'Kolikrát tleskne?' : 'Kolikrát dupne?'}`,
      correct: clap ? yes : nums.length - yes,
      hints: ['Projdi čísla jedno po druhém.', `U každého čísla se zeptej: Je ${cond.text}?`],
      explain: `Podmínka „je ${cond.text}“ platí ${hits.length === 1 ? `jen u čísla ${hits[0]}` : `u čísel ${joinA(hits.map(String))}`}. Robot tedy tleskne ${TIMES_WORD[yes]} a dupne ${TIMES_WORD[nums.length - yes]}.`,
      difficulty: nums.length === 5 ? 0.2 : -0.2,
    };
  }
  const n = rng.int(10, 20);
  const hits = Array.from({ length: n }, (_, i) => i + 1).filter(cond.test);
  const yes = hits.length;
  return {
    kind: 'number',
    key: `rada-${cond.code}-${n}`,
    prompt: `Program: Opakuj pro čísla od 1 do ${n}: když je číslo ${cond.text}, tleskni. Kolikrát robot tleskne?`,
    correct: yes,
    hints: ['Zkus si čísla napsat a ta správná zakroužkovat.', `Která čísla od 1 do ${n} jsou ${cond.plural}?`],
    explain: yes === 1
      ? `Mezi čísly od 1 do ${n} je ${cond.text} jen číslo ${hits[0]}. Robot tedy tleskne jednou.`
      : `Čísla od 1 do ${n}, která jsou ${cond.plural}: ${hits.join(', ')}. Je jich ${yes} a u každého robot jednou tleskne.`,
    difficulty: n >= 16 ? 0.2 : -0.1,
  };
}

// ---------------------------------------------------------------------------

export const postupySkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Postupy a algoritmy',
  description: 'Skládá kroky postupu ve správném pořadí, vyhodnocuje podmínky, počítá opakování a zapisuje postup kratší pomocí opakování.',
  rvp: {
    1: ['I-5-2-02'],
    2: ['I-5-2-02'],
    3: ['I-5-2-02'],
    4: ['I-5-2-02', 'I-5-2-03'],
  },
  ability: 'usuzovani',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4 },
  gen: {
    1: (rng) => opakujJednoduse(rng, 1),
    2: (rng) => opakujJednoduse(rng, 2),
    3: (rng) => {
      const r = rng.next();
      return r < 0.4 ? zkratka(rng) : r < 0.7 ? opakujProgram(rng) : cislaPodminka(3, rng);
    },
    4: (rng) => {
      const r = rng.next();
      return r < 0.45 ? vzor(rng) : r < 0.75 ? opakujSlozite(rng) : cislaPodminka(4, rng);
    },
  },
  genShare: 0.4,
});

export const postupyCards: KnowledgeCard[] = [
  {
    id: `${ID}.presne`,
    skillId: ID,
    level: 1,
    emoji: '🤖',
    title: 'Počítač dělá přesně, co mu řekneš',
    text: 'Počítač nic nedělá sám od sebe. Plní přesně ty kroky, které mu dá program – i když je v nich chyba.',
    fix: {
      before: 'Počítač si dělá, co chce.',
      evidence: 'Když program nefunguje, programátoři ho procházejí krok za krokem. Skoro vždycky zjistí, že počítač udělal přesně to, co mu program řekl – jen to nebylo to, co chtěli.',
    },
  },
  {
    id: `${ID}.algoritmus`,
    skillId: ID,
    level: 3,
    emoji: '📜',
    title: 'Odkud je slovo algoritmus',
    text: 'Slovo algoritmus pochází ze jména učence al-Chorezmího. Žil asi před 1200 lety v Bagdádu a psal knihy o tom, jak počítat.',
  },
  {
    id: `${ID}.ada`,
    skillId: ID,
    level: 4,
    emoji: '⚙️',
    title: 'Program pro stroj, který nedostavěli',
    text: 'V roce 1843 popsala Ada Lovelace postup, jak by počítací stroj Charlese Babbage spočítal řadu čísel. Často se mu říká první zveřejněný počítačový program – i když stroj nikdy nedostavěli.',
  },
];
