

import { ITEMS_DATABASE } from '../systems/Inventory.js';

export class ResourceNode {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type; // 'tree', 'rock', 'iron_vein', 'gold_vein', 'bush', 'herb', 'water_source'
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.maxHealth = this.getDefaultHealth();
    this.health = this.maxHealth;
    this.depleted = false;
    this.respawnTimer = 0;
    this.respawnTime = 60; // 60 seconds respawn
    this.shake = 0;
  }

  getDefaultHealth() {
    switch (this.type) {
      case 'tree': return 3;
      case 'rock': return 4;
      case 'iron_vein': return 4;
      case 'gold_vein': return 5;
      case 'bush': return 1;
      case 'herb': return 1;
      case 'water_source': return 999;
      default: return 2;
    }
  }

  harvest(damage = 1, toolType = null) {
    if (this.depleted) return [];

    // Bonus damage if using proper tool
    let effectiveDmg = damage;
    if (this.type === 'tree' && toolType === 'axe') effectiveDmg *= 2;
    if ((this.type === 'rock' || this.type.includes('vein')) && toolType === 'pickaxe') effectiveDmg *= 2;

    this.health -= effectiveDmg;
    this.shake = 6;

    if (this.health <= 0) {
      this.depleted = true;
      this.respawnTimer = this.respawnTime;
      return this.getDrops();
    }
    return [];
  }

  getDrops() {
    const drops = [];
    switch (this.type) {
      case 'tree':
        drops.push({ id: 'wood', count: 3 + Math.floor(Math.random() * 2) });
        if (Math.random() < 0.45) drops.push({ id: 'apple', count: 1 });
        break;
      case 'rock':
        drops.push({ id: 'stone', count: 3 + Math.floor(Math.random() * 2) });
        if (Math.random() < 0.35) drops.push({ id: 'iron_ore', count: 1 });
        break;
      case 'iron_vein':
        drops.push({ id: 'iron_ore', count: 2 + Math.floor(Math.random() * 2) });
        drops.push({ id: 'stone', count: 1 });
        break;
      case 'gold_vein':
        drops.push({ id: 'gold_ore', count: 2 + Math.floor(Math.random() * 2) });
        drops.push({ id: 'stone', count: 2 });
        break;
      case 'bush':
        drops.push({ id: 'berry', count: 2 + Math.floor(Math.random() * 2) });
        drops.push({ id: 'grass', count: 1 });
        break;
      case 'herb':
        drops.push({ id: 'grass', count: 2 });
        break;
      case 'water_source':
        drops.push({ id: 'water_bottle', count: 1 });
        break;
    }
    return drops;
  }

  update(dt) {
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 25);
    }
    if (this.depleted && this.type !== 'water_source') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.depleted = false;
        this.health = this.maxHealth;
      }
    }
  }

  render(ctx, camera) {
    if (this.depleted) {
      // Stump or broken rock
      const screenX = this.x - camera.x;
      const screenY = this.y - camera.y;
      if (this.type === 'tree') {
        ctx.fillStyle = '#6b4423';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const offsetX = (Math.random() - 0.5) * this.shake;
    const screenX = this.x - camera.x + offsetX;
    const screenY = this.y - camera.y;

    // Viewport bounds check
    if (
      screenX < -50 || screenX > ctx.canvas.width + 50 ||
      screenY < -50 || screenY > ctx.canvas.height + 50
    ) {
      return;
    }

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 12, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (this.type) {
      case 'tree': {
        // Tronco con degradado y textura
        const trunkGradient = ctx.createLinearGradient(
          screenX - 7, 0, screenX + 7, 0
        );
        trunkGradient.addColorStop(0, '#49301d');
        trunkGradient.addColorStop(0.35, '#80502d');
        trunkGradient.addColorStop(0.65, '#a87343');
        trunkGradient.addColorStop(1, '#50321f');

        ctx.fillStyle = trunkGradient;
        ctx.fillRect(screenX - 6, screenY - 10, 12, 24);

        ctx.strokeStyle = 'rgba(48, 29, 18, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX - 2, screenY - 6);
        ctx.lineTo(screenX - 3, screenY + 8);
        ctx.moveTo(screenX + 2, screenY - 2);
        ctx.lineTo(screenX + 1, screenY + 10);
        ctx.stroke();

        // Copa inferior con volumen
        const lowerLeaves = ctx.createRadialGradient(
          screenX - 8, screenY - 28, 2,
          screenX, screenY - 15, 27
        );
        lowerLeaves.addColorStop(0, '#65a94f');
        lowerLeaves.addColorStop(0.55, '#347747');
        lowerLeaves.addColorStop(1, '#194d32');

        ctx.fillStyle = lowerLeaves;
        ctx.beginPath();
        ctx.arc(screenX - 11, screenY - 13, 17, 0, Math.PI * 2);
        ctx.arc(screenX + 11, screenY - 13, 17, 0, Math.PI * 2);
        ctx.arc(screenX, screenY - 17, 22, 0, Math.PI * 2);
        ctx.fill();

        // Copa superior
        const upperLeaves = ctx.createRadialGradient(
          screenX - 7, screenY - 34, 2,
          screenX, screenY - 28, 22
        );
        upperLeaves.addColorStop(0, '#a0d96c');
        upperLeaves.addColorStop(0.5, '#58a447');
        upperLeaves.addColorStop(1, '#28633a');

        ctx.fillStyle = upperLeaves;
        ctx.beginPath();
        ctx.arc(screenX - 9, screenY - 27, 14, 0, Math.PI * 2);
        ctx.arc(screenX + 9, screenY - 27, 14, 0, Math.PI * 2);
        ctx.arc(screenX, screenY - 37, 15, 0, Math.PI * 2);
        ctx.fill();

        // Reflejos de luz en las hojas
        ctx.fillStyle = 'rgba(205, 240, 145, 0.4)';
        ctx.beginPath();
        ctx.ellipse(
          screenX - 8, screenY - 34, 7, 4, -0.5, 0, Math.PI * 2
        );
        ctx.ellipse(
          screenX + 6, screenY - 25, 5, 3, 0.4, 0, Math.PI * 2
        );
        ctx.fill();

        // Manzanas con pequeño reflejo
        ctx.fillStyle = '#d62839';
        ctx.beginPath();
        ctx.arc(screenX - 10, screenY - 17, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 11, screenY - 29, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff9b9b';
        ctx.beginPath();
        ctx.arc(screenX - 11, screenY - 18, 1, 0, Math.PI * 2);
        ctx.arc(screenX + 10, screenY - 30, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'rock': {
        // Piedra natural con volumen y degradado
        const rockGradient = ctx.createLinearGradient(
          screenX - 17, screenY - 13,
          screenX + 15, screenY + 12
        );
        rockGradient.addColorStop(0, '#d8dee3');
        rockGradient.addColorStop(0.3, '#929da7');
        rockGradient.addColorStop(0.7, '#65717c');
        rockGradient.addColorStop(1, '#343e47');

        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.moveTo(screenX - 18, screenY + 3);
        ctx.lineTo(screenX - 15, screenY - 7);
        ctx.lineTo(screenX - 5, screenY - 14);
        ctx.lineTo(screenX + 7, screenY - 13);
        ctx.lineTo(screenX + 17, screenY - 5);
        ctx.lineTo(screenX + 19, screenY + 4);
        ctx.lineTo(screenX + 10, screenY + 12);
        ctx.lineTo(screenX - 8, screenY + 13);
        ctx.closePath();
        ctx.fill();

        // Cara iluminada de la piedra
        ctx.fillStyle = 'rgba(240, 245, 248, 0.55)';
        ctx.beginPath();
        ctx.moveTo(screenX - 15, screenY - 6);
        ctx.lineTo(screenX - 5, screenY - 13);
        ctx.lineTo(screenX + 5, screenY - 10);
        ctx.lineTo(screenX - 2, screenY - 3);
        ctx.lineTo(screenX - 12, screenY);
        ctx.closePath();
        ctx.fill();

        // Facetas oscuras para dar profundidad
        ctx.fillStyle = 'rgba(35, 43, 51, 0.4)';
        ctx.beginPath();
        ctx.moveTo(screenX - 2, screenY - 3);
        ctx.lineTo(screenX + 7, screenY - 13);
        ctx.lineTo(screenX + 17, screenY - 5);
        ctx.lineTo(screenX + 19, screenY + 4);
        ctx.lineTo(screenX + 8, screenY + 9);
        ctx.closePath();
        ctx.fill();

        // Grietas y textura mineral
        ctx.strokeStyle = 'rgba(42, 50, 58, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(screenX - 3, screenY - 3);
        ctx.lineTo(screenX + 1, screenY + 2);
        ctx.lineTo(screenX - 2, screenY + 7);
        ctx.moveTo(screenX + 7, screenY - 7);
        ctx.lineTo(screenX + 5, screenY - 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(screenX - 7, screenY - 7, 1.2, 0, Math.PI * 2);
        ctx.arc(screenX + 11, screenY + 2, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'iron_vein': {
        // Piedra oscura con reflejos de hierro
        const ironGradient = ctx.createLinearGradient(
          screenX - 18, screenY - 14,
          screenX + 17, screenY + 14
        );
        ironGradient.addColorStop(0, '#aeb9c4');
        ironGradient.addColorStop(0.25, '#687681');
        ironGradient.addColorStop(0.65, '#3d4954');
        ironGradient.addColorStop(1, '#202a33');

        ctx.fillStyle = ironGradient;
        ctx.beginPath();
        ctx.moveTo(screenX - 19, screenY + 3);
        ctx.lineTo(screenX - 14, screenY - 8);
        ctx.lineTo(screenX - 4, screenY - 15);
        ctx.lineTo(screenX + 9, screenY - 12);
        ctx.lineTo(screenX + 18, screenY - 4);
        ctx.lineTo(screenX + 17, screenY + 7);
        ctx.lineTo(screenX + 7, screenY + 14);
        ctx.lineTo(screenX - 11, screenY + 11);
        ctx.closePath();
        ctx.fill();

        // Faceta superior iluminada
        ctx.fillStyle = 'rgba(211, 224, 235, 0.5)';
        ctx.beginPath();
        ctx.moveTo(screenX - 14, screenY - 8);
        ctx.lineTo(screenX - 4, screenY - 15);
        ctx.lineTo(screenX + 5, screenY - 11);
        ctx.lineTo(screenX - 2, screenY - 5);
        ctx.lineTo(screenX - 12, screenY - 1);
        ctx.closePath();
        ctx.fill();

        // Vetas metálicas plateadas
        ctx.strokeStyle = '#dce6ed';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY - 5);
        ctx.lineTo(screenX - 4, screenY - 8);
        ctx.lineTo(screenX + 1, screenY - 4);
        ctx.lineTo(screenX + 7, screenY - 7);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(236, 244, 250, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY + 5);
        ctx.lineTo(screenX, screenY + 1);
        ctx.lineTo(screenX + 5, screenY + 3);
        ctx.moveTo(screenX + 8, screenY - 1);
        ctx.lineTo(screenX + 12, screenY - 4);
        ctx.stroke();

        // Brillos del mineral
        ctx.fillStyle = '#f5fbff';
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY - 8);
        ctx.lineTo(screenX - 1, screenY - 10);
        ctx.lineTo(screenX + 1, screenY - 6);
        ctx.lineTo(screenX - 3, screenY - 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#a9c8dc';
        ctx.beginPath();
        ctx.moveTo(screenX + 7, screenY + 3);
        ctx.lineTo(screenX + 11, screenY);
        ctx.lineTo(screenX + 13, screenY + 4);
        ctx.lineTo(screenX + 9, screenY + 6);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'gold_vein': {
        // Roca oscura con volumen y caras angulosas
        const goldRockGradient = ctx.createLinearGradient(
          screenX - 18, screenY - 14,
          screenX + 17, screenY + 14
        );
        goldRockGradient.addColorStop(0, '#737a80');
        goldRockGradient.addColorStop(0.35, '#414950');
        goldRockGradient.addColorStop(0.7, '#292f35');
        goldRockGradient.addColorStop(1, '#171d22');

        ctx.fillStyle = goldRockGradient;
        ctx.beginPath();
        ctx.moveTo(screenX - 19, screenY + 3);
        ctx.lineTo(screenX - 14, screenY - 8);
        ctx.lineTo(screenX - 4, screenY - 15);
        ctx.lineTo(screenX + 8, screenY - 13);
        ctx.lineTo(screenX + 18, screenY - 4);
        ctx.lineTo(screenX + 18, screenY + 6);
        ctx.lineTo(screenX + 7, screenY + 14);
        ctx.lineTo(screenX - 10, screenY + 12);
        ctx.closePath();
        ctx.fill();

        // Reflejo sobre la superficie rocosa
        ctx.fillStyle = 'rgba(180, 190, 198, 0.3)';
        ctx.beginPath();
        ctx.moveTo(screenX - 14, screenY - 8);
        ctx.lineTo(screenX - 4, screenY - 15);
        ctx.lineTo(screenX + 5, screenY - 11);
        ctx.lineTo(screenX - 3, screenY - 4);
        ctx.closePath();
        ctx.fill();

        // Vetas doradas principales
        ctx.strokeStyle = '#a96c08';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(screenX - 12, screenY - 4);
        ctx.lineTo(screenX - 5, screenY - 8);
        ctx.lineTo(screenX + 1, screenY - 3);
        ctx.lineTo(screenX + 8, screenY - 7);
        ctx.stroke();

        ctx.strokeStyle = '#ffd54a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(screenX - 12, screenY - 5);
        ctx.lineTo(screenX - 5, screenY - 9);
        ctx.lineTo(screenX + 1, screenY - 4);
        ctx.lineTo(screenX + 8, screenY - 8);
        ctx.stroke();

        // Vetas secundarias
        ctx.strokeStyle = '#e9a817';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX - 4, screenY + 7);
        ctx.lineTo(screenX + 1, screenY + 3);
        ctx.lineTo(screenX + 6, screenY + 5);
        ctx.moveTo(screenX + 9, screenY);
        ctx.lineTo(screenX + 13, screenY - 3);
        ctx.stroke();

        // Pepitas de oro con reflejos
        ctx.fillStyle = '#ffdf63';
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY - 9);
        ctx.lineTo(screenX - 1, screenY - 11);
        ctx.lineTo(screenX + 1, screenY - 7);
        ctx.lineTo(screenX - 3, screenY - 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY + 3);
        ctx.lineTo(screenX + 9, screenY + 1);
        ctx.lineTo(screenX + 11, screenY + 5);
        ctx.lineTo(screenX + 7, screenY + 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 248, 190, 0.95)';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 9, 1, 0, Math.PI * 2);
        ctx.arc(screenX + 8, screenY + 3, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'bush': {
        // Base del arbusto con volumen y sombras
        const bushGradient = ctx.createRadialGradient(
          screenX - 5, screenY - 9, 2,
          screenX, screenY, 21
        );
        bushGradient.addColorStop(0, '#8bd66f');
        bushGradient.addColorStop(0.5, '#399653');
        bushGradient.addColorStop(1, '#174d32');

        // Hojas inferiores
        ctx.fillStyle = '#205b37';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 2, 17, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Copa principal
        ctx.fillStyle = bushGradient;
        ctx.beginPath();
        ctx.arc(screenX - 9, screenY - 2, 10, 0, Math.PI * 2);
        ctx.arc(screenX + 9, screenY - 2, 10, 0, Math.PI * 2);
        ctx.arc(screenX, screenY - 8, 12, 0, Math.PI * 2);
        ctx.arc(screenX, screenY + 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Hojas individuales para dar textura
        ctx.fillStyle = '#6fc45a';
        ctx.beginPath();
        ctx.ellipse(screenX - 8, screenY - 7, 5, 3, -0.5, 0, Math.PI * 2);
        ctx.ellipse(screenX + 2, screenY - 11, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.ellipse(screenX + 9, screenY - 4, 4, 3, 0.5, 0, Math.PI * 2);
        ctx.ellipse(screenX - 2, screenY + 1, 5, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pequeños reflejos de luz
        ctx.fillStyle = 'rgba(207, 255, 170, 0.55)';
        ctx.beginPath();
        ctx.ellipse(screenX - 7, screenY - 9, 3, 1.8, -0.5, 0, Math.PI * 2);
        ctx.ellipse(screenX + 2, screenY - 12, 2.5, 1.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Bayas rojas con sombra
        ctx.fillStyle = '#78182b';
        ctx.beginPath();
        ctx.arc(screenX - 7, screenY - 2, 3.4, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 5, 3.4, 0, Math.PI * 2);
        ctx.arc(screenX + 2, screenY + 4, 3.4, 0, Math.PI * 2);
        ctx.fill();

        // Color de las bayas
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(screenX - 7, screenY - 3, 2.7, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 6, 2.7, 0, Math.PI * 2);
        ctx.arc(screenX + 2, screenY + 3, 2.7, 0, Math.PI * 2);
        ctx.fill();

        // Brillo de las bayas
        ctx.fillStyle = '#ffb3b8';
        ctx.beginPath();
        ctx.arc(screenX - 8, screenY - 4, 1, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 7, 1, 0, Math.PI * 2);
        ctx.arc(screenX + 1, screenY + 2, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'herb':
        // Medicinal herb plant
        ctx.fillStyle = '#74c69d';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY, 6, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY, 6, 0, Math.PI * 2);
        ctx.arc(screenX, screenY - 5, 7, 0, Math.PI * 2);
        ctx.fill();
        // Flower blossom
        ctx.fillStyle = '#b5179e';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'water_source':
        // Village fountain / fresh spring
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00b4d8';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

export class DroppedItem {
  constructor(id, itemId, count, x, y) {
    this.id = id;
    this.itemId = itemId;
    this.count = count;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.despawnTimer = 180; // 3 minutes despawn
  }

  update(dt) {
    this.floatTimer += dt * 4;
    this.y = this.baseY + Math.sin(this.floatTimer) * 4;
    this.despawnTimer -= dt;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    const itemData = ITEMS_DATABASE[this.itemId];
    if (!itemData) return;

    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(screenX, this.baseY + 6 - camera.y, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating item icon
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemData.icon, screenX, screenY);

    if (this.count > 1) {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.count, screenX + 8, screenY + 6);
    }
    ctx.restore();
  }
}
