import { useGameStore } from '../../data/state';
import { TopBar } from '../components/TopBar';
import { PixelCanvas } from '../../engine/PixelCanvas';
import { SHOP_ITEMS, RARITY_COLORS } from '../../data/shopItems';
import { playClick, playPurchase } from '../../engine/AudioEngine';

export function ShopScreen() {
  const { emeralds, shopPurchases, purchaseItem, showToast } = useGameStore();

  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    if (shopPurchases[item.id] || emeralds < item.price) return;
    playPurchase();
    purchaseItem(item.id, item.price);
    showToast(`🎉 Zakoupeno: ${item.icon} ${item.name}!`);
  };

  return (
    <div className="screen shop-screen">
      <PixelCanvas theme="normal" />
      <div className="screen-content">
        <TopBar />
        <div className="shop-scroll">
          <h2 className="shop-title pixel-text">🏪 Vesničanův obchod</h2>
          <div className="shop-grid">
            {SHOP_ITEMS.map(item => {
              const owned = shopPurchases[item.id];
              const canAfford = emeralds >= item.price;
              return (
                <div key={item.id} className="shop-card mc-panel" style={{ borderTopColor: RARITY_COLORS[item.rarity] }}>
                  <div className="shop-rarity body-text" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {({ common: 'BĚŽNÉ', rare: 'VZÁCNÉ', epic: 'EPICKÉ', legendary: 'LEGENDÁRNÍ' }[item.rarity])}
                  </div>
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-name pixel-text">{item.name}</div>
                  <div className="shop-desc body-text">{item.desc}</div>
                  <div className="shop-price body-text">
                    {owned ? '✅ Zakoupeno' : `${item.price} 💎`}
                  </div>
                  {!owned && (
                    <button
                      className={`mc-btn ${canAfford ? 'mc-btn-gold' : 'mc-btn-stone'}`}
                      onClick={() => { playClick(); handleBuy(item); }}
                      disabled={!canAfford}
                    >
                      {canAfford ? '🛒 Koupit' : '🔒 Málo 💎'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
