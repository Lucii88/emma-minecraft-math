// Společné mise Vikingského trhu: úkoly do skutečného světa s rodičem.

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'trh.nakup',
    island: 'trh',
    emoji: '🛒',
    title: 'Nákup s kontrolou',
    text: 'Zaplať s rodičem malý nákup mincemi nebo bankovkou. Předem odhadni, kolik ti mají vrátit, a pak zkontroluj, jestli to sedí.',
    parentTip: 'Vyberte levnou věc do 50 Kč a nechte dítě zaplatit samo v hotovosti. Před placením se zeptejte: „Kolik nám asi vrátí?“ Po nákupu spolu zkontrolujte peníze i účtenku. Chvalte postup („pěkně jsi to spočítala“), ne rychlost.',
    level: 1,
  },
  {
    id: 'trh.stanek',
    island: 'trh',
    emoji: '🏪',
    title: 'Rodinný stánek',
    text: 'Postav doma stánek se svými výtvory, napiš cenovky a prodávej rodině za hrací peníze. Na konci spočítej, kolik jsi utržila.',
    parentTip: 'Výtvory můžou být obrázky, náramky nebo figurky z modelíny, hrací peníze stačí vystřihnout z papíru. Nakupujte, nechte ji vracet peníze a zeptejte se, co šlo nejlíp na odbyt a proč. Je to hra, ne zkouška – chvalte nápady a snahu.',
    level: 1,
  },
  {
    id: 'trh.rozhovor',
    island: 'trh',
    emoji: '🗣️',
    title: 'Jak se vydělávají peníze',
    text: 'Zeptej se rodiče, co dělá v práci, komu jeho práce pomáhá a co ho na ní baví. Pak nakresli, co ses dozvěděla.',
    parentTip: 'Popište svou práci jednoduše a konkrétně: co děláte během dne, co z toho mají ostatní a proč za to dostáváte peníze. Zmiňte i práci doma, za kterou se neplatí. Zeptejte se, co by jednou chtěla dělat ona a proč.',
    level: 1,
  },
  {
    id: 'trh.sklenice',
    island: 'trh',
    emoji: '🐷',
    title: 'Spořicí sklenice',
    text: 'Vyber si cíl, na který chceš šetřit, a nakresli ho na sklenici nebo krabičku. Každý týden si zapiš, kolik jsi přidala.',
    parentTip: 'Pomozte vybrat cíl, který jde našetřit za pár týdnů. Nakreslete k němu sloupeček a každý týden ho spolu vybarvěte. Povídejte si, co pomáhá vydržet, a dosažený cíl oslavte. Kolik odkládat, si dítě určí s vámi – žádné pevné pravidlo není potřeba.',
    level: 2,
  },
  {
    id: 'trh.porovnej',
    island: 'trh',
    emoji: '⚖️',
    title: 'Porovnej ceny',
    text: 'V obchodě najdi stejnou věc ve dvou velikostech balení. Zjisti, ve kterém je jeden kus nebo 100 g levnější.',
    parentTip: 'Hodí se jogurty, sušenky nebo rýže. Ukažte, že na cenovce u regálu bývá i cena za kilogram nebo kus. Ptejte se: „Vyplatí se nám větší balení, i když ho nestihneme sníst?“ Oceňte postup, i když výsledek vyjde jinak, než čekala.',
    level: 4,
  },
];
