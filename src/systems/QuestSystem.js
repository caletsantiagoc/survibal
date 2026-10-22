import { ITEMS_DATABASE } from './Inventory.js';

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.quests = [
      {
        id: 'quest_wood',
        title: 'Primeros Pasos en el Bosque',
        desc: 'Para sobrevivir necesitas recursos primordiales. Acércate a los árboles y recolecta madera.',
        targetType: 'gather',
        targetId: 'wood',
        required: 10,
        current: 0,
        completed: false,
        reward: { xp: 60, gold: 20, item: 'stone_axe', count: 1 }
      },
      {
        id: 'quest_campfire',
        title: 'Al Calor del Fuego',
        desc: 'Construye y coloca una fogata para protegerte del frío nocturno y cocinar alimentos.',
        targetType: 'build',
        targetId: 'campfire',
        required: 1,
        current: 0,
        completed: false,
        reward: { xp: 80, gold: 25, item: 'cooked_meat', count: 3 }
      },
      {
        id: 'quest_wolves',
        title: 'Amenaza Salvaje',
        desc: 'Los lobos salvajes merodean el bosque. Defiéndete y derrota a 3 de ellos.',
        targetType: 'kill',
        targetId: 'wolf',
        required: 3,
        current: 0,
        completed: false,
        reward: { xp: 120, gold: 40, item: 'potion_health', count: 2 }
      },
      {
        id: 'quest_village',
        title: 'El Refugio de la Aldea',
        desc: 'Encuentra la aldea de comerciantes al este del mapa y habla con el sabio Anciano Eldrin.',
        targetType: 'talk',
        targetId: 'eldrin',
        required: 1,
        current: 0,
        completed: false,
        reward: { xp: 160, gold: 50, item: 'leather_armor', count: 1 }
      },
      {
        id: 'quest_boss',
        title: 'El Despertar del Guardián',
        desc: 'Viaja a la Zona Peligrosa corrupta al norte y derrota al temible Guardián del Bosque.',
        targetType: 'kill',
        targetId: 'boss',
        required: 1,
        current: 0,
        completed: false,
        reward: { xp: 500, gold: 120, item: 'forest_crown', count: 1 }
      }
    ];
  }

  getActiveQuest() {
    return this.quests.find(q => !q.completed) || this.quests[this.quests.length - 1];
  }

  onGather(itemId, count = 1) {
    for (const q of this.quests) {
      if (!q.completed && q.targetType === 'gather' && q.targetId === itemId) {
        q.current = Math.min(q.required, q.current + count);
        this.checkCompletion(q);
      }
    }
  }

  onKill(enemyType) {
    for (const q of this.quests) {
      if (!q.completed && q.targetType === 'kill' && (q.targetId === enemyType || (q.targetId === 'boss' && enemyType === 'boss'))) {
        q.current = Math.min(q.required, q.current + 1);
        this.checkCompletion(q);
      }
    }
  }

  onBuild(buildingType) {
    for (const q of this.quests) {
      if (!q.completed && q.targetType === 'build' && q.targetId === buildingType) {
        q.current = Math.min(q.required, q.current + 1);
        this.checkCompletion(q);
      }
    }
  }

  onTalk(npcId) {
    for (const q of this.quests) {
      if (!q.completed && q.targetType === 'talk' && q.targetId === npcId) {
        q.current = Math.min(q.required, q.current + 1);
        this.checkCompletion(q);
      }
    }
  }

  checkCompletion(quest) {
    if (quest.current >= quest.required && !quest.completed) {
      quest.completed = true;
      this.claimReward(quest);
    }
  }

  claimReward(quest) {
    const { xp, gold, item, count } = quest.reward;

    // Grant XP
    if (xp && this.game.player) {
      this.game.player.addXP(xp);
    }

    // Grant gold
    if (gold && this.game.player) {
      this.game.player.coins += gold;
    }

    // Grant item
    if (item && this.game.player) {
      this.game.player.inventory.addItem(item, count || 1);
    }

    // Sound & toast
    if (this.game.soundManager) {
      this.game.soundManager.playQuestComplete();
    }
    if (this.game.hud) {
      this.game.hud.showToast(`¡Misión completada: "${quest.title}"! (+${xp} XP)`, 'toast-quest');
      this.game.hud.updateQuests();
    }
  }

  serialize() {
    return this.quests.map(q => ({
      id: q.id,
      current: q.current,
      completed: q.completed
    }));
  }

  deserialize(data) {
    if (!Array.isArray(data)) return;
    for (const saved of data) {
      const q = this.quests.find(x => x.id === saved.id);
      if (q) {
        q.current = saved.current;
        q.completed = saved.completed;
      }
    }
  }
}
