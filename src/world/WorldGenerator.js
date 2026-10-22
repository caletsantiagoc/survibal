import { GameMap, TILE_TYPES, TILE_SIZE, MAP_TILES_X, MAP_TILES_Y } from './Map.js';
import { ResourceNode } from './Resources.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { NPC } from '../entities/NPC.js';

export class WorldGenerator {
  static generate(game) {
    const map = new GameMap();
    const resources = [];
    const enemies = [];
    const npcs = [];
    let boss = null;

    // 1. Fill base terrain with Grass & Flowers
    for (let ty = 0; ty < MAP_TILES_Y; ty++) {
      for (let tx = 0; tx < MAP_TILES_X; tx++) {
        const rand = Math.random();
        if (rand < 0.12) {
          map.setTile(tx, ty, TILE_TYPES.GRASS_FLOWERS);
        } else {
          map.setTile(tx, ty, TILE_TYPES.GRASS);
        }
      }
    }

    // 2. Lake & River in South-West (tx: 10..42, ty: 72..108)
    for (let ty = 72; ty < 108; ty++) {
      for (let tx = 10; tx < 42; tx++) {
        const dx = (tx - 26) / 14;
        const dy = (ty - 90) / 16;
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.7) {
          map.setTile(tx, ty, TILE_TYPES.DEEP_WATER);
        } else if (distSq < 1.0) {
          map.setTile(tx, ty, TILE_TYPES.WATER);
        } else if (distSq < 1.25) {
          map.setTile(tx, ty, TILE_TYPES.SAND_SHORE);
        }
      }
    }

    // 3. Dense Forest in North-West (tx: 5..55, ty: 15..65)
    for (let ty = 15; ty < 65; ty++) {
      for (let tx = 5; tx < 55; tx++) {
        if (Math.random() < 0.85) {
          map.setTile(tx, ty, TILE_TYPES.FOREST_GROUND);
        }
      }
    }

    // 4. Rocky Mountains in North-East (tx: 80..115, ty: 8..55)
    for (let ty = 8; ty < 55; ty++) {
      for (let tx = 80; tx < 115; tx++) {
        if (Math.random() < 0.75) {
          map.setTile(tx, ty, TILE_TYPES.ROCK_GROUND);
        }
      }
    }

    // 5. Cursed Wastes / Dangerous Zone in North-Center (tx: 30..80, ty: 5..35)
    for (let ty = 5; ty < 35; ty++) {
      for (let tx = 30; tx < 80; tx++) {
        const dx = (tx - 55) / 22;
        const dy = (ty - 20) / 14;
        if (dx * dx + dy * dy < 1.0) {
          map.setTile(tx, ty, TILE_TYPES.CURSED_GROUND);
        }
      }
    }

    // 6. Village (Aldea Esperanza) in South-East (tx: 82..112, ty: 75..108)
    // Village plaza cobblestone
    for (let ty = 82; ty < 102; ty++) {
      for (let tx = 88; tx < 108; tx++) {
        map.setTile(tx, ty, TILE_TYPES.COBBLESTONE);
      }
    }

    // Village dirt pathway leading to the west meadow
    for (let tx = 55; tx < 88; tx++) {
      map.setTile(tx, 91, TILE_TYPES.DIRT_PATH);
      map.setTile(tx, 92, TILE_TYPES.DIRT_PATH);
    }
    // Path north to mountains
    for (let ty = 55; ty < 82; ty++) {
      map.setTile(95, ty, TILE_TYPES.DIRT_PATH);
      map.setTile(96, ty, TILE_TYPES.DIRT_PATH);
    }

    // Add village houses (colliders & floor)
    const houseConfigs = [
      { x: 89, y: 83, w: 6, h: 5, label: 'Elder' },
      { x: 101, y: 83, w: 6, h: 5, label: 'Merchant' },
      { x: 89, y: 95, w: 6, h: 5, label: 'Forge' },
      { x: 101, y: 95, w: 6, h: 5, label: 'Clinic' }
    ];

    for (const h of houseConfigs) {
      for (let hy = h.y; hy < h.y + h.h; hy++) {
        for (let hx = h.x; hx < h.x + h.w; hx++) {
          map.setTile(hx, hy, TILE_TYPES.WOOD_FLOOR);
        }
      }
      // Add solid box collider for building walls
      map.colliders.push({
        x: h.x * TILE_SIZE,
        y: h.y * TILE_SIZE,
        width: h.w * TILE_SIZE,
        height: (h.h - 1) * TILE_SIZE
      });
    }

    // Place Village Well in center of plaza (Water source)
    resources.push(new ResourceNode('village_well', 'water_source', 98 * TILE_SIZE, 92 * TILE_SIZE));

