
export const ENEMY_TYPES = {
  wolf: {
    name: 'Lobo Salvaje',
    maxHealth: 35,
    damage: 10,
    speed: 130,
    detectRadius: 200,
    attackRadius: 36,
    attackCooldown: 1.2,
    xpReward: 35,
    goldDrop: [2, 6],
    loot: [
      { id: 'raw_meat', count: 1, chance: 0.8 },
      { id: 'grass', count: 1, chance: 0.5 }
    ]
  },
  zombie: {
    name: 'Zombi Errante',
    maxHealth: 60,
    damage: 14,
    speed: 75,
    detectRadius: 170,
    attackRadius: 32,
    attackCooldown: 1.4,
    xpReward: 45,
    goldDrop: [4, 12],
    loot: [
      { id: 'stone', count: 2, chance: 0.5 },
      { id: 'iron_ore', count: 1, chance: 0.3 }
    ]
  },
  bandit: {
    name: 'Bandido Furtivo',
    maxHealth: 50,
    damage: 16,
    speed: 120,
    detectRadius: 210,
    attackRadius: 38,
    attackCooldown: 1.0,
    xpReward: 55,
    goldDrop: [12, 25],
    loot: [
      { id: 'bandage', count: 1, chance: 0.5 },
      { id: 'water_bottle', count: 1, chance: 0.4 }
    ]
  },
  forest_monster: {
    name: 'Espíritu del Bosque',
    maxHealth: 85,
    damage: 20,
    speed: 90,
    detectRadius: 220,
    attackRadius: 40,
    attackCooldown: 1.4,
    xpReward: 80,
    goldDrop: [15, 30],
    loot: [
      { id: 'wood', count: 4, chance: 1.0 },
      { id: 'berry', count: 3, chance: 0.7 }
    ]
  }
};

export class Enemy {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.config = ENEMY_TYPES[type] || ENEMY_TYPES.wolf;

    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.radius = 16;

    this.maxHealth = this.config.maxHealth;
    this.health = this.maxHealth;
    this.damage = this.config.damage;
    this.speed = this.config.speed;

