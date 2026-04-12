export interface ShopItemDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  price: number;
  currency: 'emeralds' | 'gold';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'skin_creeper', name: 'Creeper oblečení', icon: '💚', desc: 'Zelený outfit pro Emmu!', price: 15, currency: 'emeralds', rarity: 'common' },
  { id: 'pet_cat', name: 'Kočka', icon: '🐱', desc: 'Věrný společník na cesty.', price: 20, currency: 'emeralds', rarity: 'common' },
  { id: 'pet_wolf', name: 'Vlk', icon: '🐺', desc: 'Ochránce na dobrodružství!', price: 25, currency: 'emeralds', rarity: 'rare' },
  { id: 'pet_parrot', name: 'Papoušek', icon: '🦜', desc: 'Křičí odpovědi... někdy správně!', price: 30, currency: 'emeralds', rarity: 'rare' },
  { id: 'pet_axolotl', name: 'Axolotl', icon: '🦎', desc: 'Nejroztomilejší kamarád!', price: 35, currency: 'emeralds', rarity: 'rare' },
  { id: 'sword_diamond', name: 'Diamantový meč', icon: '🗡️', desc: 'Symbol tvé síly!', price: 40, currency: 'emeralds', rarity: 'epic' },
  { id: 'pickaxe_gold', name: 'Zlatý krumpáč', icon: '⛏️', desc: 'Bonus nápověda zdarma!', price: 10, currency: 'emeralds', rarity: 'common' },
  { id: 'enchant_book', name: 'Kniha kouzel', icon: '📖', desc: 'Speciální efekty u odpovědí!', price: 35, currency: 'emeralds', rarity: 'epic' },
  { id: 'totem', name: 'Totem nesmrtelnosti', icon: '🗿', desc: 'Ochrana před chybou — jednou za výpravu.', price: 50, currency: 'emeralds', rarity: 'epic' },
  { id: 'beacon', name: 'Maják', icon: '🔦', desc: 'Rozsvítí cestu — extra nápovědy.', price: 60, currency: 'emeralds', rarity: 'epic' },
  { id: 'elytra', name: 'Křídla Elytra', icon: '🪽', desc: 'Legendární křídla! Symbol síly.', price: 100, currency: 'emeralds', rarity: 'legendary' },
  { id: 'dragon_egg', name: 'Dračí vejce', icon: '🥚', desc: 'Nejcennější trofej Minecraftu!', price: 200, currency: 'emeralds', rarity: 'legendary' },
];

export const RARITY_COLORS: Record<string, string> = {
  common: '#AAAAAA',
  rare: '#5555FF',
  epic: '#AA00AA',
  legendary: '#FFAA00',
};
