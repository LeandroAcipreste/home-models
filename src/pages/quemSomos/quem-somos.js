const TUNNEL_RING_COUNT = 20;

function buildRings() {
  return Array.from({ length: TUNNEL_RING_COUNT }, (_, i) =>
    `<div class="qs-ring" style="--ring-i:${i}"></div>`
  ).join('');
}

export function quemSomosHTML() {
  return `
    <main class="qs-page qs-page-wrapper" aria-label="Quem somos — Home Model">
      <div class="qs-rings-bg" aria-hidden="true">
        <div class="qs-rings-stack" style="--tunnel-ring-count:${TUNNEL_RING_COUNT}">
          ${buildRings()}
        </div>
      </div>
      <div class="qs-content-layer">
        <div class="qs-title-area">
          <h1 class="qs-title">
            <span class="qs-title-line qs-title-line-sm">Somos a</span>
            <span class="qs-title-line qs-title-line-lg">Home Model</span>
          </h1>
        </div>
        <div class="qs-body-area">
          <p class="qs-body-text">
            A Home Model conecta talento, imagem e oportunidade em uma curadoria
            de alto padrão para moda, campanhas e projetos especiais.
          </p>
        </div>
      </div>
    </main>`;
}

export function initQuemSomos(_container) {
  // Sem lógica JS adicional nesta página — animações são puramente CSS
}
