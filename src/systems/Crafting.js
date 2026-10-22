import { ITEMS_DATABASE } from './Inventory.js';

export const RECIPES = [
  // Herramientas
  {
    id: 'craft_stone_axe',
    result: 'stone_axe',
    count: 1,
    category: 'tools',
    name: 'Hacha de Piedra',
    ingredients: { wood: 3, stone: 2 },
    desc: 'Corta árboles con mayor velocidad y sirve de arma.'
  },
  {
    id: 'craft_stone_pickaxe',
    result: 'stone_pickaxe',
    count: 1,
    category: 'tools',
    name: 'Pico de Piedra',
    ingredients: { wood: 4, stone: 3 },
    desc: 'Mina rocas y extrae minerales con gran rendimiento.'
  },

  // Armas
  {
    id: 'craft_wooden_sword',
    result: 'wooden_sword',
    count: 1,
    category: 'weapons',
    name: 'Espada de Madera',
    ingredients: { wood: 5 },
    desc: 'Espada básica de entrenamiento para cazar presas.'
  },
  {
    id: 'craft_stone_sword',
    result: 'stone_sword',
    count: 1,
    category: 'weapons',
    name: 'Espada de Piedra',
    ingredients: { wood: 5, stone: 8, iron_ore: 2 },
    desc: 'Arma más pesada con filo de piedra cortante.'
  },
  {
    id: 'craft_iron_sword',
    result: 'iron_sword',
    count: 1,
    category: 'weapons',
    name: 'Espada de Hierro',
    ingredients: { wood: 6, iron_ore: 8 },
    desc: 'Hoja de metal duradera capaz de partir bestias.'
  },

  // Supervivencia
  {
    id: 'craft_campfire',
    result: 'campfire',
    count: 1,
    category: 'survival',
    name: 'Fogata',
    ingredients: { wood: 5, stone: 3 },
    desc: 'Da luz nocturna, calor y permite asar carne cruda.'
  },
  {
    id: 'craft_torch',
    result: 'torch',
    count: 1,
    category: 'survival',
    name: 'Antorcha',
    ingredients: { wood: 2, grass: 2 },
    desc: 'Equípala para iluminar tus pasos en la oscuridad.'
  },
  {
    id: 'craft_water_bottle',
    result: 'water_bottle',
    count: 1,
    category: 'survival',
    name: 'Frasco de Agua',
    ingredients: { stone: 2, grass: 2 },
    desc: 'Contenedor rústico para beber agua y calmar la sed.'
  },

  // Construcción
  {
    id: 'craft_workbench',
    result: 'workbench',
    count: 1,
    category: 'building',
    name: 'Banco de Trabajo',
    ingredients: { wood: 10 },
    desc: 'Permite organizar herramientas de construcción.'
  },
  {
    id: 'craft_chest',
    result: 'chest',
    count: 1,
    category: 'building',
    name: 'Cofre de Almacén',
    ingredients: { wood: 8 },
    desc: 'Almacena recursos de forma segura.'
  },
  {
    id: 'craft_wooden_wall',
    result: 'wooden_wall',
    count: 1,
    category: 'building',
    name: 'Muro de Madera',
    ingredients: { wood: 4 },
    desc: 'Pared sólida para levantar refugios protectores.'
  },

  // Cocina & Medicina
  {
    id: 'craft_bandage',
    result: 'bandage',
    count: 1,
    category: 'food',
    name: 'Vendaje Medicinal',
    ingredients: { grass: 3 },
    desc: 'Cura 25 puntos de vida de forma rápida.'
  },
  {
    id: 'craft_potion_health',
    result: 'potion_health',
    count: 1,
    category: 'food',
    name: 'Poción de Salud',
    ingredients: { grass: 2, berry: 2, water_bottle: 1 },
    desc: 'Elixir revitalizante que restaura 50 de vida.'
  },
  {
    id: 'craft_cooked_meat',
    result: 'cooked_meat',
    count: 1,
    category: 'food',
    name: 'Carne Asada',
    ingredients: { raw_meat: 1 },
    requiresCampfire: true,
    desc: 'Requiere estar cerca de una Fogata. Restaura 45 hambre y 20 vida.'
  }
];

export class CraftingSystem {
  constructor(inventory, soundManager) {
    this.inventory = inventory;
    this.soundManager = soundManager;
  }

  canCraft(recipe, isNearCampfire = false) {
    if (recipe.requiresCampfire && !isNearCampfire) {
      return { can: false, reason: 'Necesitas una fogata cerca para cocinar.' };
    }

    for (const [resId, reqCount] of Object.entries(recipe.ingredients)) {
      if (this.inventory.getItemCount(resId) < reqCount) {
        return { can: false, reason: 'No tienes los recursos suficientes.' };
      }
    }

    return { can: true };
  }

  craft(recipe, isNearCampfire = false) {
    const check = this.canCraft(recipe, isNearCampfire);
    if (!check.can) return check;

    // Consume materials
    for (const [resId, reqCount] of Object.entries(recipe.ingredients)) {
      this.inventory.removeItem(resId, reqCount);
    }

    // Add crafted result
    this.inventory.addItem(recipe.result, recipe.count);

    if (this.soundManager) {
      this.soundManager.playCraft();
    }

    const item = ITEMS_DATABASE[recipe.result];
    return { can: true, item, count: recipe.count };
  }
}
