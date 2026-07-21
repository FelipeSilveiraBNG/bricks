/*
 * <me-switch> — Toggle do Minha Escala (form-associated).
 *
 * Espelha o Switch do app (src/components/designSystem/Switch do
 * minhaescala_web): anel externo branco de 3px em volta do track
 * colorido, thumb branco com sombra, estados disabled (track esmaecido,
 * label cinza) e loading (aria-busy + pulse no thumb).
 *
 * Medidas do app — medium: externo 50×30, thumb 18px, curso 20px;
 * small: externo 38×22, thumb 12px, curso 16px.
 *
 * Semântica de checkbox no submit: envia `value` (default "on") quando
 * ligado, nada quando desligado.
 *
 * Atributos: checked, disabled, loading, name, value, size (small|medium).
 * Slot: default (rótulo ao lado do controle).
 * Parts: base, control, track, thumb, label.
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
    :host([disabled]), :host([loading]) { cursor: not-allowed; }

    .base {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    :host([disabled]) .base, :host([loading]) .base { cursor: not-allowed; }

    /* Anel externo branco (como no app: botão bg-white com padding 3px) */
    .control {
      box-sizing: border-box;
      flex: none;
      display: flex;
      align-items: center;
      width: 50px;
      height: 30px;
      margin: 0;
      padding: 3px;
      border: none;
      border-radius: 999px;
      background: var(--me-color-white, #FFFFFF);
      cursor: inherit;
    }
    :host([size="small"]) .control { width: 38px; height: 22px; }

    /* Track colorido interno */
    .track {
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 3px;
      border-radius: 999px;
      background: var(--me-color-neutral-30, #D8D8E2);
      transition: background var(--me-transition, 0.2s ease);
    }
    :host([size="small"]) .track { padding: 2px; }
    :host([checked]) .track { background: var(--me-color-brand, #2F7F91); }

    /* Disabled: só o track esmaece (40% ligado / 60% desligado), como no app */
    :host([disabled]:not([checked])) .track {
      background: color-mix(in srgb, var(--me-color-neutral-30, #D8D8E2) 60%, transparent);
    }
    :host([disabled][checked]) .track {
      background: color-mix(in srgb, var(--me-color-brand, #2F7F91) 40%, transparent);
    }

    .thumb {
      display: block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--me-color-white, #FFFFFF);
      box-shadow: 0 1px 2px rgb(22 22 29 / 0.15);
      transition: translate var(--me-transition, 0.2s ease);
    }
    :host([checked]) .thumb { translate: 20px 0; }
    :host([size="small"]) .thumb { width: 12px; height: 12px; }
    :host([size="small"][checked]) .thumb { translate: 16px 0; }

    /* Loading: pulse no thumb (animate-pulse do app) */
    :host([loading]) .thumb {
      animation: me-switch-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes me-switch-pulse {
      50% { opacity: 0.5; }
    }

    /* Focus ring com offset (focus-visible:ring-2 ring-offset-2 do app) */
    .control:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px var(--me-color-surface, #FFFFFF),
        0 0 0 4px var(--me-color-brand, #2F7F91);
    }

    .label {
      font-size: var(--me-font-size-small, 14px);
      font-weight: var(--me-font-weight-medium, 500);
      line-height: var(--me-line-height-small, 18px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    :host([size="small"]) .label { font-size: 12px; }
    :host([disabled]) .label { color: var(--me-color-text-muted, #68688D); }
    .label:empty { display: none; }
  </style>
  <span class="base" part="base">
    <button class="control" part="control" type="button" role="switch" aria-checked="false">
      <span class="track" part="track">
        <span class="thumb" part="thumb"></span>
      </span>
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

    // Clicar em qualquer parte (controle ou rótulo) alterna — como o
    // <label> que envolve o botão no componente do app.
    this.shadowRoot.querySelector('.base').addEventListener('click', () => {
      if (this.disabled || this.loading) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }));
    });
  }

  static get observedAttributes() {
    return ['checked', 'disabled', 'loading'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this.controlElement.setAttribute('aria-checked', String(newValue !== null));
      this.#syncFormValue();
    }
    if (name === 'disabled' || name === 'loading') {
      // Botão nativo desabilitado bloqueia clique e foco (app: disabled || loading)
      this.controlElement.disabled = this.disabled || this.loading;
      this.controlElement.setAttribute('aria-busy', String(this.loading));
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

  get loading() { return this.hasAttribute('loading'); }
  set loading(value) {
    value ? this.setAttribute('loading', '') : this.removeAttribute('loading');
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
    this.controlElement.disabled = disabled || this.disabled || this.loading;
  }

  #syncFormValue() {
    // Semântica de checkbox: só entra no FormData quando ligado.
    this.#internals.setFormValue(this.checked ? this.value : null);
  }
}

window.customElements.define('me-switch', MeSwitch);
