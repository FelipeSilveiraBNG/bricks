/*
 * <me-input> — Campo de texto do Minha Escala (form-associated).
 *
 * Visual do app: fundo branco, borda 1px escura, cantos 4px, label
 * flutuante "notched" apoiada na borda superior (com asterisco vermelho
 * quando required), ícone opcional no início (calendar/clock).
 *
 * Atributos: label, type (text|email|password|number|date|time), name,
 * value (valor inicial), placeholder, required, disabled, size.
 * Slots: start, end (ícones).
 * Parts: base, label, input.
 * Eventos: input, change (re-emitidos com detail.value, composed).
 *
 * Participa de <form> nativo via ElementInternals (FormData inclui name/value).
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      width: 260px;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .field {
      box-sizing: border-box;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: var(--me-control-height-m, 40px);
      padding: 0 12px;
      border: 1px solid var(--me-color-secondary-50, #16161D);
      border-radius: var(--me-radius-s, 4px);
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-text, #16161D);
      transition: border-color var(--me-transition, 0.2s ease), box-shadow var(--me-transition, 0.2s ease);
    }
    :host([size="small"]) .field { height: var(--me-control-height-s, 32px); }
    :host([size="large"]) .field { height: var(--me-control-height-l, 48px); }

    .field:focus-within {
      border-color: var(--me-color-brand, #2F7F91);
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    :host([disabled]) .field {
      opacity: 0.45;
      background: var(--me-color-neutral-5, #FAFAFA);
    }

    /* Label "notched": apoiada na borda superior, com fundo da superfície. */
    label {
      position: absolute;
      top: 0;
      left: 10px;
      transform: translateY(-50%);
      padding: 0 4px;
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-text-muted, #68688D);
      font-size: 12px;
      line-height: 1.2;
      letter-spacing: var(--me-letter-spacing, 0.5px);
      white-space: nowrap;
      pointer-events: none;
    }
    .field:focus-within label { color: var(--me-color-brand, #2F7F91); }
    label[hidden] { display: none; }
    .asterisk { color: var(--me-color-negative-50, #DA1E28); }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      padding: 0;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: var(--me-font-size-body, 16px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    :host([size="small"]) input { font-size: var(--me-font-size-small, 14px); }
    input::placeholder { color: var(--me-color-text-muted, #68688D); }

    ::slotted(me-icon) {
      font-size: 18px;
      color: var(--me-color-text-muted, #68688D);
    }
  </style>
  <div class="field" part="base">
    <label part="label" hidden><span class="text"></span><span class="asterisk" hidden> *</span></label>
    <slot name="start"></slot>
    <input part="input" type="text" />
    <slot name="end"></slot>
  </div>
`;

class MeInput extends HTMLElement {
  static formAssociated = true;

  #internals;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.inputElement = this.shadowRoot.querySelector('input');
    this.labelElement = this.shadowRoot.querySelector('label');

    // Re-emite eventos nativos cruzando o shadow boundary com detail.value.
    for (const type of ['input', 'change']) {
      this.inputElement.addEventListener(type, (event) => {
        event.stopPropagation();
        this.#syncFormValue();
        this.dispatchEvent(new CustomEvent(type, {
          bubbles: true,
          composed: true,
          detail: { value: this.inputElement.value },
        }));
      });
    }
  }

  static get observedAttributes() {
    return ['label', 'type', 'value', 'placeholder', 'required', 'disabled', 'name'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'label': {
        this.labelElement.hidden = newValue == null;
        this.labelElement.querySelector('.text').textContent = newValue ?? '';
        break;
      }
      case 'type':
        this.inputElement.type = newValue ?? 'text';
        break;
      case 'value':
        // Atributo = valor inicial (semântica nativa).
        this.inputElement.value = newValue ?? '';
        this.#syncFormValue();
        break;
      case 'placeholder':
        newValue == null
          ? this.inputElement.removeAttribute('placeholder')
          : this.inputElement.setAttribute('placeholder', newValue);
        break;
      case 'required':
        this.inputElement.required = newValue !== null;
        this.labelElement.querySelector('.asterisk').hidden = newValue === null;
        this.#syncValidity();
        break;
      case 'disabled':
        this.inputElement.disabled = newValue !== null;
        break;
    }
  }

  connectedCallback() {
    this.#syncFormValue();
  }

  /* Valor vivo mora na propriedade (não reflete de volta ao atributo). */
  get value() { return this.inputElement.value; }
  set value(newValue) {
    this.inputElement.value = newValue ?? '';
    this.#syncFormValue();
  }

  get name() { return this.getAttribute('name'); }
  set name(value) {
    value == null ? this.removeAttribute('name') : this.setAttribute('name', value);
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }

  get required() { return this.hasAttribute('required'); }
  set required(value) {
    value ? this.setAttribute('required', '') : this.removeAttribute('required');
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
  focus(options) { this.inputElement.focus(options); }
  blur() { this.inputElement.blur(); }

  /* Callbacks do ciclo de vida form-associated */
  formResetCallback() {
    this.inputElement.value = this.getAttribute('value') ?? '';
    this.#syncFormValue();
  }

  formDisabledCallback(disabled) {
    this.inputElement.disabled = disabled || this.disabled;
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.inputElement.value);
    this.#syncValidity();
  }

  #syncValidity() {
    // Espelha a validade do input interno (required, type=email etc.).
    const input = this.inputElement;
    if (input.validity.valid) {
      this.#internals.setValidity({});
    } else {
      this.#internals.setValidity(input.validity, input.validationMessage, input);
    }
  }
}

window.customElements.define('me-input', MeInput);
