/*
 * <me-button> — Botão do Minha Escala.
 *
 * Espelha os botões do app (src/components/designSystem/Buttons do
 * minhaescala_web): GenericButton (base: semibold 14px, sem uppercase,
 * radius 6px), FilledButton (fundo primary20 #3CA2B9, hover primary30),
 * OutlineButton (borda 2px teal, hover fundo primary5), GhostButton
 * (texto teal, hover primary5) e PolarButton (vermelho, com hovers/
 * actives próprios, radius 4px e disabled a 40%).
 *
 * Mapeamento:
 *   primário   → <me-button>                                  (FilledButton)
 *   secundário → <me-button appearance="outlined">            (OutlineButton)
 *   terciário  → <me-button appearance="plain">               (GhostButton)
 *   destrutivo → <me-button variant="danger" [appearance]>    (PolarButton)
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
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: var(--me-control-height-m, 40px);
      padding: 0 20px;
      /* Borda transparente em todos os appearances: outlined (2px) não muda a altura */
      border: 2px solid transparent;
      border-radius: var(--me-radius-m, 6px);
      font-family: inherit;
      /* GenericButton: font-semibold text-sm, sem uppercase, tracking normal */
      font-size: var(--me-font-size-small, 14px);
      font-weight: var(--me-font-weight-semibold, 600);
      letter-spacing: normal;
      line-height: 1;
      text-decoration: none;
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
      user-select: none;
    }

    /* ===== brand (default) — Filled/Outline/GhostButton do app ===== */
    .btn {
      background: var(--me-color-primary-20, #3CA2B9);
      color: var(--me-color-white, #FFFFFF);
    }
    .btn:hover,
    .btn:active { background: var(--me-color-brand, #2F7F91); }

    :host([appearance="outlined"]) .btn {
      background: var(--me-color-surface, #FFFFFF);
      border-color: var(--me-color-brand, #2F7F91);
      color: var(--me-color-brand, #2F7F91);
    }
    :host([appearance="plain"]) .btn {
      background: transparent;
      color: var(--me-color-brand, #2F7F91);
    }
    :host([appearance="outlined"]) .btn:hover,
    :host([appearance="plain"]) .btn:hover {
      background: var(--me-color-brand-soft, #D8EEF3);
    }

    /* ===== danger — PolarButton do app (cores/radius próprios) ===== */
    :host([variant="danger"]) .btn {
      border-radius: var(--me-radius-s, 4px);
      background: var(--me-color-negative-50, #DA1E28);
      color: var(--me-color-white, #FFFFFF);
    }
    :host([variant="danger"]) .btn:hover  { background: #E76F75; }
    :host([variant="danger"]) .btn:active { background: #A01118; }

    :host([variant="danger"][appearance="outlined"]) .btn {
      background: var(--me-color-surface, #FFFFFF);
      border-color: var(--me-color-negative-50, #DA1E28);
      color: var(--me-color-negative-50, #DA1E28);
    }
    :host([variant="danger"][appearance="plain"]) .btn {
      background: transparent;
      color: var(--me-color-negative-50, #DA1E28);
    }
    :host([variant="danger"][appearance="outlined"]) .btn:hover,
    :host([variant="danger"][appearance="plain"]) .btn:hover  { background: #FEF2F2; }
    :host([variant="danger"][appearance="outlined"]) .btn:active,
    :host([variant="danger"][appearance="plain"]) .btn:active { background: #FEE2E2; }

    /* ===== success/warning/neutral — extensões do kit (mesmo padrão) ===== */
    :host([variant="success"]) .btn { --_accent: var(--me-color-success-50, #198038);  --_accent-soft: var(--me-color-success-5, #EAFBEF); }
    :host([variant="warning"]) .btn { --_accent: var(--me-color-alert-50, #F18F1B);    --_accent-soft: var(--me-color-alert-5, #FEF3E7); }
    :host([variant="neutral"]) .btn { --_accent: var(--me-color-secondary-50, #16161D); --_accent-soft: var(--me-color-neutral-20, #E2E2E9); }

    :host([variant="success"]) .btn, :host([variant="warning"]) .btn, :host([variant="neutral"]) .btn {
      background: var(--_accent);
      color: var(--me-color-white, #FFFFFF);
    }
    :host([variant="success"]) .btn:hover, :host([variant="warning"]) .btn:hover, :host([variant="neutral"]) .btn:hover {
      background: color-mix(in srgb, var(--_accent) 85%, #000);
    }
    :host([variant="success"][appearance="outlined"]) .btn, :host([variant="warning"][appearance="outlined"]) .btn, :host([variant="neutral"][appearance="outlined"]) .btn {
      background: var(--me-color-surface, #FFFFFF);
      border-color: var(--_accent);
      color: var(--_accent);
    }
    :host([variant="success"][appearance="plain"]) .btn, :host([variant="warning"][appearance="plain"]) .btn, :host([variant="neutral"][appearance="plain"]) .btn {
      background: transparent;
      color: var(--_accent);
    }
    :host([variant="success"][appearance="outlined"]) .btn:hover, :host([variant="warning"][appearance="outlined"]) .btn:hover, :host([variant="neutral"][appearance="outlined"]) .btn:hover,
    :host([variant="success"][appearance="plain"]) .btn:hover, :host([variant="warning"][appearance="plain"]) .btn:hover, :host([variant="neutral"][appearance="plain"]) .btn:hover {
      background: var(--_accent-soft);
    }

    /* Tamanhos */
    :host([size="small"]) .btn {
      height: var(--me-control-height-s, 32px);
      padding: 0 12px;
    }
    :host([size="large"]) .btn { height: var(--me-control-height-l, 48px); }

    /* Estados */
    .btn:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    /* PolarButton: disabled mantém as cores a 40% de opacidade */
    .btn:disabled,
    .btn[aria-disabled="true"] {
      opacity: 0.4;
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
