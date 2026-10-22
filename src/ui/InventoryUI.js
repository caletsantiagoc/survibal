import { ITEMS_DATABASE } from '../systems/Inventory.js';

export class InventoryUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('inventory-modal');
    this.gridEl = document.getElementById('inv-grid-slots');
    this.goldCountEl = document.getElementById('inv-gold-count');

    // Equip slots
    this.equipWeapon = document.getElementById('equip-weapon');
    this.equipArmor = document.getElementById('equip-armor');
    this.equipAccessory = document.getElementById('equip-accessory');

    // Item detail card
    this.detailIcon = document.getElementById('detail-icon');
    this.detailName = document.getElementById('detail-name');
    this.detailType = document.getElementById('detail-type');
    this.detailDesc = document.getElementById('detail-desc');
    this.detailStats = document.getElementById('detail-stats');
    this.detailActions = document.getElementById('detail-actions');

    this.btnUse = document.getElementById('btn-use-item');
    this.btnEquip = document.getElementById('btn-equip-item');
    this.btnDrop = document.getElementById('btn-drop-item');

    this.selectedSlotIndex = null;
    this.selectedEquipType = null;

    this.initEvents();
  }

  initEvents() {
    this.btnUse.addEventListener('click', () => this.handleUse());
    this.btnEquip.addEventListener('click', () => this.handleEquip());
    this.btnDrop.addEventListener('click', () => this.handleDrop());

    // Equipment slot click handlers to unequip
    [this.equipWeapon, this.equipArmor, this.equipAccessory].forEach(slotEl => {
      slotEl.addEventListener('click', () => {
        const type = slotEl.dataset.equipType;
        if (this.game.player.inventory.equipment[type]) {
          this.game.player.inventory.unequipItem(type);
          this.game.soundManager.playCollect();
          this.refresh();
        }
      });
    });
  }

  open() {
    this.modal.style.display = 'flex';
    this.selectedSlotIndex = null;
    this.selectedEquipType = null;
    this.refresh();
  }

  close() {
    this.modal.style.display = 'none';
  }

  isOpen() {
    return this.modal.style.display === 'flex';
  }

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  }

  refresh() {
    const inv = this.game.player.inventory;
    this.goldCountEl.textContent = this.game.player.coins;

    // Render 24 Inventory Grid Slots
    this.gridEl.innerHTML = '';
    for (let i = 0; i < inv.size; i++) {
      const slot = inv.slots[i];
      const slotEl = document.createElement('div');
      slotEl.className = `inv-slot ${this.selectedSlotIndex === i ? 'selected' : ''}`;
      slotEl.dataset.index = i;

      if (slot) {
        const item = ITEMS_DATABASE[slot.id];
        slotEl.innerHTML = `
          <span style="font-size:1.6rem; pointer-events:none;">${item ? item.icon : '❓'}</span>
          ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
        `;
      }

      slotEl.addEventListener('click', () => this.selectSlot(i));
      this.gridEl.appendChild(slotEl);
    }

    // Render Equipment Slots
    this.renderEquipSlot(this.equipWeapon, inv.equipment.weapon);
    this.renderEquipSlot(this.equipArmor, inv.equipment.armor);
    this.renderEquipSlot(this.equipAccessory, inv.equipment.accessory);

    // Update Detail Panel
    this.updateDetailPanel();
    this.game.hud.update();
  }

  renderEquipSlot(slotEl, itemRef) {
    if (itemRef) {
      const item = ITEMS_DATABASE[itemRef.id];
      slotEl.innerHTML = `<span style="font-size:1.6rem;">${item ? item.icon : '❓'}</span>`;
      slotEl.title = `Clic para desequipar ${item ? item.name : ''}`;
    } else {
      slotEl.innerHTML = '';
      slotEl.title = 'Vacío';
    }
  }

  selectSlot(index) {
    this.selectedSlotIndex = index;
    this.refresh();
  }

  updateDetailPanel() {
    const inv = this.game.player.inventory;
    if (this.selectedSlotIndex === null || !inv.slots[this.selectedSlotIndex]) {
      this.detailIcon.textContent = '🎒';
      this.detailName.textContent = 'Selecciona un objeto';
      this.detailType.textContent = '-';
      this.detailDesc.textContent = 'Haz clic en cualquier casilla de la mochila para ver su información y opciones.';
      this.detailStats.innerHTML = '';
      this.detailActions.style.display = 'none';
      return;
    }

    const slot = inv.slots[this.selectedSlotIndex];
    const item = ITEMS_DATABASE[slot.id];
    if (!item) return;

    this.detailIcon.textContent = item.icon;
    this.detailName.textContent = `${item.name} (${slot.count})`;
    this.detailType.textContent = item.type;
    this.detailDesc.textContent = item.desc;

    let statsHtml = '';
    if (item.attack) statsHtml += `<div>⚔️ Ataque: +${item.attack}</div>`;
    if (item.defense) statsHtml += `<div>🛡️ Defensa: +${item.defense}</div>`;
    if (item.health) statsHtml += `<div>❤️ Salud: +${item.health}</div>`;
    if (item.hunger) statsHtml += `<div>🍖 Hambre: +${item.hunger}%</div>`;
    if (item.thirst) statsHtml += `<div>💧 Sed: +${item.thirst}%</div>`;
    this.detailStats.innerHTML = statsHtml;

    this.detailActions.style.display = 'flex';

    // Toggle button visibility based on item type
    if (item.type === 'food' || item.type === 'drink' || item.type === 'consumable' || item.type === 'buildable') {
      this.btnUse.style.display = 'block';
      this.btnUse.textContent = item.type === 'buildable' ? 'Construir' : 'Consumir';
    } else {
      this.btnUse.style.display = 'none';
    }

    if (item.equipSlot) {
      this.btnEquip.style.display = 'block';
    } else {
      this.btnEquip.style.display = 'none';
    }
  }

  handleUse() {
    if (this.selectedSlotIndex === null) return;
    this.game.hud.useHotbarSlot(this.selectedSlotIndex);
    this.refresh();
  }

  handleEquip() {
    if (this.selectedSlotIndex === null) return;
    const inv = this.game.player.inventory;
    const item = inv.equipItem(this.selectedSlotIndex);
    if (item) {
      this.game.soundManager.playCraft();
      this.game.hud.showToast(`Equipado: ${item.name}`, 'toast-loot');
    }
    this.refresh();
  }

  handleDrop() {
    if (this.selectedSlotIndex === null) return;
    const inv = this.game.player.inventory;
    const slot = inv.slots[this.selectedSlotIndex];
    if (!slot) return;

    const p = this.game.player;
    this.game.spawnDroppedItem(slot.id, 1, p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30);
    inv.removeItem(slot.id, 1);
    this.game.soundManager.playCollect();
    this.refresh();
  }
}
