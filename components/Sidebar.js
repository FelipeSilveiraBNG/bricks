/*
 * <me-sidebar> + <me-sidebar-item> — Menu lateral do Minha Escala.
 *
 * Branca, altura total; recolhida 76px (só ícones) / expandida 232px.
 * Topo: logo (symbol recolhida, horizontal expandida) + botão toggle rosa
 * com chevrons duplos. Item ativo = retângulo teal com ícone/texto brancos.
 * Item "Sair" fixado embaixo via slot "footer".
 *
 * Sidebar — atributos: expanded (refletido). Evento: me-toggle (detail.expanded).
 *           Slots: default (itens), footer. Parts: base, header, toggle, nav, footer.
 * Item — atributos: href, active, collapsed (gerido pelo pai).
 *        Slots: start (me-icon), default (rótulo). Parts: base, icon, label.
 *
 * Exemplo:
 *   <me-sidebar expanded>
 *     <me-sidebar-item href="#" active><me-icon slot="start" name="monitor"></me-icon>Dashboard</me-sidebar-item>
 *     <me-sidebar-item href="#"><me-icon slot="start" name="calendar-edit"></me-icon>Gerenciar Escalas</me-sidebar-item>
 *     <me-sidebar-item slot="footer" href="#"><me-icon slot="start" name="logout"></me-icon>Sair</me-sidebar-item>
 *   </me-sidebar>
 */

import './Logo.js'; // o header da sidebar renderiza <me-logo>

/* --------------------------------------------------------- me-sidebar-item */
const itemTemplate = document.createElement('template');
itemTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .base {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-radius: var(--me-radius-m, 6px);
      background: transparent;
      color: var(--me-color-text, #16161D);
      font-family: inherit;
      font-size: var(--me-font-size-body, 16px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      text-decoration: none;
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
    }
    .base:hover { background: var(--me-color-brand-soft, #D8EEF3); }
    .base:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    :host([active]) .base {
      background: var(--me-color-brand, #2F7F91);
      color: var(--me-color-white, #FFFFFF);
      font-weight: var(--me-font-weight-bold, 700);
    }

    .icon {
      flex: none;
      display: inline-flex;
      font-size: 24px;
    }

    .label {
      flex: 1;
      min-width: 0;
      white-space: nowrap;     /* não quebra durante a transição de largura */
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    }

    /* Recolhida: só o ícone, centralizado */
    :host([collapsed]) .base { justify-content: center; padding: 10px 0; }
    :host([collapsed]) .label { display: none; }
  </style>
`;

class MeSidebarItem extends HTMLElement {
  #base = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(itemTemplate.content.cloneNode(true));
    this.#renderBase();
  }

  static get observedAttributes() {
    return ['href', 'collapsed'];
  }

  attributeChangedCallback(name) {
    if (name === 'href') this.#renderBase();
    if (name === 'collapsed') this.#syncTooltip();
  }

  get active() { return this.hasAttribute('active'); }
  set active(value) {
    value ? this.setAttribute('active', '') : this.removeAttribute('active');
  }

  get href() { return this.getAttribute('href'); }
  set href(value) {
    value == null ? this.removeAttribute('href') : this.setAttribute('href', value);
  }

  #renderBase() {
    const isLink = this.hasAttribute('href');
    const el = document.createElement(isLink ? 'a' : 'button');
    el.className = 'base';
    el.setAttribute('part', 'base');
    if (isLink) el.href = this.getAttribute('href');
    else el.type = 'button';
    el.innerHTML = `
      <span class="icon" part="icon"><slot name="start"></slot></span>
      <span class="label" part="label"><slot></slot></span>
    `;
    if (this.#base) this.#base.replaceWith(el);
    else this.shadowRoot.appendChild(el);
    this.#base = el;
    this.#syncTooltip();
  }

  /* Recolhida, o rótulo vira tooltip nativo. */
  #syncTooltip() {
    if (this.hasAttribute('collapsed')) {
      this.#base.title = this.textContent.trim();
    } else {
      this.#base.removeAttribute('title');
    }
  }
}

window.customElements.define('me-sidebar-item', MeSidebarItem);

/* -------------------------------------------------------------- me-sidebar */
const sidebarTemplate = document.createElement('template');
sidebarTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      width: 76px;
      height: 100%;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      transition: width var(--me-transition, 0.2s ease);
    }
    :host([expanded]) { width: 232px; }
    :host([hidden]) { display: none; }

    .base {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px 12px;
      background: var(--me-color-surface, #FFFFFF);
      box-shadow: var(--me-shadow-card, 0 1px 4px rgb(22 22 29 / 0.10));
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      min-height: 40px;
    }
    :host([expanded]) .header { justify-content: space-between; }

    /* No app: recolhida mostra só o toggle; expandida mostra logo + toggle. */
    .logo { display: none; }
    :host([expanded]) .logo { display: block; height: 40px; }

    .toggle {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--me-radius-m, 6px);
      background: var(--me-color-tertiary-30, #CB2957);
      color: var(--me-color-white, #FFFFFF);
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease);
    }
    .toggle:hover { background: color-mix(in srgb, var(--me-color-tertiary-30, #CB2957) 85%, #000); }
    .toggle:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .toggle .collapse-icon { display: none; }
    :host([expanded]) .toggle .expand-icon { display: none; }
    :host([expanded]) .toggle .collapse-icon { display: block; }

    nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
      padding-top: 16px;
    }
  </style>
  <div class="base" part="base">
    <div class="header" part="header">
      <me-logo class="logo" variant="horizontal"></me-logo>
      <!-- Chevrons duplos em SVG inline (estruturais, não dependem do CDN) -->
      <button class="toggle" part="toggle" type="button" aria-label="Expandir menu" aria-expanded="false">
        <svg class="expand-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 17 5-5-5-5M13 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <nav part="nav"><slot></slot></nav>
    <div class="footer" part="footer"><slot name="footer"></slot></div>
  </div>
`;

class MeSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(sidebarTemplate.content.cloneNode(true));

    this.toggleButton = this.shadowRoot.querySelector('.toggle');
    this.toggleButton.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.dispatchEvent(new CustomEvent('me-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }));
    });

    // Propaga o estado para os itens (inclusive os que chegarem depois).
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.#syncItems());
    }
  }

  static get observedAttributes() {
    return ['expanded'];
  }

  attributeChangedCallback() {
    this.#syncItems();
  }

  connectedCallback() {
    this.#syncItems();
  }

  get expanded() { return this.hasAttribute('expanded'); }
  set expanded(value) {
    value ? this.setAttribute('expanded', '') : this.removeAttribute('expanded');
  }

  #syncItems() {
    const expanded = this.expanded;
    this.toggleButton.setAttribute('aria-expanded', String(expanded));
    this.toggleButton.setAttribute('aria-label', expanded ? 'Recolher menu' : 'Expandir menu');
    for (const item of this.querySelectorAll('me-sidebar-item')) {
      expanded ? item.removeAttribute('collapsed') : item.setAttribute('collapsed', '');
    }
  }
}

window.customElements.define('me-sidebar', MeSidebar);
