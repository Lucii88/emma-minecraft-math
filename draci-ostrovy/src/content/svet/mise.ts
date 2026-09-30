// Společné mise Ostrova světa: pozorování a pokusy doma i venku s rodičem.

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'svet.mesicni-denik',
    island: 'svet',
    emoji: '🌙',
    title: 'Měsíční deník',
    text: 'Jeden týden se každý večer s rodičem podívej na Měsíc a nakresli, jaký má tvar. Na konci týdne poznáš, jestli dorůstá, nebo couvá.',
    parentTip: 'Vyberte týden, kdy je Měsíc večer vidět – třeba kolem první čtvrti. Ptejte se: Na které straně svítí? Je větší než včera? Když je zataženo, zapište „mraky“ – i to je pozorování. Chvalte pečlivé pozorování, ne krásu kresby.',
    level: 2,
  },
  {
    id: 'svet.sever',
    island: 'svet',
    emoji: '🧭',
    title: 'Kde je u nás sever?',
    text: 'Zjisti s rodičem, kde je u vás doma sever. Pomůže kompas v mobilu nebo tvůj stín kolem poledne, který ukazuje k severu. Do Slunce se přitom nedívej.',
    parentTip: 'Kompas bývá v mobilu jako aplikace. V letním čase ukazuje stín k severu spíš kolem jedné hodiny. Najděte spolu sever a pak ukažte i jih, východ a západ. Zeptejte se, ze kterého okna je ráno vidět vycházející Slunce. Nechte {ji|ho} vést a hádat, chyby k bádání patří.',
    level: 2,
  },
  {
    id: 'svet.plave',
    island: 'svet',
    emoji: '🛁',
    title: 'Plave, nebo se potopí?',
    text: 'Připrav si lavor s vodou a pět věcí z domu. U každé nejdřív řekni odhad, pak ji pusť do vody. Kolikrát se tvůj odhad trefil?',
    parentTip: 'Vyberte věci, kterým voda neublíží: korek, lžičku, jablko, kamínek, plastové víčko. Důležité je nejdřív odhadnout a pak ověřit. Chvalte odvahu odhadnout i to, že si {všimla|všiml}, když odhad nevyšel. Zkuste i plastelínu jako kuličku a jako lodičku.',
    level: 1,
  },
  {
    id: 'svet.fazole',
    island: 'svet',
    emoji: '🌱',
    title: 'Fazole v kelímku',
    text: 'Zasaď fazoli do kelímku s vlhkou vatou nebo hlínou a dej ji na okno. Každý den ji změř pravítkem a zapiš, kolik vyrostla.',
    parentTip: 'Fazole vyklíčí za několik dní. Pomozte s tabulkou: den a výška v centimetrech. Po týdnu se ptejte: Kdy rostla nejvíc? Co by se stalo ve tmě? Druhý kelímek můžete dát do skříně a porovnat – to je spravedlivý pokus. Syrové fazole nejezte.',
    level: 2,
  },
  {
    id: 'svet.plan-pokoje',
    island: 'svet',
    emoji: '🛏️',
    title: 'Plán mého pokoje',
    text: 'Nakresli plán svého pokoje, jako by ses {dívala|díval} ze stropu. Zakresli postel, stůl a dveře a na plánu ukaž, kde je sever.',
    parentTip: 'Plán je pohled shora – pomozte {jí|mu} představit si, že je pták u stropu. Pokoj můžete přeměřit kroky. Ptejte se: Co je vlevo od postele? Kde jsou dveře? Sever určete kompasem v mobilu. Chvalte nápady a pečlivost, ne přesnost.',
    level: 1,
  },
  {
    id: 'svet.mapa-ceska',
    island: 'svet',
    emoji: '🗺️',
    title: 'Hory a řeky Česka',
    text: 'Najdi s rodičem na mapě Česka Sněžku, Vltavu a Labe. Ukaž prstem, kudy teče Vltava až do Labe, a najdi místo, kde bydlíš.',
    parentTip: 'Stačí školní atlas, nástěnná mapa nebo mapa v mobilu. Ptejte se: Jakou barvu mají hory? Kde je nejvíc zelené? Kterým směrem teče řeka? Najděte i místo, kde jste byli na výletě. Nechte {ji|ho} objevovat a vést.',
    level: 2,
  },
];
