
import { Enemy } from './Enemy.js';

export class Boss {
  constructor(id, x, y) {
    this.id = id;
    this.name = 'Guardián del Bosque';
    this.type = 'boss';
    this.x = x;
    this.y = y;
    this.radius = 32;

    this.maxHealth = 320;
    this.health = this.maxHealth;
    this.damage = 25;
    this.speed = 85;

    this.attackTimer = 0;
    this.slamTimer = 6;
    this.isSlamCharging = false;
    this.slamChargeTime = 0;

    this.hasSummonedMinions = false;
    this.isEnraged = false;
    this.isDead = false;
    this.hurtTimer = 0;
    this.glowTick = 0;
  }

  takeDamage(amount, knockbackAngle = null, game = null) {
    if (this.isDead) return;

    this.health -= amount;
    this.hurtTimer = 0.2;

    if (game && game.particleSystem) {
      game.particleSystem.emitHit(this.x, this.y);
      game.particleSystem.addFloatingText(this.x, this.y - 45, `-${amount}`, '#ff1744', 22);
    }

    // Check enrage threshold (30% HP)
    if (!this.isEnraged && this.health <= this.maxHealth * 0.3) {
      this.isEnraged = true;
      this.speed = 120;
      this.damage = 32;
      if (game && game.soundManager) game.soundManager.playBossRoar();
      if (game && game.hud) game.hud.showToast('¡El Guardián del Bosque entra en Furia Salvaje!', 'toast-danger');
    }

    if (this.health <= 0) {
      this.die(game);
    }
  }

  die(game = null) {
    this.isDead = true;
    this.health = 0;

    if (game) {
      // Massive rewards
      if (game.player) {
        game.player.addXP(500, game);
        game.player.coins += 100;
        if (game.particleSystem) {
          game.particleSystem.addFloatingText(this.x, this.y - 50, '+500 XP  +100 🪙', '#ffd700', 20);
        }
      }

      // Drop Legendary items
      game.spawnDroppedItem('sylvan_blade', 1, this.x - 20, this.y);
      game.spawnDroppedItem('forest_crown', 1, this.x + 20, this.y);
      game.spawnDroppedItem('gold_ore', 5, this.x, this.y + 20);

      if (game.soundManager) {
        game.soundManager.playQuestComplete();
      }

      if (game.hud) {
        game.hud.showToast('¡HAS DERROTADO AL GUARDIÁN DEL BOSQUE!', 'toast-levelup');
        game.hud.hideBossBar();
      }

      // Quest trigger
      if (game.questSystem) {
        game.questSystem.onKill('boss');
      }
    }
  }

  performSlam(game) {
    if (!game) return;

    if (game.soundManager) game.soundManager.playBossRoar();
    if (game.particleSystem) {
      // Ground shockwave particles
      for (let i = 0; i < 40; i++) {
        const ang = (Math.PI * 2 * i) / 40;
        game.particleSystem.emit(this.x, this.y, 1, {
          color: '#2d6a4f',
          minSpeed: 100,
          maxSpeed: 200,
          gravity: 0
        });
      }
    }

    // AOE damage to player if in range
    const dist = Math.hypot(game.player.x - this.x, game.player.y - this.y);
    if (dist < 130) {
      game.player.takeDamage(35, this.name, game);
      // Push back player
      const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
      game.player.x += Math.cos(angle) * 35;
      game.player.y += Math.sin(angle) * 35;
    }
  }

