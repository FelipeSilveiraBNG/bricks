/*
 * <me-card> — Cartão do Minha Escala.
 *
 * Fundo branco, cantos arredondados, sombra sutil. Header e footer só
 * aparecem quando os slots correspondentes têm conteúdo (ou closable).
 *
 * Atributos: closable (mostra "X" no header; emite "me-close" cancelável —
 * se ninguém chamar preventDefault, o card se esconde sozinho).
 * Custom props locais: --padding (default 24px), --radius (default 8px).
 * Slots: header, default (corpo), footer.
 * Parts: base, header, body, footer, close-button.
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

    .card {
      box-sizing: border-box;
      background: var(--me-color-surface, #FFFFFF);
      border-radius: var(--radius, var(--me-radius-l, 8px));
      box-shadow: var(--me-shadow-card, 0 1px 4px rgb(22 22 29 / 0.10));
      overflow: hidden;
    }

    .header {
      display: none;
      align-items: flex-start;
      gap: 8px;
      padding: var(--padding, 24px);
      padding-bottom: 0;
    }
    .card.has-header .header { display: flex; }
    .header-content {
      flex: 1;
      font-size: 18px;             /* text-lg do título do card no app */
      font-weight: var(--me-font-weight-bold, 700);
      line-height: 28px;
    }

    .close {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin: 0;
      padding: 0;
      border: none;
      border-radius: var(--me-radius-s, 4px);
      background: transparent;
      color: var(--me-color-text-muted, #68688D);
      cursor: pointer;
    }
    .close[hidden] { display: none; } /* a classe venceria o [hidden] do UA */
    .close:hover { color: var(--me-color-text, #16161D); }
    .close:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    .body {
      padding: var(--padding, 24px);
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }

    .footer {
      display: none;
      align-items: center;
      justify-content: flex-end; /* v-card-actions com v-spacer: ações à direita */
      gap: 16px;
      padding: var(--padding, 24px);
      padding-top: 0;
    }
    .card.has-footer .footer { display: flex; }
  </style>
  <div class="card" part="base">
    <div class="header" part="header">
      <div class="header-content"><slot name="header"></slot></div>
      <!-- "X" estrutural em SVG inline (não depende do CDN de ícones) -->
      <button class="close" part="close-button" type="button" aria-label="Fechar" hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="body" part="body"><slot></slot></div>
    <div class="footer" part="footer"><slot name="footer"></slot></div>
  </div>
`;

class MeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.cardElement = this.shadowRoot.querySelector('.card');
    this.closeButton = this.shadowRoot.querySelector('.close');

    // Header/footer colapsam quando os slots estão vazios.
    this.shadowRoot.querySelector('slot[name="header"]')
      .addEventListener('slotchange', () => this.#syncSections());
    this.shadowRoot.querySelector('slot[name="footer"]')
      .addEventListener('slotchange', () => this.#syncSections());

    this.closeButton.addEventListener('click', () => {
      const allowed = this.dispatchEvent(new CustomEvent('me-close', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }));
      // Comportamento amigável para protótipos: sem preventDefault, some.
      if (allowed) this.hidden = true;
    });
  }

  static get observedAttributes() {
    return ['closable'];
  }

  attributeChangedCallback() {
    this.#syncSections();
  }

  connectedCallback() {
    this.#syncSections();
  }

  get closable() { return this.hasAttribute('closable'); }
  set closable(value) {
    value ? this.setAttribute('closable', '') : this.removeAttribute('closable');
  }

  #syncSections() {
    const hasHeaderSlot = this.shadowRoot
      .querySelector('slot[name="header"]').assignedNodes({ flatten: true }).length > 0;
    const hasFooterSlot = this.shadowRoot
      .querySelector('slot[name="footer"]').assignedNodes({ flatten: true }).length > 0;

    this.closeButton.hidden = !this.closable;
    this.cardElement.classList.toggle('has-header', hasHeaderSlot || this.closable);
    this.cardElement.classList.toggle('has-footer', hasFooterSlot);
  }
}

define('me-card', MeCard);
