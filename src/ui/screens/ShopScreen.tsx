import { useState } from 'react';
import { useGameStore } from '../../data/state';
import { TopBar } from '../components/TopBar';
import { PixelCanvas } from '../../engine/PixelCanvas';
import { SHOP_ITEMS, GOLD_SHOP_ITEMS, RARITY_COLORS, ShopItemDef } from '../../data/shopItems';
import { playClick, playPurchase } from '../../engine/AudioEngine';

export function ShopScreen() {
  const { emeralds, gold, shopPurchases, purchaseItem, purchaseConsumable, showToast } = useGameStore();
  const [tab, setTab] = useState<'emeralds' | 'gold'>('emeralds');

  const handleBuy = (item: ShopItemDef) => {
    if (item.consumable) {
      if (gold < item.price) return;
      playPurchase();
      purchaseConsumable(item.id, item.price);
      showToast(`🎉 Zakoupeno: ${item.icon} ${item.name}!`);
    } else {
      if (shopPurchases[item.id] || emeralds < item.price) return;
      playPurchase();
      purchaseItem(item.id, item.price);
      showToast(`🎉 Zakoupeno: ${item.icon} ${item.name}!`);
    }
  };

  const items = tab === 'emeralds' ? SHOP_ITEMS : GOLD_SHOP_ITEMS;
  const currency = tab === 'emeralds' ? emeralds : gold;
  const currencyIcon = tab === 'emeralds' ? '💎' : '🪙';

  return (
    <div className="screen shop-screen">
      <PixelCanvas theme="normal" />
      <div className="screen-content">
        <TopBar />
        <div className="shop-scroll">
          <h2 className="shop-title pixel-text">🏪 Vesničanův obchod</h2>

          <div className="shop-tabs">
            <button
              className={`mc-btn ${tab === 'emeralds' ? 'mc-btn-gold' : 'mc-btn-stone'}`}
              onClick={() => { playClick(); setTab('emeralds'); }}
            >
              💎 Smaragdy ({emeralds})
            </button>
            <button
              className={`mc-btn ${tab === 'gold' ? 'mc-btn-gold' : 'mc-btn-stone'}`}
              onClick={() => { playClick(); setTab('gold'); }}
            >
              🪙 Zlato ({gold})
            </button>
          </div>

          <div className="shop-grid">
            {items.map(item => {
              const owned = !item.consumable && shopPurchases[item.id];
              const canAfford = currency >= item.price;
              return (
                <div key={item.id} className="shop-card mc-panel" style={{ borderTopColor: RARITY_COLORS[item.rarity] }}>
                  <div className="shop-rarity body-text" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {({ common: 'BĚŽNÉ', rare: 'VZÁCNÉ', epic: 'EPICKÉ', legendary: 'LEGENDÁRNÍ' }[item.rarity])}
                  </div>
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-name pixel-text">{item.name}</div>
                  <div className="shop-desc body-text">{item.desc}</div>
                  {item.effectDesc && <div className="shop-effect body-text">{item.effectDesc}</div>}
                  <div className="shop-price body-text">
                    {owned ? '✅ Zakoupeno' : `${item.price} ${currencyIcon}`}
                  </div>
                  {!owned && (
                    <button
                      className={`mc-btn ${canAfford ? 'mc-btn-gold' : 'mc-btn-stone'}`}
                      onClick={() => { playClick(); handleBuy(item); }}
                      disabled={!canAfford}
                    >
                      {canAfford ? (item.consumable ? '🧪 Koupit' : '🛒 Koupit') : `🔒 Málo ${currencyIcon}`}
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
