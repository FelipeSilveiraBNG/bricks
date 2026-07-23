/*
 * <me-sidebar> + <me-sidebar-item> (+ <me-sidebar-preset>) — Menu lateral do Minha Escala.
 *
 * Espelha o Sidebar real do app (src/components/Sidebar.vue do
 * minhaescala_web): aberta 288px / recolhida 64px (transição 300ms),
 * fundo branco com borda direita cinza, header de 80px (logo "variant"
 * ~120px quando aberta + botão de toggle: quadrado rosa 24px com
 * chevrons duplos brancos), itens com 16px de padding vertical, radius
 * 4px, ativo = teal #2F7F91 com texto branco semibold, hover teal a 8%.
 *
 * Extensão do kit (não existe no app): slot "footer" para fixar itens
 * embaixo (ex.: "Sair").
 *
 * Sidebar — atributos: expanded (refletido); preset (nome do preset ativo,
 *           refletido); persist-key (chave de localStorage p/ lembrar o preset).
 *           Eventos: me-toggle (detail.expanded), me-preset-change (detail.name).
 *           Propriedades: expanded, preset. Slots: default (itens ou presets),
 *           footer. Parts: base, header, toggle, nav, footer.
 * Item — atributos: href, active, collapsed (gerido pelo pai).
 *        Slots: start (me-icon), default (rótulo). Parts: base, icon, label.
 * Preset — agrupa um CONJUNTO COMPLETO de itens; o sidebar mostra só o ativo.
 *          Atributos: name (id, obrigatório), label (rótulo humano p/ o seletor
 *          externo do consumidor — não é renderizado), default (fallback).
 *          Seleção é via API/atributo: o me-sidebar NÃO renderiza seletor.
 *
 * Persistência: quando há presets + persist-key, a escolha é lembrada em
 * localStorage. Ordem de resolução do preset ativo: armazenado → atributo
 * preset → preset com [default] → primeiro. O valor ARMAZENADO vence o
 * atributo autorado no markup. Sem presets, o componente se comporta como
 * antes (itens direto como filhos).
 *
 * Exemplo (uso clássico, sem presets):
 *   <me-sidebar expanded>
 *     <me-sidebar-item href="#" active><me-icon slot="start" name="monitor"></me-icon>Dashboard</me-sidebar-item>
 *     <me-sidebar-item href="#"><me-icon slot="start" name="calendar-edit"></me-icon>Gerenciar Escalas</me-sidebar-item>
 *     <me-sidebar-item slot="footer" href="#"><me-icon slot="start" name="logout"></me-icon>Sair</me-sidebar-item>
 *   </me-sidebar>
 *
 * Exemplo (com presets + persistência):
 *   <me-sidebar expanded preset="gestor" persist-key="me-bricks:sidebar">
 *     <me-sidebar-preset name="gestor" label="Gestor" default>
 *       <me-sidebar-item href="#" active><me-icon slot="start" name="monitor"></me-icon>Dashboard</me-sidebar-item>
 *     </me-sidebar-preset>
 *     <me-sidebar-preset name="medico" label="Médico">
 *       <me-sidebar-item href="#" active><me-icon slot="start" name="calendar"></me-icon>Minhas Escalas</me-sidebar-item>
 *     </me-sidebar-preset>
 *   </me-sidebar>
 *   // sidebar.preset = 'medico'  → troca, persiste e emite me-preset-change
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
    /* hover do app: rgba(47,127,145,0.08) */
    .base:hover { background: rgb(47 127 145 / 0.08); }
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

window.customElements.define('me-sidebar-item', MeSidebarItem);

/* ------------------------------------------------------ me-sidebar-preset */
/* Agrupa um conjunto completo de itens. O me-sidebar mostra apenas o preset
 * ativo: display:contents faz o host não gerar caixa, então seus itens viram
 * filhos flex DIRETOS do <nav> (mesmo gap/coluna dos itens sem preset). */
const presetTemplate = document.createElement('template');
presetTemplate.innerHTML = `
  <style>
    :host { display: none; }                /* inativo: fora do fluxo do nav */
    :host([active]) { display: contents; }  /* ativo: itens entram direto no flex do nav */
  </style>
  <slot></slot>
`;

