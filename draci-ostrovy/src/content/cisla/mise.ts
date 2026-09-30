// Společné mise Ostrova čísel: hravé povídání o číslech v běžném dni
// (10–20 minut), žádné doučování.

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'cisla.prochazka',
    island: 'cisla',
    emoji: '🏘️',
    title: 'Čísla na procházce',
    text: 'Vyraz s dospělým na procházku po ulici. Na které straně jsou domy se sudými čísly a na které s lichými? Zkus uhodnout číslo dalšího domu dřív, než k němu dojdeš.',
    parentTip: 'Hledejte ulici s orientačními čísly (v Praze jsou na modrých tabulkách, červená čísla popisná se řídí jinak). Ptejte se: Kolik domů je mezi čísly 12 a 20? Jaké číslo bude mít dům na rohu? Chvalte, když si pravidla všimne {sama|sám}, a nechte {ji|ho} tipovat, i když se splete.',
    level: 2,
  },
  {
    id: 'cisla.peceni',
    island: 'cisla',
    emoji: '🧁',
    title: 'Kuchyňská matematika',
    text: 'Upeč s dospělým něco dobrého podle receptu. Ty budeš vážit a odměřovat: kolik gramů mouky, kolik mililitrů mléka. Než začneš sypat, zkus odhadnout, kolik je 100 gramů.',
    parentTip: 'Trouba, nůž a horký plech jsou vaše práce, váha a odměrka {její|jeho}. Ptejte se: Kolik ještě chybí do 250 gramů? Kolik bychom potřebovali na poloviční dávku? Když se odhad netrefí, je to užitečná informace, ne chyba – chvalte, jak {postupovala|postupoval}.',
    level: 2,
  },
  {
    id: 'cisla.fazole',
    island: 'cisla',
    emoji: '🎯',
    title: 'Odhad a kontrola',
    text: 'Nasyp do skleničky suché fazole. Odhadni, kolik jich tam je, a odhad si zapiš. Pak je vysyp a spočítej po desítkách – do hromádek po deseti.',
    parentTip: 'Syrové fazole nejsou k jídlu. Ptejte se, jak {odhadovala|odhadoval} – třeba {spočítala|spočítal} jednu vrstvu? Porovnejte odhad s výsledkem: o kolik se lišil? Hromádky po deseti ukazují, jak se počítá po desítkách. Pak zkuste jinou sklenici a sledujte, jestli se odhad zlepší.',
    level: 2,
  },
  {
    id: 'cisla.minuta',
    island: 'cisla',
    emoji: '⏱️',
    title: 'Jak dlouhá je minuta',
    text: 'Zavři oči a řekni „teď“, až si budeš myslet, že uběhla minuta – dospělý to změří na stopkách. Pak si role vyměňte: kdo se trefí blíž?',
    parentTip: 'Stačí stopky v telefonu. Ptejte se: Jak jsi {poznala|poznal}, že už je minuta? {Počítala|Počítal} jsi? Zkuste to i s počítáním jednadvacet, dvaadvacet… nebo při skákání. Nejde o přesnost, ale o objevování, jak dlouhá minuta je.',
    level: 1,
  },
];
