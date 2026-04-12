export function getEffectiveDifficulty(baseDifficulty: number, playerLevel: number): number {
  return Math.min(3, baseDifficulty + Math.floor(playerLevel / 4));
}

export function getQuestLength(difficulty: number): number {
  if (difficulty <= 1) return 6;
  if (difficulty <= 2) return 7;
  return 8;
}