class MeSidebarPreset extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(presetTemplate.content.cloneNode(true));

    // slotchange não é composed; avisa o pai (me-sidebar) para re-sincronizar
    // o collapsed quando itens chegam a um preset já conectado.
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => {
      this.dispatchEvent(new CustomEvent('me-sidebar-preset-itemschange', {
        bubbles: true,
        composed: true,
      }));
    });
  }

  get name() { return this.getAttribute('name'); }
  set name(value) {
    value == null ? this.removeAttribute('name') : this.setAttribute('name', value);
  }

  get default() { return this.hasAttribute('default'); }

  get active() { return this.hasAttribute('active'); }
  set active(value) {
    value ? this.setAttribute('active', '') : this.removeAttribute('active');
  }
}

window.customElements.define('me-sidebar-preset', MeSidebarPreset);

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
      border-right: 1px solid #E5E7EB; /* border-gray-200 do app */
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
          <path d="M7.5 7l5 5-5 5M13 7l5 5-5 5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="collapse-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="var(--me-color-tertiary-30, #CB2957)"/>
          <path d="M16.5 17l-5-5 5-5M11 17l-5-5 5-5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

    // Propaga o estado para os itens (inclusive os que chegarem depois) e
    // hidrata presets que sejam adicionados após o connect.
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => {
        this.#syncItems();
        if (!this.#hydrated) this.#hydrate();
      });
    }

    // Itens que chegam a um preset já conectado → re-sincroniza collapsed.
    this.addEventListener('me-sidebar-preset-itemschange', () => this.#syncItems());
  }

  static get observedAttributes() {
    return ['expanded', 'preset'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'expanded') { this.#syncItems(); return; }
    if (name === 'preset') {
      if (!this.#hydrated) return;                // ignora writes durante upgrade/hydrate
      if (newValue === this.#activeName) return;  // idempotente, evita loop
      this.#setActivePreset(newValue, { emit: true, persist: true });
    }
  }

  connectedCallback() {
    this.#hydrate();
    this.#syncItems();
  }

  get expanded() { return this.hasAttribute('expanded'); }
  set expanded(value) {
    value ? this.setAttribute('expanded', '') : this.removeAttribute('expanded');
  }

  get preset() { return this.getAttribute('preset'); }
  set preset(value) {
    value == null ? this.removeAttribute('preset') : this.setAttribute('preset', value);
  }

  #syncItems() {
    const expanded = this.expanded;
    this.toggleButton.setAttribute('aria-expanded', String(expanded));
    this.toggleButton.setAttribute('aria-label', expanded ? 'Recolher menu' : 'Expandir menu');
    for (const item of this.querySelectorAll('me-sidebar-item')) {
      expanded ? item.removeAttribute('collapsed') : item.setAttribute('collapsed', '');
    }
  }

  /* -------- Presets (conjuntos completos de itens) -------- */
  #presets() {
    return [...this.querySelectorAll(':scope > me-sidebar-preset')];
  }

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

  /* Resolve o preset ativo (armazenado → atributo → default → primeiro) sem
   * emitir evento nem gravar storage. Sem presets: no-op (modo compatível). */
  #hydrate() {
    const presets = this.#presets();
    if (!presets.length) return;
    const names = presets.map((p) => p.getAttribute('name'));
    const stored = this.#readStored();
    const attr = this.getAttribute('preset');
    const def = presets.find((p) => p.hasAttribute('default'));
    const target =
      (stored && names.includes(stored)) ? stored :
      (attr && names.includes(attr))     ? attr :
      def                                ? def.getAttribute('name') :
                                           names[0];
    this.#applyActive(target);
    // Reflete o atributo sem re-emitir: #hydrated ainda é false (o callback
    // ignora) e #activeName já é target (segundo guard).
    if (this.getAttribute('preset') !== target) this.setAttribute('preset', target ?? '');
    this.#hydrated = true;
  }

  #applyActive(name) {
    for (const preset of this.#presets()) {
      preset.toggleAttribute('active', preset.getAttribute('name') === name);
    }
    this.#activeName = name;
  }

  #setActivePreset(name, { emit, persist }) {
    const names = this.#presets().map((p) => p.getAttribute('name'));
    if (!names.includes(name)) {                 // nome inexistente: reverte e sai
      if (this.getAttribute('preset') !== this.#activeName) {
        this.setAttribute('preset', this.#activeName ?? '');
      }
      return;
    }
    if (name === this.#activeName) return;
    this.#applyActive(name);
    if (persist) this.#writeStored(name);
    if (emit) {
      this.dispatchEvent(new CustomEvent('me-preset-change', {
        bubbles: true,
        composed: true,
        detail: { name },
      }));
    }
  }
}

window.customElements.define('me-sidebar', MeSidebar);
