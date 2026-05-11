import { getValidatedModels } from '../../data/models.js';
import { modelCardHTML, modelCardStyles } from '../../components/model-card/model-card.js';

const TUNNEL_COUNT = 20;

function buildRings() {
  return Array.from({ length: TUNNEL_COUNT }, (_, i) =>
    `<div class="fm-hero-ring" style="--ring-i:${i}"></div>`
  ).join('');
}

export function femaleModelsHTML() {
  const models = getValidatedModels('female');
  
  const modelsGridHTML = models.length > 0 
    ? `<div class="model-grid">${models.map(m => modelCardHTML(m)).join('')}</div>`
    : `<p class="no-models-msg">Nenhum modelo cadastrado no momento.</p>`;

  return `
    <style>${modelCardStyles()}</style>
    <section class="female-models-page fm-page-wrapper" aria-label="Female models — Home Model">
      <div class="fm-hero-rings-bg" aria-hidden="true">
        <div class="fm-hero-rings-stack" style="--tunnel-ring-count:${TUNNEL_COUNT}">
          ${buildRings()}
        </div>
      </div>
      
      <div class="fm-content-layer">
        <div class="fm-header">
          <h2 class="fm-hero-title">
            <span class="fm-hero-title-line qs-title-line-sm">Feminino</span>
            <span class="fm-hero-title-line qs-title-line-lg">Models</span>
          </h2>
        </div>
        
        <div class="fm-grid-container">
          ${modelsGridHTML}
        </div>
      </div>
    </section>`;
}

export function initFemaleModels(container) {
  // Lógica adicional de interação com os cards pode ser colocada aqui
  console.log('[FemaleModels] Initialized with', getValidatedModels('female').length, 'models');
}
