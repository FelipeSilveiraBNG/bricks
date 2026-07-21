/*
 * <me-switch> — Toggle do Minha Escala (form-associated).
 *
 * Track teal quando ligado, cinza quando desligado; thumb branco.
 * Semântica de checkbox no submit: envia `value` (default "on") quando
 * ligado, nada quando desligado.
 *
 * Atributos: checked, disabled, name, value, size (small|medium).
 * Slot: default (rótulo ao lado do controle).
 * Parts: base, control, thumb, label.
 * Evento: change (detail.checked).
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
    }
    :host([hidden]) { display: none; }
    :host([disabled]) { opacity: 0.45; pointer-events: none; }

    .base {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .control {
      box-sizing: border-box;
      flex: none;
      position: relative;
      width: 40px;
      height: 22px;
      margin: 0;
      padding: 2px;
      border: none;
      border-radius: 999px;
      background: var(--me-color-neutral-20, #E2E2E9);
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease);
    }
    :host([checked]) .control { background: var(--me-color-brand, #2F7F91); }

    :host([size="small"]) .control { width: 32px; height: 18px; }

    .thumb {
      display: block;
      aspect-ratio: 1;
      height: 100%;
      border-radius: 50%;
      background: var(--me-color-white, #FFFFFF);
      box-shadow: 0 1px 2px rgb(22 22 29 / 0.25);
      transition: translate var(--me-transition, 0.2s ease);
    }
    :host([checked]) .thumb { translate: calc(100% + 2px) 0; }
    :host([size="small"][checked]) .thumb { translate: calc(100% - 2px) 0; }

    .control:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    .label {
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    :host([size="small"]) .label { font-size: var(--me-font-size-small, 14px); }
  </style>
  <span class="base" part="base">
    <button class="control" part="control" type="button" role="switch" aria-checked="false">
      <span class="thumb" part="thumb"></span>
    </button>
    <span class="label" part="label"><slot></slot></span>
  </span>
`;

class MeSwitch extends HTMLElement {
  static formAssociated = true;

  #internals;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.controlElement = this.shadowRoot.querySelector('.control');

    // Clicar em qualquer parte (controle ou rótulo) alterna.
    this.shadowRoot.querySelector('.base').addEventListener('click', () => {
      if (this.disabled) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }));
    });
  }

  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this.controlElement.setAttribute('aria-checked', String(newValue !== null));
      this.#syncFormValue();
    }
    if (name === 'disabled') {
      this.controlElement.disabled = newValue !== null;
    }
  }

  connectedCallback() {
    this.#syncFormValue();
  }

  /* Estado vivo refletido no atributo (permite estilizar me-switch[checked]). */
  get checked() { return this.hasAttribute('checked'); }
  set checked(value) {
    value ? this.setAttribute('checked', '') : this.removeAttribute('checked');
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }

  get value() { return this.getAttribute('value') ?? 'on'; }
  set value(newValue) { this.setAttribute('value', newValue); }

  get name() { return this.getAttribute('name'); }
  set name(value) {
    value == null ? this.removeAttribute('name') : this.setAttribute('name', value);
  }

  get form() { return this.#internals.form; }

  formResetCallback() {
    this.checked = false;
  }

  formDisabledCallback(disabled) {
    this.controlElement.disabled = disabled || this.disabled;
  }

  #syncFormValue() {
    // Semântica de checkbox: só entra no FormData quando ligado.
    this.#internals.setFormValue(this.checked ? this.value : null);
  }
}

window.customElements.define('me-switch', MeSwitch);
