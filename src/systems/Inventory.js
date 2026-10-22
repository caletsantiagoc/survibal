/**
 * Database of all items in the game.
 */
export const ITEMS_DATABASE = {
  wood: { id: 'wood', name: 'Madera', icon: '🪵', type: 'resource', maxStack: 99, desc: 'Madera resistente talada de los árboles.' },
  stone: { id: 'stone', name: 'Piedra', icon: '🪨', type: 'resource', maxStack: 99, desc: 'Piedra sólida extraída de rocas y vetas.' },
  iron_ore: { id: 'iron_ore', name: 'Mineral de Hierro', icon: '🔩', type: 'resource', maxStack: 99, desc: 'Mineral metálico brillante para forjar armas y armaduras.' },
  gold_ore: { id: 'gold_ore', name: 'Mineral de Oro', icon: '✨', type: 'resource', maxStack: 99, desc: 'Valioso mineral para comercio y equipo especial.' },
  grass: { id: 'grass', name: 'Hierbas y Fibras', icon: '🌿', type: 'resource', maxStack: 99, desc: 'Hierbas silvestres medicinales y fibras vegetales.' },
  berry: { id: 'berry', name: 'Baya Silvestre', icon: '🍒', type: 'food', maxStack: 50, desc: 'Fruta silvestre fresca. Recupera hambre y un poco de sed.', hunger: 12, thirst: 6 },
  apple: { id: 'apple', name: 'Manzana', icon: '🍎', type: 'food', maxStack: 50, desc: 'Deliciosa manzana recogida de los manzanos.', hunger: 22, thirst: 10, health: 5 },
  raw_meat: { id: 'raw_meat', name: 'Carne Cruda', icon: '🥩', type: 'food', maxStack: 30, desc: 'Carne cruda de presa. Asarla en una fogata es mucho más nutritivo.', hunger: 15, health: -5 },
  cooked_meat: { id: 'cooked_meat', name: 'Carne Asada', icon: '🍖', type: 'food', maxStack: 30, desc: 'Carne jugosa y cocinada. Recupera gran cantidad de hambre y salud.', hunger: 45, health: 20 },
  water_bottle: { id: 'water_bottle', name: 'Agua Fresca', icon: '💧', type: 'drink', maxStack: 20, desc: 'Agua pura recolectada de lagos o del pozo de la aldea.', thirst: 50 },
  bandage: { id: 'bandage', name: 'Vendaje Medicinal', icon: '🩹', type: 'consumable', maxStack: 20, desc: 'Vendaje hecho de fibras curativas. Restaura 25 de salud.', health: 25 },
  potion_health: { id: 'potion_health', name: 'Poción de Salud', icon: '🧪', type: 'consumable', maxStack: 20, desc: 'Poción concentrada de hierbas que sana 50 de salud.', health: 50 },
  
  // Tools & Weapons
  stone_axe: { id: 'stone_axe', name: 'Hacha de Piedra', icon: '🪓', type: 'tool', maxStack: 1, equipSlot: 'weapon', attack: 7, toolType: 'axe', desc: 'Permite talar árboles rápidamente y causa buen daño.' },
  stone_pickaxe: { id: 'stone_pickaxe', name: 'Pico de Piedra', icon: '⛏️', type: 'tool', maxStack: 1, equipSlot: 'weapon', attack: 6, toolType: 'pickaxe', desc: 'Permite picar rocas y minerales de forma eficiente.' },
  wooden_sword: { id: 'wooden_sword', name: 'Espada de Madera', icon: '🗡️', type: 'weapon', maxStack: 1, equipSlot: 'weapon', attack: 9, desc: 'Espada básica para defenderse de animales salvajes.' },
  stone_sword: { id: 'stone_sword', name: 'Espada de Piedra', icon: '⚔️', type: 'weapon', maxStack: 1, equipSlot: 'weapon', attack: 15, desc: 'Espada afilada y resistente para combate.' },
  iron_sword: { id: 'iron_sword', name: 'Espada de Hierro', icon: '🗡️', type: 'weapon', maxStack: 1, equipSlot: 'weapon', attack: 24, desc: 'Arma de metal forjada por el herrero. Gran daño cortante.' },
  sylvan_blade: { id: 'sylvan_blade', name: 'Espada Silvana', icon: '✨', type: 'weapon', maxStack: 1, equipSlot: 'weapon', attack: 38, desc: 'Espada legendaria imbuida con la magia del bosque.' },
  
  // Armor & Gear
  leather_armor: { id: 'leather_armor', name: 'Armadura de Cuero', icon: '🥋', type: 'armor', maxStack: 1, equipSlot: 'armor', defense: 6, desc: 'Protección ligera que amortigua ataques enemigos.' },
  iron_armor: { id: 'iron_armor', name: 'Coraza de Hierro', icon: '🛡️', type: 'armor', maxStack: 1, equipSlot: 'armor', defense: 15, desc: 'Armadura pesada forjada para resistir a los monstruos más fieros.' },
  forest_crown: { id: 'forest_crown', name: 'Corona del Bosque', icon: '👑', type: 'accessory', maxStack: 1, equipSlot: 'accessory', defense: 6, attack: 5, desc: 'Símbolo del vencedor del Guardián del Bosque.' },
  torch: { id: 'torch', name: 'Antorcha', icon: '🏮', type: 'accessory', maxStack: 10, equipSlot: 'accessory', desc: 'Ilumina tus alrededores intensamente durante la noche.' },
  
  // Structures & Building
  campfire: { id: 'campfire', name: 'Fogata', icon: '🔥', type: 'buildable', maxStack: 10, buildType: 'campfire', desc: 'Estructura que ilumina, calienta y asa carnes crudas.' },
  workbench: { id: 'workbench', name: 'Banco de Trabajo', icon: '🪑', type: 'buildable', maxStack: 5, buildType: 'workbench', desc: 'Mesa de trabajo para proyectos avanzados.' },
  chest: { id: 'chest', name: 'Cofre de Almacén', icon: '📦', type: 'buildable', maxStack: 5, buildType: 'chest', desc: 'Cofre resistente con capacidad para guardar 16 objetos.' },
  wooden_wall: { id: 'wooden_wall', name: 'Muro de Madera', icon: '🧱', type: 'buildable', maxStack: 20, buildType: 'wall', desc: 'Bloquea el avance de bestias y zombis.' }
};

