import { WorldDef } from './types';

export const WORLDS: WorldDef[] = [
  {
    id: 'plains', name: 'Pláně sčítání', desc: 'Sčítej jako Minecraft farmář!',
    icon: '🌾', type: 'addition', difficulty: 1, unlockLevel: 1,
    quests: ['Stavba farmy', 'Sklizeň obilí', 'Krmení zvířat', 'Nová stodola', 'Zlatý den'],
    color: '#7CB342', theme: 'normal',
  },
  {
    id: 'caves', name: 'Jeskyně odčítání', desc: 'Odečítej v hlubinách dolů!',
    icon: '⛏️', type: 'subtraction', difficulty: 1, unlockLevel: 1,
    quests: ['Těžba uhlí', 'Hledání železa', 'Cesta k diamantům', 'Lávová jeskyně', 'Tajná chodba'],
    color: '#8B8B8B', theme: 'normal',
  },
  {
    id: 'village', name: 'Vesnice slovních úloh', desc: 'Pomoz vesničanům s problémy!',
    icon: '🏘️', type: 'word_problems', difficulty: 2, unlockLevel: 2,
    quests: ['Tržiště', 'Stavba domu', 'Obrana vesnice', 'Knihovna', 'Festival'],
    color: '#B8860B', theme: 'normal',
  },
  {
    id: 'nether', name: 'Nether hádanek', desc: 'Logické hádanky v Netheru!',
    icon: '🔥', type: 'puzzles', difficulty: 2, unlockLevel: 3,
    quests: ['Portál Netheru', 'Most přes lávu', 'Pevnost Blazů', 'Wither skelet', 'Netherbrick hrad'],
    color: '#CC3300', theme: 'nether',
  },
  {
    id: 'ocean', name: 'Oceán vzorců', desc: 'Najdi vzorce a posloupnosti!',
    icon: '🌊', type: 'patterns', difficulty: 2, unlockLevel: 3,
    quests: ['Podmořský chrám', 'Korálový útes', 'Poklad na dně', 'Delfíní stezka', 'Podmořská pevnost'],
    color: '#0277BD', theme: 'ocean',
  },
  {
    id: 'memory', name: 'Paměťová pevnost', desc: 'Trénuj paměť a vizuální vnímání!',
    icon: '🧠', type: 'memory', difficulty: 1, unlockLevel: 2,
    quests: ['Kouzelnická věž', 'Knihovna', 'Brána Endu', 'Čarodějova komnata', 'Trůnní sál'],
    color: '#6A1B9A', theme: 'night',
  },
  {
    id: 'redstone', name: 'Redstone logika', desc: 'Logické operace a porovnávání!',
    icon: '⚡', type: 'logic', difficulty: 3, unlockLevel: 4,
    quests: ['Obvod', 'Piston dveře', 'Redstone počítač', 'Hodinový stroj', 'Mega farma'],
    color: '#FF3333', theme: 'nether',
  },
  {
    id: 'end', name: 'End — Finální bitva', desc: 'Smíšené výzvy pro skutečné hrdiny!',
    icon: '🐉', type: 'mixed', difficulty: 3, unlockLevel: 5,
    quests: ['Cesta na End', 'Endermani', 'Drak Ender', 'Město Endu', 'Cesta za křídly'],
    color: '#1D1026', theme: 'end',
  },
];
