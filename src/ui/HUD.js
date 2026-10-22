import { ITEMS_DATABASE } from '../systems/Inventory.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../world/Map.js';

export class HUD {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.barHp = document.getElementById('bar-hp');
    this.textHp = document.getElementById('text-hp');
    this.barHunger = document.getElementById('bar-hunger');
    this.textHunger = document.getElementById('text-hunger');
    this.barThirst = document.getElementById('bar-thirst');
    this.textThirst = document.getElementById('text-thirst');
    this.barEnergy = document.getElementById('bar-energy');
    this.textEnergy = document.getElementById('text-energy');
    this.barXp = document.getElementById('bar-xp');
    this.textXp = document.getElementById('text-xp');
    this.playerLevel = document.getElementById('hud-player-level');
    this.goldText = document.getElementById('hud-gold-text');

    this.timeIcon = document.getElementById('hud-time-icon');
    this.dayText = document.getElementById('hud-day-text');
    this.clockText = document.getElementById('hud-clock-text');

    this.questName = document.getElementById('hud-quest-name');
    this.questObjective = document.getElementById('hud-quest-objective');
    this.questProgress = document.getElementById('hud-quest-progress');

    this.hotbarEl = document.getElementById('hud-hotbar');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.bossHud = document.getElementById('boss-hud');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossNameText = document.getElementById('boss-name-text');

    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionText = document.getElementById('interaction-text');
    this.toastContainer = document.getElementById('toast-container');

