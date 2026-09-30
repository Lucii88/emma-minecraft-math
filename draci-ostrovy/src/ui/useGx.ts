import { useCallback } from 'react';
import { useGame } from '../core/game';
import { gx } from '../core/gender';

/** Texty se značkami {ženský|mužský} podle právě hrajícího hráče. */
export function useGx() {
  const gender = useGame((s) => s.profile.gender);
  return useCallback((text: string) => gx(text, gender), [gender]);
}
