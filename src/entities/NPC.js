export class NPC {
  constructor(id, name, role, x, y, options = {}) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.x = x;
    this.y = y;
    this.portrait = options.portrait || '🧙‍♂️';
    this.dialogue = options.dialogue || 'Hola, viajero.';
    this.color = options.color || '#4361ee';
    this.shopItems = options.shopItems || [];
    this.canHeal = options.canHeal || false;
  }

  interact(game) {
    if (game.dialogueUI) {
      game.dialogueUI.open(this);
    }
    if (game.questSystem) {
      game.questSystem.onTalk(this.id);
    }
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

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
    ctx.ellipse(screenX, screenY + 12, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body / Robe
    ctx.fillStyle = this.color;
    ctx.fillRect(screenX - 9, screenY - 6, 18, 18);

    // Head
    ctx.fillStyle = '#fcd5b5';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 14, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hat / Hair / Beard
    if (this.id === 'eldrin') {
      // Wizard hat & white beard
      ctx.fillStyle = '#3a0ca3';
      ctx.beginPath();
      ctx.moveTo(screenX - 10, screenY - 18);
      ctx.lineTo(screenX + 10, screenY - 18);
      ctx.lineTo(screenX, screenY - 32);
      ctx.fill();

      // White beard
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(screenX - 5, screenY - 10, 10, 8);
    } else if (this.id === 'thorgar') {
      // Blacksmith apron
      ctx.fillStyle = '#7f4f24';
      ctx.fillRect(screenX - 6, screenY - 4, 12, 14);
    } else if (this.id === 'lyra') {
      // Healer green hood
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.arc(screenX, screenY - 16, 9, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Overhead tag
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, screenX, screenY - 26);

    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#cad2c5';
    ctx.fillText(`[${this.role}]`, screenX, screenY - 37);

    ctx.restore();
  }
}