    this.selectedHotbarIndex = 0;
    this.initHotbarSlots();
  }

  initHotbarSlots() {
    if (!this.hotbarEl) return;
    this.hotbarEl.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${i === 0 ? 'active' : ''}`;
      slot.dataset.index = i;
      slot.innerHTML = `
        <span class="slot-key">${i + 1}</span>
        <span class="slot-icon" id="hb-icon-${i}"></span>
        <span class="slot-count" id="hb-count-${i}"></span>
      `;
      slot.addEventListener('click', () => {
        this.selectHotbarSlot(i);
        this.useHotbarSlot(i);
      });
      this.hotbarEl.appendChild(slot);
    }
  }

  selectHotbarSlot(index) {
    this.selectedHotbarIndex = index;
    const slots = this.hotbarEl.querySelectorAll('.hotbar-slot');
    slots.forEach((s, idx) => {
      s.classList.toggle('active', idx === index);
    });
  }

  useHotbarSlot(index) {
    const slotData = this.game.player.inventory.slots[index];
    if (!slotData) return;

    const item = ITEMS_DATABASE[slotData.id];
    if (!item) return;

    if (item.type === 'food') {
      if (item.hunger) this.game.player.feed(item.hunger);
      if (item.health) this.game.player.heal(item.health);
      if (item.thirst) this.game.player.drink(item.thirst);
      this.game.player.inventory.removeItem(item.id, 1);
      this.game.soundManager.playEat();
      this.showToast(`Comiste ${item.name}`, 'toast-loot');
    } else if (item.type === 'drink') {
      if (item.thirst) this.game.player.drink(item.thirst);
      this.game.player.inventory.removeItem(item.id, 1);
      this.game.soundManager.playDrink();
      this.showToast(`Bebiste ${item.name}`, 'toast-loot');
    } else if (item.type === 'consumable') {
      if (item.health) this.game.player.heal(item.health);
      this.game.player.inventory.removeItem(item.id, 1);
      this.game.soundManager.playDrink();
      this.showToast(`Usaste ${item.name}`, 'toast-loot');
    } else if (item.equipSlot) {
      this.game.player.inventory.equipItem(index);
      this.game.soundManager.playCraft();
      this.showToast(`Equipaste ${item.name}`, 'toast-loot');
    } else if (item.type === 'buildable') {
      this.game.buildingSystem.startPlacement(item);
      this.showToast(`Modo construcción: Coloca con Clic / E`, 'toast-quest');
    }
    this.update();
  }

  update() {
    const p = this.game.player;
    if (!p) return;

    // HP Bar
    const hpPct = Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100));
    this.barHp.style.width = `${hpPct}%`;
    this.textHp.textContent = `${Math.round(p.health)} / ${p.maxHealth}`;

    // Hunger Bar
    const hungerPct = Math.max(0, Math.min(100, (p.hunger / p.maxHunger) * 100));
    this.barHunger.style.width = `${hungerPct}%`;
    this.textHunger.textContent = `${Math.round(p.hunger)}%`;

    // Thirst Bar
    const thirstPct = Math.max(0, Math.min(100, (p.thirst / p.maxThirst) * 100));
    this.barThirst.style.width = `${thirstPct}%`;
    this.textThirst.textContent = `${Math.round(p.thirst)}%`;

    // Energy Bar
    const energyPct = Math.max(0, Math.min(100, (p.stamina / p.maxStamina) * 100));
    this.barEnergy.style.width = `${energyPct}%`;
    this.textEnergy.textContent = `${Math.round(p.stamina)}%`;

    // XP Bar
    const xpPct = Math.max(0, Math.min(100, (p.xp / p.xpToNextLevel) * 100));
    this.barXp.style.width = `${xpPct}%`;
    this.textXp.textContent = `${p.xp} / ${p.xpToNextLevel} XP`;

    // Level & Gold
    this.playerLevel.textContent = `Nivel ${p.level}`;
    this.goldText.textContent = p.coins;

    // Time & Day
    const dn = this.game.dayNight;
    if (dn) {
      this.dayText.textContent = `Día ${dn.day}`;
      this.clockText.textContent = dn.getFormattedTime();
      this.timeIcon.textContent = dn.getTimeIcon();
    }

    // Hotbar Items update
    for (let i = 0; i < 6; i++) {
      const slot = p.inventory.slots[i];
      const iconEl = document.getElementById(`hb-icon-${i}`);
      const countEl = document.getElementById(`hb-count-${i}`);

      if (slot) {
        const item = ITEMS_DATABASE[slot.id];
        iconEl.textContent = item ? item.icon : '❓';
        countEl.textContent = slot.count > 1 ? slot.count : '';
      } else {
        iconEl.textContent = '';
        countEl.textContent = '';
      }
    }

    // Quests Widget
    this.updateQuests();

    // Render Minimap
    this.renderMinimap();
  }

  updateQuests() {
    if (!this.game.questSystem) return;
    const active = this.game.questSystem.getActiveQuest();
    if (active) {
      this.questName.textContent = active.title;
      this.questObjective.textContent = active.desc;
      this.questProgress.textContent = `${active.current} / ${active.required} ${active.completed ? '✅ (Completada)' : ''}`;
    }
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Map background representation
    ctx.fillStyle = '#2d6a4f'; // green world base
    ctx.fillRect(0, 0, w, h);

    // Lake representation (SW)
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(w * 0.1, h * 0.65, w * 0.25, h * 0.3);

    // Village representation (SE)
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(w * 0.7, h * 0.68, w * 0.22, h * 0.25);

    // Cursed Wastes (North Center)
    ctx.fillStyle = '#59296e';
    ctx.fillRect(w * 0.28, h * 0.05, w * 0.44, h * 0.25);

    // Mountains (NE)
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(w * 0.72, h * 0.08, w * 0.25, h * 0.4);

    // Draw Enemies (red dots)
    ctx.fillStyle = '#ff4d6d';
    for (const enemy of this.game.enemies) {
      if (enemy.isDead) continue;
      const ex = (enemy.x / WORLD_WIDTH) * w;
      const ey = (enemy.y / WORLD_HEIGHT) * h;
      ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }

    // Draw Boss (skull / purple box)
    if (this.game.boss && !this.game.boss.isDead) {
      const bx = (this.game.boss.x / WORLD_WIDTH) * w;
      const by = (this.game.boss.y / WORLD_HEIGHT) * h;
      ctx.fillStyle = '#ff0054';
      ctx.fillRect(bx - 3, by - 3, 6, 6);
    }

    // Draw Player (glowing yellow circle)
    const px = (this.game.player.x / WORLD_WIDTH) * w;
    const py = (this.game.player.y / WORLD_HEIGHT) * h;

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  showBossBar(name, currentHp, maxHp) {
    this.bossHud.style.display = 'flex';
    this.bossNameText.textContent = `🌲 ${name}`;
    const pct = Math.max(0, (currentHp / maxHp) * 100);
    this.bossHpFill.style.width = `${pct}%`;
  }

  hideBossBar() {
    this.bossHud.style.display = 'none';
  }

  showPrompt(text) {
    this.interactionPrompt.style.display = 'flex';
    this.interactionText.textContent = text;
  }

  hidePrompt() {
    this.interactionPrompt.style.display = 'none';
  }

  showToast(message, type = 'toast-loot') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}
