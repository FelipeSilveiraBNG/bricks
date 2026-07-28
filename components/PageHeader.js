/*
 * <me-page-header> — Cabeçalho de página do Minha Escala.
 *
 * Espelha o Header.vue do app (minhaescala_web): barra branca com padding
 * 16px/32px, título 24px bold + subtítulo teal escuro abaixo; área à direita
 * para ações (sino de notificação, avatar etc.) via slot "end".
 *
 * Toggle mobile (como o botão v-if="isMobile" do app): com o atributo "menu",
 * um botão de seta aparece à esquerda APENAS em telas < 800px e emite o evento
 * "me-menu" ao clicar (detail.open = estado desejado). O consumidor liga esse
 * evento à sidebar (ex.: sidebar.expanded = e.detail.open). O atributo refletido
 * "menu-open" alterna a direção da seta (fechado → expandir; aberto → recolher).
 *
 * Atributos: heading, subheading (conveniência em texto puro), menu, menu-open.
 * Slots: heading, subheading (sobrepõem os atributos), end.
 * Eventos: me-menu (detail.open) — clique no botão mobile.
 * Parts: base, menu, heading, subheading, end.
 */
import { define } from './define.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
    }
    :host([hidden]) { display: none; }

    .base {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 48px;
      padding: 16px 32px; /* px-8 py-4 do Header.vue */
      background: var(--me-color-surface, #FFFFFF);
    }

    /* Botão de menu mobile (text-gray-500 do app). Oculto por padrão; só
       aparece com [menu] em telas < 800px (espelha v-if="isMobile"). */
    .menu {
      display: none;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      border-radius: var(--me-radius-m, 6px);
      color: var(--me-color-text-muted, #68688D);
      cursor: pointer;
    }
    .menu:hover { background: var(--me-color-brand-hover, rgb(47 127 145 / 0.08)); }
    .menu:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .menu svg { display: block; width: 24px; height: 24px; }

    /* Fechado mostra a seta de expandir; aberto (menu-open) a de recolher. */
    .menu .collapse-icon { display: none; }
    :host([menu-open]) .menu .expand-icon { display: none; }
    :host([menu-open]) .menu .collapse-icon { display: block; }

    @media (max-width: 799px) {
      :host([menu]) .menu { display: inline-flex; }
    }

    .titles {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .heading {
      font-size: var(--me-font-size-h5, 24px);
      line-height: var(--me-line-height-h5, 32px);
      font-weight: var(--me-font-weight-bold, 700);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subheading {
      font-size: var(--me-font-size-small, 14px);
      line-height: var(--me-line-height-small, 18px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      color: var(--me-color-brand-dark, #163D45); /* teal escuro do wordmark, como no app */
    }
    .subheading:empty { display: none; }

    .end {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 24px; /* dimensiona me-icons slotted */
    }
  </style>
  <header class="base" part="base">
    <button class="menu" part="menu" type="button" aria-label="Abrir menu" aria-expanded="false">
      <!-- Chevron duplo cinza (como os arrows do Header.vue): → expandir / ← recolher -->
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7l5 5-5 5M12 7l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="collapse-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 7l-5 5 5 5M12 7l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="titles">
      <div class="heading" part="heading"><slot name="heading"></slot></div>
      <div class="subheading" part="subheading"><slot name="subheading"></slot></div>
    </div>
    <div class="end" part="end"><slot name="end"></slot></div>
  </header>
`;

class MePageHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Clique no botão mobile: emite a intenção de abrir/fechar a sidebar.
    this.shadowRoot.querySelector('.menu').addEventListener('click', () => {
      const open = !this.hasAttribute('menu-open');
      this.dispatchEvent(new CustomEvent('me-menu', {
        bubbles: true,
        composed: true,
        detail: { open },
      }));
    });
  }

  static get observedAttributes() {
    return ['heading', 'subheading', 'menu-open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'menu-open') {
      const open = newValue != null;
      const button = this.shadowRoot.querySelector('.menu');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      return;
    }
    // heading/subheading preenchem os slots como texto default (slot fallback).
    const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
    slot.textContent = newValue ?? '';
  }

  get heading() { return this.getAttribute('heading'); }
  set heading(value) {
    value == null ? this.removeAttribute('heading') : this.setAttribute('heading', value);
  }

  get subheading() { return this.getAttribute('subheading'); }
  set subheading(value) {
    value == null ? this.removeAttribute('subheading') : this.setAttribute('subheading', value);
  }

  get menu() { return this.hasAttribute('menu'); }
  set menu(value) {
    value ? this.setAttribute('menu', '') : this.removeAttribute('menu');
  }

  get menuOpen() { return this.hasAttribute('menu-open'); }
  set menuOpen(value) {
    value ? this.setAttribute('menu-open', '') : this.removeAttribute('menu-open');
  }
}

define('me-page-header', MePageHeader);
