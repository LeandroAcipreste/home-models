import { getValidatedModels } from '../../data/models.js';
import { modelCardHTML, modelCardStyles } from '../../components/model-card/model-card.js';

const TUNNEL_COUNT = 20;

function buildRings() {
  return Array.from({ length: TUNNEL_COUNT }, (_, i) =>
    `<div class="fm-hero-ring" style="--ring-i:${i}"></div>`
  ).join('');
}

export function maleModelsHTML() {
  const models = getValidatedModels('male');
  
  const modelsGridHTML = models.length > 0 
    ? `<div class="model-grid">${models.map(m => modelCardHTML(m)).join('')}</div>`
    : `<p class="no-models-msg">Nenhum modelo masculino cadastrado no momento.</p>`;

  return `
    <style>
      ${modelCardStyles()}
      .fm-hero-title-line.qs-title-line-lg { color: #171717; }
    </style>
    <section class="male-models-page fm-page-wrapper" aria-label="Male models — Home Model">
      <div class="fm-hero-rings-bg" aria-hidden="true" style="background: #fdfdfd;">
        <div class="fm-hero-rings-stack" style="--tunnel-ring-count:${TUNNEL_COUNT}; opacity: 0.5;">
          ${buildRings()}
        </div>
      </div>
      
      <div class="fm-content-layer">
        <div class="fm-header">
          <h2 class="fm-hero-title">
            <span class="fm-hero-title-line qs-title-line-sm">Masculino</span>
            <span class="fm-hero-title-line qs-title-line-lg">Models</span>
          </h2>
        </div>
        
        <div class="fm-grid-container">
          ${modelsGridHTML}
        </div>
      </div>
    </section>`;
}

export function initMaleModels(container) {
  console.log('[MaleModels] Initialized with', getValidatedModels('male').length, 'models');
}
