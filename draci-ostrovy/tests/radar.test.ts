import { describe, expect, it } from 'vitest';
import { buildRadar } from '../src/core/radar';
import { defaultProfile } from '../src/core/storage';
import type { AnswerEvent } from '../src/core/types';

const ev = (p: Partial<AnswerEvent>): AnswerEvent => ({
  t: Date.UTC(2026, 9, 1, 10),
  sessionId: 's1',
  itemId: 'cisla.rady:3:x',
  skillId: 'cisla.rady',
  island: 'cisla',
  level: 3,
  outcome: 'first',
  attempts: 1,
  hintsUsed: 0,
  responseMs: 20000,
  ...p,
});

describe('rodičovský radar', () => {
  it('počítá podceňování a přeceňování z hodnocení jistoty', () => {
    const events = [
      ev({ confidence: 'hadala' }),
      ev({ confidence: 'hadala' }),
      ev({ confidence: 'jiste' }),
      ev({ confidence: 'jiste', outcome: 'failed', attempts: 3 }),
      ev({ confidence: 'asi', outcome: 'later', attempts: 2 }),
    ];
    const r = buildRadar(defaultProfile(), events);
    expect(r.confidence.rated).toBe(5);
    expect(r.confidence.underconfidence).toBeCloseTo(2 / 3);
    expect(r.confidence.overconfidence).toBeCloseTo(1 / 2);
  });

  it('zapisuje trénink testových formátů s daty a počty', () => {
    const events = [ev({ testLike: 'ciselne-rady' }), ev({ testLike: 'ciselne-rady', t: Date.UTC(2026, 9, 3) }), ev({ testLike: 'vahy', skillId: 'cisla.vahy' })];
    const r = buildRadar(defaultProfile(), events);
    const rady = r.testLike.find((t) => t.format === 'ciselne-rady')!;
    expect(rady.count).toBe(2);
    expect(rady.last).toBeGreaterThan(rady.first);
    expect(r.testLike.map((t) => t.format)).toContain('vahy');
  });

  it('otevřené odpovědi jdou do tvořivosti, ne do schopností', () => {
    const events = [ev({ outcome: 'open', skillId: 'slova.tvoreni', text: 'Drak umí zpívat.', ideas: 3 })];
    const r = buildRadar(defaultProfile(), events);
    expect(r.creativity.openAnswers).toBe(1);
    expect(r.creativity.avgIdeas).toBe(3);
    expect(r.confidence.rated).toBe(0);
  });
});
