import { SaveSystem } from '../systems/SaveSystem.js';

export class MenuManager {
  constructor(game) {
    this.game = game;

    // Overlays & Modals
    this.mainMenu = document.getElementById('menu-overlay');
    this.pauseModal = document.getElementById('pause-modal');
    this.controlsModal = document.getElementById('controls-modal');
    this.gameOverOverlay = document.getElementById('gameover-overlay');
    this.deathReasonText = document.getElementById('death-reason-text');

    // Main Menu buttons
    this.btnStartNew = document.getElementById('btn-start-new-game');
    this.btnStartContinue = document.getElementById('btn-start-continue-game');
    this.btnMainControls = document.getElementById('btn-main-controls');

    // Pause Menu buttons
    this.btnResume = document.getElementById('btn-resume-game');
    this.btnSave = document.getElementById('btn-save-game');
    this.btnLoad = document.getElementById('btn-load-game');
    this.btnShowControls = document.getElementById('btn-show-controls');
    this.btnExitToMenu = document.getElementById('btn-exit-to-menu');

    // Death buttons
    this.btnRestart = document.getElementById('btn-restart-game');
    this.btnLoadDead = document.getElementById('btn-load-dead-game');

    this.initEvents();
  }

  initEvents() {
    // Main Menu
    this.btnStartNew.addEventListener('click', () => {
      this.mainMenu.style.display = 'none';
      this.game.startNewGame();
    });

    this.btnStartContinue.addEventListener('click', () => {
      if (SaveSystem.hasSave()) {
        this.mainMenu.style.display = 'none';
        this.game.loadSavedGame();
      } else {
        alert('No hay una partida guardada previamente. Iniciando nueva aventura.');
        this.mainMenu.style.display = 'none';
        this.game.startNewGame();
      }
    });

    this.btnMainControls.addEventListener('click', () => {
      this.controlsModal.style.display = 'flex';
    });

    // Pause Menu
    this.btnResume.addEventListener('click', () => {
      this.closePause();
    });

    this.btnSave.addEventListener('click', () => {
      const res = SaveSystem.save(this.game);
      if (res.success) {
        this.game.hud.showToast('¡Partida guardada correctamente! 💾', 'toast-loot');
      } else {
        this.game.hud.showToast('Error al guardar partida.', 'toast-danger');
      }
    });

    this.btnLoad.addEventListener('click', () => {
      const res = SaveSystem.load(this.game);
      if (res.success) {
        this.closePause();
        this.game.hud.showToast('¡Partida cargada exitosamente! 📂', 'toast-loot');
        this.game.hud.update();
      } else {
        this.game.hud.showToast(res.reason || 'Error al cargar.', 'toast-danger');
      }
    });

    this.btnShowControls.addEventListener('click', () => {
      this.controlsModal.style.display = 'flex';
    });

    this.btnExitToMenu.addEventListener('click', () => {
      this.closePause();
      this.mainMenu.style.display = 'flex';
      this.game.state = 'MENU';
    });

    // Game Over
    this.btnRestart.addEventListener('click', () => {
      this.gameOverOverlay.style.display = 'none';
      this.game.startNewGame();
    });

    this.btnLoadDead.addEventListener('click', () => {
      if (SaveSystem.hasSave()) {
        this.gameOverOverlay.style.display = 'none';
        this.game.loadSavedGame();
      } else {
        this.gameOverOverlay.style.display = 'none';
        this.game.startNewGame();
      }
    });

    // Generic Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.close;
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.style.display = 'none';
      });
    });
  }

  openPause() {
    this.pauseModal.style.display = 'flex';
    this.game.state = 'PAUSED';
  }

  closePause() {
    this.pauseModal.style.display = 'none';
    this.game.state = 'PLAYING';
  }

  togglePause() {
    if (this.pauseModal.style.display === 'flex') {
      this.closePause();
    } else {
      this.openPause();
    }
  }

  showGameOver(reason = 'enemigos') {
    this.deathReasonText.textContent = `Fuiste derrotado por: ${reason}.`;
    this.gameOverOverlay.style.display = 'flex';
    this.game.state = 'GAMEOVER';
  }
}
