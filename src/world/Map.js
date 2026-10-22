/**
 * Map system for a large 2D open world.
 * Tile size: 32x32 px.
 * Dimensions: 120x120 tiles = 3840x3840 px.
 */
export const TILE_SIZE = 32;
export const MAP_TILES_X = 120;
export const MAP_TILES_Y = 120;
export const WORLD_WIDTH = MAP_TILES_X * TILE_SIZE; // 3840 px
export const WORLD_HEIGHT = MAP_TILES_Y * TILE_SIZE; // 3840 px

export const TILE_TYPES = {
  GRASS: 0,
  GRASS_FLOWERS: 1,
  FOREST_GROUND: 2,
  DIRT_PATH: 3,
  COBBLESTONE: 4,
  SAND_SHORE: 5,
  WATER: 6,
  DEEP_WATER: 7,
  ROCK_GROUND: 8,
  CURSED_GROUND: 9,
  WOOD_FLOOR: 10
};

export class GameMap {
  constructor() {
    this.width = MAP_TILES_X;
    this.height = MAP_TILES_Y;
    this.tiles = new Uint8Array(this.width * this.height);
    this.colliders = []; // list of {x, y, width, height}
    this.decorations = []; // flowers, grass blades, small pebbles
    this.waterAnimationTick = 0;
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return TILE_TYPES.DEEP_WATER;
    }
    return this.tiles[ty * this.width + tx];
  }

  setTile(tx, ty, tileType) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.tiles[ty * this.width + tx] = tileType;
    }
  }

  isSolid(worldX, worldY, radius = 10) {
    // World boundary check
    if (worldX < 40 || worldX > WORLD_WIDTH - 40 || worldY < 40 || worldY > WORLD_HEIGHT - 40) {
      return true;
    }

    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    const tile = this.getTile(tx, ty);

    // Deep water is impassable
    if (tile === TILE_TYPES.DEEP_WATER) {
      return true;
    }

    // Check custom rect colliders (village buildings, cliffs)
    for (const box of this.colliders) {
      if (
        worldX + radius > box.x &&
        worldX - radius < box.x + box.width &&
        worldY + radius > box.y &&
        worldY - radius < box.y + box.height
      ) {
        return true;
      }
    }

    return false;
  }

  getBiomeAt(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);

    if (tx > 80 && ty > 70 && tx < 112 && ty < 105) return 'Aldea';
    if (ty < 35 && tx > 20 && tx < 100) return 'Zona Peligrosa (Boss)';
    if (tx > 85 && ty < 60) return 'Montañas';
    if (tx < 35 && ty > 65) return 'Lago Cristalino';
    if (tx < 60 && ty < 65) return 'Bosque Ancestral';
    return 'Pradera';
  }

  update(dt) {
    this.waterAnimationTick += dt * 3;
  }

  render(ctx, camera) {
    // Viewport Culling: Calculate visible tile bounds
    const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endTileX = Math.min(this.width, Math.ceil((camera.x + ctx.canvas.width) / TILE_SIZE) + 1);
    const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endTileY = Math.min(this.height, Math.ceil((camera.y + ctx.canvas.height) / TILE_SIZE) + 1);

    const waterWave = Math.sin(this.waterAnimationTick) * 2;

    ctx.save();

    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        const tile = this.getTile(tx, ty);
        const screenX = tx * TILE_SIZE - camera.x;
        const screenY = ty * TILE_SIZE - camera.y;

        switch (tile) {
          case TILE_TYPES.GRASS:
            ctx.fillStyle = '#4f8a3d';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;

          case TILE_TYPES.GRASS_FLOWERS:
            ctx.fillStyle = '#569443';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Flower dots
            ctx.fillStyle = '#ff6b8b';
            ctx.fillRect(screenX + 8, screenY + 8, 3, 3);
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(screenX + 22, screenY + 20, 3, 3);
            break;

          case TILE_TYPES.FOREST_GROUND:
            ctx.fillStyle = '#2f5e28';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Leaf texture
            ctx.fillStyle = '#254e20';
            ctx.fillRect(screenX + 6, screenY + 14, 5, 2);
            ctx.fillRect(screenX + 20, screenY + 8, 4, 2);
            break;

          case TILE_TYPES.DIRT_PATH:
            ctx.fillStyle = '#8b6f47';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#7a5f3a';
            ctx.fillRect(screenX + 4, screenY + 4, 3, 3);
            break;

          case TILE_TYPES.COBBLESTONE:
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 1, screenY + 1, 14, 14);
            ctx.strokeRect(screenX + 16, screenY + 16, 14, 14);
            break;

          case TILE_TYPES.SAND_SHORE:
            ctx.fillStyle = '#e0c080';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;

          case TILE_TYPES.WATER:
            ctx.fillStyle = '#0077b6';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Animated water glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(screenX + 6 + waterWave, screenY + 10, 8, 2);
            break;

          case TILE_TYPES.DEEP_WATER:
            ctx.fillStyle = '#03045e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(screenX + 12 - waterWave, screenY + 16, 10, 2);
            break;

          case TILE_TYPES.ROCK_GROUND:
            ctx.fillStyle = '#495057';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#343a40';
            ctx.fillRect(screenX + 8, screenY + 6, 6, 6);
            break;

          case TILE_TYPES.CURSED_GROUND:
            ctx.fillStyle = '#2b1b36';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Purple cursed veins
            ctx.fillStyle = '#59296e';
            ctx.fillRect(screenX + 4, screenY + 12, 10, 2);
            ctx.fillRect(screenX + 18, screenY + 6, 8, 2);
            break;

          case TILE_TYPES.WOOD_FLOOR:
            ctx.fillStyle = '#7a4e28';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#543315';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        }
      }
    }

    // Render world decorations (pebbles, wild flowers, etc.)
    for (const dec of this.decorations) {
      const screenX = dec.x - camera.x;
      const screenY = dec.y - camera.y;

      if (
        screenX < -20 || screenX > ctx.canvas.width + 20 ||
        screenY < -20 || screenY > ctx.canvas.height + 20
      ) {
        continue;
      }

      ctx.fillStyle = dec.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, dec.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
