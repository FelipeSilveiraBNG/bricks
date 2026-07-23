/*
 * <me-select-filter> + <me-option> + <me-filter-tag> — Filtros do Minha Escala.
 *
 * Réplica dos componentes de src/components/Filters/ e Approvals/components/
 * do minhaescala_web:
 *   - me-select-filter  ← SelectFilter.vue  (pílula rounded-full que abre um
 *       dropdown; suporta multiseleção, busca e badge de contagem)
 *   - me-option         ← <li> das opções do SelectFilter
 *   - me-filter-tag     ← ActiveFilters.vue (chip teal removível de filtro ativo)
 *
 * As opções são filhas em light DOM (como o me-radio dentro do me-radio-group):
 *   <me-select-filter label="Status" multiple>
 *     <me-icon slot="start" name="format-list-checks"></me-icon>
 *     <me-option value="PENDING_AUDIT" selected>Aguardando Auditoria</me-option>
 *     <me-option value="APPROVED">Aprovado</me-option>
 *   </me-select-filter>
 *
 * Ícones internos (chevron, ×) são SVG inline: a webfont MDI usada pelo
 * <me-icon> vive no documento e NÃO atravessa o shadow DOM. O slot "start",
 * porém, projeta um <me-icon> do light DOM sem problema.
 *
 * me-select-filter
 *   Atributos: label, open (refletido), multiple, searchable, disabled,
 *     align (left|right), search-placeholder.
 *   Slots: start (ícone), default (os me-option).
 *   Propriedade (leitura): value → array dos values selecionados.
 *   Eventos: me-select (detail { value, selected }) a cada opção alternada;
 *     change (detail { value: [...] }) com a lista completa;
 *     me-toggle (detail { open }) ao abrir/fechar.
 *   Parts: base, trigger, icon, label, count, panel, search, list, empty.
 *
 * me-option
 *   Atributos: value, selected (gerido pelo pai, refletido), disabled.
 *   Slot: default (rótulo). Part: base.
 *
 * me-filter-tag
 *   Atributos: value, no-remove (esconde o ×).
 *   Slot: default (rótulo). Evento: me-remove (detail { value }). Parts: base, remove.
 */

