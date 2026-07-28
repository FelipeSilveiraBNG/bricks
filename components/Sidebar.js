/*
 * <me-sidebar> + <me-sidebar-item> — Menu lateral do Minha Escala.
 *
 * Espelha o Sidebar real do app (src/components/Sidebar.vue do
 * minhaescala_web): aberta 288px / recolhida 64px (transição 300ms),
 * fundo branco com borda direita cinza, header de 80px (logo "variant"
 * ~120px quando aberta + botão de toggle: quadrado rosa 24px com
 * chevrons duplos brancos), itens com 16px de padding vertical, radius
 * 4px, ativo = teal #2F7F91 com texto branco semibold, hover teal a 8%.
 *
 * PRESETS (menus por perfil) ficam DENTRO do componente: as listas de itens são
 * definidas em ./sidebar-presets.js (fonte única de verdade), NÃO no HTML que usa
 * o me-sidebar. O consumidor só escolhe o preset e qual item está ativo:
 *
 *   <me-sidebar expanded preset="gestor" active-item="aprovacoes"></me-sidebar>
 *
 * O me-sidebar gera os <me-sidebar-item> a partir do preset (não se declaram
 * itens de menu no markup). Para adicionar/editar menus, edite sidebar-presets.js.
 *
 * Sidebar — atributos: expanded (refletido); preset (nome de um preset em
 *           sidebar-presets.js; refletido); active-item (key do item ativo);
 *           persist-key (chave de localStorage p/ lembrar o preset).
 *           Propriedades: expanded, preset, activeItem.
 *           Eventos: me-toggle (detail.expanded), me-preset-change (detail.name).
 *           Slot: footer (itens fixos embaixo, ex.: "Sair" — caso especial; o app
 *           real não tem "Sair" na sidebar). Parts: base, header, toggle, nav, footer.
 * Item — gerado pelo me-sidebar; encapsula a linha (link/ícone/rótulo, estado
 *        ativo e recolhido). Atributos: href, active, collapsed. Slots: start
 *        (me-icon), default (rótulo). Parts: base, icon, label.
 *
 * Persistência: com persist-key, a escolha do preset é lembrada em localStorage.
 * Ordem de resolução: armazenado → atributo preset → primeiro preset do objeto.
 *
 * Troca de preset via API (o seletor é do consumidor; o componente não o renderiza):
 *   sidebar.preset = 'medico'  // troca, persiste e emite me-preset-change
 */

import './Logo.js'; // o header da sidebar renderiza <me-logo>
import './Icon.js'; // os itens gerados usam <me-icon>
import { SIDEBAR_PRESETS } from './sidebar-presets.js';
import { define } from './define.js';

