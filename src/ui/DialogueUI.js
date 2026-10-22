import { ITEMS_DATABASE } from '../systems/Inventory.js';

export class DialogueUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('dialogue-modal');
    this.portraitEl = document.getElementById('npc-portrait-icon');
    this.nameEl = document.getElementById('npc-name-display');
    this.textEl = document.getElementById('dialogue-text-content');
    this.optionsEl = document.getElementById('dialogue-action-buttons');

    // Shop modal elements
    this.shopModal = document.getElementById('shop-modal');
    this.shopTitle = document.getElementById('shop-title');
    this.shopTabBuy = document.getElementById('shop-tab-buy');
    this.shopTabSell = document.getElementById('shop-tab-sell');
    this.shopItemsList = document.getElementById('shop-items-list');
    this.shopPlayerGold = document.getElementById('shop-player-gold');

    this.currentNpc = null;
    this.shopMode = 'buy'; // 'buy' or 'sell'

    this.initEvents();
  }

  initEvents() {
    this.shopTabBuy.addEventListener('click', () => {
      this.shopMode = 'buy';
      this.shopTabBuy.classList.add('active');
      this.shopTabSell.classList.remove('active');
      this.refreshShop();
    });

    this.shopTabSell.addEventListener('click', () => {
      this.shopMode = 'sell';
      this.shopTabSell.classList.add('active');
      this.shopTabBuy.classList.remove('active');
      this.refreshShop();
    });
  }

  open(npc) {
    this.currentNpc = npc;
    this.modal.style.display = 'flex';
    this.portraitEl.textContent = npc.portrait;
    this.nameEl.textContent = `${npc.name} (${npc.role})`;
    this.textEl.textContent = npc.dialogue;

    this.renderOptions(npc);
  }

  close() {
    this.modal.style.display = 'none';
  }

  renderOptions(npc) {
    this.optionsEl.innerHTML = '';

    // Healing Option for Doctor / Lyra
    if (npc.canHeal) {
      const healBtn = document.createElement('button');
      healBtn.className = 'action-btn';
      healBtn.textContent = '💖 Curarme completamente (15 🪙)';
      healBtn.addEventListener('click', () => {
        if (this.game.player.coins >= 15) {
          this.game.player.coins -= 15;
          this.game.player.health = this.game.player.maxHealth;
          this.game.soundManager.playDrink();
          this.textEl.textContent = '¡Tus heridas han sido completamente sanadas por mis ungüentos!';
          this.game.hud.showToast('¡Salud restaurada al 100%!', 'toast-loot');
          this.game.hud.update();
        } else {
          this.textEl.textContent = 'No tienes suficientes monedas para pagar el tratamiento.';
        }
      });
      this.optionsEl.appendChild(healBtn);
    }

    // Shop Option for merchants / blacksmiths
    if (npc.id === 'boran' || npc.id === 'thorgar' || npc.id === 'lyra') {
      const shopBtn = document.createElement('button');
      shopBtn.className = 'action-btn';
      shopBtn.textContent = '🛍️ Comerciar (Comprar / Vender)';
      shopBtn.addEventListener('click', () => {
        this.close();
        this.openShop(npc);
      });
      this.optionsEl.appendChild(shopBtn);
    }

    // Quest Advice / Eldrin
    if (npc.id === 'eldrin') {
      const adviceBtn = document.createElement('button');
      adviceBtn.className = 'action-btn';
      adviceBtn.textContent = '📜 Pedir consejo sobre el Guardián';
      adviceBtn.addEventListener('click', () => {
        this.textEl.textContent = 'El Guardián del Bosque yace en el claro sombrío al norte. No vayas sin una buena espada de piedra o hierro, y asegúrate de llevar comida y pociones. Cuando se enfurezca, golpeará el suelo con raíces.';
      });
      this.optionsEl.appendChild(adviceBtn);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-btn btn-danger';
    closeBtn.textContent = '👋 Despedirse';
    closeBtn.addEventListener('click', () => this.close());
    this.optionsEl.appendChild(closeBtn);
  }

  openShop(npc) {
    this.currentNpc = npc;
    this.shopModal.style.display = 'flex';
    this.shopTitle.textContent = `Tienda: ${npc.name}`;
    this.shopMode = 'buy';
    this.shopTabBuy.classList.add('active');
    this.shopTabSell.classList.remove('active');
    this.refreshShop();
  }

  closeShop() {
    this.shopModal.style.display = 'none';
  }

  refreshShop() {
    this.shopPlayerGold.textContent = this.game.player.coins;
    this.shopItemsList.innerHTML = '';

    if (this.shopMode === 'buy') {
      // Wares for sale by NPC
      const defaultWares = [
        { id: 'apple', price: 6 },
        { id: 'water_bottle', price: 8 },
        { id: 'cooked_meat', price: 18 },
        { id: 'bandage', price: 14 },
        { id: 'potion_health', price: 32 },
        { id: 'stone_sword', price: 45 },
        { id: 'leather_armor', price: 50 },
        { id: 'iron_ore', price: 20 }
      ];

      defaultWares.forEach(ware => {
        const item = ITEMS_DATABASE[ware.id];
        if (!item) return;

        const row = document.createElement('div');
        row.className = 'recipe-card';
        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.5rem;">${item.icon}</span>
            <div>
              <div style="font-weight:700; color:#fff;">${item.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.desc}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:#ffd700; font-weight:700;">${ware.price} 🪙</span>
            <button class="action-btn" style="padding:4px 10px;">Comprar</button>
          </div>
        `;

        const buyBtn = row.querySelector('button');
        buyBtn.addEventListener('click', () => {
          if (this.game.player.coins >= ware.price) {
            this.game.player.coins -= ware.price;
            this.game.player.inventory.addItem(ware.id, 1);
            this.game.soundManager.playCollect();
            this.game.hud.showToast(`Compraste ${item.name}`, 'toast-loot');
            this.refreshShop();
            this.game.hud.update();
          } else {
            this.game.hud.showToast('No tienes suficiente oro.', 'toast-danger');
          }
        });

        this.shopItemsList.appendChild(row);
      });
    } else {
      // Player inventory items to sell
      const inv = this.game.player.inventory;
      let hasSellable = false;

      for (let i = 0; i < inv.size; i++) {
        const slot = inv.slots[i];
        if (!slot) continue;
        const item = ITEMS_DATABASE[slot.id];
        if (!item) continue;

        hasSellable = true;
        const sellPrice = Math.max(1, Math.floor((item.attack || item.defense || 10) * 0.4));

        const row = document.createElement('div');
        row.className = 'recipe-card';
        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.5rem;">${item.icon}</span>
            <div>
              <div style="font-weight:700; color:#fff;">${item.name} (x${slot.count})</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.desc}</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:#ffd700; font-weight:700;">+${sellPrice} 🪙 c/u</span>
            <button class="action-btn" style="padding:4px 10px;">Vender 1</button>
          </div>
        `;

        const sellBtn = row.querySelector('button');
        sellBtn.addEventListener('click', () => {
          inv.removeItem(slot.id, 1);
          this.game.player.coins += sellPrice;
          this.game.soundManager.playCollect();
          this.game.hud.showToast(`Vendiste 1 ${item.name} por ${sellPrice} 🪙`, 'toast-loot');
          this.refreshShop();
          this.game.hud.update();
        });

        this.shopItemsList.appendChild(row);
      }

      if (!hasSellable) {
        this.shopItemsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px;">No tienes objetos para vender.</div>';
      }
    }
  }
}
