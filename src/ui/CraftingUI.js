import { RECIPES } from '../systems/Crafting.js';
import { ITEMS_DATABASE } from '../systems/Inventory.js';

export class CraftingUI {
  constructor(game) {
    this.game = game;
    this.modal = document.getElementById('crafting-modal');
    this.recipesListEl = document.getElementById('craft-recipes-list');

    this.previewIcon = document.getElementById('craft-preview-icon');
    this.previewName = document.getElementById('craft-preview-name');
    this.previewDesc = document.getElementById('craft-preview-desc');
    this.ingredientsListEl = document.getElementById('craft-ingredients-list');
    this.btnDoCraft = document.getElementById('btn-do-craft');

    this.currentCategory = 'tools';
    this.selectedRecipe = RECIPES[0];

    this.initEvents();
  }

  initEvents() {
    // Category tabs
    const catButtons = this.modal.querySelectorAll('.craft-cat-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        const availableInCat = RECIPES.filter(r => r.category === this.currentCategory);
        this.selectedRecipe = availableInCat[0] || null;
        this.refresh();
      });
    });

    // Craft button
    this.btnDoCraft.addEventListener('click', () => {
      if (!this.selectedRecipe) return;

      const isNearCampfire = this.game.buildingSystem.getNearCampfire(this.game.player.x, this.game.player.y);
      const res = this.game.craftingSystem.craft(this.selectedRecipe, isNearCampfire);

      if (res.can) {
        this.game.hud.showToast(`¡Fabricado con éxito: ${res.item.name}!`, 'toast-loot');
        // Quest hook
        if (this.game.questSystem) {
          this.game.questSystem.onGather(res.item.id, res.count);
        }
        this.refresh();
      } else {
        this.game.hud.showToast(res.reason || 'No se pudo fabricar.', 'toast-danger');
      }
    });
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
    const isNearCampfire = this.game.buildingSystem.getNearCampfire(this.game.player.x, this.game.player.y);
    const categoryRecipes = RECIPES.filter(r => r.category === this.currentCategory);

    this.recipesListEl.innerHTML = '';
    categoryRecipes.forEach(recipe => {
      const item = ITEMS_DATABASE[recipe.result];
      const check = this.game.craftingSystem.canCraft(recipe, isNearCampfire);

      const card = document.createElement('div');
      card.className = `recipe-card ${this.selectedRecipe && this.selectedRecipe.id === recipe.id ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="recipe-card-info">
          <span class="recipe-card-icon">${item ? item.icon : '🔨'}</span>
          <div>
            <div class="recipe-card-name">${recipe.name}</div>
            <div style="font-size:0.75rem; color:${check.can ? '#52b788' : '#e63946'};">
              ${check.can ? 'Listo para fabricar' : (check.reason || 'Faltan materiales')}
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectedRecipe = recipe;
        this.refresh();
      });

      this.recipesListEl.appendChild(card);
    });

    this.updatePreview(isNearCampfire);
  }

  updatePreview(isNearCampfire) {
    if (!this.selectedRecipe) {
      this.previewIcon.textContent = '🔨';
      this.previewName.textContent = 'Selecciona una receta';
      this.previewDesc.textContent = 'Elige una receta de la lista para ver los materiales requeridos.';
      this.ingredientsListEl.innerHTML = '';
      this.btnDoCraft.disabled = true;
      return;
    }

    const item = ITEMS_DATABASE[this.selectedRecipe.result];
    this.previewIcon.textContent = item ? item.icon : '🔨';
    this.previewName.textContent = this.selectedRecipe.name;
    this.previewDesc.textContent = this.selectedRecipe.desc;

    // Render ingredients
    this.ingredientsListEl.innerHTML = '';
    const check = this.game.craftingSystem.canCraft(this.selectedRecipe, isNearCampfire);

    for (const [matId, reqAmount] of Object.entries(this.selectedRecipe.ingredients)) {
      const mat = ITEMS_DATABASE[matId];
      const currentAmount = this.game.player.inventory.getItemCount(matId);
      const hasEnough = currentAmount >= reqAmount;

      const ingEl = document.createElement('div');
      ingEl.className = `ingredient-item ${hasEnough ? 'has-enough' : 'not-enough'}`;
      ingEl.innerHTML = `
        <span>${mat ? mat.icon : ''} ${mat ? mat.name : matId}</span>
        <span>${currentAmount} / ${reqAmount} ${hasEnough ? '✔️' : '❌'}</span>
      `;
      this.ingredientsListEl.appendChild(ingEl);
    }

    if (this.selectedRecipe.requiresCampfire) {
      const campEl = document.createElement('div');
      campEl.className = `ingredient-item ${isNearCampfire ? 'has-enough' : 'not-enough'}`;
      campEl.innerHTML = `
        <span>🔥 Fogata cercana</span>
        <span>${isNearCampfire ? 'Cerca ✔️' : 'Lejos ❌'}</span>
      `;
      this.ingredientsListEl.appendChild(campEl);
    }

    this.btnDoCraft.disabled = !check.can;
    this.btnDoCraft.style.opacity = check.can ? '1' : '0.5';
  }
}
