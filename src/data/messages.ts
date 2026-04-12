import { pick } from '../game/questions/helpers';

const PRAISE_CORRECT = [
  'Výborně, Emmo! 🎉',
  'Skvělá práce! ⭐',
  'Diamantová odpověď! 💎',
  'Ty jsi mistryně! 🏆',
  'To bylo rychlé! 🔥',
  'Úžasné! ✨',
  'Vytěžila jsi správnou odpověď! ⛏️',
  'Zářivý výkon! 🌟',
  'Přesný zásah! 🎯',
  'Síla! 💪',
  'Jako diamant — tvrdá a přesná! 💎',
  'Neporazitelná! ⚔️',
];

const PRAISE_EFFORT = [
  'Nevadí, zkusíš to znovu — a to se počítá! 💪',
  'Každá chyba tě učí něco nového! 🌱',
  'I zkušení hráči musí kopat víckrát! ⛏️',
  'Stavíš svůj svět cihlu po cihle — jsi na cestě! 🧱',
  'Důležité je, že to nevzdáváš! 🌈',
  'Tvé úsilí je jako redstone — dává ti sílu! 🔥',
  'Diamanty se taky hledají dlouho — vydrž! 💎',
  'Krok za krokem, blok za blokem! 🐾',
  'Chyba není prohra, je to krok k vítězství! 🏆',
  'Steve taky neporazil Dragona napoprvé! 🐉',
];

const STREAK_MESSAGES: Record<number, string> = {
  3: '🔥 3 v řadě! Jsi v laufu!',
  4: '🔥🔥 4 v řadě!',
  5: '⚡ 5 v řadě! Fenomenální!',
  6: '⚡⚡ 6! Nezastavitelná!',
  7: '🌟 7 v řadě! Neuvěřitelné!',
  8: '💎 8 v řadě! Diamantová série!',
  9: '👑 9! Královská série!',
  10: '🐉 10! Ender Dragon by byl v šoku!',
};

const WELCOME_MESSAGES = [
  'Ahoj, Emmo! Kam dnes vyrazíme? 🗺️',
  'Vítej zpět, stavitelko! 💪',
  'Svět čeká na průzkum! 🌍',
  'Připravena na dobrodružství? ⚔️',
  'Nový den, nové výzvy! 🌟',
  'Emmo, pojďme na to! 🔥',
];

export function getCorrectPraise(): string {
  return pick(PRAISE_CORRECT);
}

export function getEffortPraise(): string {
  return pick(PRAISE_EFFORT);
}

export function getStreakMessage(streak: number): string | null {
  if (streak >= 10) return `🐉 ${streak} v řadě! LEGENDÁRNÍ!`;
  return STREAK_MESSAGES[streak] || null;
}

export function getWelcome(): string {
  return pick(WELCOME_MESSAGES);
}