/* --------------------------------------------------------------- me-option */
const optionTemplate = document.createElement('template');
optionTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 do SelectFilter.vue */
    .base {
      padding: 8px 16px;
      font-size: var(--me-font-size-small, 14px);
      line-height: 20px;
      color: var(--me-color-secondary-40, #1E1E29);
      cursor: pointer;
      user-select: none;
      transition: background var(--me-transition, 0.2s ease);
    }
    .base:hover { background: var(--me-color-neutral-10, #F0F0F4); }

    /* Selecionado = bg-gray-100 font-semibold text-primary30 */
    :host([selected]) .base {
      background: var(--me-color-neutral-10, #F0F0F4);
      color: var(--me-color-primary-30, #2F7F91);
      font-weight: var(--me-font-weight-semibold, 600);
    }

    :host([disabled]) .base { opacity: 0.45; cursor: not-allowed; }
  </style>
  <div class="base" part="base"><slot></slot></div>
`;

class MeOption extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(optionTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', String(this.selected));
  }

  static get observedAttributes() {
    return ['selected'];
  }

  attributeChangedCallback() {
    this.setAttribute('aria-selected', String(this.selected));
  }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v); }

  get selected() { return this.hasAttribute('selected'); }
  set selected(v) { v ? this.setAttribute('selected', '') : this.removeAttribute('selected'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* Texto usado no filtro de busca do pai. */
  get label() { return this.textContent.trim(); }
}

window.customElements.define('me-option', MeOption);

/* -------------------------------------------------------- me-select-filter */
const filterTemplate = document.createElement('template');
filterTemplate.innerHTML = `
  <style>
    :host {
      position: relative;
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* Pílula: border rounded-full border-neutral-400 hover:bg-gray-100 do SelectFilter.vue */
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      padding: 8px 16px;
      border: 1px solid var(--me-color-neutral-40, #BCBCCD);
      border-radius: 999px;
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-secondary-10, #68688D);
      font: inherit;
      font-size: var(--me-font-size-small, 14px);
      line-height: 20px;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--me-transition, 0.2s ease);
    }
    .trigger:hover { background: var(--me-color-neutral-10, #F0F0F4); }
    .trigger:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    :host([disabled]) .trigger {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: var(--me-color-neutral-20, #E2E2E9);
    }

    /* Ícone do slot "start" (um me-icon do light DOM) */
    ::slotted(me-icon) { font-size: 18px; }
    .label:empty { display: none; }

    /* Badge de contagem: w-4 h-4 rounded-full bg-primary30 text-white text-[10px] */
    .count {
      display: none;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: var(--me-color-primary-30, #2F7F91);
      color: #fff;
      font-size: 11px;
      font-weight: var(--me-font-weight-bold, 700);
    }
    :host([data-has-count]) .count { display: inline-flex; }

    /* Dropdown: absolute mt-2 rounded-md shadow-lg bg-white ring-1 border do SelectFilter.vue */
    .panel {
      display: none;
      position: absolute;
      z-index: 20;
      top: calc(100% + 8px);
      left: 0;
      min-width: 240px;
      background: var(--me-color-surface, #FFFFFF);
      border: 1px solid var(--me-color-neutral-20, #E2E2E9);
      border-radius: var(--me-radius-m, 6px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      overflow: hidden;
    }
    :host([open]) .panel { display: block; }
    :host([align="right"]) .panel { left: auto; right: 0; }

    .search {
      display: none;
      padding: 8px;
      border-bottom: 1px solid var(--me-color-neutral-20, #E2E2E9);
    }
    :host([searchable]) .search { display: block; }
    .search input {
      box-sizing: border-box;
      width: 100%;
      padding: 6px 12px;
      border: 1px solid var(--me-color-neutral-30, #D8D8E2);
      border-radius: var(--me-radius-s, 4px);
      font: inherit;
      font-size: var(--me-font-size-small, 14px);
    }
    .search input:focus {
      outline: none;
      border-color: var(--me-color-brand, #2F7F91);
      box-shadow: 0 0 0 1px var(--me-color-brand, #2F7F91);
    }

    .list { max-height: 240px; overflow: auto; }

    .empty {
      display: none;
      padding: 8px 16px;
      font-size: var(--me-font-size-small, 14px);
      font-style: italic;
      color: var(--me-color-neutral-50, #9E9EB7);
    }
    :host([data-empty]) .empty { display: block; }
    :host([data-empty]) .list { display: none; }
  </style>
  <button class="trigger" part="trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
    <slot name="start"></slot>
    <span class="label" part="label"></span>
    <span class="count" part="count"></span>
  </button>
  <div class="panel" part="panel" role="listbox">
    <div class="search" part="search">
      <input type="text" part="search-input" placeholder="Buscar..." aria-label="Buscar" />
    </div>
    <div class="list" part="list"><slot></slot></div>
    <div class="empty" part="empty">Nenhum resultado</div>
  </div>
`;

class MeSelectFilter extends HTMLElement {
  #onDocPointer;
  #trigger;
  #searchInput;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(filterTemplate.content.cloneNode(true));

    this.#trigger = this.shadowRoot.querySelector('.trigger');
    this.#searchInput = this.shadowRoot.querySelector('.search input');

    // Abre/fecha ao clicar na pílula.
    this.#trigger.addEventListener('click', () => {
      if (this.disabled) return;
      this.open ? this.#close() : this.#open();
    });

    // Seleção: clique numa me-option.
    this.shadowRoot.querySelector('.list').addEventListener('click', (event) => {
      const option = event.target.closest('me-option');
      if (!option || option.disabled || !this.contains(option)) return;
      this.#toggleOption(option);
    });

    // Busca: filtra as opções por texto.
    this.#searchInput.addEventListener('input', () => this.#applySearch());

    // Recalcula contagem/estado quando as opções mudam.
    this.shadowRoot.querySelector('.list slot')
      .addEventListener('slotchange', () => { this.#updateCount(); this.#applySearch(); });

    // Fecha ao clicar fora / Esc.
    this.#onDocPointer = (event) => {
      if (this.open && !event.composedPath().includes(this)) this.#close();
    };
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.open) {
        event.stopPropagation();
        this.#close();
        this.#trigger.focus();
      }
    });
  }

  static get observedAttributes() {
    return ['label', 'open', 'disabled'];
  }

  connectedCallback() {
    document.addEventListener('pointerdown', this.#onDocPointer);
    this.#updateCount();
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.#onDocPointer);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'label') this.shadowRoot.querySelector('.label').textContent = newValue ?? '';
    if (name === 'open') this.#trigger.setAttribute('aria-expanded', String(newValue !== null));
    if (name === 'disabled') this.#trigger.disabled = newValue !== null;
  }

  /* ---- atributos / propriedades ---- */
  get label() { return this.getAttribute('label') ?? ''; }
  set label(v) { this.setAttribute('label', v); }

  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.#open() : this.#close(); }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(v) { v ? this.setAttribute('multiple', '') : this.removeAttribute('multiple'); }

  get searchable() { return this.hasAttribute('searchable'); }
  set searchable(v) { v ? this.setAttribute('searchable', '') : this.removeAttribute('searchable'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* Lista (somente leitura) dos values selecionados. */
  get value() { return this.#options().filter((o) => o.selected).map((o) => o.value); }

  /* ---- internos ---- */
  #options() {
    return [...this.querySelectorAll('me-option')].filter((o) => o.closest('me-select-filter') === this);
  }

  #open() {
    if (this.disabled || this.open) return;
    if (this.searchable) { this.#searchInput.value = ''; this.#applySearch(); }
    this.setAttribute('open', '');
    if (this.searchable) requestAnimationFrame(() => this.#searchInput.focus());
    this.dispatchEvent(new CustomEvent('me-toggle', { bubbles: true, composed: true, detail: { open: true } }));
  }

  #close() {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('me-toggle', { bubbles: true, composed: true, detail: { open: false } }));
  }

  #toggleOption(option) {
    if (this.multiple) {
      option.selected = !option.selected;
    } else {
      for (const o of this.#options()) o.selected = o === option;
      this.#close();
    }
    this.#updateCount();
    this.dispatchEvent(new CustomEvent('me-select', {
      bubbles: true, composed: true,
      detail: { value: option.value, selected: option.selected },
    }));
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true, composed: true,
      detail: { value: this.value },
    }));
  }

  #updateCount() {
    const count = this.#options().filter((o) => o.selected).length;
    this.shadowRoot.querySelector('.count').textContent = String(count);
    this.toggleAttribute('data-has-count', count > 0);
  }

  #applySearch() {
    const term = (this.#searchInput.value || '').trim().toLowerCase();
    let visible = 0;
    for (const option of this.#options()) {
      const match = !term || option.label.toLowerCase().includes(term);
      option.hidden = !match;
      if (match) visible++;
    }
    this.toggleAttribute('data-empty', visible === 0);
  }
}

window.customElements.define('me-select-filter', MeSelectFilter);

/* ------------------------------------------------------------ me-filter-tag */
const tagTemplate = document.createElement('template');
tagTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* rounded-full border-primary30 bg-primary-50 text-primary30 do ActiveFilters.vue */
    .base {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border: 1px solid var(--me-color-primary-30, #2F7F91);
      border-radius: 999px;
      background: var(--me-color-primary-5, #D8EEF3);
      color: var(--me-color-primary-30, #2F7F91);
      font-size: var(--me-font-size-small, 14px);
      line-height: 18px;
    }

    .remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      line-height: 1;
    }
    .remove:focus-visible {
      outline: none;
      border-radius: var(--me-radius-s, 4px);
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .remove svg { width: 14px; height: 14px; display: block; }
    :host([no-remove]) .remove { display: none; }
  </style>
  <span class="base" part="base">
    <slot></slot>
    <button class="remove" part="remove" type="button" aria-label="Remover filtro">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </span>
`;

class MeFilterTag extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(tagTemplate.content.cloneNode(true));

    this.shadowRoot.querySelector('.remove').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('me-remove', {
        bubbles: true, composed: true,
        detail: { value: this.value },
      }));
    });
  }

  get value() { return this.getAttribute('value'); }
  set value(v) { v == null ? this.removeAttribute('value') : this.setAttribute('value', v); }
}

window.customElements.define('me-filter-tag', MeFilterTag);
