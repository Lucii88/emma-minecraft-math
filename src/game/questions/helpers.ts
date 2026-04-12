export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateOptions(correct: number, difficulty: number): number[] {
  const opts = new Set<number>([correct]);
  const range = difficulty <= 1 ? 5 : difficulty <= 2 ? 8 : 12;
  let attempts = 0;
  while (opts.size < 4 && attempts < 50) {
    let wrong = correct + randInt(-range, range);
    if (wrong < 0) wrong = randInt(0, correct + range);
    if (wrong !== correct) opts.add(wrong);
    attempts++;
  }
  while (opts.size < 4) opts.add(correct + opts.size);
  return shuffle([...opts]);
}
