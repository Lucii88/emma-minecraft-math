// Ostrov záhad – kritické myšlení. Hádankář mlžný se na každou odpověď
// zeptá: „A jak to víš?“ Dovednosti: jak to víme, fakt × názor, mýtus ×
// pravda, reklama a dračí detektivka. Úlohy jsou v souborech kriticke-*.ts.

import { bankSkill } from '../../core/bank';
import type { SkillDef } from '../../core/types';
import { detektivBanks } from './kriticke-detektiv';
import { faktBanks } from './kriticke-fakt';
import { jakBanks } from './kriticke-jak';
import { mytusBanks } from './kriticke-mytus';
import { reklamaBanks } from './kriticke-reklama';

export { kritickeCards, kritickeMissions } from './kriticke-kniha';

export const jakToVime = bankSkill({
  id: 'zahady.jak-to-vime',
  island: 'zahady',
  name: 'Jak to víme?',
  description: 'Rozvíjí vědecké myšlení: dítě rozlišuje způsoby poznání (pozorování, měření, pokus, odborník, spolehlivý zdroj) a zjišťuje, proč je férový a opakovaný pokus spolehlivější než doslech.',
  rvp: {
    1: ['ČJS-3-4-03'],
    2: ['ČJS-3-4-03'],
    3: ['ČJS-3-4-03', 'ČJS-5-4-06'],
    4: ['ČJS-5-4-06', 'I-5-1-01'],
  },
  ability: 'usuzovani',
  banks: jakBanks,
});

export const faktNazor = bankSkill({
  id: 'zahady.fakt-nazor',
  island: 'zahady',
  name: 'Fakt, nebo názor?',
  description: 'Učí rozlišit ověřitelný fakt od názoru a najít slova, která hodnocení prozrazují, i ve větách, kde je obojí.',
  rvp: {
    1: ['ČJL-3-1-01'],
    2: ['ČJL-3-1-01'],
    3: ['ČJL-5-1-01', 'ČJL-5-1-02'],
    4: ['ČJL-5-1-02'],
  },
  ability: 'usuzovani',
  banks: faktBanks,
});

export const mytusPravda = bankSkill({
  id: 'zahady.mytus',
  island: 'zahady',
  name: 'Mýtus, nebo pravda?',
  description: 'Třídí rozšířené omyly a překvapivé pravdy o přírodě a světě a u každé ukazuje, jak na to vědci přišli – pozorováním, měřením nebo pokusem.',
  rvp: {
    1: ['ČJS-3-4-02'],
    2: ['ČJS-3-4-02', 'ČJS-3-4-03'],
    3: ['ČJS-3-4-03', 'ČJS-5-4-04'],
    4: ['ČJS-5-4-02', 'ČJS-5-4-04'],
    5: ['ČJS-5-4-02', 'ČJS-5-4-06'],
  },
  ability: 'usuzovani',
  banks: mytusBanks,
});

export const reklama = bankSkill({
  id: 'zahady.reklama',
  island: 'zahady',
  name: 'Reklama: kdo z toho má užitek?',
  description: 'Učí rozpoznat, co po nás reklama chce, kdo ji platí a jaké triky používá – od „jen dnes!“ a hvězdičky s malým písmem po placená doporučení a nákupy ve hrách.',
  rvp: {
    2: ['ČJL-5-1-06', 'ČJL-3-1-01'],
    3: ['ČJL-5-1-06'],
    4: ['ČJL-5-1-06', 'ČJS-5-2-03'],
    5: ['ČJL-5-1-06', 'ČJS-5-2-03', 'M-5-4-01'],
  },
  ability: 'usuzovani',
  banks: reklamaBanks,
});

export const detektiv = bankSkill({
  id: 'zahady.detektiv',
  island: 'zahady',
  name: 'Dračí detektivka',
  description: 'Rozvíjí usuzování ze stop: dítě vyřazuje podezřelé, spojuje víc stop dohromady a odlišuje, co ví jistě, od toho, co jen tuší.',
  rvp: {
    2: ['ČJL-3-1-01'],
    3: ['ČJL-5-1-02'],
    4: ['ČJL-5-1-02', 'M-5-4-01'],
    5: ['ČJL-5-1-02', 'M-5-4-01'],
  },
  ability: 'usuzovani',
  banks: detektivBanks,
});

export const kritickeSkills: SkillDef[] = [jakToVime, faktNazor, mytusPravda, reklama, detektiv];