export class Inventory {
  constructor(size = 24) {
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
  }

  addItem(itemId, count = 1) {
    const itemData = ITEMS_DATABASE[itemId];
    if (!itemData) return 0;

    let remaining = count;

    // First try stacking into existing slots
    if (itemData.maxStack > 1) {
      for (let i = 0; i < this.size; i++) {
        const slot = this.slots[i];
        if (slot && slot.id === itemId && slot.count < itemData.maxStack) {
          const space = itemData.maxStack - slot.count;
          const toAdd = Math.min(space, remaining);
          slot.count += toAdd;
          remaining -= toAdd;
          if (remaining <= 0) return count;
        }
      }
    }

    // Place remaining into empty slots
    while (remaining > 0) {
      const emptyIdx = this.slots.findIndex(s => s === null);
      if (emptyIdx === -1) {
        // Inventory full
        break;
      }
      const toAdd = Math.min(remaining, itemData.maxStack);
      this.slots[emptyIdx] = {
        id: itemId,
        count: toAdd
      };
      remaining -= toAdd;
    }

    return count - remaining; // Number of items successfully added
  }

  removeItem(itemId, count = 1) {
    let remaining = count;
    for (let i = this.size - 1; i >= 0; i--) {
      const slot = this.slots[i];
      if (slot && slot.id === itemId) {
        if (slot.count > remaining) {
          slot.count -= remaining;
          remaining = 0;
          break;
        } else {
          remaining -= slot.count;
          this.slots[i] = null;
          if (remaining <= 0) break;
        }
      }
    }
    return remaining === 0;
  }

  hasItem(itemId, count = 1) {
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === itemId) {
        total += slot.count;
        if (total >= count) return true;
      }
    }
    return false;
  }

  getItemCount(itemId) {
    let total = 0;
    for (let i = 0; i < this.size; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  equipItem(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return null;

    const itemData = ITEMS_DATABASE[slot.id];
    if (!itemData || !itemData.equipSlot) return null;

    const targetSlot = itemData.equipSlot;
    const previousEquipped = this.equipment[targetSlot];

    this.equipment[targetSlot] = { id: slot.id, count: 1 };
    
    // Decrement or clear slot
    if (slot.count > 1) {
      slot.count -= 1;
    } else {
      this.slots[slotIndex] = null;
    }

    // Return previous to inventory if there was one
    if (previousEquipped) {
      this.addItem(previousEquipped.id, 1);
    }

    return itemData;
  }

  unequipItem(slotType) {
    const item = this.equipment[slotType];
    if (!item) return false;

    const added = this.addItem(item.id, 1);
    if (added > 0) {
      this.equipment[slotType] = null;
      return true;
    }
    return false; // inventory was full
  }

  // Export / Import for SaveSystem
  serialize() {
    return {
      slots: this.slots,
      equipment: this.equipment
    };
  }

  deserialize(data) {
    if (!data) return;
    this.slots = data.slots || new Array(this.size).fill(null);
    this.equipment = data.equipment || { weapon: null, armor: null, accessory: null };
  }
}
