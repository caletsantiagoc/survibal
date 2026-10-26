import { Player } from './entities/Player.js';
import { DroppedItem } from './world/Resources.js';
import { WorldGenerator } from './world/WorldGenerator.js';
import { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from './world/Map.js';

import { SoundManager } from './audio/SoundManager.js';
import { SurvivalSystem } from './systems/Survival.js';
import { CombatSystem } from './systems/Combat.js';
import { CraftingSystem } from './systems/Crafting.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { DayNightSystem } from './systems/DayNight.js';
import { BuildingSystem } from './systems/BuildingSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';

import { HUD } from './ui/HUD.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { CraftingUI } from './ui/CraftingUI.js';
import { QuestUI } from './ui/QuestUI.js';
import { DialogueUI } from './ui/DialogueUI.js';
import { MapUI } from './ui/MapUI.js';
import { MenuManager } from './ui/Menu.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = 'MENU';
    this.lastTime = 0;
    this.autoSaveTimer = 0;

    // Camera
    this.camera = { x: 0, y: 0 };

    // Input state
    this.keysDown = new Set();
    this.keysJustPressed = new Set();
    this.mouseDown = false;
    this.mouseJustPressed = false;
    this.mousePos = { x: 0, y: 0 };

    // Dropped loot in world
    this.droppedItems = [];

    // Audio
    this.soundManager = new SoundManager();

    // Systems initialization
    this.particleSystem = new ParticleSystem();
    this.dayNight = new DayNightSystem();
    this.buildingSystem = new BuildingSystem(this);

    // Initial World & Player setup
    this.initWorld();

    // Systems dependent on Player
    this.survivalSystem = new SurvivalSystem(this.player);
    this.craftingSystem = new CraftingSystem(this.player.inventory, this.soundManager);
    this.combatSystem = new CombatSystem(this);
    this.questSystem = new QuestSystem(this);

    // UI Managers
    this.hud = new HUD(this);
    this.inventoryUI = new InventoryUI(this);
    this.craftingUI = new CraftingUI(this);
    this.questUI = new QuestUI(this);
    this.dialogueUI = new DialogueUI(this);
    this.mapUI = new MapUI(this);
    this.menuManager = new MenuManager(this);

    this.initInputListeners();
    this.bindHUDButtons();
  }

  initWorld() {
    // Generate map, resources, enemies, and village
    const generated = WorldGenerator.generate(this);
    this.map = generated.map;
    this.resources = generated.resources;
    this.enemies = generated.enemies;
    this.npcs = generated.npcs;
    this.boss = generated.boss;

    // Spawn player in peaceful meadow near the village path
    const spawnX = 52 * TILE_SIZE;
    const spawnY = 91 * TILE_SIZE;

    if (!this.player) {
      this.player = new Player(spawnX, spawnY);
    } else {
      this.player.respawn(spawnX, spawnY);
    }
  }

  initInputListeners() {
    window.addEventListener('keydown', e => {
      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysDown.add(e.code);

      this.handleGlobalKeys(e);
    });

    window.addEventListener('keyup', e => {
      this.keysDown.delete(e.code);
    });

    this.canvas.addEventListener('mousedown', e => {
      this.mouseDown = true;
      this.mouseJustPressed = true;

      this.soundManager.init();

      if (this.buildingSystem.placementMode) {
        const rect = this.canvas.getBoundingClientRect();
        const worldX = this.camera.x + e.clientX - rect.left;
        const worldY = this.camera.y + e.clientY - rect.top;
        this.buildingSystem.placeBuilding(worldX, worldY);
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });

    window.addEventListener('mousemove', e => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;

      if (this.buildingSystem.placementMode) {
        const rect = this.canvas.getBoundingClientRect();
        this.buildingSystem.previewX = this.camera.x + e.clientX - rect.left;
        this.buildingSystem.previewY = this.camera.y + e.clientY - rect.top;
      }
    });
  }

  handleGlobalKeys(e) {
    if (this.state === 'MENU' || this.state === 'GAMEOVER') return;

    if (e.code === 'Escape') {
      if (this.closeAnyOpenModal()) {
        return;
      }
      this.menuManager.togglePause();
      return;
    }

    if (this.state === 'PAUSED') return;

    if (e.code === 'KeyI') {
      this.inventoryUI.toggle();
    } else if (e.code === 'KeyC') {
      this.craftingUI.toggle();
    } else if (e.code === 'KeyQ') {
      this.questUI.toggle();
    } else if (e.code === 'KeyM') {
      this.mapUI.toggle();
    } else if (e.code === 'KeyE') {
      this.handleInteraction();
    }

    // Hotbar shortcuts 1 to 6
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
      const idx = parseInt(e.code.replace('Digit', '')) - 1;
      this.hud.selectHotbarSlot(idx);
      this.hud.useHotbarSlot(idx);
    }
  }

  closeAnyOpenModal() {
    let closed = false;

    if (this.inventoryUI.isOpen()) {
      this.inventoryUI.close();
      closed = true;
    }

    if (this.craftingUI.isOpen()) {
      this.craftingUI.close();
      closed = true;
    }

    if (this.questUI.isOpen()) {
      this.questUI.close();
      closed = true;
    }

    if (this.mapUI.isOpen()) {
      this.mapUI.close();
      closed = true;
    }

    if (this.dialogueUI.modal.style.display === 'flex') {
      this.dialogueUI.close();
      closed = true;
    }

    if (this.dialogueUI.shopModal.style.display === 'flex') {
      this.dialogueUI.closeShop();
      closed = true;
    }

    if (this.buildingSystem.placementMode) {
      this.buildingSystem.cancelPlacement();
      closed = true;
    }

    return closed;
  }

  bindHUDButtons() {
    document.getElementById('btn-inventory').addEventListener('click', () => this.inventoryUI.toggle());
    document.getElementById('btn-crafting').addEventListener('click', () => this.craftingUI.toggle());
    document.getElementById('btn-quests').addEventListener('click', () => this.questUI.toggle());
    document.getElementById('btn-map').addEventListener('click', () => this.mapUI.toggle());
    document.getElementById('btn-open-map').addEventListener('click', () => this.mapUI.toggle());
    document.getElementById('btn-open-quest-log').addEventListener('click', () => this.questUI.toggle());
    document.getElementById('btn-pause-quick').addEventListener('click', () => this.menuManager.togglePause());

    const btnMute = document.getElementById('btn-mute-sound');

    btnMute.addEventListener('click', () => {
      const isMuted = this.soundManager.toggleMute();
      btnMute.textContent = isMuted ? '🔇' : '🔊';
      btnMute.title = isMuted ? 'Sonido Silenciado' : 'Sonido Activado';
    });
  }

  startNewGame() {
    SaveSystem.clearSave();
    this.initWorld();
    this.state = 'PLAYING';
    this.soundManager.init();
    this.soundManager.startAmbientMusic();
    this.hud.showToast('¡Bienvenido a Survival RPG! Recolecta madera con [E] o [Espacio].', 'toast-loot');
  }

  loadSavedGame() {
    this.initWorld();
    const res = SaveSystem.load(this);

    if (res.success) {
      this.state = 'PLAYING';
      this.soundManager.init();
      this.soundManager.startAmbientMusic();
      this.hud.showToast('¡Partida cargada con éxito! Continúa tu aventura.', 'toast-loot');
    } else {
      this.startNewGame();
    }
  }

  onPlayerDeath(source) {
    this.soundManager.playTone(80, 'sawtooth', 0.8, 0.4, 20);
    this.menuManager.showGameOver(source);
  }

  spawnDroppedItem(itemId, count, x, y) {
    this.droppedItems.push(new DroppedItem(Date.now() + Math.random(), itemId, count, x, y));
  }

  handleInteraction() {
    const p = this.player;

    // 1. Check NPC interaction
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.x - p.x, npc.y - p.y);

      if (dist <= 55) {
        npc.interact(this);
        return;
      }
    }

    // 2. Check Natural Resources interaction
    for (const res of this.resources) {
      if (res.depleted) continue;

      const dist = Math.hypot(res.x - p.x, res.y - p.y);

      if (dist <= 55) {
        if (res.type === 'water_source') {
          p.drink(50);
          p.inventory.addItem('water_bottle', 1);
          this.soundManager.playDrink();
          this.hud.showToast('Bebiste agua fresca y llenaste un frasco.', 'toast-loot');
          return;
        } else {
          const drops = res.harvest(1);

          if (res.type === 'tree') {
            this.soundManager.playChop();
            this.particleSystem.emitChopWood(res.x, res.y);
          } else if (res.type === 'rock' || res.type.includes('vein')) {
            this.soundManager.playMine();
            this.particleSystem.emitMineStone(res.x, res.y);
          } else {
            this.soundManager.playCollect();
          }

          for (const d of drops) {
            this.spawnDroppedItem(d.id, d.count, res.x, res.y);
            this.questSystem.onGather(d.id, d.count);
          }

          return;
        }
      }
    }

    // 3. Check Placed Buildings interaction
    const nearBuilding = this.buildingSystem.getNearBuilding(p.x, p.y);

    if (nearBuilding) {
      if (nearBuilding.type === 'campfire') {
        if (p.inventory.hasItem('raw_meat', 1)) {
          p.inventory.removeItem('raw_meat', 1);
          p.inventory.addItem('cooked_meat', 1);
          this.soundManager.playEat();
          this.hud.showToast('¡Asaste 1 Carne Cruda en la fogata!', 'toast-loot');
        } else {
          this.hud.showToast('La fogata te abriga e ilumina la noche.', 'toast-loot');
        }

        return;
      } else if (nearBuilding.type === 'bed') {
        this.dayNight.sleep();
        p.stamina = p.maxStamina;
        this.soundManager.playQuestComplete();
        this.hud.showToast('Dormiste hasta el amanecer (06:00 AM). Energía restaurada.', 'toast-loot');
        return;
      }
    }
  }

  checkInteractionPrompt() {
    const p = this.player;

    if (p.isDead || this.state !== 'PLAYING') {
      this.hud.hidePrompt();
      return;
    }

    // Check NPCs
    for (const npc of this.npcs) {
      if (Math.hypot(npc.x - p.x, npc.y - p.y) <= 55) {
        this.hud.showPrompt(`Hablar con ${npc.name}`);
        return;
      }
    }

    // Check Resources
    for (const res of this.resources) {
      if (!res.depleted && Math.hypot(res.x - p.x, res.y - p.y) <= 52) {
        if (res.type === 'tree') this.hud.showPrompt('Talar Árbol (Madera)');
        else if (res.type === 'rock') this.hud.showPrompt('Picar Roca (Piedra)');
        else if (res.type === 'iron_vein') this.hud.showPrompt('Extraer Mineral de Hierro');
        else if (res.type === 'gold_vein') this.hud.showPrompt('Extraer Mineral de Oro');
        else if (res.type === 'bush') this.hud.showPrompt('Recolectar Bayas');
        else if (res.type === 'herb') this.hud.showPrompt('Recolectar Hierbas');
        else if (res.type === 'water_source') this.hud.showPrompt('Beber / Recolectar Agua');

        return;
      }
    }

    // Check Buildings
    const b = this.buildingSystem.getNearBuilding(p.x, p.y);

    if (b) {
      if (b.type === 'campfire') this.hud.showPrompt('Asar Carne en la Fogata');
      else if (b.type === 'bed') this.hud.showPrompt('Dormir y pasar la noche');

      return;
    }

    this.hud.hidePrompt();
  }

  // --- Input helper methods for Player ---
  isDown(code) {
    return this.keysDown.has(code);
  }

  isJustPressed(code) {
    return this.keysJustPressed.has(code);
  }

  isMouseDown() {
    return this.mouseDown;
  }

  isMouseJustPressed() {
    return this.mouseJustPressed;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Update Survival & Day/Night
    this.survivalSystem.update(dt);
    this.dayNight.update(dt);
    this.map.update(dt);
    this.buildingSystem.update(dt);
    this.particleSystem.update(dt);

    // Update Player
    this.player.update(dt, this, this.map, this);

    // Update Resources
    for (const res of this.resources) {
      res.update(dt);
    }

    // Update Enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player, this.map, this);
    }

    // Update Boss
    if (this.boss) {
      this.boss.update(dt, this.player, this.map, this);
    }

    // Update Dropped Items
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.update(dt);

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);

      if (dist < 32) {
        const added = this.player.inventory.addItem(item.itemId, item.count);

        if (added > 0) {
          this.soundManager.playCollect();
          this.particleSystem.addFloatingText(item.x, item.y - 12, `+${item.count}`, '#52b788', 14);
          this.droppedItems.splice(i, 1);
          this.hud.update();
        }
      } else if (item.despawnTimer <= 0) {
        this.droppedItems.splice(i, 1);
      }
    }

    // Nighttime enemy spawner
    if (this.dayNight.isNight() && this.enemies.filter(e => !e.isDead).length < 22 && Math.random() < 0.005) {
      const spawnDist = 320 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      const sx = this.player.x + Math.cos(angle) * spawnDist;
      const sy = this.player.y + Math.sin(angle) * spawnDist;

      if (!this.map.isSolid(sx, sy)) {
        const type = Math.random() < 0.6 ? 'zombie' : 'wolf';
        this.enemies.push(new (this.enemies[0]?.constructor || Object)(Date.now(), type, sx, sy));
      }
    }

    // Camera follow player smoothly
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;

    this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - this.canvas.width, targetCamX));
    this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height, targetCamY));

    // Interaction Prompt check
    this.checkInteractionPrompt();

    // Auto-save every 120s
    this.autoSaveTimer += dt;

    if (this.autoSaveTimer >= 120) {
      this.autoSaveTimer = 0;
      SaveSystem.save(this);
    }

    // Refresh HUD
    this.hud.update();

    // Reset single-frame inputs
    this.keysJustPressed.clear();
    this.mouseJustPressed = false;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'MENU') {
      this.renderMenuBackground();
      return;
    }

    // 1. Render World Map Tiles
    this.map.render(this.ctx, this.camera);

    // 2. Render Resources
    for (const res of this.resources) {
      res.render(this.ctx, this.camera);
    }

    // 3. Render Placed Buildings
    this.buildingSystem.render(this.ctx, this.camera);

    // 4. Render Dropped Loot
    for (const drop of this.droppedItems) {
      drop.render(this.ctx, this.camera);
    }

    // 5. Render NPCs
    for (const npc of this.npcs) {
      npc.render(this.ctx, this.camera);
    }

    // 6. Render Enemies
    for (const enemy of this.enemies) {
      enemy.render(this.ctx, this.camera);
    }

    // 7. Render Boss
    if (this.boss) {
      this.boss.render(this.ctx, this.camera);
    }

    // 8. Render Player
    this.player.render(this.ctx, this.camera);

    // 9. Render Combat & Ambient Particles
    this.particleSystem.render(this.ctx, this.camera);

    // 10. Render Day/Night Lighting Overlay
    const lights = [
      {
        x: this.player.x,
        y: this.player.y,
        radius: this.player.inventory.equipment.accessory?.id === 'torch' ? 240 : 120,
        type: 'player'
      }
    ];

    // Campfire lights with warm glow
    for (const b of this.buildingSystem.buildings) {
      if (b.type === 'campfire') {
        lights.push({
          x: b.x,
          y: b.y,
          radius: 220,
          type: 'campfire'
        });
      }
    }

    // Village street lamp lights
    lights.push(
      { x: 95 * TILE_SIZE, y: 89 * TILE_SIZE, radius: 130, type: 'lamp' },
      { x: 104 * TILE_SIZE, y: 89 * TILE_SIZE, radius: 130, type: 'lamp' },
      { x: 98 * TILE_SIZE, y: 92 * TILE_SIZE, radius: 150, type: 'lamp' }
    );

    this.dayNight.renderLighting(this.ctx, this.camera, lights);
  }

  renderMenuBackground() {
    const time = Date.now() * 0.001;
    const ctx = this.ctx;

    ctx.fillStyle = '#0b131f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Floating starlight particles
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 123 + time * 0.2) * 0.5 + 0.5) * this.canvas.width;
      const y = (Math.cos(i * 321 + time * 0.15) * 0.5 + 0.5) * this.canvas.height;
      const rad = 1 + (Math.sin(i + time) * 0.5 + 0.5) * 2;

      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(t => this.loop(t));
  }
}
