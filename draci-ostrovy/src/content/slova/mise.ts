// Společné mise Ostrova slov: hry se slovy pro celou rodinu (10–20 minut,
// stačí papír, tužka a chuť si hrát).

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'slova.kniha-hadanek',
    island: 'slova',
    emoji: '📒',
    title: 'Rodinná kniha hádanek',
    text: 'Založ si sešit na hádanky. Každý z rodiny ti řekne jednu hádanku, ty ji zapíšeš a odpověď schováš pod přeložený roh stránky. Nakonec vymysli vlastní hádanku a vyzkoušej ji na ostatních.',
    parentTip: 'Se zapisováním klidně pomozte, ale hádanku {ji|ho} nechte zapsat po svém. U vlastní hádanky se ptejte: Co je na té věci zvláštního? Jak ji popsat, aby nebyla hned uhodnutá? Chvalte nápaditou indicii a klidně se nechte nachytat.',
    level: 1,
  },
  {
    id: 'slova.dopis-drakovi',
    island: 'slova',
    emoji: '✉️',
    title: 'Dopis drakovi',
    text: 'Napiš svému drakovi dopis. Pozdrav ho, napiš mu, co jsi {zažila|zažil}, a zeptej se ho na něco, co tě zajímá. Můžeš přidat i obrázek.',
    parentTip: 'Nejdřív obsah, potom pravopis: chyby nepodtrhávejte červeně. Ptejte se: Co by drak chtěl vědět? Jak dopis začneš a jak skončíš? Chvalte, jak dopis {poskládala|poskládal} – oslovení, zážitek, otázka, pozdrav. Když bude chtít, opravte spolu jednu dvě věci a dopis schovejte do obálky.',
    level: 1,
  },
  {
    id: 'slova.slovni-fotbal',
    island: 'slova',
    emoji: '⚽',
    title: 'Slovní fotbal na cestě',
    text: 'Na cestě si zahrajte slovní fotbal. Kdo je na řadě, řekne slovo, které začíná poslední hláskou předchozího slova: drak – kočka – auto – okno… Slova se nesmějí opakovat.',
    parentTip: 'Hrajte bez vyřazování, ať je to zábava. Když si neví rady, napovězte: Zvíře na K? Ztížit se to dá tématem (jen zvířata, jen jídlo) nebo tím, že slovo musí mít aspoň tři slabiky. Ch je jedno písmeno a slova končící na y nebo ř jsou těžší – domluvte se, co s nimi.',
    level: 1,
  },
];
