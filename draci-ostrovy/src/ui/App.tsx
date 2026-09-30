import { lazy, Suspense } from 'react';
import { useGame } from '../core/game';
import { Hatch } from './screens/Hatch';
import { MapScreen } from './screens/MapScreen';
import { Play } from './screens/Play';
import { DayEnd, IslandScreen, Journal, MissionEnd } from './screens/Screens';
import { Book } from './screens/Book';
import { Players, Setup } from './screens/Players';

// Rodičovská část se načte, až když je potřeba.
const Parent = lazy(() => import('./parent/Parent').then((m) => ({ default: m.Parent })));

export function App() {
  const screen = useGame((s) => s.screen);
  const island = useGame((s) => s.island);

  const view = (() => {
    switch (screen) {
      case 'setup':
        return <Setup />;
      case 'players':
        return <Players />;
      case 'hatch':
        return <Hatch />;
      case 'map':
        return <MapScreen />;
      case 'island':
        return <IslandScreen />;
      case 'play':
        return <Play />;
      case 'missionEnd':
        return <MissionEnd />;
      case 'dayEnd':
        return <DayEnd />;
      case 'book':
        return <Book />;
      case 'journal':
        return <Journal />;
      case 'parent':
        return (
          <Suspense fallback={<p className="center">Načítám…</p>}>
            <Parent />
          </Suspense>
        );
    }
  })();

  return (
    <div key={screen + (screen === 'island' ? island : '')} className="app screen-enter">
      {view}
    </div>
  );
}
