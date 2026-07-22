/*
 * <me-radio-group> + <me-radio> — Seleção única do Minha Escala.
 *
 * O GRUPO é o dono do estado: participa do form (ElementInternals),
 * gerencia seleção, roving tabindex e navegação por setas. O <me-radio>
 * é apresentacional (círculo teal ou card selecionável).
 *
 * Grupo — atributos: name, value, label (aria), orientation (vertical|horizontal).
 *         evento: change (detail.value).
 * Radio — atributos: value, disabled, checked (gerido pelo grupo, refletido),
 *         appearance (plain|card). Slots: default (título), description (só card).
 *         Parts: base, control, dot, label, description.
 *
 * Exemplo (modo card, "Regras de proporcionalidade" do app):
 *   <me-radio-group name="regra" value="limite" label="Regras de proporcionalidade">
 *     <me-radio value="limite" appearance="card">
 *       Proporcional com limite
 *       <span slot="description">Desconto por atraso e/ou saída antecipada.</span>
 *     </me-radio>
 *     ...
 *   </me-radio-group>
 */

/* ---------------------------------------------------------------- me-radio */
const radioTemplate = document.createElement('template');
radioTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
      cursor: pointer;
      outline: none;
    }
    :host([hidden]) { display: none; }
    :host([disabled]) { opacity: 0.45; pointer-events: none; }

    .base {
      display: flex;
      align-items: center;             /* radio simples: círculo e label centralizados (app) */
      gap: 8px;
    }

    /* Círculo do radio (anel + ponto teal) */
    .control {
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;                     /* w-[18px] do app */
      height: 18px;
      border: 2px solid #9ca3af;       /* gray-400 do app (não selecionado) */
      border-radius: 50%;
      background: var(--me-color-surface, #FFFFFF);
      transition: border-color var(--me-transition, 0.2s ease);
    }
    :host([checked]) .control { border-color: var(--me-color-brand, #2F7F91); }
    :host(:focus-visible) .control {
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--me-color-brand, #2F7F91);
      scale: 0;
      transition: scale var(--me-transition, 0.2s ease);
    }
    :host([checked]) .dot { scale: 1; }

    .text { display: flex; flex-direction: column; gap: 4px; }
    .label {
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    .description {
      display: none;
      font-size: var(--me-font-size-small, 14px);
      line-height: 20px;
      color: #4b5563;                  /* gray-600 do app */
    }

    /* Modo card (SelecaoProporcionalidade do app) */
    :host([appearance="card"]) .base {
      box-sizing: border-box;
      height: 100%;
      align-items: flex-start;
      padding: 16px;
      border-radius: var(--me-radius-l, 8px);
      background: var(--me-color-surface, #FFFFFF);
      /* Borda #d1d5db (gray-300 do app) via inset — engrossa selecionado sem
         layout shift — composta com a shadow-sm base do card. */
      box-shadow: inset 0 0 0 1px #d1d5db, 0 1px 2px rgb(0 0 0 / 0.05);
      transition: box-shadow var(--me-transition, 0.2s ease), background var(--me-transition, 0.2s ease);
    }
    :host([appearance="card"][checked]) .base {
      box-shadow: inset 0 0 0 2px var(--me-color-brand, #2F7F91), 0 1px 2px rgb(0 0 0 / 0.05);
    }
    :host([appearance="card"]) .label { font-weight: var(--me-font-weight-semibold, 600); }
    :host([appearance="card"]) .description { display: block; }
  </style>
  <div class="base" part="base">
    <span class="control" part="control"><span class="dot" part="dot"></span></span>
    <span class="text">
      <span class="label" part="label"><slot></slot></span>
      <span class="description" part="description"><slot name="description"></slot></span>
    </span>
  </div>
`;

class MeRadio extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(radioTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'radio');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
    this.setAttribute('aria-checked', String(this.checked));
  }

  static get observedAttributes() {
    return ['checked'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') this.setAttribute('aria-checked', String(newValue !== null));
  }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(newValue) { this.setAttribute('value', newValue); }

  get checked() { return this.hasAttribute('checked'); }
  set checked(value) {
    value ? this.setAttribute('checked', '') : this.removeAttribute('checked');
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }
}

window.customElements.define('me-radio', MeRadio);

/* ---------------------------------------------------------- me-radio-group */
const groupTemplate = document.createElement('template');
groupTemplate.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    :host([hidden]) { display: none; }
    :host([orientation="horizontal"]) {
      flex-direction: row;
      align-items: stretch;
    }
    /* Cards dividem o espaço igualmente na horizontal */
    :host([orientation="horizontal"]) ::slotted(me-radio[appearance="card"]) {
      flex: 1 1 0;
    }
  </style>
  <slot></slot>
`;

class MeRadioGroup extends HTMLElement {
  static formAssociated = true;

  #internals;
  #defaultValue = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(groupTemplate.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.shadowRoot.querySelector('slot')
      .addEventListener('slotchange', () => this.#syncRadios());

    this.addEventListener('click', (event) => {
      const radio = event.target.closest('me-radio');
      if (radio && !radio.disabled) this.#select(radio, { focus: false });
    });

    this.addEventListener('keydown', (event) => {
      const radios = this.#enabledRadios();
      if (!radios.length) return;

      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
        event.preventDefault();
        const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
        const current = radios.indexOf(event.target.closest('me-radio'));
        const next = radios[(current + (forward ? 1 : -1) + radios.length) % radios.length];
        this.#select(next, { focus: true }); // padrão nativo: mover já seleciona
      } else if (event.key === ' ') {
        event.preventDefault();
        const radio = event.target.closest('me-radio');
        if (radio && !radio.disabled) this.#select(radio, { focus: false });
      }
    });
  }

  static get observedAttributes() {
    return ['value', 'label', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') this.#syncRadios();
    if (name === 'label') {
      newValue == null
        ? this.removeAttribute('aria-label')
        : this.setAttribute('aria-label', newValue);
    }
  }

  connectedCallback() {
    this.setAttribute('role', 'radiogroup');
    // Guarda o valor inicial para restaurar no reset do form.
    if (this.#defaultValue === null) this.#defaultValue = this.value;
    this.#syncRadios();
  }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(newValue) { this.setAttribute('value', newValue); }

  get name() { return this.getAttribute('name'); }
  set name(value) {
    value == null ? this.removeAttribute('name') : this.setAttribute('name', value);
  }

  get form() { return this.#internals.form; }

  formResetCallback() {
    this.value = this.#defaultValue ?? '';
    this.#syncRadios();
  }

  #radios() {
    return [...this.querySelectorAll('me-radio')];
  }

  #enabledRadios() {
    return this.#radios().filter((radio) => !radio.disabled);
  }

  /* Seleção via interação do usuário: atualiza estado e emite change. */
  #select(radio, { focus }) {
    const changed = this.value !== radio.getAttribute('value');
    this.setAttribute('value', radio.getAttribute('value') ?? '');
    if (focus) radio.focus();
    if (changed) {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }));
    }
  }

  /* Reconcilia checked/tabindex dos filhos e o valor do form. */
  #syncRadios() {
    const radios = this.#radios();
    if (!radios.length) return;

    let checkedRadio = null;
    for (const radio of radios) {
      const isChecked = radio.getAttribute('value') === this.value && this.value !== '';
      radio.checked = isChecked;
      if (isChecked) checkedRadio = radio;
    }

    // Roving tabindex: um único tab stop no grupo.
    const focusTarget = checkedRadio ?? this.#enabledRadios()[0];
    for (const radio of radios) {
      radio.setAttribute('tabindex', radio === focusTarget ? '0' : '-1');
    }

    this.#internals.setFormValue(this.value !== '' ? this.value : null);
  }
}

window.customElements.define('me-radio-group', MeRadioGroup);
