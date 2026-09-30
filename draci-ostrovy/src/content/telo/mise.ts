// Společné mise Ostrova těla: krátké pokusy s vlastním tělem, které hráčka
// dělá s rodičem (10–20 minut, bez drahých pomůcek).

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'telo.tep',
    island: 'telo',
    emoji: '💓',
    title: 'Tep po skákání',
    text: 'Nejdřív si v klidu nahmatej tep na zápěstí nebo na krku a počítej údery 30 sekund – dospělý hlídá čas. Pak udělej 20 výskoků a změř tep znovu. O kolik úderů víc jsi {napočítala|napočítal}?',
    parentTip: 'Tep najdete dvěma prsty na vnitřní straně zápěstí pod palcem, nebo jemně z jedné strany krku – palcem ne, ten má vlastní tep. Za minutu je úderů dvakrát víc než za 30 sekund. Ptejte se: Proč srdce po skákání bije rychleji? Po minutě odpočinku změřte tep ještě jednou a pozorujte, jak se zklidňuje.',
    level: 2,
  },
  {
    id: 'telo.chutova-laborator',
    island: 'telo',
    emoji: '👅',
    title: 'Chuťová laboratoř',
    text: 'Zavři oči a ochutnávej malé kousky jídla, které ti připraví dospělý. Poznáš, co to je? Pak to zkus se zacpaným nosem a nakonec vyzkoušej, jestli cítíš sladkou chuť na špičce jazyka i na jeho krajích.',
    parentTip: 'Jen potraviny, které zná a nemá na ně alergii: jablko, hruška, slaný preclík, citron, med nebo hořká čokoláda. Na zkoušku jazyka stačí vatová tyčinka namočená ve vodě s cukrem. Ptejte se: Podle čeho jsi to {poznala|poznal}? Pomohl nos? Pak se vyměňte a hádejte i vy.',
    level: 1,
  },
  {
    id: 'telo.spankovy-denik',
    island: 'telo',
    emoji: '🛏️',
    title: 'Spánkový deník',
    text: 'Celý týden si zapisuj, kdy jdeš spát a kdy ráno vstáváš, a spočítej, kolik hodin jsi {spala|spal}. Ke každému dni nakresli, jak ses ráno {cítila|cítil}. Vidíš nějakou souvislost?',
    parentTip: 'Školní děti potřebují zhruba 9 až 12 hodin spánku. S počítáním přes půlnoc pomozte: od 20:30 do 7:00 je to 10 a půl hodiny. Nic nehodnoťte, jen spolu pozorujte, jak spánek souvisí s náladou. Ptejte se: Kdy ses ráno {cítila|cítil} nejlíp? Zajímavé je porovnat všední dny a víkend.',
    level: 2,
  },
  {
    id: 'telo.otisky-prstu',
    island: 'telo',
    emoji: '🔍',
    title: 'Otiskový detektiv',
    text: 'Začerni tužkou kousek papíru a přejeď po něm bříškem prstu. Prst pak přitiskni na lepicí stranu průhledné pásky a pásku nalep na bílý papír. Porovnej svůj otisk s otisky rodiny – najdeš smyčky, víry nebo oblouky?',
    parentTip: 'Nejčastější jsou smyčky, víry bývají méně často a oblouky jsou vzácné. Ptejte se: V čem se otisky liší? Má někdo z rodiny stejný vzor jako ty? Otisky prstů má každý člověk jiné, i jednovaječná dvojčata. Nakonec si umyjte ruce.',
    level: 2,
  },
];
