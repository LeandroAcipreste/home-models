import { rainbowBorder } from '../../components/rainbow-border/rainbow-border.js';
import { button } from '../../components/button/button.js';

const logoSrc = '/src/components/navigate-bar/logo-mode-models.jpg';

// ─── Masks ────────────────────────────────────────────────────────────────────
const onlyDigits = v => v.replace(/\D+/g, '');
const maskCpf = v => { const d = onlyDigits(v).slice(0,11); if(d.length<=3) return d; if(d.length<=6) return `${d.slice(0,3)}.${d.slice(3)}`; if(d.length<=9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`; return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`; };
const maskRg  = v => { const d = onlyDigits(v).slice(0,9); if(d.length<=2) return d; if(d.length<=5) return `${d.slice(0,2)}.${d.slice(2)}`; if(d.length<=8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`; return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}-${d.slice(8)}`; };
const maskCep = v => { const d = onlyDigits(v).slice(0,8); return d.length<=5 ? d : `${d.slice(0,5)}-${d.slice(5)}`; };
const maskEmail = v => v.replace(/\s+/g,'').toLowerCase();

async function fetchCep(cep) {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  for (const url of [`https://brasilapi.com.br/api/cep/v2/${d}`, `https://viacep.com.br/ws/${d}/json/`]) {
    try {
      const res  = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.erro) continue;
      return { rua: data.street ?? data.logradouro ?? '', bairro: data.neighborhood ?? data.bairro ?? '', cidade: data.city ?? data.localidade ?? '', estado: data.state ?? data.uf ?? '' };
    } catch { /* tenta próximo */ }
  }
  return null;
}

const field = (label, name, attrs = '') =>
  `<label class="cad-field"><span>${label}</span><input name="${name}" ${attrs} /></label>`;

const submitBtn = button({ 
  children: 'Enviar', 
  className: 'rb-pad-submit', 
  showIcon: true 
});

export function cadastroPageHTML() {
  const uploadBtn = button({ 
    children: 'Selecionar Foto', 
    className: 'rb-pad-upload',
    showIcon: false 
  });
  return `
    <main class="cadastro-page" style="--cad-bg-image:url(${logoSrc});--cad-brand-font:'Montserrat','Avenir Next','Nunito Sans','Segoe UI','Helvetica Neue',Arial,sans-serif">
      <section class="cadastro-shell" style="margin:0 auto;width:100%;max-width:64rem;padding:0 1rem">
        <div class="cadastro-card">
          <header class="cadastro-header">
            <p class="cadastro-impact">Está pronto para dar início ao seu sonho?</p>
            <h1 class="cadastro-title">Cadastro Home Model</h1>
          </header>
          <form class="cadastro-form js-cad-form" novalidate>
            <div class="cadastro-grid">
              ${field('Nome completo','nomeCompleto','required')}
              ${field('E-mail','email','type="email" required placeholder="nome@dominio.com" autocomplete="email"')}
              ${field('Confirmar e-mail','confirmarEmail','type="email" required placeholder="nome@dominio.com" autocomplete="email"')}
              ${field('RG','rg','required')}
              ${field('CPF','cpf','required inputmode="numeric" maxlength="14" placeholder="000.000.000-00"')}
              <label class="cad-check">
                <input type="checkbox" name="maiorDeIdade" checked />
                <span>Sou maior de 18 anos</span>
              </label>
            </div>
            <div class="js-responsavel-section" hidden>
              <div class="cadastro-grid">
                ${field('Nome do responsável','nomeResponsavel')}
                ${field('CPF do responsável','cpfResponsavel','inputmode="numeric" maxlength="14" placeholder="000.000.000-00"')}
              </div>
            </div>
            <div class="cad-divider"></div>
            <div class="cadastro-grid">
              ${field('CEP','cep','required inputmode="numeric" maxlength="9" placeholder="00000-000" autocomplete="postal-code"')}
              ${field('Rua','rua','required')}
              ${field('Número','numero','required')}
              ${field('Complemento','complemento')}
              ${field('Bairro','bairro','required')}
              ${field('Cidade','cidade','required')}
              ${field('Estado','estado','required')}
              ${field('País','pais','required value="Brasil"')}
            </div>
            <p class="cad-helper js-cep-msg" hidden></p>
            <div class="cad-divider"></div>
            <div class="cadastro-grid">
              <div class="cad-field cad-upload-field">
                <span>Upload de foto</span>
                <div class="cad-upload-box">
                  <input id="cad-foto" type="file" accept="image/*" class="cad-upload-input-hidden" />
                  <label for="cad-foto" class="cad-upload-trigger-wrap">${uploadBtn}</label>
                  <p class="cad-upload-filename js-filename">Nenhum arquivo selecionado</p>
                  <p class="cad-upload-hint">Envie uma foto nítida (JPG ou PNG).</p>
                </div>
              </div>
              ${field('Data para avaliação','dataAvaliacao','type="date" required')}
              ${field('Horário para avaliação','horarioAvaliacao','type="time" required')}
            </div>
            <div class="js-photo-preview" hidden>
              <div class="cad-photo-preview-wrap">
                <img class="cad-photo-preview js-preview-img" src="" alt="Preview do upload" />
              </div>
            </div>
            <div class="cad-password-stack">
              ${field('Criar senha','senha','type="password" required autocomplete="new-password"')}
              ${field('Confirmar senha','confirmarSenha','type="password" required autocomplete="new-password"')}
            </div>
            <div class="cad-submit">
              ${submitBtn}
            </div>
            <p class="cad-success js-cad-success" hidden></p>
          </form>
        </div>
      </section>
    </main>`;
}

export function initCadastroPage(container) {
  const form          = container.querySelector('.js-cad-form');
  const responsavelSec = container.querySelector('.js-responsavel-section');
  const cepMsg        = container.querySelector('.js-cep-msg');
  const successMsg    = container.querySelector('.js-cad-success');
  const fileInput     = container.querySelector('#cad-foto');
  const filename      = container.querySelector('.js-filename');
  const photoPreview  = container.querySelector('.js-photo-preview');
  const previewImg    = container.querySelector('.js-preview-img');
  let previewUrl      = '';

  // Máscaras em tempo real
  form.addEventListener('input', (e) => {
    const el   = e.target;
    const name = el.name;
    const cur  = el.selectionStart;
    if (name === 'cpf' || name === 'cpfResponsavel') el.value = maskCpf(el.value);
    else if (name === 'rg')    el.value = maskRg(el.value);
    else if (name === 'cep')   el.value = maskCep(el.value);
    else if (name === 'email' || name === 'confirmarEmail') el.value = maskEmail(el.value);
    try { el.setSelectionRange(cur, cur); } catch {}
  });

  // Maior de idade toggle
  form.maiorDeIdade.addEventListener('change', (e) => {
    responsavelSec.hidden = e.target.checked;
  });

  // Auto-preenche endereço pelo CEP
  form.cep.addEventListener('blur', async () => {
    cepMsg.hidden = true;
    const addr = await fetchCep(form.cep.value);
    if (!addr) { cepMsg.textContent = 'Não foi possível localizar o CEP. Preencha manualmente.'; cepMsg.hidden = false; return; }
    ['rua','bairro','cidade','estado'].forEach(k => { if (addr[k]) form[k].value = addr[k]; });
    cepMsg.textContent = 'Endereço preenchido automaticamente.';
    cepMsg.hidden = false;
  });

  // Preview de foto
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    filename.textContent = file ? file.name : 'Nenhum arquivo selecionado';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) { photoPreview.hidden = true; return; }
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    photoPreview.hidden = false;
  });

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.email.value !== form.confirmarEmail.value) {
      successMsg.textContent = 'Os e-mails não coincidem. Verifique e tente novamente.';
      successMsg.style.color = '#b91c1c';
    } else if (form.senha.value !== form.confirmarSenha.value) {
      successMsg.textContent = 'As senhas não coincidem. Verifique e tente novamente.';
      successMsg.style.color = '#b91c1c';
    } else {
      successMsg.textContent = 'Cadastro enviado com sucesso! Em breve nossa equipe entrará em contato.';
      successMsg.style.color = '';
    }
    successMsg.hidden = false;
  });

  return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
}
