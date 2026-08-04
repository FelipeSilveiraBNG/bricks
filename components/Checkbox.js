/*
 * <me-checkbox> + <me-checkbox-select> — Checkbox do Minha Escala.
 *
 * Réplica fiel de src/components/designSystem/Checkbox/index.vue e
 * Select/CheckboxSelect.vue do minhaescala_web:
 *
 * Checkbox — caixa 18×18px, radius 4px, borda 2px #E2E2E9; marcado =
 * borda #2F7F91 + miolo teal com check branco (mesmo SVG FontAwesome
 * em base64 do app); transição só na cor da borda (0.2s ease-in-out,
 * o preenchimento aparece instantâneo, como no original); disabled =
 * caixa cinza #E5E7EB e label #9E9EB7; label a 16px do controle.
 *
 * CheckboxSelect — card branco (radius 8px, padding 16px) com título
 * 18px semibold, descrição e lista de checkboxes com gap 16px.
 *
 * <me-checkbox> (form-associated) — atributos: checked, disabled, name,
 *   value (default "on"). Slot: default (rótulo). Parts: base, control, label.
 *   Evento: change (detail: { checked, value }). Semântica de checkbox no
 *   submit: aparece no FormData só quando marcado; vários com o mesmo name
 *   geram múltiplas entradas, como checkboxes nativos.
 *
 * <me-checkbox-select> — atributos: heading, description. Slot: default
 *   (os me-checkbox). Parts: base, heading, description, options.
 *   Evento: change (detail: { value: [values marcados] }).
 *
 * Exemplo:
 *   <me-checkbox-select heading="Turnos" description="Selecione os turnos.">
 *     <me-checkbox name="turno" value="diurno" checked>Diurno</me-checkbox>
 *     <me-checkbox name="turno" value="noturno">Noturno</me-checkbox>
 *   </me-checkbox-select>
 */
import { define } from './define.js';

/* Check branco do app (FontAwesome 6.2.0, mesmo data URI do Checkbox Vue) */
const CHECK_ICON = `url('data:image/svg+xml;base64, PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IndoaXRlIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PCEtLSEgRm9udCBBd2Vzb21lIFBybyA2LjIuMCBieSBAZm9udGF3ZXNvbWUgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbSBMaWNlbnNlIC0gaHR0cHM6Ly9mb250YXdlc29tZS5jb20vbGljZW5zZSAoQ29tbWVyY2lhbCBMaWNlbnNlKSBDb3B5cmlnaHQgMjAyMiBGb250aWNvbnMsIEluYy4gLS0+PHBhdGggZD0iTTQ3MC42IDEwNS40YzEyLjUgMTIuNSAxMi41IDMyLjggMCA0NS4zbC0yNTYgMjU2Yy0xMi41IDEyLjUtMzIuOCAxMi41LTQ1LjMgMGwtMTI4LTEyOGMtMTIuNS0xMi41LTEyLjUtMzIuOCAwLTQ1LjNzMzIuOC0xMi41IDQ1LjMgMEwxOTIgMzM4LjcgNDI1LjQgMTA1LjRjMTIuNS0xMi41IDMyLjgtMTIuNSA0NS4zIDB6Ii8+PC9zdmc+')`;

