/**
 * rainbow-border.js — Substitui o componente React RainbowBorder.
 * Retorna uma string HTML com os CSS vars injetados.
 */

export const RAINBOW_BORDER_RADIUS_PX = 12;
export const RAINBOW_BORDER_WIDTH_PX  = 2;

/**
 * @param {object} opts
 * @param {string}  [opts.children]      HTML interno
 * @param {string}  [opts.className]     classes extras no wrapper
 * @param {number}  [opts.radiusPx]
 * @param {number}  [opts.borderWidthPx]
 * @param {string}  [opts.innerBg]
 * @param {number}  [opts.conicStartDeg]
 */
export function rainbowBorder({
  children = '',
  className = '',
  radiusPx = RAINBOW_BORDER_RADIUS_PX,
  borderWidthPx = RAINBOW_BORDER_WIDTH_PX,
  innerBg = '#ffffff',
  conicStartDeg = 0,
} = {}) {
  const style = [
    `--rb-radius:${radiusPx}px`,
    `--rb-border:${borderWidthPx}px`,
    `--rb-inner-bg:${innerBg}`,
    `--rb-conic-start:${conicStartDeg}deg`,
  ].join(';');

  return `<div class="rainbow-border ${className}".trim() style="${style}"><div class="rainbow-border__content">${children}</div></div>`;
}
