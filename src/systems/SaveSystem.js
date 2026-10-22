export class SaveSystem {
  static SAVE_KEY = 'survival_rpg_2d_savegame_v1';

  static save(game) {
    try {
      const saveData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          x: game.player.x,
          y: game.player.y,
          health: game.player.health,
          maxHealth: game.player.maxHealth,
          hunger: game.player.hunger,
          thirst: game.player.thirst,
          stamina: game.player.stamina,
          level: game.player.level,
          xp: game.player.xp,
          xpToNextLevel: game.player.xpToNextLevel,
          attack: game.player.baseAttack,
          defense: game.player.baseDefense,
          coins: game.player.coins,
          inventory: game.player.inventory.serialize()
        },
        dayNight: {
          day: game.dayNight.day,
          time: game.dayNight.time
        },
        quests: game.questSystem.serialize(),
        buildings: game.buildingSystem.buildings.map(b => ({
          id: b.id,
          type: b.type,
          x: b.x,
          y: b.y,
          storage: b.storage || null
        }))
      };

      localStorage.setItem(SaveSystem.SAVE_KEY, JSON.stringify(saveData));
      return { success: true };
    } catch (err) {
      console.error('Error al guardar partida:', err);
      return { success: false, error: err.message };
    }
  }

  static hasSave() {
    return localStorage.getItem(SaveSystem.SAVE_KEY) !== null;
  }

  static load(game) {
    try {
      const raw = localStorage.getItem(SaveSystem.SAVE_KEY);
      if (!raw) return { success: false, reason: 'No hay partida guardada.' };

      const saveData = JSON.parse(raw);

      // Restore Player
      const p = game.player;
      p.x = saveData.player.x;
      p.y = saveData.player.y;
      p.health = saveData.player.health;
      p.maxHealth = saveData.player.maxHealth;
      p.hunger = saveData.player.hunger;
      p.thirst = saveData.player.thirst;
      p.stamina = saveData.player.stamina;
      p.level = saveData.player.level;
      p.xp = saveData.player.xp;
      p.xpToNextLevel = saveData.player.xpToNextLevel;
      p.baseAttack = saveData.player.attack;
      p.baseDefense = saveData.player.defense;
      p.coins = saveData.player.coins;
      p.inventory.deserialize(saveData.player.inventory);

      // Restore Day/Night
      if (saveData.dayNight) {
        game.dayNight.day = saveData.dayNight.day;
        game.dayNight.time = saveData.dayNight.time;
      }

      // Restore Quests
      if (saveData.quests) {
        game.questSystem.deserialize(saveData.quests);
      }

      // Restore Buildings
      if (saveData.buildings && Array.isArray(saveData.buildings)) {
        game.buildingSystem.buildings = [];
        for (const b of saveData.buildings) {
          const building = new (game.buildingSystem.constructor.Building || Object)(b.id, b.type, b.x, b.y);
          if (b.storage) building.storage = b.storage;
          game.buildingSystem.buildings.push(building);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error al cargar partida:', err);
      return { success: false, error: err.message };
    }
  }

  static clearSave() {
    localStorage.removeItem(SaveSystem.SAVE_KEY);
  }
}