  update(dt, player, map, game) {
    if (this.isDead) return;

    this.glowTick += dt * 4;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // Update Boss HUD display based on proximity
    if (game && game.hud) {
      if (distToPlayer <= 420 && !this.isDead) {
        game.hud.showBossBar(this.name, this.health, this.maxHealth);
      } else {
        game.hud.hideBossBar();
      }
    }

    // Minion summon at 50% HP
    if (!this.hasSummonedMinions && this.health <= this.maxHealth * 0.5) {
      this.hasSummonedMinions = true;
      if (game) {
        game.enemies.push(new Enemy(Date.now() + 1, 'wolf', this.x - 50, this.y));
        game.enemies.push(new Enemy(Date.now() + 2, 'wolf', this.x + 50, this.y));
        if (game.hud) game.hud.showToast('¡El Guardián ha invocado lobos salvajes!', 'toast-danger');
      }
    }

    // Slam Attack Logic
    this.slamTimer -= dt;
    if (this.slamTimer <= 0 && !this.isSlamCharging && distToPlayer < 250) {
      this.isSlamCharging = true;
      this.slamChargeTime = 1.0;
    }

    if (this.isSlamCharging) {
      this.slamChargeTime -= dt;
      if (this.slamChargeTime <= 0) {
        this.isSlamCharging = false;
        this.slamTimer = 7.0;
        this.performSlam(game);
      }
      return; // Standing still while charging slam
    }

    // Normal Chase & Melee
    if (distToPlayer <= 380 && !player.isDead) {
      if (distToPlayer <= 50) {
        if (this.attackTimer <= 0) {
          this.attackTimer = 1.2;
          player.takeDamage(this.damage, this.name, game);
        }
      } else {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const moveX = Math.cos(angle) * this.speed * dt;
        const moveY = Math.sin(angle) * this.speed * dt;

        if (!map.isSolid(this.x + moveX, this.y, 24)) this.x += moveX;
        if (!map.isSolid(this.x, this.y + moveY, 24)) this.y += moveY;
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();

    const hurt = this.hurtTimer > 0;
    const enraged = this.isEnraged;
    const charging = this.isSlamCharging;
    const pulse = Math.sin(this.glowTick);
    const coreColor = enraged ? '#ff1744' : '#00ff9d';

    // Sombra profunda
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(screenX + 2, screenY + 29, 39, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura exterior animada
    ctx.save();
    ctx.globalAlpha = 0.13 + Math.sin(this.glowTick * 0.7) * 0.04;
    ctx.fillStyle = enraged ? '#ff003c' : '#00e676';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 8, 48 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aura de ataque cargado o furia
    if (enraged || charging) {
      const auraColor = charging
        ? 'rgba(255, 183, 3, 0.35)'
        : 'rgba(230, 25, 60, 0.35)';

      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(
        screenX,
        screenY - 7,
        (charging ? 50 : 45) + Math.sin(this.glowTick * 2) * 5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Anillo mágico
      ctx.strokeStyle = charging ? '#ffd166' : '#ff3155';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(
        screenX,
        screenY + 20,
        35 + Math.sin(this.glowTick * 2) * 3,
        10,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Raíces inferiores
    ctx.fillStyle = hurt ? '#ff7777' : '#392317';
    ctx.beginPath();
    ctx.moveTo(screenX - 16, screenY + 12);
    ctx.lineTo(screenX - 28, screenY + 25);
    ctx.lineTo(screenX - 14, screenY + 21);
    ctx.lineTo(screenX - 7, screenY + 13);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + 12, screenY + 12);
    ctx.lineTo(screenX + 28, screenY + 24);
    ctx.lineTo(screenX + 16, screenY + 21);
    ctx.lineTo(screenX + 7, screenY + 13);
    ctx.closePath();
    ctx.fill();

    // Piernas de madera
    const legGradient = ctx.createLinearGradient(
      screenX - 20, screenY + 5,
      screenX + 20, screenY + 25
    );
    legGradient.addColorStop(0, hurt ? '#ffaaaa' : '#795033');
    legGradient.addColorStop(0.5, hurt ? '#ff6b6b' : '#42291b');
    legGradient.addColorStop(1, hurt ? '#d63b50' : '#241710');

    ctx.fillStyle = legGradient;
    ctx.beginPath();
    ctx.moveTo(screenX - 17, screenY + 4);
    ctx.lineTo(screenX - 3, screenY + 5);
    ctx.lineTo(screenX - 5, screenY + 22);
    ctx.lineTo(screenX - 17, screenY + 25);
    ctx.lineTo(screenX - 21, screenY + 18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + 3, screenY + 5);
    ctx.lineTo(screenX + 17, screenY + 4);
    ctx.lineTo(screenX + 21, screenY + 18);
    ctx.lineTo(screenX + 16, screenY + 25);
    ctx.lineTo(screenX + 5, screenY + 22);
    ctx.closePath();
    ctx.fill();

    // Contorno de las piernas
    ctx.strokeStyle = hurt ? '#ffb0b0' : '#24160f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brazos gigantes de madera
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = hurt ? '#ff7777' : '#2b1b12';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(screenX - 17, screenY - 12);
    ctx.lineTo(screenX - 29, screenY + 2);
    ctx.moveTo(screenX + 17, screenY - 12);
    ctx.lineTo(screenX + 29, screenY + 2);
    ctx.stroke();

    // Superficie de los brazos
    ctx.strokeStyle = hurt ? '#ffaaaa' : '#795033';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(screenX - 17, screenY - 12);
    ctx.lineTo(screenX - 28, screenY + 1);
    ctx.moveTo(screenX + 17, screenY - 12);
    ctx.lineTo(screenX + 28, screenY + 1);
    ctx.stroke();

    // Dedos en forma de raíces
    ctx.strokeStyle = hurt ? '#ff9999' : '#4a2d1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX - 28, screenY + 1);
    ctx.lineTo(screenX - 34, screenY + 7);
    ctx.moveTo(screenX - 28, screenY + 1);
    ctx.lineTo(screenX - 21, screenY + 7);
    ctx.moveTo(screenX + 28, screenY + 1);
    ctx.lineTo(screenX + 34, screenY + 7);
    ctx.moveTo(screenX + 28, screenY + 1);
    ctx.lineTo(screenX + 21, screenY + 7);
    ctx.stroke();

    // Contorno del torso
    ctx.fillStyle = hurt ? '#ff7777' : '#21150f';
    ctx.beginPath();
    ctx.roundRect(screenX - 24, screenY - 23, 48, 48, 8);
    ctx.fill();

    // Torso con degradado
    const bodyGradient = ctx.createLinearGradient(
      screenX - 23, screenY - 22,
      screenX + 23, screenY + 22
    );
    bodyGradient.addColorStop(0, hurt ? '#ffc0c0' : '#a87545');
    bodyGradient.addColorStop(0.24, hurt ? '#ff7777' : '#795033');
    bodyGradient.addColorStop(0.58, hurt ? '#e85a5a' : '#513522');
    bodyGradient.addColorStop(1, hurt ? '#bd3434' : '#2b1b12');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(screenX - 21, screenY - 21, 42, 44, 6);
    ctx.fill();

    // Placas de corteza de la armadura
    ctx.fillStyle = hurt ? '#ffaaaa' : '#3b2518';
    ctx.beginPath();
    ctx.moveTo(screenX - 20, screenY - 15);
    ctx.lineTo(screenX - 7, screenY - 20);
    ctx.lineTo(screenX - 2, screenY - 9);
    ctx.lineTo(screenX - 15, screenY - 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + 20, screenY - 15);
    ctx.lineTo(screenX + 7, screenY - 20);
    ctx.lineTo(screenX + 2, screenY - 9);
    ctx.lineTo(screenX + 15, screenY - 5);
    ctx.closePath();
    ctx.fill();

    // Textura de madera en el pecho
    ctx.strokeStyle = hurt ? '#ffd0d0' : '#b17b49';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX - 15, screenY - 1);
    ctx.lineTo(screenX - 10, screenY + 5);
    ctx.lineTo(screenX - 14, screenY + 11);
    ctx.moveTo(screenX + 13, screenY - 3);
    ctx.lineTo(screenX + 8, screenY + 3);
    ctx.lineTo(screenX + 13, screenY + 9);
    ctx.stroke();

    // Musgo sobre la armadura
    if (!hurt) {
      ctx.fillStyle = '#246b38';
      ctx.beginPath();
      ctx.ellipse(screenX - 15, screenY - 12, 7, 3, -0.4, 0, Math.PI * 2);
      ctx.ellipse(screenX + 14, screenY + 12, 6, 3, 0.5, 0, Math.PI * 2);
      ctx.ellipse(screenX - 14, screenY + 15, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#62a84f';
      ctx.beginPath();
      ctx.arc(screenX - 16, screenY - 13, 2, 0, Math.PI * 2);
      ctx.arc(screenX + 13, screenY + 11, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Placa central del pecho
    ctx.fillStyle = hurt ? '#ffaaaa' : '#342015';
    ctx.beginPath();
    ctx.moveTo(screenX - 10, screenY - 8);
    ctx.lineTo(screenX + 10, screenY - 8);
    ctx.lineTo(screenX + 13, screenY + 8);
    ctx.lineTo(screenX, screenY + 14);
    ctx.lineTo(screenX - 13, screenY + 8);
    ctx.closePath();
    ctx.fill();

    // Núcleo mágico: resplandor exterior
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(this.glowTick * 1.7) * 0.1;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY + 2, 15 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Núcleo de cristal
    const coreGradient = ctx.createRadialGradient(
      screenX - 3, screenY - 1, 1,
      screenX, screenY + 2, 9
    );
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.25, coreColor);
    coreGradient.addColorStop(1, enraged ? '#8c002b' : '#087c50');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 8);
    ctx.lineTo(screenX + 7, screenY - 2);
    ctx.lineTo(screenX + 5, screenY + 7);
    ctx.lineTo(screenX, screenY + 10);
    ctx.lineTo(screenX - 5, screenY + 7);
    ctx.lineTo(screenX - 7, screenY - 2);
    ctx.closePath();
    ctx.fill();

    // Anillos alrededor del núcleo
    ctx.strokeStyle = hurt ? '#ffffff' : coreColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      screenX,
      screenY + 2,
      11 + Math.sin(this.glowTick) * 1.5,
      5,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Cuello
    ctx.fillStyle = hurt ? '#ffaaaa' : '#42291b';
    ctx.fillRect(screenX - 10, screenY - 29, 20, 13);

    // Cabeza con contorno
    ctx.fillStyle = hurt ? '#ff7777' : '#24170f';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 29, 20, 0, Math.PI * 2);
    ctx.fill();

    const headGradient = ctx.createLinearGradient(
      screenX - 17, screenY - 46,
      screenX + 17, screenY - 12
    );
    headGradient.addColorStop(0, hurt ? '#ffc0c0' : '#a87545');
    headGradient.addColorStop(0.45, hurt ? '#ff7777' : '#70472e');
    headGradient.addColorStop(1, hurt ? '#d63b50' : '#382317');

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 29, 17, 0, Math.PI * 2);
    ctx.fill();

    // Placas de la frente
    ctx.fillStyle = hurt ? '#ffaaaa' : '#382317';
    ctx.beginPath();
    ctx.moveTo(screenX - 12, screenY - 38);
    ctx.lineTo(screenX - 4, screenY - 45);
    ctx.lineTo(screenX + 1, screenY - 36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + 12, screenY - 38);
    ctx.lineTo(screenX + 4, screenY - 45);
    ctx.lineTo(screenX - 1, screenY - 36);
    ctx.closePath();
    ctx.fill();

    // Cuernos de ramas gruesas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = hurt ? '#ff9999' : '#21150e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(screenX - 11, screenY - 40);
    ctx.lineTo(screenX - 20, screenY - 49);
    ctx.lineTo(screenX - 27, screenY - 61);
    ctx.moveTo(screenX - 20, screenY - 49);
    ctx.lineTo(screenX - 31, screenY - 48);

    ctx.moveTo(screenX + 11, screenY - 40);
    ctx.lineTo(screenX + 20, screenY - 49);
    ctx.lineTo(screenX + 27, screenY - 61);
    ctx.moveTo(screenX + 20, screenY - 49);
    ctx.lineTo(screenX + 31, screenY - 48);
    ctx.stroke();

    // Superficie de los cuernos
    ctx.strokeStyle = hurt ? '#ffc0c0' : '#795033';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX - 12, screenY - 41);
    ctx.lineTo(screenX - 20, screenY - 49);
    ctx.lineTo(screenX - 27, screenY - 60);
    ctx.moveTo(screenX - 20, screenY - 49);
    ctx.lineTo(screenX - 30, screenY - 48);

    ctx.moveTo(screenX + 12, screenY - 41);
    ctx.lineTo(screenX + 20, screenY - 49);
    ctx.lineTo(screenX + 27, screenY - 60);
    ctx.moveTo(screenX + 20, screenY - 49);
    ctx.lineTo(screenX + 30, screenY - 48);
    ctx.stroke();

    // Brotes verdes en las ramas
    if (!hurt) {
      ctx.fillStyle = '#48a84d';
      ctx.beginPath();
      ctx.ellipse(screenX - 25, screenY - 55, 4, 2, -0.8, 0, Math.PI * 2);
      ctx.ellipse(screenX + 25, screenY - 55, 4, 2, 0.8, 0, Math.PI * 2);
      ctx.ellipse(screenX - 30, screenY - 47, 3, 2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(screenX + 30, screenY - 47, 3, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Máscara natural sobre la cara
    ctx.fillStyle = hurt ? '#ffaaaa' : '#3c271a';
    ctx.beginPath();
    ctx.moveTo(screenX - 15, screenY - 29);
    ctx.lineTo(screenX - 9, screenY - 36);
    ctx.lineTo(screenX, screenY - 32);
    ctx.lineTo(screenX + 9, screenY - 36);
    ctx.lineTo(screenX + 15, screenY - 29);
    ctx.lineTo(screenX + 9, screenY - 20);
    ctx.lineTo(screenX, screenY - 17);
    ctx.lineTo(screenX - 9, screenY - 20);
    ctx.closePath();
    ctx.fill();

    // Ojos: brillo exterior
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(screenX - 7, screenY - 29, 7, 0, Math.PI * 2);
    ctx.arc(screenX + 7, screenY - 29, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ojos luminosos
    const eyeGradient = ctx.createRadialGradient(
      screenX, screenY - 29, 1,
      screenX, screenY - 29, 5
    );
    eyeGradient.addColorStop(0, '#ffffff');
    eyeGradient.addColorStop(0.35, hurt ? '#ffffff' : coreColor);
    eyeGradient.addColorStop(1, enraged ? '#ff003c' : '#008f58');

    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.ellipse(screenX - 7, screenY - 29, 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(screenX + 7, screenY - 29, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grietas luminosas en la frente
    ctx.strokeStyle = hurt ? '#ffffff' : coreColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 43);
    ctx.lineTo(screenX - 3, screenY - 37);
    ctx.lineTo(screenX + 1, screenY - 34);
    ctx.stroke();

    // Mandíbula de madera
    ctx.fillStyle = hurt ? '#ffaaaa' : '#4b3020';
    ctx.beginPath();
    ctx.moveTo(screenX - 9, screenY - 21);
    ctx.lineTo(screenX, screenY - 17);
    ctx.lineTo(screenX + 9, screenY - 21);
    ctx.lineTo(screenX + 6, screenY - 15);
    ctx.lineTo(screenX - 6, screenY - 15);
    ctx.closePath();
    ctx.fill();

    // Colmillos de raíz
    ctx.fillStyle = '#d7c6a0';
    ctx.beginPath();
    ctx.moveTo(screenX - 5, screenY - 20);
    ctx.lineTo(screenX - 3, screenY - 16);
    ctx.lineTo(screenX - 1, screenY - 20);
    ctx.moveTo(screenX + 2, screenY - 20);
    ctx.lineTo(screenX + 4, screenY - 16);
    ctx.lineTo(screenX + 6, screenY - 20);
    ctx.fill();

    // Partículas mágicas decorativas
    if (!hurt) {
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.75;

      for (let i = 0; i < 6; i++) {
        const angle = this.glowTick + (Math.PI * 2 * i) / 6;
        const orbitX = screenX + Math.cos(angle) * 34;
        const orbitY = screenY - 7 + Math.sin(angle) * 24;

        ctx.beginPath();
        ctx.arc(orbitX, orbitY, i % 2 === 0 ? 2 : 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    // Indicador visual de carga del golpe
    if (charging) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        screenX,
        screenY,
        48 + Math.sin(this.glowTick * 3) * 3,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.fillStyle = '#fff1b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡GOLPE!', screenX, screenY - 67);
    }

    // Efecto de daño
    if (hurt) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenX, screenY - 12, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
