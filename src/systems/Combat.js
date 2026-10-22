import { ITEMS_DATABASE } from './Inventory.js';

export class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  performPlayerAttack(player) {
    const attackReach = 55;
    let hitX = player.x;
    let hitY = player.y;

    if (player.direction === 0) hitY += 30; // Down
    else if (player.direction === 1) hitY -= 30; // Up
    else if (player.direction === 2) hitX -= 30; // Left
    else if (player.direction === 3) hitX += 30; // Right

    // Visual dust / slash particles
    if (this.game.particleSystem) {
      this.game.particleSystem.emit(hitX, hitY, 5, {
        color: '#ffffff',
        minSpeed: 40,
        maxSpeed: 100,
        size: 2.5
      });
    }

    let hitSomething = false;

    // 1. Check hitting Enemies
    for (const enemy of this.game.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - hitX, enemy.y - hitY);
      if (dist <= attackReach) {
        hitSomething = true;
        const rawDmg = player.getTotalAttack();
        const isCrit = Math.random() < 0.15;
        const finalDmg = isCrit ? Math.round(rawDmg * 1.5) : rawDmg;

        const knockbackAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        enemy.takeDamage(finalDmg, knockbackAngle, this.game);

        if (this.game.soundManager) this.game.soundManager.playHit();
        if (isCrit && this.game.particleSystem) {
          this.game.particleSystem.addFloatingText(enemy.x, enemy.y - 32, '¡CRÍTICO!', '#ffd700', 16);
        }
      }
    }

    // 2. Check hitting Boss
    if (this.game.boss && !this.game.boss.isDead) {
      const dist = Math.hypot(this.game.boss.x - hitX, this.game.boss.y - hitY);
      if (dist <= attackReach + 20) {
        hitSomething = true;
        const rawDmg = player.getTotalAttack();
        const isCrit = Math.random() < 0.15;
        const finalDmg = isCrit ? Math.round(rawDmg * 1.5) : rawDmg;

        this.game.boss.takeDamage(finalDmg, null, this.game);
        if (this.game.soundManager) this.game.soundManager.playHit();
      }
    }

    // 3. Check hitting Natural Resources (Trees, Rocks, etc.)
    const equippedWeapon = player.inventory.equipment.weapon;
    const toolType = equippedWeapon && ITEMS_DATABASE[equippedWeapon.id] ? ITEMS_DATABASE[equippedWeapon.id].toolType : null;

    for (const res of this.game.resources) {
      if (res.depleted) continue;
      const dist = Math.hypot(res.x - hitX, res.y - hitY);
      if (dist <= attackReach) {
        hitSomething = true;
        const drops = res.harvest(1, toolType);

        if (res.type === 'tree') {
          if (this.game.soundManager) this.game.soundManager.playChop();
          if (this.game.particleSystem) this.game.particleSystem.emitChopWood(res.x, res.y);
        } else if (res.type === 'rock' || res.type.includes('vein')) {
          if (this.game.soundManager) this.game.soundManager.playMine();
          if (this.game.particleSystem) this.game.particleSystem.emitMineStone(res.x, res.y);
        }

        // Spawn drops
        for (const drop of drops) {
          this.game.spawnDroppedItem(drop.id, drop.count, res.x, res.y);
          if (this.game.questSystem) {
            this.game.questSystem.onGather(drop.id, drop.count);
          }
        }
        break; // hit one resource node per swing
      }
    }
  }
}
