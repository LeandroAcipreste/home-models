/**
 * model-card.js — Componente de Card de Modelo
 */

export function modelCardHTML(model) {
  return `
    <a href="/model/${model.id}" class="model-card-link" style="text-decoration: none; color: inherit;">
      <div class="model-card js-model-card" data-id="${model.id}">
        <div class="model-card__image-wrapper">
          <img src="${model.image || '/public/images/placeholders/no-avatar.jpg'}" 
               alt="${model.name}" 
               class="model-card__img" 
               loading="lazy" />
          <div class="model-card__overlay">
            <span class="model-card__category">${model.category}</span>
          </div>
        </div>
        <div class="model-card__info">
          <h3 class="model-card__name">${model.name}</h3>
          <p class="model-card__social">${model.instagram}</p>
        </div>
      </div>
    </a>
  `;
}

export function modelCardStyles() {
  return `
    .model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;
      width: 100%;
      padding: 2rem 0;
    }

    .model-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease;
      cursor: pointer;
    }

    .model-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }

    .model-card__image-wrapper {
      position: relative;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      background: #f5f5f5;
    }

    .model-card__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: scale 0.5s ease;
    }

    .model-card:hover .model-card__img {
      scale: 1.05;
    }

    .model-card__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
      display: flex;
      align-items: flex-end;
      padding: 1.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .model-card:hover .model-card__overlay {
      opacity: 1;
    }

    .model-card__category {
      color: #fff;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    .model-card__info {
      padding: 1.25rem;
      text-align: center;
    }

    .model-card__name {
      margin: 0;
      font-family: var(--fm-font-serif, serif);
      font-size: 1.5rem;
      color: #1a1a1a;
    }

    .model-card__social {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: #888;
    }
  `;
}
