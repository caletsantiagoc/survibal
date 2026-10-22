import { WORLD_WIDTH, WORLD_HEIGHT } from '../world/Map.js';

export class MapUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('map-modal');
    this.canvas = document.getElementById('full-map-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  }

  open() {
    this.modal.style.display = 'flex';
    this.render();
  }

  close() {
    this.modal.style.display = 'none';
  }

  isOpen() {
    return this.modal.style.display === 'flex';
  }

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Base Meadow
    ctx.fillStyle = '#4f8a3d';
    ctx.fillRect(0, 0, w, h);

    // 2. Lake (South-West)
    ctx.fillStyle = '#0077b6';
    ctx.beginPath();
    ctx.ellipse(w * 0.22, h * 0.78, w * 0.16, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0c080'; // sand border
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Dense Forest (North-West)
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(w * 0.05, h * 0.12, w * 0.42, h * 0.45);

    // 4. Rocky Mountains (North-East)
    ctx.fillStyle = '#6c757d';
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.48);
    ctx.lineTo(w * 0.85, h * 0.06);
    ctx.lineTo(w * 0.98, h * 0.48);
    ctx.closePath();
    ctx.fill();

    // 5. Cursed Wastes / Boss Arena (North-Center)
    ctx.fillStyle = '#3a0ca3';
    ctx.beginPath();
    ctx.ellipse(w * 0.46, h * 0.18, w * 0.22, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Village (South-East)
    ctx.fillStyle = '#b08968';
    ctx.fillRect(w * 0.68, h * 0.64, w * 0.26, h * 0.28);
    ctx.strokeStyle = '#7f4f24';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.68, h * 0.64, w * 0.26, h * 0.28);

    // Zone Labels
    ctx.font = 'bold 12px "Cinzel", sans-serif';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.fillText('🌲 Bosque Ancestral', w * 0.26, h * 0.32);
    ctx.fillText('⛰️ Montañas Rocosas', w * 0.84, h * 0.30);
    ctx.fillText('💧 Lago Cristalino', w * 0.22, h * 0.80);
    ctx.fillText('🏡 Aldea Esperanza', w * 0.81, h * 0.78);
    ctx.fillText('🌾 Pradera Central', w * 0.50, h * 0.55);

    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('💀 Zona Peligrosa (Boss)', w * 0.46, h * 0.18);

    // Boss Icon
    if (this.game.boss && !this.game.boss.isDead) {
      const bx = (this.game.boss.x / WORLD_WIDTH) * w;
      const by = (this.game.boss.y / WORLD_HEIGHT) * h;
      ctx.font = '16px sans-serif';
      ctx.fillText('👹', bx, by);
    }

    // Player Pin Marker
    const px = (this.game.player.x / WORLD_WIDTH) * w;
    const py = (this.game.player.y / WORLD_HEIGHT) * h;

    // Glowing ring
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('📍 Tú', px, py - 10);
  }
}
