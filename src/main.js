import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');

  // Set internal canvas resolution to match window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize Game instance
  const game = new Game(canvas);

  // Start main loop
  requestAnimationFrame(timestamp => {
    game.loop(timestamp);
  });

  console.log('⚔️ Survival RPG: Mundo Abierto 2D inicializado correctamente.');
});
