import { useGameStore } from './data/state';
import { TitleScreen } from './ui/screens/TitleScreen';
import { HubScreen } from './ui/screens/HubScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { InventoryScreen } from './ui/screens/InventoryScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { Toast } from './ui/components/Toast';
import { AchievementPopup } from './ui/components/AchievementPopup';

export default function App() {
  const screen = useGameStore(s => s.screen);

  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'hub' && <HubScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'inventory' && <InventoryScreen />}
      {screen === 'shop' && <ShopScreen />}
      <Toast />
      <AchievementPopup />
    </>
  );
}
