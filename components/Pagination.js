/*
 * <me-pagination> — Paginação do Minha Escala.
 *
 * Funcionamento inspirado na TOAST UI Pagination (@toast-ui/pagination, JS puro):
 * total de itens/itens por página → páginas, janela de `visible-pages` números,
 * botões primeira/anterior/próxima/última, eventos before/after move e métodos
 * (movePageTo, reset, setItemsPerPage...). A janela com reticências replica o
 * algoritmo do VPagination do Vuetify (o componente usado no minhaescala_web),
 * e a APARÊNCIA espelha o v-pagination do app: número ativo preenchido em teal,
 * botões arredondados, setas ‹ › nas pontas (first/last « » opcionais).
 *
 * Atributos (refletidos): page (atual, 1-based), total-pages, total-items,
 *   items-per-page (default 10), visible-pages (default 5), first-last, disabled,
 *   ellipsis (default "…"). Se total-pages for definido, vence; senão calcula-se
 *   ceil(total-items / items-per-page).
 * Propriedades: page, totalPages (leitura), totalItems, itemsPerPage, visiblePages.
 * Métodos (paridade TOAST UI): getCurrentPage(), getTotalPages(), movePageTo(n),
 *   reset(totalItems?), setItemsPerPage(n), setTotalItems(n).
 * Eventos: me-before-move (cancelável; detail { page } = destino; preventDefault
 *   cancela a navegação) e change (detail { page } = página atual, após mover).
 * Parts: base, item, control, page, active, prev, next, first, last, ellipsis.
 */

// [start, start+1, …, start+length-1]
function createRange(length, start = 1) {
  return Array.from({ length }, (_, i) => start + i);
}

