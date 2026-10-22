import { ITEMS_DATABASE } from '../systems/Inventory.js';

export class QuestUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('quest-modal');
    this.container = document.getElementById('quest-log-container');
  }

  open() {
    this.modal.style.display = 'flex';
    this.refresh();
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

  refresh() {
    if (!this.game.questSystem) return;
    this.container.innerHTML = '';

    for (const q of this.game.questSystem.quests) {
      const card = document.createElement('div');
      card.className = `quest-card ${q.completed ? 'completed' : ''}`;

      const rewardItem = q.reward.item ? ITEMS_DATABASE[q.reward.item] : null;

      card.innerHTML = `
        <div class="quest-card-header">
          <span class="quest-name">${q.title}</span>
          <span style="font-weight:700; color:${q.completed ? '#52b788' : '#ffd166'}; font-size:0.85rem;">
            ${q.completed ? '✅ COMPLETADA' : `${q.current} / ${q.required}`}
          </span>
        </div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-reward">
          🎁 Recompensas: ${q.reward.xp} XP | ${q.reward.gold} 🪙 ${rewardItem ? `| ${rewardItem.icon} ${rewardItem.name}` : ''}
        </div>
      `;

      this.container.appendChild(card);
    }
  }
}
