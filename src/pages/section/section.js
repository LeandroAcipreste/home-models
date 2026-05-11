export function sectionPageHTML(title) {
  return `
    <main class="section-page" aria-label="${title} — Home Model">
      <h1 class="section-page-title">${title}</h1>
      <p class="section-page-desc">Conteúdo desta seção em breve.</p>
      <a href="/" class="section-page-link">Voltar ao início</a>
    </main>`;
}
