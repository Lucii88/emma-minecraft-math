// Vynálezecká dílna – algoritmy, data a šifry: dovednosti, karty do Knihy
// draků a společné mise s rodičem. Každá dovednost má vlastní soubor
// algoritmy-*.ts, společné pomůcky pro mřížku jsou v algoritmy-mrizka.ts.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { chybaCards, chybaSkill } from './algoritmy-chyba';
import { dataCards, dataSkill } from './algoritmy-data';
import { letCards, letSkill } from './algoritmy-let';
import { postupyCards, postupySkill } from './algoritmy-postupy';
import { sifryCards, sifrySkill } from './algoritmy-sifry';

export const algoritmySkills: SkillDef[] = [letSkill, chybaSkill, postupySkill, dataSkill, sifrySkill];

export const algoritmyCards: KnowledgeCard[] = [...letCards, ...chybaCards, ...postupyCards, ...dataCards, ...sifryCards];

export const algoritmyMissions: JointMission[] = [
  {
    id: 'dilna.robot-rodic',
    island: 'dilna',
    emoji: '🤖',
    title: 'Robot rodič',
    text: 'Schovej v pokoji malý poklad. Rodič bude robot, který umí jen tři povely: „krok dopředu“, „otoč se doleva“ a „otoč se doprava“. Doveď ho povely až k pokladu!',
    parentTip: 'Buďte opravdu doslovný robot: udělejte přesně to, co zazní, i když to vede ke zdi (opatrně). Když se robot splete, zeptejte se: „Který povel byl špatně?“ Chvalte, když dcera chybu sama najde a opraví. Pak si role vyměňte.',
    level: 1,
  },
  {
    id: 'dilna.tajna-zprava',
    island: 'dilna',
    emoji: '🔐',
    title: 'Tajná zpráva',
    text: 'Vymysli vlastní šifru: každému písmenu přiřaď obrázek nebo číslo. Napiš rodiči tajný vzkaz a dej mu k němu klíč. Dokáže ho rozluštit?',
    parentTip: 'Nechte dceru, ať šifru vymyslí sama, i kdyby byla jednoduchá. Při luštění nahlas přemýšlejte, jak postupujete, a nechte se opravit. Starší luštitelé můžou zkusit vzkaz bez klíče: která značka je nejčastější? V češtině patří k nejčastějším písmenům O, E a A.',
    level: 1,
  },
  {
    id: 'dilna.scitani-z-okna',
    island: 'dilna',
    emoji: '🐦',
    title: 'Sčítání z okna',
    text: 'Sedni si s rodičem k oknu a deset minut počítej, co vidíš: ptáky, auta nebo lidi se psem. Každou věc zapiš čárkou do tabulky. Pak z čárek nakresli sloupcový graf.',
    parentTip: 'Připravte tabulku se třemi řádky a obrázky (pták, auto, pes) a nechte dceru čárkovat. Potom se ptejte: Čeho bylo nejvíc? O kolik? Myslíš, že to zítra bude stejné? Graf nakreslete na čtverečkovaný papír – jedno políčko je jedna čárka.',
    level: 1,
  },
  {
    id: 'dilna.recept-pro-robota',
    island: 'dilna',
    emoji: '🥪',
    title: 'Recept pro doslovného robota',
    text: 'Napiš nebo nakresli postup, jak udělat chleba s máslem. Rodič bude robot a udělá přesně to, co v postupu stojí – nic víc. Povede se chleba napoprvé?',
    parentTip: 'Plňte kroky úplně doslova: když chybí „vezmi nůž“, robot nemá čím mazat, a tak třeba maže prstem. Smějte se chybám spolu, hledejte, který krok chybí nebo je nepřesný, a postup opravte. Na máslo stačí tupý nůž, ostrý ať zůstane dospělému.',
    level: 2,
  },
];
