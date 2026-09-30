// Vynálezecká dílna – umělá inteligence a digitální svět. Průvodcem je Hugin,
// mechanický havran z dílny (jméno má po Odinově havranovi ze severských
// bájí). Je to jasně stroj: umí hodně, ale plete se, nemá city a rád se
// nechá opravit. Hráč nebo hráčka se učí, že AI se mýlí a je potřeba ji ověřovat.
// Emočním parťákem hráče je jeho drak, ne Hugin.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { aiCards, aiSkill } from './digitalni-ai';
import { huginCards, huginSkill } from './digitalni-hugin';
import { soukromiCards, soukromiSkill } from './digitalni-soukromi';
import { strojCards, strojSkill } from './digitalni-stroj';

export const digitalniSkills: SkillDef[] = [aiSkill, strojSkill, huginSkill, soukromiSkill];

export const digitalniCards: KnowledgeCard[] = [...aiCards, ...strojCards, ...huginCards, ...soukromiCards];

export const digitalniMissions: JointMission[] = [
  {
    id: 'dilna.hon-na-ai',
    island: 'dilna',
    emoji: '🔍',
    title: 'Hon na AI doma',
    text: 'Projdi s rodičem byt nebo dům a najdi tři věci, které používají umělou inteligenci, a tři, které jen plní pevná pravidla. U každé řekni, proč si to myslíš.',
    parentTip: 'Ptejte se: Učila se ta věc z mnoha příkladů, nebo dělá pořád totéž podle pravidla? Hraniční věci, třeba pračku nebo vysavač s nápisem AI, klidně nechte nerozhodnuté – i to je dobrý závěr. Chvalte zdůvodnění, ne správnost.',
    level: 1,
  },
  {
    id: 'dilna.heslo-veta',
    island: 'dilna',
    emoji: '🔑',
    title: 'Silné heslo-věta',
    text: 'Vymysli s rodičem heslo z několika slov, třeba větu o drakovi, kterou si zapamatuješ. Nikam ho veřejně nepiš a neříkej ho kamarádům.',
    parentTip: 'Ukažte, že dlouhá věta je silnější než 1234 nebo jméno. Dítě si ji může nakreslit jako obrázek, ale samotné heslo nepište tam, kde ho uvidí ostatní. Když ho opravdu použijete, uložte si ho u sebe. Chvalte nápaditost.',
    level: 2,
  },
  {
    id: 'dilna.dite-je-stroj',
    island: 'dilna',
    emoji: '🤖',
    title: 'Hraj si na stroj',
    text: 'Rodič ti ukáže věci s nálepkou „drak“ a „není drak“. Ty jsi stroj: přijď na pravidlo a pak třiď nové věci. Potom si role vyměňte.',
    parentTip: 'Zvolte jednoduché skryté pravidlo, třeba „drak je všechno zelené“ nebo „drak má ocas“. Ukazujte příklady po jednom a nechte dítě tipovat. Pak ať vymyslí pravidlo pro vás. Povídejte si, kolik příkladů bylo potřeba a kdy se stroj spletl.',
    level: 2,
  },
  {
    id: 'dilna.oprav-hugina',
    island: 'dilna',
    emoji: '🐦',
    title: 'Oprav Hugina naživo',
    text: 'Rodič bude Hugin a přečte ti pět tvrzení. Dvě z nich jsou schválně špatně. Najdi je a vymysli, jak bys každé tvrzení {ověřila|ověřil}.',
    parentTip: 'Připravte pět krátkých tvrzení z domova, třeba „lednička je vyšší než stůl“, dvě z nich chybná. U každého se ptejte: Jak bychom to ověřili? Pak to spolu opravdu změřte, spočítejte nebo najděte v knize. Chvalte nápady na ověření.',
    level: 1,
  },
];
