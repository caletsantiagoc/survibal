export class SurvivalSystem {
  constructor(player) {
    this.player = player;
    this.hungerTimer = 0;
    this.thirstTimer = 0;
    this.damageTimer = 0;
    this.regenTimer = 0;
  }

  update(dt) {
    if (!this.player || this.player.isDead) return;

    // Decay rates per second:
    // Base hunger rate: ~1.2 per 10 seconds. Slower when idle, faster when running.
    const runningMultiplier = this.player.isRunning ? 2.5 : 1.0;
    this.hungerTimer += dt;
    if (this.hungerTimer >= 3.0) {
      this.hungerTimer = 0;
      this.player.hunger = Math.max(0, this.player.hunger - 0.4 * runningMultiplier);
    }

    // Base thirst rate: ~1.8 per 10 seconds. Slower when idle, faster when running.
    this.thirstTimer += dt;
    if (this.thirstTimer >= 2.5) {
      this.thirstTimer = 0;
      this.player.thirst = Math.max(0, this.player.thirst - 0.5 * runningMultiplier);
    }

    // Stamina Handling:
    // If running, stamina drains by 20/s.
    // If not running, stamina recovers by 15/s.
    if (this.player.isRunning) {
      this.player.stamina = Math.max(0, this.player.stamina - 20 * dt);
      if (this.player.stamina <= 0) {
        this.player.isRunning = false; // forced to walk
      }
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 16 * dt);
    }

    // Health penalties for starvation or dehydration
    if (this.player.hunger <= 0 || this.player.thirst <= 0) {
      this.damageTimer += dt;
      if (this.damageTimer >= 2.0) {
        this.damageTimer = 0;
        let penalty = 0;
        if (this.player.hunger <= 0) penalty += 3;
        if (this.player.thirst <= 0) penalty += 4;
        this.player.takeDamage(penalty, 'hambre/deshidratación');
      }
    } else {
      this.damageTimer = 0;
    }

    // Health Regeneration when well nourished
    if (this.player.hunger >= 80 && this.player.thirst >= 80 && this.player.health < this.player.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 2.5) {
        this.regenTimer = 0;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
      }
    } else {
      this.regenTimer = 0;
    }
  }
}
