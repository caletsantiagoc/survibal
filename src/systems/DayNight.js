export class DayNightSystem {
  constructor() {
    this.day = 1;
    // Time in minutes of day (0..1440). Start at 08:00 AM (480 minutes)
    this.time = 480;
    // 1 real second = 4.8 game minutes -> full 24h day takes 300 seconds (5 min)
    this.timeSpeed = 4.8;
  }

  update(dt) {
    this.time += dt * this.timeSpeed;
    if (this.time >= 1440) {
      this.time -= 1440;
      this.day += 1;
    }
  }

  isNight() {
    return this.time < 360 || this.time > 1200; // before 6 AM or after 8 PM
  }

  getFormattedTime() {
    const hours = Math.floor(this.time / 60);
    const minutes = Math.floor(this.time % 60);
    const padH = String(hours).padStart(2, '0');
    const padM = String(minutes).padStart(2, '0');
    return `${padH}:${padM}`;
  }

  getTimeIcon() {
    if (this.time >= 360 && this.time < 480) return '🌅'; // sunrise
    if (this.time >= 480 && this.time < 1140) return '☀️'; // day
    if (this.time >= 1140 && this.time < 1260) return '🌇'; // sunset
    return '🌙'; // night
  }

  // Returns darkness alpha from 0 (day) to ~0.88 (deep night)
  getDarknessAlpha() {
    // 08:00 to 18:00 -> 0.0 (broad daylight)
    if (this.time >= 480 && this.time <= 1080) {
      return 0.0;
    }
    // 18:00 to 21:00 -> dusk (0.0 to 0.85)
    if (this.time > 1080 && this.time <= 1260) {
      const progress = (this.time - 1080) / 180;
      return progress * 0.85;
    }
    // 21:00 to 05:00 -> full night
    if (this.time > 1260 || this.time < 300) {
      return 0.88;
    }
    // 05:00 to 08:00 -> dawn (0.85 down to 0.0)
    if (this.time >= 300 && this.time < 480) {
      const progress = (this.time - 300) / 180;
      return (1 - progress) * 0.85;
    }
    return 0.0;
  }

  renderLighting(ctx, camera, lights = []) {
    const alpha = this.getDarknessAlpha();
    if (alpha <= 0.01) return; // No darkness to render

    ctx.save();
    // Fill entire screen with nighttime ambient color
    ctx.fillStyle = `rgba(5, 7, 18, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Carve out lights with 'destination-out' blend mode
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of lights) {
      const screenX = light.x - camera.x;
      const screenY = light.y - camera.y;

      // Skip if off-screen
      if (
        screenX + light.radius < 0 ||
        screenX - light.radius > ctx.canvas.width ||
        screenY + light.radius < 0 ||
        screenY - light.radius > ctx.canvas.height
      ) {
        continue;
      }

      // Add gentle flicker
      const flicker = (Math.sin(Date.now() * 0.005 + light.x) * 0.06);
      const rad = Math.max(10, light.radius * (1 + flicker));

      const grad = ctx.createRadialGradient(screenX, screenY, rad * 0.1, screenX, screenY, rad);
      grad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      grad.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.7})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  sleep() {
    this.time = 360; // Wake up at 06:00 AM
    this.day += 1;
  }
}
