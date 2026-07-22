/*
 * <me-input> — Campo de texto do Minha Escala (form-associated).
 *
 * Visual do app (Input.vue): fundo branco, borda 1px #323232, cantos 4px.
 * A label começa DENTRO do campo (como placeholder) e sobe/encolhe para a
 * borda superior ao focar ou quando há valor (label flutuante). O foco
 * engrossa a borda para 2px em primary-20 (#3CA2B9). Estado de erro: borda,
 * label e mensagem em negative (#DA1E28), com a mensagem abaixo do campo.
 *
 * Atributos: label, type (text|email|password|number|date|time), name,
 * value (valor inicial), placeholder, required, disabled, size,
 * error, error-message.
 * Slots: start, end (ícones).
 * Parts: base, label, input, error.
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
      border: 1px solid var(--me-color-gray-50, #323232);
      border-radius: var(--me-radius-s, 4px);
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-text, #16161D);
      transition: border-color var(--me-transition, 0.2s ease), box-shadow var(--me-transition, 0.2s ease);
    }
    :host([size="small"]) .field { height: var(--me-control-height-s, 32px); }
    :host([size="large"]) .field { height: var(--me-control-height-l, 48px); }

    /* App engrossa a borda para 2px em primary-20 no foco; o inset dobra a
       espessura sem deslocar o layout (evita o "pulo" de 1px). */
    .field:focus-within {
      border-color: var(--me-color-primary-20, #3CA2B9);
      box-shadow: inset 0 0 0 1px var(--me-color-primary-20, #3CA2B9);
    }
    :host([disabled]) .field {
      opacity: 0.45;
      background: var(--me-color-neutral-5, #FAFAFA);
    }

    /* Label flutuante: em repouso funciona como placeholder centralizado;
       flutua para a borda superior ao focar, ao ter valor (.filled) ou
       quando há ícone no início (.has-start). */
    label {
      position: absolute;
      top: 50%;
      left: 12px;
      transform: translateY(-50%);
      margin: 0;
      padding: 0;
      max-width: calc(100% - 24px);
      background: transparent;
      color: var(--me-color-text-muted, #68688D);
      font-size: var(--me-font-size-body, 16px);
      line-height: 1.2;
      letter-spacing: var(--me-letter-spacing, 0.5px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      transition: top var(--me-transition, 0.2s ease), left var(--me-transition, 0.2s ease),
                  font-size var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
    }
    :host([size="small"]) label { font-size: var(--me-font-size-small, 14px); }
    label[hidden] { display: none; }

    .field:focus-within label,
    .field.filled label,
    .field.has-start label {
      top: 0;
      left: 10px;
      font-size: 12px;
      background: var(--me-color-surface, #FFFFFF);
      padding: 0 4px;
    }
    .field:focus-within label { color: var(--me-color-primary-20, #3CA2B9); }
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

    /* Placeholder nativo fica escondido enquanto a label repousa por cima
       (evita texto duplicado); reaparece quando a label flutua. Sem label,
       o placeholder aparece normalmente. */
    .field.has-label input::placeholder { color: transparent; }
    .field.has-label:focus-within input::placeholder,
    .field.has-label.filled input::placeholder,
    .field.has-label.has-start input::placeholder { color: var(--me-color-text-muted, #68688D); }
    .field:not(.has-label) input::placeholder { color: var(--me-color-text-muted, #68688D); }

    ::slotted(me-icon) {
      font-size: 18px;
      color: var(--me-color-text-muted, #68688D);
    }

    /* Estado de erro (negative), vence o foco */
    :host([error]) .field {
      border-color: var(--me-color-negative-50, #DA1E28);
      box-shadow: inset 0 0 0 1px var(--me-color-negative-50, #DA1E28);
    }
    :host([error]) .field label { color: var(--me-color-negative-50, #DA1E28); }

    .error-text {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.3;
      letter-spacing: var(--me-letter-spacing, 0.5px);
      color: var(--me-color-negative-50, #DA1E28);
    }
    .error-text[hidden] { display: none; }
  </style>
  <div class="field" part="base">
    <label part="label" hidden><span class="text"></span><span class="asterisk" hidden> *</span></label>
    <slot name="start"></slot>
    <input part="input" type="text" />
    <slot name="end"></slot>
  </div>
  <div class="error-text" part="error" hidden></div>
`;

class MeInput extends HTMLElement {
  static formAssociated = true;

  #internals;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.fieldElement = this.shadowRoot.querySelector('.field');
    this.inputElement = this.shadowRoot.querySelector('input');
    this.labelElement = this.shadowRoot.querySelector('label');
    this.errorTextElement = this.shadowRoot.querySelector('.error-text');

    // Re-emite eventos nativos cruzando o shadow boundary com detail.value.
    for (const type of ['input', 'change']) {
      this.inputElement.addEventListener(type, (event) => {
        event.stopPropagation();
        this.#syncFormValue();
        this.#syncFilled();
        this.dispatchEvent(new CustomEvent(type, {
          bubbles: true,
          composed: true,
          detail: { value: this.inputElement.value },
        }));
      });
    }

    // Ícone no início força a label a flutuar (não sobrepõe o ícone).
    this.shadowRoot.querySelector('slot[name="start"]')
      .addEventListener('slotchange', () => this.#syncStart());
  }

  static get observedAttributes() {
    return ['label', 'type', 'value', 'placeholder', 'required', 'disabled', 'name', 'error', 'error-message'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'label': {
        this.labelElement.hidden = newValue == null;
        this.labelElement.querySelector('.text').textContent = newValue ?? '';
        this.fieldElement.classList.toggle('has-label', newValue != null);
        break;
      }
      case 'type':
        this.inputElement.type = newValue ?? 'text';
        this.#syncFilled();
        break;
      case 'value':
        // Atributo = valor inicial (semântica nativa).
        this.inputElement.value = newValue ?? '';
        this.#syncFormValue();
        this.#syncFilled();
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
      case 'error':
      case 'error-message':
        this.#syncError();
        break;
    }
  }

  connectedCallback() {
    this.#syncFormValue();
    this.#syncFilled();
    this.#syncStart();
    this.#syncError();
  }

  /* Valor vivo mora na propriedade (não reflete de volta ao atributo). */
  get value() { return this.inputElement.value; }
  set value(newValue) {
    this.inputElement.value = newValue ?? '';
    this.#syncFormValue();
    this.#syncFilled();
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

  get error() { return this.hasAttribute('error'); }
  set error(value) {
    value ? this.setAttribute('error', '') : this.removeAttribute('error');
  }

  get errorMessage() { return this.getAttribute('error-message'); }
  set errorMessage(value) {
    value == null ? this.removeAttribute('error-message') : this.setAttribute('error-message', value);
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
    this.#syncFilled();
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

  /* A label flutua quando há valor ou o tipo sempre mostra conteúdo (date/time). */
  #syncFilled() {
    const alwaysFilled = ['date', 'time', 'datetime-local', 'month', 'week'];
    const filled = this.inputElement.value !== '' || alwaysFilled.includes(this.inputElement.type);
    this.fieldElement.classList.toggle('filled', filled);
  }

  #syncStart() {
    const hasStart = this.shadowRoot
      .querySelector('slot[name="start"]').assignedNodes({ flatten: true }).length > 0;
    this.fieldElement.classList.toggle('has-start', hasStart);
  }

  #syncError() {
    const on = this.hasAttribute('error');
    this.inputElement.setAttribute('aria-invalid', String(on));
    const message = this.getAttribute('error-message') ?? '';
    this.errorTextElement.textContent = message;
    this.errorTextElement.hidden = !(on && message);
  }
}

window.customElements.define('me-input', MeInput);
