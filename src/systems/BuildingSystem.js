import { ITEMS_DATABASE } from './Inventory.js';

export class Building {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type; // 'campfire', 'chest', 'workbench', 'wall', 'bed'
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;

    if (type === 'chest') {
      this.storage = new Array(16).fill(null);
    }
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();

    switch (this.type) {
      case 'campfire':
        // Stone circle base
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Wooden logs
        ctx.strokeStyle = '#5a381e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(screenX - 12, screenY - 10);
        ctx.lineTo(screenX + 12, screenY + 10);
        ctx.moveTo(screenX + 12, screenY - 10);
        ctx.lineTo(screenX - 12, screenY + 10);
        ctx.stroke();

        // Animated fire flame
        const time = Date.now() * 0.008;
        const flameHeight = 16 + Math.sin(time) * 4;
        const grad = ctx.createRadialGradient(screenX, screenY, 3, screenX, screenY - 6, flameHeight);
        grad.addColorStop(0, '#ffff00');
        grad.addColorStop(0.5, '#ff5500');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY - 4, flameHeight * 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'chest':
        // Wooden chest with brass lock
        ctx.fillStyle = '#784b23';
        ctx.fillRect(screenX - 18, screenY - 14, 36, 28);
        ctx.strokeStyle = '#412711';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - 18, screenY - 14, 36, 28);

        // Chest lid band
        ctx.fillStyle = '#b08d57';
        ctx.fillRect(screenX - 18, screenY - 4, 36, 4);

        // Lock
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(screenX - 4, screenY - 3, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX - 1, screenY, 2, 4);
        break;

      case 'workbench':
        // Wooden table top
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(screenX - 20, screenY - 15, 40, 30);
        ctx.strokeStyle = '#4a2f13';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - 20, screenY - 15, 40, 30);

        // Tools on table (hammer & saw details)
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(screenX - 10, screenY - 8, 12, 4);
        ctx.fillStyle = '#5c3818';
        ctx.fillRect(screenX - 6, screenY - 4, 4, 8);
        break;

      case 'wall':
        // Wooden palisade wall
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(screenX - 18, screenY - 18, 36, 36);
        ctx.strokeStyle = '#382310';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - 18, screenY - 18, 36, 36);

        // Wooden planks lines
        ctx.beginPath();
        ctx.moveTo(screenX - 6, screenY - 18);
        ctx.lineTo(screenX - 6, screenY + 18);
        ctx.moveTo(screenX + 6, screenY - 18);
        ctx.lineTo(screenX + 6, screenY + 18);
        ctx.stroke();
        break;

      case 'bed':
        // Cozy cot
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(screenX - 18, screenY - 24, 36, 48);
        // Blanket
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(screenX - 16, screenY - 8, 32, 30);
        // Pillow
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(screenX - 14, screenY - 22, 28, 12);
        break;
    }

    ctx.restore();
  }
}

export class BuildingSystem {
  constructor(game) {
    this.game = game;
    this.buildings = [];
    this.placementMode = null; // item or recipe to place
    this.previewX = 0;
    this.previewY = 0;
  }

  startPlacement(itemOrType) {
    this.placementMode = itemOrType;
  }

  cancelPlacement() {
    this.placementMode = null;
  }

  canPlaceAt(x, y) {
    // Check collision with other buildings
    for (const b of this.buildings) {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < 38) return false;
    }
    // Check collision with player
    const pDist = Math.hypot(this.game.player.x - x, this.game.player.y - y);
    if (pDist < 40) return false;

    // Check with map solid obstacles / water
    if (this.game.map && this.game.map.isSolid(x, y)) {
      return false;
    }

    return true;
  }

  placeBuilding(x, y) {
    if (!this.placementMode) return false;

    if (!this.canPlaceAt(x, y)) {
      this.game.hud.showToast('¡No puedes construir aquí! Hay un obstáculo.', 'toast-danger');
      return false;
    }

    const type = typeof this.placementMode === 'string' 
      ? this.placementMode 
      : this.placementMode.buildType || this.placementMode.id;

    const building = new Building(Date.now() + Math.random(), type, x, y);
    this.buildings.push(building);

    // Consume item from player inventory if it came from item
    if (typeof this.placementMode === 'object' && this.placementMode.id) {
      this.game.player.inventory.removeItem(this.placementMode.id, 1);
    }

    this.game.soundManager.playCraft();
    this.game.particleSystem.emitChopWood(x, y);
    this.game.hud.showToast(`¡Estructura construida con éxito!`, 'toast-loot');

    // Quest hook for building campfire
    if (type === 'campfire' && this.game.questSystem) {
      this.game.questSystem.onBuild('campfire');
    }

    this.placementMode = null;
    return true;
  }

  getNearCampfire(x, y, radius = 90) {
    return this.buildings.some(b => b.type === 'campfire' && Math.hypot(b.x - x, b.y - y) <= radius);
  }

  getNearBuilding(x, y, radius = 55) {
    return this.buildings.find(b => Math.hypot(b.x - x, b.y - y) <= radius);
  }

  update(dt) {
    // Campfire particle emitters
    for (const b of this.buildings) {
      if (b.type === 'campfire') {
        this.game.particleSystem.emitEmbers(b.x, b.y);
      }
    }
  }

  render(ctx, camera) {
    // Render placed buildings
    for (const b of this.buildings) {
      b.render(ctx, camera);
    }

    // Render placement preview ghost
    if (this.placementMode) {
      const screenX = this.previewX - camera.x;
      const screenY = this.previewY - camera.y;
      const valid = this.canPlaceAt(this.previewX, this.previewY);

      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = valid ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
      ctx.strokeStyle = valid ? '#4caf50' : '#f44336';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(screenX, screenY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = ITEMS_DATABASE[this.placementMode.id]?.icon || '🔨';
      ctx.fillText(icon, screenX, screenY);
      ctx.restore();
    }
  }
}