    this.state = 'idle'; // 'idle', 'chase', 'attack', 'dead'
    this.target = null;
    this.attackTimer = 0;
    this.wanderTimer = Math.random() * 3;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.hurtTimer = 0;
    this.isDead = false;
  }

  takeDamage(amount, knockbackAngle = null, game = null) {
    if (this.isDead) return;

    this.health -= amount;
    this.hurtTimer = 0.2;

    if (knockbackAngle !== null) {
      this.x += Math.cos(knockbackAngle) * 16;
      this.y += Math.sin(knockbackAngle) * 16;
    }

    if (game && game.particleSystem) {
      game.particleSystem.emitHit(this.x, this.y);
      game.particleSystem.addFloatingText(this.x, this.y - 18, `-${amount}`, '#ff4d6d', 16);
    }

    if (this.health <= 0) {
      this.die(game);
    }
  }

  die(game = null) {
    this.isDead = true;
    this.health = 0;

    if (game) {
      // Award XP
      if (game.player) {
        game.player.addXP(this.config.xpReward, game);
      }

      // Drop Gold
      const [minG, maxG] = this.config.goldDrop;
      const gold = Math.floor(minG + Math.random() * (maxG - minG + 1));
      if (game.player) {
        game.player.coins += gold;
        if (game.particleSystem) {
          game.particleSystem.addFloatingText(this.x, this.y - 34, `+${gold} 🪙`, '#ffd700', 15);
        }
      }

      // Drop Loot Items
      for (const drop of this.config.loot) {
        if (Math.random() <= drop.chance) {
          game.spawnDroppedItem(drop.id, drop.count, this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20);
        }
      }

      // Quest hook
      if (game.questSystem) {
        game.questSystem.onKill(this.type);
      }
    }
  }

  update(dt, player, map, game) {
    if (this.isDead) return;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // AI Logic
    if (distToPlayer <= this.config.detectRadius && !player.isDead) {
      // In Chase Range
      this.state = 'chase';

      if (distToPlayer <= this.config.attackRadius) {
        // Attack Range
        this.state = 'attack';
        if (this.attackTimer <= 0) {
          this.attackTimer = this.config.attackCooldown;
          player.takeDamage(this.damage, this.config.name, game);
        }
      } else {
        // Move towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const moveX = Math.cos(angle) * this.speed * dt;
        const moveY = Math.sin(angle) * this.speed * dt;

        if (!map.isSolid(this.x + moveX, this.y, 14)) this.x += moveX;
        if (!map.isSolid(this.x, this.y + moveY, 14)) this.y += moveY;
      }
    } else {
      // Idle / Wander near spawn
      this.state = 'idle';
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2.5 + Math.random() * 3.5;
        this.wanderAngle = Math.random() * Math.PI * 2;
      }

      // Gentle wander
      const distFromSpawn = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);
      if (distFromSpawn > 120) {
        this.wanderAngle = Math.atan2(this.spawnY - this.y, this.spawnX - this.x);
      }

      const moveX = Math.cos(this.wanderAngle) * (this.speed * 0.3) * dt;
      const moveY = Math.sin(this.wanderAngle) * (this.speed * 0.3) * dt;

      if (!map.isSolid(this.x + moveX, this.y, 12)) this.x += moveX;
      if (!map.isSolid(this.x, this.y + moveY, 12)) this.y += moveY;
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Viewport cull
    if (
      screenX < -50 || screenX > ctx.canvas.width + 50 ||
      screenY < -50 || screenY > ctx.canvas.height + 50
    ) {
      return;
    }

    ctx.save();

    // Sombra mejorada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(screenX + 2, screenY + 13, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brillo de daño
    const hurt = this.hurtTimer > 0;

    // Luz ambiental sutil para cada enemigo
    if (!hurt) {
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle =
        this.type === 'wolf' ? '#a8c9e8' :
        this.type === 'zombie' ? '#65ff9a' :
        this.type === 'bandit' ? '#d6a45e' : '#00ff99';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    switch (this.type) {
      case 'wolf': {
        // Cola
        ctx.fillStyle = hurt ? '#ff6b6b' : '#505965';
        ctx.beginPath();
        ctx.moveTo(screenX - 13, screenY + 1);
        ctx.lineTo(screenX - 24, screenY - 7);
        ctx.lineTo(screenX - 20, screenY + 5);
        ctx.lineTo(screenX - 13, screenY + 7);
        ctx.closePath();
        ctx.fill();

        // Contorno y cuerpo
        ctx.fillStyle = '#303842';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 1, 19, 12, -0.08, 0, Math.PI * 2);
        ctx.fill();

        const wolfBody = ctx.createLinearGradient(
          screenX - 14, screenY - 10,
          screenX + 10, screenY + 12
        );
        wolfBody.addColorStop(0, hurt ? '#ffb0b0' : '#a6afb9');
        wolfBody.addColorStop(0.5, hurt ? '#ff6b6b' : '#737e8b');
        wolfBody.addColorStop(1, hurt ? '#d63b50' : '#414a55');

        ctx.fillStyle = wolfBody;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, 17, 10, -0.08, 0, Math.PI * 2);
        ctx.fill();

        // Pelaje del lomo
        ctx.fillStyle = hurt ? '#ffaaaa' : '#d0d5dc';
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY - 6);
        ctx.lineTo(screenX - 5, screenY - 12);
        ctx.lineTo(screenX - 1, screenY - 7);
        ctx.lineTo(screenX + 4, screenY - 12);
        ctx.lineTo(screenX + 8, screenY - 5);
        ctx.closePath();
        ctx.fill();

        // Patas
        ctx.strokeStyle = hurt ? '#ff8a8a' : '#3e4650';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY + 5);
        ctx.lineTo(screenX - 12, screenY + 11);
        ctx.moveTo(screenX - 2, screenY + 6);
        ctx.lineTo(screenX - 3, screenY + 11);
        ctx.moveTo(screenX + 8, screenY + 5);
        ctx.lineTo(screenX + 10, screenY + 10);
        ctx.stroke();

        // Cabeza
        ctx.fillStyle = hurt ? '#ff7777' : '#687482';
        ctx.beginPath();
        ctx.arc(screenX + 12, screenY - 5, 9, 0, Math.PI * 2);
        ctx.fill();

        // Orejas puntiagudas
        ctx.fillStyle = hurt ? '#ff9999' : '#414b58';
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY - 10);
        ctx.lineTo(screenX + 5, screenY - 19);
        ctx.lineTo(screenX + 12, screenY - 12);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 13, screenY - 11);
        ctx.lineTo(screenX + 18, screenY - 19);
        ctx.lineTo(screenX + 20, screenY - 8);
        ctx.closePath();
        ctx.fill();

        // Hocico
        ctx.fillStyle = hurt ? '#ffb0b0' : '#c3cad2';
        ctx.beginPath();
        ctx.moveTo(screenX + 17, screenY - 4);
        ctx.lineTo(screenX + 25, screenY - 1);
        ctx.lineTo(screenX + 17, screenY + 2);
        ctx.closePath();
        ctx.fill();

        // Nariz
        ctx.fillStyle = '#20252b';
        ctx.beginPath();
        ctx.arc(screenX + 24, screenY - 1, 2, 0, Math.PI * 2);
        ctx.fill();

        // Ojo brillante
        ctx.fillStyle = hurt ? '#ffffff' : '#ffcf40';
        ctx.beginPath();
        ctx.arc(screenX + 15, screenY - 7, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22252a';
        ctx.fillRect(screenX + 15, screenY - 8, 1, 3);
        break;
      }

      case 'zombie': {
        // Piernas rotas
        ctx.strokeStyle = hurt ? '#ff7777' : '#3e5140';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX - 4, screenY + 5);
        ctx.lineTo(screenX - 7, screenY + 13);
        ctx.moveTo(screenX + 4, screenY + 5);
        ctx.lineTo(screenX + 8, screenY + 12);
        ctx.stroke();

        // Brazos extendidos
        ctx.strokeStyle = hurt ? '#ff8a8a' : '#477d53';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(screenX - 6, screenY - 4);
        ctx.lineTo(screenX - 15, screenY + 1);
        ctx.moveTo(screenX + 6, screenY - 4);
        ctx.lineTo(screenX + 15, screenY - 8);
        ctx.stroke();

        // Torso con degradado
        const zombieBody = ctx.createLinearGradient(
          screenX - 9, screenY - 8,
          screenX + 9, screenY + 13
        );
        zombieBody.addColorStop(0, hurt ? '#ffb0b0' : '#74a96c');
        zombieBody.addColorStop(0.55, hurt ? '#ff6b6b' : '#386641');
        zombieBody.addColorStop(1, hurt ? '#d83d50' : '#243f2b');

        ctx.fillStyle = zombieBody;
        ctx.beginPath();
        ctx.roundRect(screenX - 8, screenY - 8, 16, 20, 3);
        ctx.fill();

        // Ropa desgarrada
        ctx.fillStyle = hurt ? '#ff9c9c' : '#27352b';
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY + 4);
        ctx.lineTo(screenX - 2, screenY + 7);
        ctx.lineTo(screenX - 5, screenY + 12);
        ctx.lineTo(screenX - 9, screenY + 10);
        ctx.closePath();
        ctx.fill();

        // Cuello
        ctx.fillStyle = hurt ? '#ffaaaa' : '#51865a';
        ctx.fillRect(screenX - 3, screenY - 12, 6, 5);

        // Cabeza
        const zombieHead = ctx.createLinearGradient(
          screenX - 7, screenY - 22,
          screenX + 8, screenY - 7
        );
        zombieHead.addColorStop(0, hurt ? '#ffd0d0' : '#9bd18c');
        zombieHead.addColorStop(1, hurt ? '#ff6b6b' : '#417c50');

        ctx.fillStyle = zombieHead;
        ctx.beginPath();
        ctx.arc(screenX, screenY - 15, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Cabello desordenado
        ctx.fillStyle = hurt ? '#ff9999' : '#344437';
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY - 17);
        ctx.lineTo(screenX - 10, screenY - 24);
        ctx.lineTo(screenX - 4, screenY - 21);
        ctx.lineTo(screenX, screenY - 25);
        ctx.lineTo(screenX + 3, screenY - 21);
        ctx.lineTo(screenX + 8, screenY - 23);
        ctx.lineTo(screenX + 8, screenY - 15);
        ctx.closePath();
        ctx.fill();

        // Cicatrices
        ctx.strokeStyle = hurt ? '#ffffff' : '#31543a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(screenX - 6, screenY - 12);
        ctx.lineTo(screenX - 2, screenY - 10);
        ctx.moveTo(screenX + 3, screenY - 5);
        ctx.lineTo(screenX + 6, screenY - 8);
        ctx.stroke();

        // Ojos rojos brillantes
        ctx.fillStyle = 'rgba(255, 0, 35, 0.25)';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 16, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 16, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hurt ? '#ffffff' : '#ff243f';
        ctx.fillRect(screenX - 4, screenY - 17, 3, 2.5);
        ctx.fillRect(screenX + 2, screenY - 17, 3, 2.5);

        // Boca
        ctx.fillStyle = '#202820';
        ctx.fillRect(screenX - 4, screenY - 9, 8, 2);

        ctx.fillStyle = '#d9e4d4';
        ctx.fillRect(screenX - 2, screenY - 9, 2, 2);
        ctx.fillRect(screenX + 2, screenY - 9, 2, 2);
        break;
      }

      case 'bandit': {
        // Capa exterior
        ctx.fillStyle = '#141820';
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY - 8);
        ctx.lineTo(screenX + 7, screenY - 8);
        ctx.lineTo(screenX + 12, screenY + 12);
        ctx.lineTo(screenX - 12, screenY + 12);
        ctx.closePath();
        ctx.fill();

        // Capa con volumen
        const cloak = ctx.createLinearGradient(
          screenX - 10, screenY - 6,
          screenX + 10, screenY + 10
        );
        cloak.addColorStop(0, hurt ? '#ffb0b0' : '#596273');
        cloak.addColorStop(0.4, hurt ? '#ff6b6b' : '#292f3c');
        cloak.addColorStop(1, hurt ? '#d83d50' : '#101319');

        ctx.fillStyle = cloak;
        ctx.beginPath();
        ctx.moveTo(screenX - 7, screenY - 8);
        ctx.lineTo(screenX + 7, screenY - 8);
        ctx.lineTo(screenX + 10, screenY + 11);
        ctx.lineTo(screenX - 10, screenY + 11);
        ctx.closePath();
        ctx.fill();

        // Pliegues de la ropa
        ctx.strokeStyle = hurt ? '#ffc0c0' : '#454d5b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(screenX - 4, screenY - 3);
        ctx.lineTo(screenX - 6, screenY + 8);
        ctx.moveTo(screenX + 3, screenY - 2);
        ctx.lineTo(screenX + 6, screenY + 8);
        ctx.stroke();

        // Cinturón
        ctx.fillStyle = '#76512f';
        ctx.fillRect(screenX - 8, screenY + 3, 16, 3);

        ctx.fillStyle = '#d9b56d';
        ctx.fillRect(screenX - 2, screenY + 3, 4, 3);

        // Cuello
        ctx.fillStyle = hurt ? '#ffb0b0' : '#bb895d';
        ctx.fillRect(screenX - 3, screenY - 12, 6, 5);

        // Capucha
        ctx.fillStyle = hurt ? '#ff7777' : '#202633';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 13, 10, Math.PI, Math.PI * 2);
        ctx.lineTo(screenX + 10, screenY - 7);
        ctx.lineTo(screenX - 10, screenY - 7);
        ctx.closePath();
        ctx.fill();

        // Rostro
        const banditFace = ctx.createLinearGradient(
          screenX - 6, screenY - 19,
          screenX + 6, screenY - 7
        );
        banditFace.addColorStop(0, hurt ? '#ffd0d0' : '#edc391');
        banditFace.addColorStop(1, hurt ? '#ff7777' : '#a96e48');

        ctx.fillStyle = banditFace;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY - 12, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Máscara
        ctx.fillStyle = hurt ? '#ffaaaa' : '#171a21';
        ctx.beginPath();
        ctx.moveTo(screenX - 7, screenY - 14);
        ctx.lineTo(screenX + 7, screenY - 14);
        ctx.lineTo(screenX + 6, screenY - 9);
        ctx.lineTo(screenX, screenY - 7);
        ctx.lineTo(screenX - 6, screenY - 9);
        ctx.closePath();
        ctx.fill();

        // Ojos
        ctx.fillStyle = hurt ? '#ffffff' : '#f8e6bb';
        ctx.fillRect(screenX - 4, screenY - 14, 2.5, 2);
        ctx.fillRect(screenX + 2, screenY - 14, 2.5, 2);

        // Brazo armado
        ctx.strokeStyle = hurt ? '#ff8888' : '#6b4c36';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY - 3);
        ctx.lineTo(screenX + 13, screenY + 1);
        ctx.stroke();

        // Daga con hoja metálica
        ctx.fillStyle = '#b7c8d8';
        ctx.beginPath();
        ctx.moveTo(screenX + 11, screenY - 1);
        ctx.lineTo(screenX + 24, screenY - 5);
        ctx.lineTo(screenX + 18, screenY + 3);
        ctx.closePath();
        ctx.fill();

        // Brillo de la hoja
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 15, screenY - 2);
        ctx.lineTo(screenX + 22, screenY - 4);
        ctx.stroke();

        // Empuñadura
        ctx.strokeStyle = '#8b5e3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY - 1);
        ctx.lineTo(screenX + 13, screenY + 3);
        ctx.stroke();
        break;
      }

      case 'forest_monster': {
        // Raíces y extremidades
        ctx.strokeStyle = hurt ? '#ff8a8a' : '#4c3023';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX - 7, screenY + 3);
        ctx.lineTo(screenX - 12, screenY + 12);
        ctx.moveTo(screenX + 7, screenY + 3);
        ctx.lineTo(screenX + 13, screenY + 11);
        ctx.moveTo(screenX - 10, screenY - 4);
        ctx.lineTo(screenX - 17, screenY + 2);
        ctx.moveTo(screenX + 10, screenY - 4);
        ctx.lineTo(screenX + 17, screenY - 9);
        ctx.stroke();

        // Contorno del tronco
        ctx.fillStyle = '#21150f';
        ctx.beginPath();
        ctx.roundRect(screenX - 13, screenY - 13, 26, 28, 5);
        ctx.fill();

        // Cuerpo de madera con degradado
        const bark = ctx.createLinearGradient(
          screenX - 13, screenY - 12,
          screenX + 13, screenY + 12
        );
        bark.addColorStop(0, hurt ? '#ffb0b0' : '#96603a');
        bark.addColorStop(0.3, hurt ? '#ff7777' : '#67402a');
        bark.addColorStop(0.7, hurt ? '#e95a5a' : '#493020');
        bark.addColorStop(1, hurt ? '#bd3434' : '#2d2019');

        ctx.fillStyle = bark;
        ctx.beginPath();
        ctx.roundRect(screenX - 11, screenY - 12, 22, 25, 4);
        ctx.fill();

        // Anillos y vetas de la madera
        ctx.strokeStyle = hurt ? '#ffc0c0' : '#a9794b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(screenX - 6, screenY - 9);
        ctx.lineTo(screenX - 3, screenY - 3);
        ctx.lineTo(screenX - 6, screenY + 3);
        ctx.moveTo(screenX + 3, screenY - 11);
        ctx.lineTo(screenX + 1, screenY - 5);
        ctx.lineTo(screenX + 5, screenY + 1);
        ctx.moveTo(screenX - 5, screenY + 7);
        ctx.lineTo(screenX + 2, screenY + 4);
        ctx.stroke();

        // Musgo del cuerpo
        if (!hurt) {
          ctx.fillStyle = '#347a3e';
          ctx.beginPath();
          ctx.ellipse(screenX - 7, screenY - 7, 4, 2.5, -0.5, 0, Math.PI * 2);
          ctx.ellipse(screenX + 7, screenY + 5, 3, 2, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cuello de madera
        ctx.strokeStyle = hurt ? '#ff7777' : '#533421';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - 10);
        ctx.lineTo(screenX, screenY - 16);
        ctx.stroke();

        // Copa de hojas trasera
        ctx.fillStyle = hurt ? '#ff8a8a' : '#174d2b';
        ctx.beginPath();
        ctx.arc(screenX - 6, screenY - 18, 9, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 21, 10, 0, Math.PI * 2);
        ctx.arc(screenX + 11, screenY - 15, 7, 0, Math.PI * 2);
        ctx.fill();

        // Hojas iluminadas
        ctx.fillStyle = hurt ? '#ffc0c0' : '#3ca65b';
        ctx.beginPath();
        ctx.arc(screenX - 7, screenY - 21, 5, 0, Math.PI * 2);
        ctx.arc(screenX + 2, screenY - 25, 5, 0, Math.PI * 2);
        ctx.arc(screenX + 9, screenY - 19, 4, 0, Math.PI * 2);
        ctx.fill();

        // Nervaduras de hojas
        if (!hurt) {
          ctx.strokeStyle = '#8bd36a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX - 9, screenY - 23);
          ctx.lineTo(screenX - 5, screenY - 19);
          ctx.moveTo(screenX + 1, screenY - 27);
          ctx.lineTo(screenX + 4, screenY - 22);
          ctx.stroke();
        }

        // Astas de madera
        ctx.fillStyle = hurt ? '#ffaaaa' : '#67402a';
        ctx.beginPath();
        ctx.moveTo(screenX - 7, screenY - 20);
        ctx.lineTo(screenX - 14, screenY - 29);
        ctx.lineTo(screenX - 10, screenY - 17);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 7, screenY - 20);
        ctx.lineTo(screenX + 15, screenY - 28);
        ctx.lineTo(screenX + 11, screenY - 16);
        ctx.closePath();
        ctx.fill();

        // Aura elemental verde
        if (!hurt) {
          ctx.save();
          ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 250) * 0.06;
          ctx.fillStyle = '#00ff87';
          ctx.beginPath();
          ctx.arc(screenX, screenY - 7, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Ojo elemental
        ctx.fillStyle = hurt ? '#ffffff' : '#00e676';
        ctx.beginPath();
        ctx.arc(screenX + 1, screenY - 7, 4, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo del ojo
        ctx.fillStyle = '#eafff1';
        ctx.beginPath();
        ctx.arc(screenX + 2, screenY - 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Pequeños puntos de luz
        if (!hurt) {
          ctx.fillStyle = '#a5ffb9';
          ctx.beginPath();
          ctx.arc(screenX - 13, screenY - 12, 1.5, 0, Math.PI * 2);
          ctx.arc(screenX + 14, screenY - 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      default:
        // Apariencia de respaldo para tipos desconocidos
        ctx.fillStyle = hurt ? '#ff7777' : '#6c757d';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    // Barra de vida
    const barWidth = 36;
    const barHeight = 4;
    const hpPercent = Math.max(0, this.health / this.maxHealth);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(screenX - barWidth / 2 - 1, screenY - 33, barWidth + 2, barHeight + 2);

    ctx.fillStyle = '#451e25';
    ctx.fillRect(screenX - barWidth / 2, screenY - 32, barWidth, barHeight);

    ctx.fillStyle =
      hpPercent > 0.5 ? '#52d681' :
      hpPercent > 0.25 ? '#ffd166' : '#ff354f';

    ctx.fillRect(
      screenX - barWidth / 2,
      screenY - 32,
      barWidth * hpPercent,
      barHeight
    );

    // Nombre del enemigo con contorno
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(this.config.name, screenX, screenY - 37);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.config.name, screenX, screenY - 37);

    ctx.restore();
  }
}