/* -------------------------------------------------------------- me-checkbox */
const checkboxTemplate = document.createElement('template');
checkboxTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
    }
    :host([hidden]) { display: none; }

    /* flex-start, não center: com rótulo de uma linha os dois dão o mesmo
       resultado, mas quando ele quebra — o normal em mobile — o center joga a
       caixa para o meio do parágrafo. Medido: rótulo de 3 linhas (72px) deixava
       a caixa de 18px a 27px do topo, longe da linha a que ela se refere. */
    .base {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      user-select: none;      /* select-none do app */
    }
    :host([disabled]) .base { cursor: not-allowed; }

    /* Réplica do input[type=checkbox].checkbox do app */
    input {
      appearance: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      height: 18px;
      width: 18px;
      /* mr-4 (16px). Os 3px de topo centram a caixa de 18px na primeira linha do
         rótulo, que tem 24px de line-height: (24-18)/2 = 3. É o que mantém o
         visual idêntico ao do align-items:center quando o rótulo é de uma linha. */
      margin: 3px 16px 0 0;
      background-color: var(--me-color-white, #FFFFFF);
      border-radius: var(--me-radius-s, 4px);
      border: 2px solid var(--me-color-neutral-20, #E2E2E9);
      display: flex;
      cursor: inherit;
      flex-shrink: 0;
      transition: border-color 0.2s ease-in-out; /* só a borda anima, como no app */
    }
    input:checked { border-color: var(--me-color-brand, #2F7F91); }
    /* disabled:bg-gray-200 no app; aqui o passo equivalente da paleta do kit */
    input:disabled { background-color: var(--me-color-neutral-20, #E2E2E9); }

    /* Miolo: preenchimento teal + check branco (aparece sem animação) */
    input::after {
      content: ' ';
      height: 100%;
      width: 100%;
      background-color: var(--me-color-brand, #2F7F91);
      background-image: ${CHECK_ICON};
      background-size: contain;
      display: none;
    }
    input:checked::after { display: block; }

    .label {
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      text-align: left;
      word-break: normal;
    }
    :host([disabled]) .label { color: var(--me-color-neutral-50, #9E9EB7); }
    .label:empty { display: none; }
  </style>
  <label class="base" part="base">
    <input type="checkbox" part="control" />
    <span class="label" part="label"><slot></slot></span>
  </label>
`;

class MeCheckbox extends HTMLElement {
  static formAssociated = true;

  #internals;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(checkboxTemplate.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.inputElement = this.shadowRoot.querySelector('input');

    // O <label> do shadow já alterna o input nativo; refletimos no host
    // e re-emitimos o change cruzando o shadow boundary (padrão bng).
    this.inputElement.addEventListener('change', (event) => {
      event.stopPropagation();
      this.checked = this.inputElement.checked;
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }));
    });
  }

  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this.inputElement.checked = newValue !== null;
      this.#syncFormValue();
    }
    if (name === 'disabled') {
      this.inputElement.disabled = newValue !== null;
    }
  }

  connectedCallback() {
    this.#syncFormValue();
  }

  /* Estado vivo refletido no atributo (permite estilizar me-checkbox[checked]). */
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
    this.inputElement.disabled = disabled || this.disabled;
  }

  #syncFormValue() {
    // Semântica de checkbox: só entra no FormData quando marcado.
    this.#internals.setFormValue(this.checked ? this.value : null);
  }
}

define('me-checkbox', MeCheckbox);

/* ------------------------------------------------------- me-checkbox-select */
const selectTemplate = document.createElement('template');
selectTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
    }
    :host([hidden]) { display: none; }

    /* Card do app: bg-white rounded-lg p-4, coluna com gap-2 */
    .base {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--me-color-surface, #FFFFFF);
      border-radius: var(--me-radius-l, 8px);
    }

    .heading {
      margin: 0;
      font-size: 18px;              /* text-lg */
      line-height: 28px;
      font-weight: var(--me-font-weight-semibold, 600);
      text-align: left;
    }
    .heading:empty { display: none; }

    .description {
      margin: 0;
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      text-align: left;
    }
    .description:empty { display: none; }

    /* Lista: flex col gap-4 mt-4 */
    .options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
  </style>
  <div class="base" part="base">
    <h2 class="heading" part="heading"></h2>
    <p class="description" part="description"></p>
    <div class="options" part="options"><slot></slot></div>
  </div>
`;

class MeCheckboxSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(selectTemplate.content.cloneNode(true));

    // Agrega os changes dos filhos num evento com a lista de marcados
    // (equivalente ao update:modelValue string[] do componente Vue).
    this.addEventListener('change', (event) => {
      const checkbox = event.target.closest?.('me-checkbox');
      if (!checkbox) return;
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }));
    });
  }

  static get observedAttributes() {
    return ['heading', 'description'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.shadowRoot.querySelector(`.${name}`).textContent = newValue ?? '';
  }

  get heading() { return this.getAttribute('heading'); }
  set heading(value) {
    value == null ? this.removeAttribute('heading') : this.setAttribute('heading', value);
  }

  get description() { return this.getAttribute('description'); }
  set description(value) {
    value == null ? this.removeAttribute('description') : this.setAttribute('description', value);
  }

  /* Lista (somente leitura) dos values marcados, como o modelValue do app. */
  get value() {
    return [...this.querySelectorAll('me-checkbox')]
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
  }
}

define('me-checkbox-select', MeCheckboxSelect);
