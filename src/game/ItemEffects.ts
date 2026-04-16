export interface ActiveEffects {
  freeHint: boolean;
  secondChance: boolean;
  xpBoost: number;
  streakShield: boolean;
  revealWrong: number;
  bonusEmeralds: number;
  bonusGold: number;
  visualHint: boolean;
  extraTry: boolean;
}

const ITEM_EFFECTS: Record<string, Partial<ActiveEffects>> = {
  pet_cat:        { freeHint: true },
  pickaxe_gold:   { revealWrong: 1 },
  pet_wolf:       { streakShield: true },
  pet_parrot:     { freeHint: true, revealWrong: 1 },
  pet_axolotl:    { extraTry: true },
  sword_diamond:  { bonusGold: 2 },
  enchant_book:   { visualHint: true },
  totem:          { secondChance: true },
  beacon:         { bonusEmeralds: 2 },
  elytra:         { xpBoost: 0.5 },
  dragon_egg:     {},
};

export function computeActiveEffects(inventory: Record<string, boolean>): ActiveEffects {
  const base: ActiveEffects = {
    freeHint: false,
    secondChance: false,
    xpBoost: 0,
    streakShield: false,
    revealWrong: 0,
    bonusEmeralds: 0,
    bonusGold: 0,
    visualHint: false,
    extraTry: false,
  };

  for (const itemId of Object.keys(inventory)) {
    if (!inventory[itemId]) continue;
    const fx = ITEM_EFFECTS[itemId];
    if (!fx) continue;

    if (fx.freeHint) base.freeHint = true;
    if (fx.secondChance) base.secondChance = true;
    if (fx.xpBoost) base.xpBoost += fx.xpBoost;
    if (fx.streakShield) base.streakShield = true;
    if (fx.revealWrong) base.revealWrong += fx.revealWrong;
    if (fx.bonusEmeralds) base.bonusEmeralds += fx.bonusEmeralds;
    if (fx.bonusGold) base.bonusGold += fx.bonusGold;
    if (fx.visualHint) base.visualHint = true;
    if (fx.extraTry) base.extraTry = true;
  }

  return base;
}
