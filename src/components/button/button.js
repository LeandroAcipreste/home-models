/**
 * button.js — Substitui o componente React Button.
 * Retorna HTML string. Para navegação SPA usa data-spa-link.
 */
import { rainbowBorder } from '../rainbow-border/rainbow-border.js';

const LOGIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;

/**
 * @param {object} opts
 * @param {string}  [opts.children]    texto do botão
 * @param {string}  [opts.label]       fallback label
 * @param {boolean} [opts.showIcon]    exibe ícone LogIn
 * @param {string}  [opts.className]   classes extras
 * @param {string}  [opts.href]        link externo
 * @param {string}  [opts.to]          rota SPA
 * @param {number}  [opts.conicStartDeg]
 */
export function button({
  children,
  label = 'Login',
  showIcon = true,
  icon: customIcon,
  className = '',
  href = '#',
  to,
  conicStartDeg = 0,
} = {}) {
  const text = children ?? label;
  const iconContent = customIcon ?? LOGIN_ICON_SVG;
  const icon = showIcon
    ? `<span class="canvas-download-btn__icon" aria-hidden="true">${iconContent}</span>`
    : '';

  const inner = rainbowBorder({
    className: 'rb-pad-btn',
    conicStartDeg,
    children: `<div style="display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; height: 100%;">${icon}${text}</div>`,
  });

  const cls = `canvas-download-btn ${className}`.trim();

  if (to) {
    return `<a href="${to}" class="${cls}">${inner}</a>`;
  }
  return `<a href="${href}" class="${cls}">${inner}</a>`;
}
