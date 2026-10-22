
import { Inventory, ITEMS_DATABASE } from '../systems/Inventory.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 36;
    this.speed = 150; // pixels per second
    this.runSpeed = 240;

    // Direction: 0: Down, 1: Up, 2: Left, 3: Right
    this.direction = 0;
    this.isMoving = false;
    this.isRunning = false;
    this.walkAnimTimer = 0;

    // Core RPG Stats
    this.name = 'Héroe';
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;

    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.maxHunger = 100;
    this.hunger = 100;
    this.maxThirst = 100;
    this.thirst = 100;

    this.baseAttack = 8;
    this.baseDefense = 2;
    this.coins = 20;

    // Inventory & Equipment
    this.inventory = new Inventory(24);
    // Give some starting starter items
    this.inventory.addItem('apple', 3);
    this.inventory.addItem('water_bottle', 2);
    this.inventory.addItem('wooden_sword', 1);

    // Equip starter weapon automatically
    this.inventory.equipItem(2);

    // Combat states
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0.38; // attack speed
    this.attackCooldownTimer = 0;
    this.isDead = false;
    this.hurtTimer = 0;
  }

  getTotalAttack() {
    let atk = this.baseAttack;
    const wep = this.inventory.equipment.weapon;
    if (wep && ITEMS_DATABASE[wep.id]) {
      atk += ITEMS_DATABASE[wep.id].attack || 0;
    }
    const acc = this.inventory.equipment.accessory;
    if (acc && ITEMS_DATABASE[acc.id]) {
      atk += ITEMS_DATABASE[acc.id].attack || 0;
    }
    return atk;
  }

  getTotalDefense() {
    let def = this.baseDefense;
    const arm = this.inventory.equipment.armor;
    if (arm && ITEMS_DATABASE[arm.id]) {
      def += ITEMS_DATABASE[arm.id].defense || 0;
    }
    const acc = this.inventory.equipment.accessory;
    if (acc && ITEMS_DATABASE[acc.id]) {
      def += ITEMS_DATABASE[acc.id].defense || 0;
    }
    return def;
  }

  addXP(amount, game = null) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.levelUp(game);
    }
  }

  levelUp(game = null) {
    this.level += 1;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    this.maxHealth += 15;
    this.health = this.maxHealth;
    this.baseAttack += 3;
    this.baseDefense += 2;
    this.stamina = this.maxStamina;

    if (game) {
      if (game.soundManager) game.soundManager.playLevelUp();
      if (game.particleSystem) game.particleSystem.emitLevelUp(this.x, this.y);
      if (game.hud) {
        game.hud.showToast(`¡SUBISTE AL NIVEL ${this.level}! Salud, Ataque y Defensa mejorados.`, 'toast-levelup');
      }
    }
  }

  takeDamage(amount, source = 'enemigo', game = null) {
    if (this.isDead) return;

    // Defense mitigates damage
    const def = this.getTotalDefense();
    const effectiveDmg = Math.max(1, Math.round(amount * (100 / (100 + def))));

    this.health = Math.max(0, this.health - effectiveDmg);
    this.hurtTimer = 0.25;

    if (game) {
      if (game.soundManager) game.soundManager.playHit();
      if (game.particleSystem) {
        game.particleSystem.emitHit(this.x, this.y);
        game.particleSystem.addFloatingText(this.x, this.y - 20, `-${effectiveDmg}`, '#ff4d6d', 18);
      }
    }

    if (this.health <= 0) {
      this.die(source, game);
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  feed(amount) {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  drink(amount) {
    this.thirst = Math.min(this.maxThirst, this.thirst + amount);
  }

  die(source, game = null) {
    this.isDead = true;
    if (game && game.onPlayerDeath) {
      game.onPlayerDeath(source);
    }
  }

  respawn(spawnX, spawnY) {
    this.x = spawnX;
    this.y = spawnY;
    this.health = this.maxHealth;
    this.hunger = 80;
    this.thirst = 80;
    this.stamina = this.maxStamina;
    this.isDead = false;
  }

  attack(game) {
    if (this.isAttacking || this.attackCooldownTimer > 0 || this.isDead) return;

    // Needs stamina to attack
    if (this.stamina < 5) return;
    this.stamina -= 5;

    this.isAttacking = true;
    this.attackTimer = 0.22;
    this.attackCooldownTimer = this.attackCooldown;

    if (game && game.soundManager) {
      game.soundManager.playAttack();
    }

    // Execute combat hitbox check
    if (game && game.combatSystem) {
      game.combatSystem.performPlayerAttack(this);
    }
  }

  update(dt, input, map, game) {
    if (this.isDead) return;

    // Attack cooldown timers
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
    }

    // Movement Input
    let dx = 0;
    let dy = 0;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      // Set facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 3 : 2; // Right or Left
      } else {
        this.direction = dy > 0 ? 0 : 1; // Down or Up
      }

      // Check sprint
      this.isRunning = (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) && this.stamina > 10;
      const currentSpeed = this.isRunning ? this.runSpeed : this.speed;

      // Normalize diagonal vector
      const length = Math.hypot(dx, dy);
      const moveX = (dx / length) * currentSpeed * dt;
      const moveY = (dy / length) * currentSpeed * dt;

      // Collision checks against map
      const newX = this.x + moveX;
      const newY = this.y + moveY;

      if (!map.isSolid(newX, this.y, 14)) {
        this.x = newX;
      }
      if (!map.isSolid(this.x, newY, 14)) {
        this.y = newY;
      }

      this.walkAnimTimer += dt * (this.isRunning ? 14 : 9);
    } else {
      this.isRunning = false;
      this.walkAnimTimer = 0;
    }

    // Attack input trigger
    if (input.isJustPressed('Space') || input.isMouseJustPressed()) {
      this.attack(game);
    }
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();

    // Animación de movimiento
    const bounceY = this.isMoving ? Math.sin(this.walkAnimTimer) * 2.5 : 0;
    const stepOffset = this.isMoving ? Math.sin(this.walkAnimTimer) * 3.5 : 0;
    const hurt = this.hurtTimer > 0;

    // Sombra mejorada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.beginPath();
    ctx.ellipse(screenX + 1, screenY + 15, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brillo de daño
    if (hurt) {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.14)';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY - 4, 20, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Botas con contorno
    ctx.fillStyle = '#24150d';
    ctx.beginPath();
    ctx.roundRect(screenX - 11, screenY + 10 + stepOffset, 10, 8, 2);
    ctx.roundRect(screenX + 1, screenY + 10 - stepOffset, 10, 8, 2);
    ctx.fill();

    const bootGradient = ctx.createLinearGradient(
      screenX - 10, screenY + 11,
      screenX + 10, screenY + 18
    );
    bootGradient.addColorStop(0, '#96613b');
    bootGradient.addColorStop(0.5, '#5b3822');
    bootGradient.addColorStop(1, '#352016');

    ctx.fillStyle = bootGradient;
    ctx.beginPath();
    ctx.roundRect(screenX - 10, screenY + 11 + stepOffset, 8, 5, 1.5);
    ctx.roundRect(screenX + 2, screenY + 11 - stepOffset, 8, 5, 1.5);
    ctx.fill();

    // Suelas
    ctx.strokeStyle = '#c18a54';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - 9, screenY + 16 + stepOffset);
    ctx.lineTo(screenX - 3, screenY + 16 + stepOffset);
    ctx.moveTo(screenX + 3, screenY + 16 - stepOffset);
    ctx.lineTo(screenX + 9, screenY + 16 - stepOffset);
    ctx.stroke();

    // Piernas
    const legGradient = ctx.createLinearGradient(
      screenX - 8, screenY + 2,
      screenX + 8, screenY + 13
    );
    legGradient.addColorStop(0, hurt ? '#ffaaaa' : '#536d86');
    legGradient.addColorStop(0.5, hurt ? '#ff6b6b' : '#293e55');
    legGradient.addColorStop(1, hurt ? '#d83b50' : '#172738');

    ctx.fillStyle = legGradient;
    ctx.beginPath();
    ctx.roundRect(screenX - 9, screenY + 3 + bounceY, 7, 11, 2);
    ctx.roundRect(screenX + 2, screenY + 3 + bounceY, 7, 11, 2);
    ctx.fill();

    // Contorno de las piernas
    ctx.strokeStyle = hurt ? '#ffb0b0' : '#17212b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cuerpo: contorno de la túnica
    ctx.fillStyle = hurt ? '#ff7777' : '#172b38';
    ctx.beginPath();
    ctx.roundRect(screenX - 12, screenY - 9 + bounceY, 24, 23, 4);
    ctx.fill();

    // Túnica con degradado
    const tunicGradient = ctx.createLinearGradient(
      screenX - 11, screenY - 8 + bounceY,
      screenX + 11, screenY + 12 + bounceY
    );
    tunicGradient.addColorStop(0, hurt ? '#ffbaba' : '#7eafc0');
    tunicGradient.addColorStop(0.35, hurt ? '#ff7777' : '#426f87');
    tunicGradient.addColorStop(0.75, hurt ? '#ed5656' : '#2b5069');
    tunicGradient.addColorStop(1, hurt ? '#bd3434' : '#1b3449');

    ctx.fillStyle = tunicGradient;
    ctx.beginPath();
    ctx.roundRect(screenX - 10, screenY - 8 + bounceY, 20, 20, 3);
    ctx.fill();

    // Hombros de la armadura
    ctx.fillStyle = hurt ? '#ffaaaa' : '#536e7e';
    ctx.beginPath();
    ctx.ellipse(screenX - 9, screenY - 5 + bounceY, 5, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(screenX + 9, screenY - 5 + bounceY, 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Brillos metálicos en los hombros
    if (!hurt) {
      ctx.strokeStyle = '#a9c8d6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX - 12, screenY - 6 + bounceY);
      ctx.lineTo(screenX - 8, screenY - 8 + bounceY);
      ctx.moveTo(screenX + 7, screenY - 8 + bounceY);
      ctx.lineTo(screenX + 11, screenY - 6 + bounceY);
      ctx.stroke();
    }

    // Costuras y textura de la túnica
    ctx.strokeStyle = hurt ? '#ffd0d0' : '#86a9b9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - 6, screenY - 3 + bounceY);
    ctx.lineTo(screenX - 6, screenY + 8 + bounceY);
    ctx.moveTo(screenX + 6, screenY - 3 + bounceY);
    ctx.lineTo(screenX + 6, screenY + 8 + bounceY);
    ctx.stroke();

    // Emblema del héroe
    ctx.fillStyle = hurt ? '#ffffff' : '#d9e9ef';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 4 + bounceY);
    ctx.lineTo(screenX + 3, screenY + bounceY);
    ctx.lineTo(screenX, screenY + 4 + bounceY);
    ctx.lineTo(screenX - 3, screenY + bounceY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hurt ? '#ffaaaa' : '#3d6076';
    ctx.beginPath();
    ctx.arc(screenX, screenY + bounceY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Cinturón de cuero
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(screenX - 10, screenY + 5 + bounceY, 20, 4);

    const beltGradient = ctx.createLinearGradient(
      screenX - 10, screenY + 5 + bounceY,
      screenX + 10, screenY + 9 + bounceY
    );
    beltGradient.addColorStop(0, '#d3aa68');
    beltGradient.addColorStop(0.5, '#a9783d');
    beltGradient.addColorStop(1, '#76502d');

    ctx.fillStyle = beltGradient;
    ctx.fillRect(screenX - 9, screenY + 5.5 + bounceY, 18, 2.5);

    // Hebilla
    ctx.fillStyle = '#f4d58d';
    ctx.fillRect(screenX - 2, screenY + 5 + bounceY, 4, 4);
    ctx.fillStyle = '#79522c';
    ctx.fillRect(screenX - 1, screenY + 6 + bounceY, 2, 2);

    // Brazos
    ctx.fillStyle = hurt ? '#ffaaaa' : '#b9825c';
    ctx.beginPath();
    ctx.roundRect(screenX - 14, screenY - 4 + bounceY, 5, 12, 2);
    ctx.roundRect(screenX + 9, screenY - 4 + bounceY, 5, 12, 2);
    ctx.fill();

    // Guantes de cuero
    ctx.fillStyle = hurt ? '#ff7777' : '#5c3925';
    ctx.beginPath();
    ctx.roundRect(screenX - 14, screenY + 5 + bounceY, 5, 5, 1.5);
    ctx.roundRect(screenX + 9, screenY + 5 + bounceY, 5, 5, 1.5);
    ctx.fill();

    // Cuello
    ctx.fillStyle = hurt ? '#ffaaaa' : '#c88f68';
    ctx.fillRect(screenX - 4, screenY - 14 + bounceY, 8, 7);

    // Cabeza con contorno
    ctx.fillStyle = hurt ? '#ff7777' : '#6c4430';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 15 + bounceY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Rostro con sombreado
    const faceGradient = ctx.createLinearGradient(
      screenX - 9, screenY - 24 + bounceY,
      screenX + 8, screenY - 7 + bounceY
    );
    faceGradient.addColorStop(0, hurt ? '#ffd0d0' : '#ffe0bd');
    faceGradient.addColorStop(0.6, hurt ? '#ffaaaa' : '#e8b58e');
    faceGradient.addColorStop(1, hurt ? '#ff7777' : '#b87957');

    ctx.fillStyle = faceGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 15 + bounceY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Orejas
    ctx.fillStyle = hurt ? '#ffaaaa' : '#d99e7b';
    ctx.beginPath();
    ctx.arc(screenX - 9, screenY - 15 + bounceY, 2.5, 0, Math.PI * 2);
    ctx.arc(screenX + 9, screenY - 15 + bounceY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cabello
    const hairGradient = ctx.createLinearGradient(
      screenX - 10, screenY - 26 + bounceY,
      screenX + 8, screenY - 16 + bounceY
    );
    hairGradient.addColorStop(0, hurt ? '#ffaaaa' : '#96653c');
    hairGradient.addColorStop(0.45, hurt ? '#ff7777' : '#5c3a21');
    hairGradient.addColorStop(1, hurt ? '#d83b50' : '#302016');

    ctx.fillStyle = hairGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 19 + bounceY, 10, Math.PI, Math.PI * 2);
    ctx.lineTo(screenX + 9, screenY - 17 + bounceY);
    ctx.lineTo(screenX + 5, screenY - 20 + bounceY);
    ctx.lineTo(screenX + 1, screenY - 17 + bounceY);
    ctx.lineTo(screenX - 3, screenY - 20 + bounceY);
    ctx.lineTo(screenX - 8, screenY - 17 + bounceY);
    ctx.closePath();
    ctx.fill();

    // Reflejos del cabello
    if (!hurt) {
      ctx.strokeStyle = '#c2925f';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(screenX - 5, screenY - 25 + bounceY);
      ctx.lineTo(screenX - 1, screenY - 27 + bounceY);
      ctx.moveTo(screenX + 1, screenY - 24 + bounceY);
      ctx.lineTo(screenX + 5, screenY - 26 + bounceY);
      ctx.stroke();
    }

    // Ojos según dirección
    ctx.fillStyle = '#f7f0db';

    if (this.direction === 0) {
      ctx.fillRect(screenX - 5, screenY - 16 + bounceY, 4, 4);
      ctx.fillRect(screenX + 1, screenY - 16 + bounceY, 4, 4);

      ctx.fillStyle = '#293b45';
      ctx.fillRect(screenX - 3, screenY - 15 + bounceY, 2, 3);
      ctx.fillRect(screenX + 2, screenY - 15 + bounceY, 2, 3);
    } else if (this.direction === 2) {
      ctx.fillStyle = '#f7f0db';
      ctx.fillRect(screenX - 7, screenY - 16 + bounceY, 4, 4);

      ctx.fillStyle = '#293b45';
      ctx.fillRect(screenX - 6, screenY - 15 + bounceY, 2, 3);
    } else if (this.direction === 3) {
      ctx.fillStyle = '#f7f0db';
      ctx.fillRect(screenX + 3, screenY - 16 + bounceY, 4, 4);

      ctx.fillStyle = '#293b45';
      ctx.fillRect(screenX + 4, screenY - 15 + bounceY, 2, 3);
    }

    // Cejas
    if (this.direction !== 1) {
      ctx.strokeStyle = hurt ? '#ffffff' : '#69442d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();

      if (this.direction === 0) {
        ctx.moveTo(screenX - 6, screenY - 18 + bounceY);
        ctx.lineTo(screenX - 2, screenY - 19 + bounceY);
        ctx.moveTo(screenX + 1, screenY - 19 + bounceY);
        ctx.lineTo(screenX + 5, screenY - 18 + bounceY);
      } else if (this.direction === 2) {
        ctx.moveTo(screenX - 8, screenY - 18 + bounceY);
        ctx.lineTo(screenX - 3, screenY - 18 + bounceY);
      } else if (this.direction === 3) {
        ctx.moveTo(screenX + 3, screenY - 18 + bounceY);
        ctx.lineTo(screenX + 8, screenY - 18 + bounceY);
      }

      ctx.stroke();
    }

    // Nariz y boca cuando mira hacia abajo
    if (this.direction === 0) {
      ctx.fillStyle = hurt ? '#ffffff' : '#bb7958';
      ctx.fillRect(screenX - 1, screenY - 12 + bounceY, 2, 2);

      ctx.strokeStyle = '#965b46';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX - 2, screenY - 9 + bounceY);
      ctx.lineTo(screenX + 2, screenY - 9 + bounceY);
      ctx.stroke();
    }

    // Capa corta
    if (this.direction === 1) {
      ctx.fillStyle = hurt ? '#ffaaaa' : '#263f52';
      ctx.beginPath();
      ctx.moveTo(screenX - 9, screenY - 6 + bounceY);
      ctx.lineTo(screenX + 9, screenY - 6 + bounceY);
      ctx.lineTo(screenX + 7, screenY + 7 + bounceY);
      ctx.lineTo(screenX, screenY + 11 + bounceY);
      ctx.lineTo(screenX - 7, screenY + 7 + bounceY);
      ctx.closePath();
      ctx.fill();

      if (!hurt) {
        ctx.strokeStyle = '#52768c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - 3 + bounceY);
        ctx.lineTo(screenX, screenY + 7 + bounceY);
        ctx.stroke();
      }
    }

    // Arma equipada
    const wep = this.inventory.equipment.weapon;
    const hasSword = wep && wep.id.includes('sword');

    if (this.isAttacking) {
      // Destello exterior del ataque
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#fff4bd';
      ctx.lineWidth = 10;
      ctx.beginPath();

      let arcStart = 0;
      let arcEnd = Math.PI;

      if (this.direction === 3) {
        arcStart = -Math.PI * 0.35;
        arcEnd = Math.PI * 0.35;
      } else if (this.direction === 2) {
        arcStart = Math.PI * 0.65;
        arcEnd = Math.PI * 1.35;
      } else if (this.direction === 0) {
        arcStart = Math.PI * 0.15;
        arcEnd = Math.PI * 0.85;
      } else if (this.direction === 1) {
        arcStart = Math.PI * 1.15;
        arcEnd = Math.PI * 1.85;
      }

      ctx.arc(screenX, screenY, 32, arcStart, arcEnd);
      ctx.stroke();
      ctx.restore();

      // Arco de espada
      ctx.strokeStyle = 'rgba(220, 245, 255, 0.95)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 32, arcStart, arcEnd);
      ctx.stroke();

      // Filo dorado
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 35, arcStart, arcEnd);
      ctx.stroke();

      // Brillos del golpe
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const angle = arcStart + (arcEnd - arcStart) * (i / 2);
        ctx.beginPath();
        ctx.arc(
          screenX + Math.cos(angle) * 32,
          screenY + Math.sin(angle) * 32,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Espada durante el ataque
      ctx.save();
      ctx.translate(screenX, screenY + bounceY);
      ctx.rotate(
        this.direction === 3 ? -0.65 :
        this.direction === 2 ? Math.PI + 0.65 :
        this.direction === 0 ? 1.1 : -1.1
      );

      // Empuñadura
      ctx.fillStyle = '#55351e';
      ctx.fillRect(8, -2, 10, 4);

      // Guarda
      ctx.fillStyle = '#e5bd69';
      ctx.fillRect(15, -5, 3, 10);

      // Hoja
      const bladeGradient = ctx.createLinearGradient(17, -3, 36, 3);
      bladeGradient.addColorStop(0, '#b9c9d4');
      bladeGradient.addColorStop(0.5, '#ffffff');
      bladeGradient.addColorStop(1, '#708da2');

      ctx.fillStyle = bladeGradient;
      ctx.beginPath();
      ctx.moveTo(17, -3);
      ctx.lineTo(34, -2);
      ctx.lineTo(39, 0);
      ctx.lineTo(34, 2);
      ctx.lineTo(17, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // Espada enfundada o sostenida al costado
      ctx.save();

      if (this.direction === 3 || this.direction === 2) {
        const facingLeft = this.direction === 2;
        ctx.translate(screenX + (facingLeft ? -11 : 11), screenY - 4 + bounceY);
        ctx.rotate(facingLeft ? Math.PI : 0);

        // Empuñadura
        ctx.fillStyle = '#4c2e1b';
        ctx.fillRect(0, -1.5, 5, 3);

        // Guarda metálica
        ctx.fillStyle = '#d7b56d';
        ctx.fillRect(4, -4, 2, 8);

        // Hoja
        const bladeGradient = ctx.createLinearGradient(6, -2, 19, 2);
        bladeGradient.addColorStop(0, '#8ea7b9');
        bladeGradient.addColorStop(0.5, '#f5fbff');
        bladeGradient.addColorStop(1, '#617e93');

        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.lineTo(17, -1.5);
        ctx.lineTo(21, 0);
        ctx.lineTo(17, 1.5);
        ctx.lineTo(6, 2);
        ctx.closePath();
        ctx.fill();

        // Reflejo del filo
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(7, -1);
        ctx.lineTo(17, -0.7);
        ctx.stroke();
      } else if (hasSword) {
        // Empuñadura visible cuando mira arriba o abajo
        ctx.fillStyle = '#56341f';
        ctx.fillRect(screenX + 9, screenY - 2 + bounceY, 4, 9);

        ctx.fillStyle = '#d7b56d';
        ctx.fillRect(screenX + 7, screenY + bounceY, 8, 2);
      }

      ctx.restore();
    }

    // Brillo sutil del personaje
    if (!hurt && this.isRunning) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#9ee7ff';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY - 2 + bounceY, 15, 23, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
