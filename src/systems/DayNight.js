
export class DayNightSystem {
  constructor() {
    this.day = 1;

    // Time in minutes of day (0..1440). Start at 08:00 AM
    this.time = 480;

    // 1 real second = 4.8 game minutes
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
    return this.time < 360 || this.time > 1200;
  }

  getFormattedTime() {
    const hours = Math.floor(this.time / 60);
    const minutes = Math.floor(this.time % 60);
    const padH = String(hours).padStart(2, '0');
    const padM = String(minutes).padStart(2, '0');

    return `${padH}:${padM}`;
  }

  getTimeIcon() {
    if (this.time >= 360 && this.time < 480) return '🌅';
    if (this.time >= 480 && this.time < 1140) return '☀️';
    if (this.time >= 1140 && this.time < 1260) return '🌇';

    return '🌙';
  }

  // Returns darkness alpha from 0 (day) to 0.35 (night)
  getDarknessAlpha() {
    // 08:00 to 18:00: daylight
    if (this.time >= 480 && this.time <= 1080) {
      return 0.0;
    }

    // 18:00 to 21:00: dusk
    if (this.time > 1080 && this.time <= 1260) {
      const progress = (this.time - 1080) / 180;
      return progress * 0.35;
    }

    // 21:00 to 05:00: night with reduced darkness
    if (this.time > 1260 || this.time < 300) {
      return 0.35;
    }

    // 05:00 to 08:00: dawn
    if (this.time >= 300 && this.time < 480) {
      const progress = (this.time - 300) / 180;
      return (1 - progress) * 0.35;
    }

    return 0.0;
  }

  renderLighting(ctx, camera, lights = []) {
    const alpha = this.getDarknessAlpha();

    // No darkness or night glow needed during broad daylight
    if (alpha <= 0.01) return;

    ctx.save();

    // Apply nighttime darkness to the screen
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(5, 7, 18, ${alpha})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Cut light areas out of the darkness overlay
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of lights) {
      const screenX = light.x - camera.x;
      const screenY = light.y - camera.y;

      // Skip lights outside the visible screen
      if (
        screenX + light.radius < 0 ||
        screenX - light.radius > ctx.canvas.width ||
        screenY + light.radius < 0 ||
        screenY - light.radius > ctx.canvas.height
      ) {
        continue;
      }

      // Slightly flickering light
      const flicker = Math.sin(Date.now() * 0.005 + light.x) * 0.06;
      const radius = Math.max(10, light.radius * (1 + flicker));

      const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        radius * 0.1,
        screenX,
        screenY,
        radius
      );

      gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.7})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw warm-colored glow over the cleared campfire light areas
    ctx.globalCompositeOperation = 'source-over';

    for (const light of lights) {
      if (light.type !== 'campfire') continue;

      const screenX = light.x - camera.x;
      const screenY = light.y - camera.y;

      // Skip campfires outside the visible screen
      if (
        screenX + light.radius < 0 ||
        screenX - light.radius > ctx.canvas.width ||
        screenY + light.radius < 0 ||
        screenY - light.radius > ctx.canvas.height
      ) {
        continue;
      }

      // Warm glow flickers gently with the fire
      const flicker = Math.sin(Date.now() * 0.008 + light.x) * 0.04;
      const radius = light.radius * (1 + flicker);

      const warmGradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        radius
      );

      warmGradient.addColorStop(0, 'rgba(255, 190, 90, 0.28)');
      warmGradient.addColorStop(0.2, 'rgba(255, 145, 55, 0.22)');
      warmGradient.addColorStop(0.5, 'rgba(255, 105, 25, 0.12)');
      warmGradient.addColorStop(0.8, 'rgba(230, 75, 15, 0.045)');
      warmGradient.addColorStop(1, 'rgba(230, 75, 15, 0)');

      ctx.fillStyle = warmGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Small orange core to emphasize the firelight
      const coreRadius = Math.max(8, radius * 0.12);
      const coreGradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        coreRadius
      );

      coreGradient.addColorStop(0, 'rgba(255, 220, 140, 0.30)');
      coreGradient.addColorStop(0.5, 'rgba(255, 130, 40, 0.16)');
      coreGradient.addColorStop(1, 'rgba(255, 100, 20, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  sleep() {
    this.time = 360;
    this.day += 1;
  }
}
