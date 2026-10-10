// Společné mise Školního ostrova: angličtina doma, krátce a hravě.

import type { JointMission } from '../../core/types';

export const missions: JointMission[] = [
  {
    id: 'skola.rozhovor',
    island: 'skola',
    emoji: '🗣️',
    title: 'Anglický rozhovor u večeře',
    text: 'Zeptej se rodiče anglicky: What’s your name? How old are you? Pak se role prohodí a ptá se rodič tebe.',
    parentTip:
      'Stačí pět minut a otázky ze školy: What’s your name? How old are you? What color is it? What’s this? Where’s the…? Když odpoví s chybou (Me seven.), zopakujte větu správně (I’m seven.) a nic dalšího neopravujte. Chvalte, že mluví – i pomalu a s chybou.',
    level: 1,
  },
  {
    id: 'skola.hlaskovani',
    island: 'skola',
    emoji: '🔤',
    title: 'Hláskovací souboj',
    text: 'Rodič vyhláskuje anglicky slovo a ty ho napíšeš. Pak hláskuješ ty a píše rodič. Kdo udělá méně chyb?',
    parentTip:
      'Používejte anglické názvy písmen: G = dží, J = džej, E = í, I = aj, A = ej, R = á, Y = uaj, W = dabl jú. Začněte krátkými slovy ze školy (bag, pen, red, desk, book), pak jmény (Sam, Lucy). Ve zkoušce Cambridge Starters se hláskují hlavně jména.',
    level: 1,
  },
  {
    id: 'skola.stitky',
    island: 'skola',
    emoji: '🏷️',
    title: 'Anglické štítky doma',
    text: 'Nalep na věci doma lísteček s anglickým slovem: door, window, chair, desk, book, bag. Každý den jeden štítek přečti nahlas.',
    parentTip:
      'Nechte štítky viset aspoň týden. Ptejte se: Where’s the book? – It’s on the desk. Tak se procvičí i předložky in, on, under, next to.',
    level: 1,
  },
];
