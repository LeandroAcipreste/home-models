import { getModelById } from '../../data/models.js';
import { button } from '../../components/button/button.js';

export function modelProfileHTML(state = {}) {
  const { params = {} } = state;
  const model = getModelById(params.id);

  if (!model) {
    return `<div class="profile-error">Modelo não encontrado</div>`;
  }

  const TRANSLATIONS = {
    height: 'Altura',
    bust: 'Busto',
    chest: 'Tórax',
    waist: 'Cintura',
    hips: 'Quadril',
    shoes: 'Sapatos',
    eyes: 'Olhos',
    hair: 'Cabelo'
  };

  const statsHTML = Object.entries(model.stats).map(([label, value]) => `
    <div class="profile-stat-item">
      <span class="profile-stat-label">${(TRANSLATIONS[label] || label).toUpperCase()}</span>
      <span class="profile-stat-value">${value}</span>
    </div>
  `).join('');

  const renderGallery = (items) => (items || []).map(img => `
    <div class="profile-gallery-item">
      <img src="${img}" alt="" loading="lazy" class="profile-gallery-img" />
    </div>
  `).join('');

  const worksHTML = renderGallery(model.works);
  const polaroidsHTML = renderGallery(model.polaroids);
  
  const videoHTML = model.video ? `
    <div class="profile-video-container">
      <video controls class="profile-video-player" poster="${model.image}">
        <source src="${model.video}" type="video/mp4">
        Seu navegador não suporta vídeos.
      </video>
    </div>
  ` : '<p class="profile-no-data">Vídeo não disponível.</p>';

  return `
    <style>
      .profile-page {
        background: #ffffff;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
      }

      @media (min-width: 1024px) {
        .profile-page { flex-direction: row; }
      }

      /* Hero - Lado Esquerdo */
      .profile-hero {
        position: relative;
        width: 100%;
        height: 80dvh;
        background: #f5f5f5;
      }

      @media (min-width: 1024px) {
        .profile-hero {
          width: 45%;
          height: 100dvh;
          position: sticky;
          top: 0;
        }
      }

      .profile-hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* Content - Lado Direito */
      .profile-content {
        flex: 1;
        padding: 3rem 1.5rem;
        max-width: 100%;
      }

      @media (min-width: 1024px) {
        .profile-content { padding: 5rem 4rem; }
      }

      .profile-header {
        margin-bottom: 4rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 2rem;
      }

      .profile-name {
        font-family: var(--fm-font-serif, serif);
        font-size: clamp(2.5rem, 5vw, 4.5rem);
        margin: 0;
        line-height: 1;
        color: #1a1a1a;
      }



      /* Stats Grid */
      .profile-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
        margin-bottom: 5rem;
      }

      @media (min-width: 640px) {
        .profile-stats-grid { grid-template-columns: repeat(4, 1fr); }
      }

      .profile-stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .profile-stat-label {
        font-size: 0.65rem;
        font-weight: 700;
        color: #bbb;
        letter-spacing: 0.1em;
      }

      .profile-stat-value {
        font-size: 1.1rem;
        color: #333;
      }

      /* Gallery */
      .profile-gallery {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 4rem;
      }

      .profile-gallery-item {
        aspect-ratio: 3 / 4;
        overflow: hidden;
        background: #f9f9f9;
        border-radius: 4px;
      }

      .profile-gallery-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }

      .profile-gallery-item:hover .profile-gallery-img {
        transform: scale(1.05);
      }

      .profile-nav-top {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
      }

      .profile-section {
        margin-bottom: 5rem;
      }

      .profile-section-title {
        font-family: var(--fm-font-serif, serif);
        font-size: 1.5rem;
        color: #1a1a1a;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .profile-section-title::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #eee;
      }

      .profile-video-container {
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
      }

      .profile-video-player {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-no-data {
        color: #888;
        font-style: italic;
        font-size: 0.9rem;
      }
    </style>

    <main class="profile-page">
      <div class="profile-hero">
        <img src="${model.image}" alt="${model.name}" class="profile-hero-img" />
      </div>

      <div class="profile-content">
        <header class="profile-header">
          <div class="profile-nav-top">
            ${button({ 
              children: 'Voltar para modelos', 
              href: '#', 
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
              className: 'btn-back-profile js-btn-back' 
            })}
          </div>
          
          <h1 class="profile-name">${model.name}</h1>
          
          <div class="profile-actions-area" style="margin-top: 2rem;">
            ${button({ 
              label: 'Selecionar este Modelo', 
              className: 'js-btn-select-model',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' 
            })}
          </div>

          <div class="profile-success-msg js-success-msg" style="display: none; margin-top: 1.5rem;">
            <div style="background: #f0fff4; border: 1px solid #c6f6d5; padding: 1.5rem; border-radius: 12px; color: #22543d; font-size: 0.95rem;">
              <strong style="display: block; margin-bottom: 0.5rem;">✓ Seleção Realizada!</strong>
              Um e-mail de notificação foi enviado para <strong>${model.name}</strong>. Nossa equipe entrará em contato em breve para os próximos passos.
            </div>
          </div>
        </header>

        <section class="profile-stats">
          <div class="profile-stats-grid">
            ${statsHTML}
          </div>
        </section>

        <div class="profile-portfolio-sections">
          <section class="profile-section">
            <h2 class="profile-section-title">Trabalhos</h2>
            <div class="profile-gallery">
              ${worksHTML || '<p class="profile-no-data">Nenhum trabalho registrado.</p>'}
            </div>
          </section>

          <section class="profile-section">
            <h2 class="profile-section-title">Polaroids</h2>
            <div class="profile-gallery">
              ${polaroidsHTML || '<p class="profile-no-data">Nenhuma polaroid registrada.</p>'}
            </div>
          </section>

          <section class="profile-section">
            <h2 class="profile-section-title">Vídeo Apresentação</h2>
            ${videoHTML}
          </section>
        </div>
      </div>
    </main>
    <style>
      .profile-nav-top { margin-bottom: 3rem; }
      .btn-back-profile .rainbow-border { --rb-radius: 30px; }
      .btn-back-profile .rb-pad-btn { 
        padding: 0.6rem 1.5rem; 
        font-size: 0.9rem;
        font-weight: 500;
        color: #1a1a1a;
      }
      
      .profile-page .canvas-download-btn__icon { 
        color: #0066ff; 
        display: flex;
        align-items: center;
      }

      .profile-success-msg {
        animation: slideUp 0.5s ease-out;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
}

import gsap from 'gsap';

export function initModelProfile(container, state = {}) {
  const { params = {} } = state;
  window.scrollTo(0, 0);
  const model = getModelById(params.id);
  const btnSelect = container.querySelector('.js-btn-select-model');
  const btnBack = container.querySelector('.js-btn-back');
  const successMsg = container.querySelector('.js-success-msg');

  if (btnBack) {
    btnBack.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.back();
    });
  }

  if (btnSelect && successMsg) {
    btnSelect.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Simulação Sênior de Processamento
      btnSelect.style.pointerEvents = 'none';
      btnSelect.style.opacity = '0.7';
      
      console.log(`[Email] Disparando e-mail para ${model.email}...`);
      
      // Simula o delay de envio do e-mail
      setTimeout(() => {
        gsap.to(btnSelect, { autoAlpha: 0, height: 0, marginBottom: 0, duration: 0.4, onComplete: () => {
          btnSelect.style.display = 'none';
          successMsg.style.display = 'block';
        }});
      }, 800);
    });
  }

  console.log('[ModelProfile] Portfolio initialized for:', model?.name);
}