    // Place NPCs in Village
    npcs.push(
      new NPC('eldrin', 'Anciano Eldrin', 'Sabio de la Aldea', 95 * TILE_SIZE, 89 * TILE_SIZE, {
        portrait: '🧙‍♂️',
        color: '#4361ee',
        dialogue: 'Bienvenido, joven sobreviviente. Este mundo es despiadado con quienes no se preparan. Reúne recursos, fabrica buenas armas y no te aventures al norte de noche a menos que estés listo para desafiar al Guardián.'
      }),
      new NPC('boran', 'Boran', 'Comerciante', 104 * TILE_SIZE, 89 * TILE_SIZE, {
        portrait: '🧔',
        color: '#f77f00',
        dialogue: '¡Mercancías de primera! Tengo raciones frescas, manzanas jugosas, agua pura y compro toda la madera y mineral que traigas.'
      }),
      new NPC('thorgar', 'Thorgar', 'Herrero', 92 * TILE_SIZE, 98 * TILE_SIZE, {
        portrait: '🔨',
        color: '#b08d57',
        dialogue: 'El acero nunca miente. Si quieres atravesar las garras de las bestias salvajes, necesitarás armas de metal templado y una buena armadura.'
      }),
      new NPC('lyra', 'Lyra', 'Curandera', 104 * TILE_SIZE, 98 * TILE_SIZE, {
        portrait: '👩‍⚕️',
        color: '#2a9d8f',
        canHeal: true,
        dialogue: '¿Herido por el viaje? Descansa aquí. Por 15 monedas puedo curar todas tus heridas con mis ungüentos medicinales.'
      })
    );

    // 7. Populate Nature Resources
    // Trees in Forest and Meadow
    for (let i = 0; i < 110; i++) {
      let x, y;
      if (i < 80) {
        // Deep forest
        x = (8 + Math.random() * 45) * TILE_SIZE;
        y = (18 + Math.random() * 45) * TILE_SIZE;
      } else {
        // Meadow scattered
        x = (40 + Math.random() * 40) * TILE_SIZE;
        y = (50 + Math.random() * 35) * TILE_SIZE;
      }
      resources.push(new ResourceNode(`tree_${i}`, 'tree', x, y));
    }

    // Berry bushes & Herbs
    for (let i = 0; i < 40; i++) {
      const x = (10 + Math.random() * 60) * TILE_SIZE;
      const y = (20 + Math.random() * 60) * TILE_SIZE;
      resources.push(new ResourceNode(`bush_${i}`, 'bush', x, y));
    }
    for (let i = 0; i < 30; i++) {
      const x = (25 + Math.random() * 55) * TILE_SIZE;
      const y = (35 + Math.random() * 50) * TILE_SIZE;
      resources.push(new ResourceNode(`herb_${i}`, 'herb', x, y));
    }

    // Rocks & Ores in Mountain and scattered
    for (let i = 0; i < 60; i++) {
      const x = (82 + Math.random() * 30) * TILE_SIZE;
      const y = (12 + Math.random() * 40) * TILE_SIZE;
      const type = Math.random() < 0.4 ? 'iron_vein' : Math.random() < 0.18 ? 'gold_vein' : 'rock';
      resources.push(new ResourceNode(`rock_${i}`, type, x, y));
    }
    for (let i = 0; i < 20; i++) {
      const x = (45 + Math.random() * 35) * TILE_SIZE;
      const y = (55 + Math.random() * 30) * TILE_SIZE;
      resources.push(new ResourceNode(`rock_scatter_${i}`, 'rock', x, y));
    }

    // 8. Populate Enemies
    // Wolves in forest
    for (let i = 0; i < 10; i++) {
      const x = (15 + Math.random() * 35) * TILE_SIZE;
      const y = (25 + Math.random() * 35) * TILE_SIZE;
      enemies.push(new Enemy(`wolf_${i}`, 'wolf', x, y));
    }
    // Forest Monsters in deep forest
    for (let i = 0; i < 5; i++) {
      const x = (12 + Math.random() * 30) * TILE_SIZE;
      const y = (18 + Math.random() * 25) * TILE_SIZE;
      enemies.push(new Enemy(`forest_m_${i}`, 'forest_monster', x, y));
    }
    // Zombies in Cursed zone
    for (let i = 0; i < 9; i++) {
      const x = (36 + Math.random() * 40) * TILE_SIZE;
      const y = (8 + Math.random() * 22) * TILE_SIZE;
      enemies.push(new Enemy(`zombie_${i}`, 'zombie', x, y));
    }
    // Bandits along plains and mountain borders
    for (let i = 0; i < 7; i++) {
      const x = (65 + Math.random() * 25) * TILE_SIZE;
      const y = (40 + Math.random() * 25) * TILE_SIZE;
      enemies.push(new Enemy(`bandit_${i}`, 'bandit', x, y));
    }

    // 9. Boss in the Center of Cursed Wastes
    boss = new Boss('guardian_boss', 55 * TILE_SIZE, 18 * TILE_SIZE);

    return { map, resources, enemies, npcs, boss };
  }
}

