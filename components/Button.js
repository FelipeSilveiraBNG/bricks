/*
 * <me-button> — Botão do Minha Escala.
 *
 * Mapeamento visual do app:
 *   primário   → <me-button>                                  (teal preenchido)
 *   secundário → <me-button appearance="outlined">            (borda teal)
 *   terciário  → <me-button appearance="plain">               (ghost, só texto)
 *   destrutivo → <me-button variant="danger" appearance="outlined">
 *
 * Atributos: variant (brand|danger|success|warning|neutral), appearance
 * (filled|outlined|plain), size (small|medium|large), disabled, type
 * (button|submit), href (renderiza <a>).
 * Slots: default (rótulo), start, end (ícones).
 * Parts: base, label.
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .btn {
      /* Cor de destaque por variante — o appearance decide como usá-la. */
      --_accent: var(--me-color-brand, #2F7F91);
      --_accent-soft: var(--me-color-brand-soft, #D8EEF3);

      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: var(--me-control-height-m, 40px);
      padding: 0 20px;
      border: 1px solid var(--_accent);
      border-radius: var(--me-radius-m, 6px);
      background: var(--_accent);
      color: var(--me-color-white, #FFFFFF);
      font-family: inherit;
      font-size: var(--me-font-size-body, 16px);
      font-weight: var(--me-font-weight-bold, 700);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      line-height: 1;
      text-decoration: none;
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
      user-select: none;
    }

    /* Variantes: só trocam a cor de destaque */
    :host([variant="danger"])  .btn { --_accent: var(--me-color-negative-50, #DA1E28); --_accent-soft: var(--me-color-negative-5, #FCE9EA); }
    :host([variant="success"]) .btn { --_accent: var(--me-color-success-50, #198038);  --_accent-soft: var(--me-color-success-5, #EAFBEF); }
    :host([variant="warning"]) .btn { --_accent: var(--me-color-alert-50, #F18F1B);    --_accent-soft: var(--me-color-alert-5, #FEF3E7); }
    :host([variant="neutral"]) .btn { --_accent: var(--me-color-secondary-50, #16161D); --_accent-soft: var(--me-color-neutral-20, #E2E2E9); }

    /* Appearances */
    .btn:hover { background: color-mix(in srgb, var(--_accent) 85%, #000); }
    .btn:active { background: color-mix(in srgb, var(--_accent) 75%, #000); }

    :host([appearance="outlined"]) .btn {
      background: var(--me-color-surface, #FFFFFF);
      color: var(--_accent);
    }
    :host([appearance="outlined"]) .btn:hover { background: var(--_accent-soft); }

    :host([appearance="plain"]) .btn {
      background: transparent;
      border-color: transparent;
      color: var(--_accent);
    }
    :host([appearance="plain"]) .btn:hover { background: var(--_accent-soft); }

    /* Tamanhos */
    :host([size="small"]) .btn {
      height: var(--me-control-height-s, 32px);
      padding: 0 12px;
      font-size: var(--me-font-size-small, 14px);
    }
    :host([size="large"]) .btn { height: var(--me-control-height-l, 48px); }

    /* Estados */
    .btn:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .btn:disabled,
    .btn[aria-disabled="true"] {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    ::slotted(me-icon) { font-size: 1.25em; }
  </style>
`;

class MeButton extends HTMLElement {
  #base = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#renderBase();

    // type="submit" participa do form externo (requestSubmit valida e submete).
    this.addEventListener('click', (event) => {
      if (this.disabled) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
      }
      if (this.getAttribute('type') === 'submit') {
        this.closest('form')?.requestSubmit();
      }
    });
  }

  static get observedAttributes() {
    return ['disabled', 'href'];
  }

  attributeChangedCallback(name) {
    if (name === 'href') this.#renderBase();
    if (name === 'disabled') this.#syncDisabled();
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }

  get href() { return this.getAttribute('href'); }
  set href(value) {
    value == null ? this.removeAttribute('href') : this.setAttribute('href', value);
  }

  focus(options) { this.#base?.focus(options); }
  blur() { this.#base?.blur(); }

  /* Cria <button> ou <a> conforme href; os slots vivem dentro dele. */
  #renderBase() {
    const isLink = this.hasAttribute('href');
    const el = document.createElement(isLink ? 'a' : 'button');
    el.className = 'btn';
    el.setAttribute('part', 'base');
    if (isLink) {
      el.href = this.getAttribute('href');
    } else {
      el.type = 'button'; // o submit é feito via requestSubmit no listener
    }
    el.innerHTML = `
      <slot name="start"></slot>
      <span class="label" part="label"><slot></slot></span>
      <slot name="end"></slot>
    `;
    if (this.#base) this.#base.replaceWith(el);
    else this.shadowRoot.appendChild(el);
    this.#base = el;
    this.#syncDisabled();
  }

  #syncDisabled() {
    if (!this.#base) return;
    if (this.#base.tagName === 'BUTTON') {
      this.#base.disabled = this.disabled;
    } else {
      this.#base.setAttribute('aria-disabled', String(this.disabled));
    }
  }
}

window.customElements.define('me-button', MeButton);