const CHEVRON = {
  // ‹ e ›
  prev: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
  // « e » (duplo)
  first: 'M18 6l-6 6 6 6M12 6l-6 6 6 6',
  last: 'M6 6l6 6-6 6M12 6l6 6-6 6',
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      justify-content: center;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .base {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    /* Botão base (número, seta ou reticências) — density "comfortable" do app (36px) */
    .item {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      border: 0;
      border-radius: var(--me-radius-s, 4px);
      background: none;
      color: var(--me-color-text, #16161D);
      font: inherit;
      font-size: var(--me-font-size-small, 14px);
      line-height: 1;
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease),
                  color var(--me-transition, 0.2s ease);
    }
    .item:hover:not(:disabled):not(.active) { background: var(--me-color-neutral-10, #F0F0F4); }
    .item:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    /* Página ativa: preenchida em teal, texto branco em bold (como o v-pagination) */
    .item.active {
      background: var(--me-color-brand, #2F7F91);
      color: var(--me-color-white, #FFFFFF);
      font-weight: var(--me-font-weight-bold, 700);
      cursor: default;
    }

    /* Setas (prev/next/first/last): ícone cinza; desabilitado esmaecido */
    .control { color: var(--me-color-text-muted, #68688D); }
    .control svg { width: 20px; height: 20px; display: block; }
    .item:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Reticências: não interativa */
    .ellipsis {
      color: var(--me-color-text-muted, #68688D);
      cursor: default;
      user-select: none;
    }

    :host([disabled]) .base { opacity: 0.6; pointer-events: none; }
  </style>
  <ul class="base" part="base" role="list"></ul>
`;

class MePagination extends HTMLElement {
  #list;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#list = this.shadowRoot.querySelector('.base');

    this.#list.addEventListener('click', (event) => {
      const el = event.target.closest('[data-page]');
      if (!el || el.disabled) return;
      this.movePageTo(Number(el.dataset.page));
    });

    // Navegação por teclado (setas ← →), como no v-pagination.
    this.addEventListener('keydown', (event) => {
      if (this.disabled) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); this.movePageTo(this.page - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); this.movePageTo(this.page + 1); }
    });
  }

  static get observedAttributes() {
    return ['page', 'total-pages', 'total-items', 'items-per-page', 'visible-pages', 'first-last', 'disabled', 'ellipsis'];
  }

  connectedCallback() {
    this.setAttribute('role', 'navigation');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Paginação');
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  /* ---------- atributos / propriedades ---------- */
  #int(name, fallback) {
    const raw = parseInt(this.getAttribute(name), 10);
    return Number.isNaN(raw) ? fallback : raw;
  }

  get page() { return Math.max(1, this.#int('page', 1)); }
  set page(v) { this.setAttribute('page', String(v)); }

  get totalItems() { return Math.max(0, this.#int('total-items', 0)); }
  set totalItems(v) { this.setAttribute('total-items', String(v)); }

  get itemsPerPage() { return Math.max(1, this.#int('items-per-page', 10)); }
  set itemsPerPage(v) { this.setAttribute('items-per-page', String(v)); }

  get visiblePages() { return Math.max(1, this.#int('visible-pages', 5)); }
  set visiblePages(v) { this.setAttribute('visible-pages', String(v)); }

  get ellipsis() { return this.getAttribute('ellipsis') ?? '…'; }

  get firstLast() { return this.hasAttribute('first-last'); }
  set firstLast(v) { v ? this.setAttribute('first-last', '') : this.removeAttribute('first-last'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* total-pages explícito vence; senão calcula de total-items / items-per-page. */
  get totalPages() {
    if (this.hasAttribute('total-pages')) return Math.max(1, this.#int('total-pages', 1));
    const items = this.totalItems;
    if (items > 0) return Math.max(1, Math.ceil(items / this.itemsPerPage));
    return 1;
  }

  /* ---------- métodos (paridade TOAST UI) ---------- */
  getCurrentPage() { return this.page; }
  getTotalPages() { return this.totalPages; }

  movePageTo(target) {
    const clamped = Math.min(Math.max(Math.round(target) || 1, 1), this.totalPages);
    if (clamped === this.page) return;

    // beforeMove cancelável: preventDefault() aborta a navegação.
    const before = this.dispatchEvent(new CustomEvent('me-before-move', {
      bubbles: true, composed: true, cancelable: true, detail: { page: clamped },
    }));
    if (!before) return;

    this.page = clamped; // reflete o atributo → re-render via attributeChangedCallback
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true, composed: true, detail: { page: clamped },
    }));
  }

  reset(totalItems) {
    if (totalItems != null) this.setAttribute('total-items', String(totalItems));
    this.page = 1;
  }

  setItemsPerPage(n) { this.itemsPerPage = n; }
  setTotalItems(n) { this.totalItems = n; }

  /* ---------- janela de páginas (algoritmo do VPagination) ---------- */
  #range(current, length, visible) {
    if (length <= 0) return [];
    if (visible <= 1) return [current];
    if (length <= visible) return createRange(length);

    const even = visible % 2 === 0;
    const middle = even ? visible / 2 : Math.floor(visible / 2);
    const left = even ? middle : middle + 1;
    const right = length - middle;

    if (left - current >= 0) {
      return [...createRange(Math.max(1, visible - 1)), this.ellipsis, length];
    } else if (current - right >= (even ? 1 : 0)) {
      const rangeLength = visible - 1;
      return [1, this.ellipsis, ...createRange(rangeLength, length - rangeLength + 1)];
    }
    const rangeLength = Math.max(1, visible - 3);
    const rangeStart = rangeLength === 1 ? current : current - Math.ceil(rangeLength / 2) + 1;
    return [1, this.ellipsis, ...createRange(rangeLength, rangeStart), this.ellipsis, length];
  }

  /* ---------- render ---------- */
  #control(kind, targetPage, label, disabled) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item control';
    btn.setAttribute('part', `control ${kind}`);
    btn.setAttribute('aria-label', label);
    btn.dataset.page = String(targetPage);
    if (disabled) btn.disabled = true;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${CHEVRON[kind]}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return btn;
  }

  #render() {
    const length = this.totalPages;
    const current = Math.min(this.page, length);
    const list = this.#list;
    list.replaceChildren();

    if (this.firstLast) {
      list.append(this.#control('first', 1, 'Primeira página', current <= 1));
    }
    list.append(this.#control('prev', current - 1, 'Página anterior', current <= 1));

    for (const item of this.#range(current, length, this.visiblePages)) {
      if (item === this.ellipsis) {
        const span = document.createElement('span');
        span.className = 'item ellipsis';
        span.setAttribute('part', 'item ellipsis');
        span.setAttribute('aria-hidden', 'true');
        span.textContent = this.ellipsis;
        list.append(span);
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = item === current;
      btn.className = 'item page' + (isActive ? ' active' : '');
      btn.setAttribute('part', 'item page' + (isActive ? ' active' : ''));
      btn.dataset.page = String(item);
      btn.textContent = String(item);
      btn.setAttribute('aria-label', `Página ${item}`);
      if (isActive) btn.setAttribute('aria-current', 'page');
      list.append(btn);
    }

    list.append(this.#control('next', current + 1, 'Próxima página', current >= length));
    if (this.firstLast) {
      list.append(this.#control('last', length, 'Última página', current >= length));
    }
  }
}

window.customElements.define('me-pagination', MePagination);