/* --------------------------------------------------------- me-sidebar-item */
const itemTemplate = document.createElement('template');
itemTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* Linha do item como no app: py-4 (16px), rounded (4px), duration-200 */
    .base {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 16px;                    /* mx-4 do label no app */
      width: 100%;
      padding: 16px 24px;           /* py-4 + px-6 (aberta) */
      border: none;
      border-radius: var(--me-radius-s, 4px);
      background: transparent;
      color: var(--me-color-secondary-40, #1E1E29);
      font-family: inherit;
      font-size: var(--me-font-size-body, 16px);
      letter-spacing: normal;
      text-decoration: none;
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
    }
    /* hover do app: rgba(47,127,145,0.08) — tint da marca, derivado no token */
    .base:hover { background: var(--me-color-brand-hover, rgb(47 127 145 / 0.08)); }
    .base:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    /* ativo: bg-[#2F7F91] text-white font-semibold */
    :host([active]) .base {
      background: var(--me-color-brand, #2F7F91);
      color: var(--me-color-white, #FFFFFF);
      font-weight: var(--me-font-weight-semibold, 600);
    }

    .icon {
      flex: none;
      display: inline-flex;
      font-size: 24px;
    }

    .label {
      flex: 1;
      min-width: 0;
      white-space: nowrap;          /* não quebra durante a transição de largura */
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    }

    /* Recolhida: só o ícone, centralizado (justify-center do app) */
    :host([collapsed]) .base { justify-content: center; padding: 16px 0; }
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

  /* Recolhida, o rótulo vira tooltip nativo (o app usa v-tooltip à direita). */
  #syncTooltip() {
    if (this.hasAttribute('collapsed')) {
      this.#base.title = this.textContent.trim();
    } else {
      this.#base.removeAttribute('title');
    }
  }
}

define('me-sidebar-item', MeSidebarItem);

/* -------------------------------------------------------------- me-sidebar */
const sidebarTemplate = document.createElement('template');
sidebarTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      width: 64px;                  /* w-16 recolhida */
      height: 100%;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      transition: width 0.3s ease;  /* duration-300 do app */
    }
    :host([expanded]) { width: 288px; } /* w-72 aberta */
    :host([hidden]) { display: none; }

    .base {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--me-color-surface, #FFFFFF);
      /* border-gray-200 no app; aqui o passo equivalente da paleta do kit */
      border-right: 1px solid var(--me-color-neutral-20, #E2E2E9);
      overflow: hidden;
    }

    /* Header: h-20 (80px), px-4; aberta = logo + toggle, recolhida = só toggle */
    .header {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      padding: 0 16px;
    }
    :host([expanded]) .header { justify-content: space-between; }

    /* Logo "variant" do app com ~120px de largura (150:46 → altura 37px) */
    .logo { display: none; }
    :host([expanded]) .logo { display: block; height: 37px; }

    /* Botão do toggle: sem estilo próprio; o ícone é o quadrado rosa 24px */
    .toggle {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--me-radius-m, 6px);
    }
    .toggle:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .toggle svg { display: block; }
    .toggle .collapse-icon { display: none; }
    :host([expanded]) .toggle .expand-icon { display: none; }
    :host([expanded]) .toggle .collapse-icon { display: block; }

    /* Nav: mt-6 (24px); aberta px-4 (16px), recolhida px-2 (8px); itens mt-1 (gap 4px) */
    nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 24px;
      padding: 0 8px;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
    }
    :host([expanded]) nav { padding: 0 16px; }

    .footer {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: auto;
      padding: 16px 8px;
    }
    :host([expanded]) .footer { padding: 16px; }
  </style>
  <div class="base" part="base">
    <div class="header" part="header">
      <me-logo class="logo" variant="variant"></me-logo>
      <!-- Ícone do app (assets/icons/rightArrow.vue): quadrado rosa rx-6
           24px com chevrons duplos brancos -->
      <button class="toggle" part="toggle" type="button" aria-label="Expandir menu" aria-expanded="false">
        <svg class="expand-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="var(--me-color-tertiary-30, #CB2957)"/>
          <path d="M7.5 7l5 5-5 5M13 7l5 5-5 5" stroke="var(--me-color-white, #FFFFFF)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="collapse-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="var(--me-color-tertiary-30, #CB2957)"/>
          <path d="M16.5 17l-5-5 5-5M11 17l-5-5 5-5" stroke="var(--me-color-white, #FFFFFF)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <nav part="nav"><slot></slot></nav>
    <div class="footer" part="footer"><slot name="footer"></slot></div>
  </div>
`;

class MeSidebar extends HTMLElement {
  #hydrated = false;
  #activeName = null;

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

    // Mantém o collapsed em dia quando itens entram/saem (modo custom sem preset,
    // ou itens de footer). É idempotente com a geração via preset.
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => { if (this.#hydrated) this.#syncCollapsed(); });
    }
  }

  static get observedAttributes() {
    return ['expanded', 'preset', 'active-item'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#hydrated) return;                  // ignora writes durante upgrade/hydrate
    if (name === 'expanded') { this.#syncCollapsed(); return; }
    if (name === 'active-item') { this.#syncActive(); return; }
    if (name === 'preset') {
      if (newValue === this.#activeName) return;  // idempotente, evita loop
      this.#setPreset(newValue, { emit: true, persist: true });
    }
  }

  connectedCallback() {
    this.#hydrate();
  }

  get expanded() { return this.hasAttribute('expanded'); }
  set expanded(value) {
    value ? this.setAttribute('expanded', '') : this.removeAttribute('expanded');
  }

  get preset() { return this.getAttribute('preset'); }
  set preset(value) {
    value == null ? this.removeAttribute('preset') : this.setAttribute('preset', value);
  }

  get activeItem() { return this.getAttribute('active-item'); }
  set activeItem(value) {
    value == null ? this.removeAttribute('active-item') : this.setAttribute('active-item', value);
  }

  /* -------- persistência do preset -------- */
  #persistKey() { return this.getAttribute('persist-key'); }

  #readStored() {
    const key = this.#persistKey();
    if (!key) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  }

  #writeStored(name) {
    const key = this.#persistKey();
    if (!key) return;
    try { localStorage.setItem(key, name); } catch { /* modo privado/bloqueado */ }
  }

  /* Presets são opt-in: só quando há preset (armazenado ou atributo) o componente
   * gera os itens. Sem preset, o consumidor declara <me-sidebar-item> à mão
   * (menu custom) e nós só cuidamos do collapsed. */
  #hydrate() {
    const names = Object.keys(SIDEBAR_PRESETS);
    const stored = this.#readStored();
    const attr = this.getAttribute('preset');
    const target =
      (stored && names.includes(stored)) ? stored :
      (attr && names.includes(attr))     ? attr :
                                           null;
    this.#activeName = target;
    this.#hydrated = true;
    if (target) {
      if (this.getAttribute('preset') !== target) this.setAttribute('preset', target);
      this.#renderItems();
    } else {
      this.#syncCollapsed(); // menu custom (itens declarados no markup)
    }
  }

  #setPreset(name, { emit, persist }) {
    if (!(name in SIDEBAR_PRESETS)) {             // nome inexistente: reverte e sai
      if (this.getAttribute('preset') !== this.#activeName) {
        this.setAttribute('preset', this.#activeName ?? '');
      }
      return;
    }
    if (name === this.#activeName) return;
    this.#activeName = name;
    if (persist) this.#writeStored(name);
    this.#renderItems();
    if (emit) {
      this.dispatchEvent(new CustomEvent('me-preset-change', {
        bubbles: true,
        composed: true,
        detail: { name },
      }));
    }
  }

  /* Gera os <me-sidebar-item> do preset ativo como filhos (light DOM), para que
   * o <me-icon> herde a webfont MDI do documento. Itens do slot footer são
   * preservados (não fazem parte do preset). */
  #renderItems() {
    const preset = SIDEBAR_PRESETS[this.#activeName];
    if (!preset) return;

    for (const child of [...this.children]) {
      if (child.getAttribute && child.getAttribute('slot') === 'footer') continue;
      child.remove();
    }

    const active = this.getAttribute('active-item');
    const collapsed = !this.expanded;
    const frag = document.createDocumentFragment();
    for (const item of preset.items) {
      const el = document.createElement('me-sidebar-item');
      el.dataset.key = item.key;
      if (item.href != null) el.setAttribute('href', item.href);
      if (item.key === active) el.setAttribute('active', '');
      if (collapsed) el.setAttribute('collapsed', '');
      const icon = document.createElement('me-icon');
      icon.setAttribute('slot', 'start');
      icon.setAttribute('name', item.icon);
      el.append(icon, document.createTextNode(item.label));
      frag.append(el);
    }
    this.append(frag);

    this.#syncCollapsed();
  }

  #syncActive() {
    const active = this.getAttribute('active-item');
    for (const item of this.querySelectorAll('me-sidebar-item[data-key]')) {
      item.toggleAttribute('active', item.dataset.key === active);
    }
  }

  #syncCollapsed() {
    const expanded = this.expanded;
    this.toggleButton.setAttribute('aria-expanded', String(expanded));
    this.toggleButton.setAttribute('aria-label', expanded ? 'Recolher menu' : 'Expandir menu');
    for (const item of this.querySelectorAll('me-sidebar-item')) {
      expanded ? item.removeAttribute('collapsed') : item.setAttribute('collapsed', '');
    }
  }
}

define('me-sidebar', MeSidebar);
