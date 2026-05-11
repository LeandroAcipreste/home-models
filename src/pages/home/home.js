import { setState } from '../../state.js';
import { mountHero } from './hero.js';
import { mountIntroductionVideo } from './introduction-video.js';

/**
 * home.js — Arquitetura Unificada e Responsiva (Padrão Sênior)
 * 
 * Elimina a separação binária Desktop/Mobile em favor de um 
 * único fluxo cinematográfico que se adapta ao dispositivo.
 */

export function homePageHTML() {
  return `
    <div class="home-page-unified">
      <div id="intro-slot"></div>
      <div id="hero-slot"></div>
    </div>
  `;
}

export function initHomePage(container, routeState) {
  const shell     = container.querySelector('.home-page-unified');
  const skipIntro = Boolean(routeState?.skipIntro);
  const heroSlot  = container.querySelector('#hero-slot');
  const introSlot = container.querySelector('#intro-slot');

  // Esconde bottom nav durante a sequência inicial
  setState('homeBottomNavHidden', !skipIntro);

  let introCtrl   = null;
  let heroCtrl    = null;
  let heroIsReady = false;

  // 1. Monta o Hero (o motor principal de scroll-scrub)
  heroCtrl = mountHero(heroSlot, {
    skipIntro,
    onReady: () => {
      heroIsReady = true;
      if (introCtrl) introCtrl.setReady();
    },
    // Quando o vídeo de entrada do Hero termina, revela o menu
    onHeaderNavReveal: () => setState('homeBottomNavHidden', false),
  });

  if (skipIntro) {
    if (routeState?.skipIntro) location.hash = '/';
    return () => {
      setState('homeBottomNavHidden', false);
      heroCtrl?.cleanup();
    };
  }

  // 2. Monta a Intro por cima
  introCtrl = mountIntroductionVideo(introSlot, {
    readyToReveal: false,
    onLiftStart: () => heroCtrl.triggerPlay(),
    onFinish: () => {
      introSlot.innerHTML = '';
      introCtrl = null;
    },
  });

  // Sincronização: se o Hero carregou antes da Intro ser montada
  if (heroIsReady && introCtrl) {
    introCtrl.setReady();
  }

  return () => {
    setState('homeBottomNavHidden', false);
    heroCtrl?.cleanup();
    if (introCtrl) introCtrl.cleanup();
  };
}
