export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  emit(x, y, count = 8, config = {}) {
    const {
      color = '#ffd166',
      minSpeed = 30,
      maxSpeed = 120,
      minLife = 0.3,
      maxLife = 0.8,
      size = 3,
      gravity = 60,
      shape = 'circle'
    } = config;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const life = minLife + Math.random() * (maxLife - minLife);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size,
        color,
        gravity,
        shape
      });
    }
  }

  // Pre-configured particle effects
  emitChopWood(x, y) {
    this.emit(x, y, 7, {
      color: '#a06030',
      size: 4,
      minSpeed: 40,
      maxSpeed: 100,
      gravity: 120,
      shape: 'rect'
    });
  }

  emitMineStone(x, y) {
    this.emit(x, y, 7, {
      color: '#adb5bd',
      size: 3,
      minSpeed: 50,
      maxSpeed: 130,
      gravity: 150,
      shape: 'rect'
    });
  }

  emitHit(x, y) {
    this.emit(x, y, 10, {
      color: '#e63946',
      size: 3.5,
      minSpeed: 60,
      maxSpeed: 150,
      gravity: 100
    });
  }

  emitLevelUp(x, y) {
    for (let i = 0; i < 35; i++) {
      const angle = (Math.PI * 2 * i) / 35;
      const speed = 70 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 1.2,
        maxLife: 1.2,
        size: 5,
        color: i % 2 === 0 ? '#ffd700' : '#c77dff',
        gravity: -30, // floats upwards
        shape: 'circle'
      });
    }
  }

  emitEmbers(x, y) {
    if (Math.random() > 0.4) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 5,
      vx: (Math.random() - 0.5) * 20,
      vy: -30 - Math.random() * 30,
      life: 0.9,
      maxLife: 0.9,
      size: 2.5,
      color: Math.random() > 0.5 ? '#ff7b00' : '#ffea00',
      gravity: -10,
      shape: 'circle'
    });
  }

  addFloatingText(x, y, text, color = '#fff', size = 16) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      life: 1.1,
      maxLife: 1.1,
      vy: -35
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  render(ctx, camera) {
    ctx.save();
    // Render particles
    for (const p of this.particles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;

      if (p.shape === 'rect') {
        ctx.fillRect(screenX - p.size / 2, screenY - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating combat text
    ctx.font = 'bold 15px "Cinzel", sans-serif';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const screenX = ft.x - camera.x;
      const screenY = ft.y - camera.y;
      const alpha = Math.max(0, ft.life / ft.maxLife);

      ctx.globalAlpha = alpha;
      // Outline for readability
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, screenX, screenY);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, screenX, screenY);
    }

    ctx.restore();
  }
}
