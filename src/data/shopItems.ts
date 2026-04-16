export interface ShopItemDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  effectDesc?: string;
  price: number;
  currency: 'emeralds' | 'gold';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  consumable?: boolean;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'skin_creeper', name: 'Creeper oblečení', icon: '💚', desc: 'Zelený outfit pro Emmu!', price: 15, currency: 'emeralds', rarity: 'common' },
  { id: 'pickaxe_gold', name: 'Zlatý krumpáč', icon: '⛏️', desc: 'Odkryje jednu špatnou odpověď.', effectDesc: '🔍 Škrtne 1 špatnou možnost', price: 10, currency: 'emeralds', rarity: 'common' },
  { id: 'pet_cat', name: 'Kočka', icon: '🐱', desc: 'Šeptne ti 1 nápovědu zdarma za výpravu.', effectDesc: '💡 1× nápověda zdarma', price: 20, currency: 'emeralds', rarity: 'common' },
  { id: 'pet_wolf', name: 'Vlk', icon: '🐺', desc: 'Chrání tvou sérii — 1. chyba neruší streak!', effectDesc: '🛡️ Streak shield', price: 25, currency: 'emeralds', rarity: 'rare' },
  { id: 'pet_parrot', name: 'Papoušek', icon: '🦜', desc: 'Nápověda + škrtne špatnou odpověď!', effectDesc: '💡+🔍 Hint + škrtne 1', price: 30, currency: 'emeralds', rarity: 'rare' },
  { id: 'pet_axolotl', name: 'Axolotl', icon: '🦎', desc: 'Dostaneš 3. pokus místo 2!', effectDesc: '🔄 Extra pokus', price: 35, currency: 'emeralds', rarity: 'rare' },
  { id: 'sword_diamond', name: 'Diamantový meč', icon: '🗡️', desc: 'Za každou výpravu +2 gold navíc!', effectDesc: '🪙 +2 gold za quest', price: 40, currency: 'emeralds', rarity: 'epic' },
  { id: 'enchant_book', name: 'Kniha kouzel', icon: '📖', desc: 'Zobrazí Montessori pomůcku i u těžkých úloh.', effectDesc: '✨ Vizuální pomůcka vždy', price: 35, currency: 'emeralds', rarity: 'epic' },
  { id: 'totem', name: 'Totem nesmrtelnosti', icon: '🗿', desc: '1× za výpravu: chyba se vymaže!', effectDesc: '❤️ 1× druhá šance', price: 50, currency: 'emeralds', rarity: 'epic' },
  { id: 'beacon', name: 'Maják', icon: '🔦', desc: '+2 emeraldy za každou dokončenou výpravu.', effectDesc: '💎 +2 emeraldy za quest', price: 60, currency: 'emeralds', rarity: 'epic' },
  { id: 'elytra', name: 'Křídla Elytra', icon: '🪽', desc: '+50% XP ze všech výprav!', effectDesc: '✨ +50% XP boost', price: 100, currency: 'emeralds', rarity: 'legendary' },
  { id: 'dragon_egg', name: 'Dračí vejce', icon: '🥚', desc: 'Odemkne speciální Dragon Quest!', effectDesc: '🐉 Dračí výprava', price: 200, currency: 'emeralds', rarity: 'legendary' },
];

export const GOLD_SHOP_ITEMS: ShopItemDef[] = [
  { id: 'xp_potion', name: 'XP lektvar', icon: '🧪', desc: '+25% XP na příští výpravu.', effectDesc: '✨ Jednorázový XP boost', price: 5, currency: 'gold', rarity: 'common', consumable: true },
  { id: 'ender_pearl', name: 'Ender perla', icon: '🟣', desc: 'Přeskočí 1 otázku ve výpravě.', effectDesc: '⏭️ Skip 1 otázku', price: 8, currency: 'gold', rarity: 'rare', consumable: true },
  { id: 'golden_apple', name: 'Zlaté jablko', icon: '🍎', desc: 'Obnoví streak na polovinu tvého rekordu.', effectDesc: '🔥 Obnova streaku', price: 10, currency: 'gold', rarity: 'epic', consumable: true },
];

export const RARITY_COLORS: Record<string, string> = {
  common: '#AAAAAA',
  rare: '#5555FF',
  epic: '#AA00AA',
  legendary: '#FFAA00',
};
