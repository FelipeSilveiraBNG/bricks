/*
 * <me-tab-group> + <me-tab> + <me-tab-panel> — Abas do Minha Escala.
 *
 * Funcionamento inspirado no wa-tab-group/wa-tab/wa-tab-panel do Web Awesome;
 * aparência espelhando o Tabs.vue do minhaescala_web (nav centralizada, abas de
 * largura igual, sublinhado teal na ativa, texto bold na ativa, fade no painel).
 *
 * O GRUPO é o dono do estado: gerencia qual aba está ativa, o roving tabindex,
 * a navegação por setas/Home/End e a ligação ARIA (tab <-> tabpanel). Cada
 * <me-tab> é apresentacional e aponta para um painel via panel="nome"; cada
 * <me-tab-panel name="nome"> guarda o conteúdo daquela aba.
 *
 *   <me-tab-group active="geral">
 *     <me-tab panel="geral">Geral</me-tab>
 *     <me-tab panel="config">Configurações</me-tab>
 *     <me-tab-panel name="geral">...</me-tab-panel>
 *     <me-tab-panel name="config">...</me-tab-panel>
 *   </me-tab-group>
 *
 * O consumidor escreve as <me-tab> e <me-tab-panel> como filhas diretas, na
 * ordem que preferir — o grupo move as abas para o slot "nav" sozinho.
 *
 * Grupo — atributo: active (nome do painel, refletido). Evento: change (detail.name).
 *         Parts: base, nav, body.
 * Tab   — atributos: panel (nome do painel), disabled, active (gerido pelo grupo).
 *         Slot: default (rótulo). Parts: base, button.
 * Panel — atributo: name, active (gerido pelo grupo). Slot: default. Part: base.
 */

// Contador para IDs únicos — usado só quando a aba/painel não traz id próprio,
// para amarrar aria-controls (tab -> painel) e aria-labelledby (painel -> tab).
let uid = 0;

/* ------------------------------------------------------------------- me-tab */
const tabTemplate = document.createElement('template');
tabTemplate.innerHTML = `
  <style>
    :host {
      /* flex:1 1 0 -> todas as abas dividem a largura igualmente, replicando
         o "w-full" de cada aba dentro do nav centralizado do Tabs.vue. */
      flex: 1 1 0;
      display: flex;
      outline: none;
    }
    :host([hidden]) { display: none; }
    :host([disabled]) { opacity: 0.45; pointer-events: none; }

    .button {
      flex: 1;
      box-sizing: border-box;
      padding: 16px 8px;                 /* py-4 px-2 do app */
      margin-bottom: -1px;               /* sobrepõe a linha de 1px do nav */
      border: 0;
      border-bottom: 2px solid transparent;
      background: none;
      cursor: pointer;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      color: var(--me-color-text-muted, #68688D);   /* gray-500 do app */
      transition: color var(--me-transition, 0.2s ease),
                  border-color var(--me-transition, 0.2s ease);
    }
    .button:hover { color: var(--me-color-secondary-40, #1E1E29); } /* gray-700 */

    :host([active]) .button {
      color: var(--me-color-text, #16161D);          /* gray-900 do app */
      font-weight: var(--me-font-weight-bold, 700);
      border-bottom-color: var(--me-color-brand, #2F7F91);
    }

    /* Foco visível no host (que é o elemento role="tab" com roving tabindex).
       O <button> interno fica fora da ordem de tab (tabindex=-1). */
    :host(:focus-visible) {
      border-radius: var(--me-radius-s, 4px);
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
  </style>
  <button class="button" part="button" tabindex="-1" type="button"><slot></slot></button>
`;

class MeTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(tabTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'tab');
    if (!this.id) this.id = `me-tab-${++uid}`;
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
    this.setAttribute('aria-selected', String(this.active));
  }

  static get observedAttributes() {
    return ['active', 'disabled'];
  }

  attributeChangedCallback(name) {
    if (name === 'active') this.setAttribute('aria-selected', String(this.active));
    if (name === 'disabled') this.setAttribute('aria-disabled', String(this.disabled));
  }

  get panel() { return this.getAttribute('panel') ?? ''; }
  set panel(value) { this.setAttribute('panel', value); }

  get active() { return this.hasAttribute('active'); }
  set active(value) {
    value ? this.setAttribute('active', '') : this.removeAttribute('active');
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) {
    value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }
}

window.customElements.define('me-tab', MeTab);

/* ------------------------------------------------------------- me-tab-panel */
const panelTemplate = document.createElement('template');
panelTemplate.innerHTML = `
  <style>
    :host { display: block; }
    :host([hidden]) { display: none; }

    /* Só o painel ativo aparece. O !important (mesmo motivo do <me-page>)
       impede que um "me-tab-panel { display:flex }" do documento vaze e
       mostre todos os painéis de uma vez. */
    :host(:not([active])) { display: none !important; }

    /* Fade de entrada ao ativar — replica o Transition "fade" do Tabs.vue
       (opacidade + leve deslize vertical). Como o painel sai de display:none,
       a animação roda de novo a cada troca de aba. */
    :host([active]) { animation: me-tab-panel-in 0.25s ease-out; }
    @keyframes me-tab-panel-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([active]) { animation: none; }
    }
  </style>
  <slot></slot>
`;

class MeTabPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(panelTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'tabpanel');
    if (!this.id) this.id = `me-tab-panel-${++uid}`;
  }

  get name() { return this.getAttribute('name') ?? ''; }
  set name(value) { this.setAttribute('name', value); }

  get active() { return this.hasAttribute('active'); }
  set active(value) {
    value ? this.setAttribute('active', '') : this.removeAttribute('active');
  }
}

window.customElements.define('me-tab-panel', MeTabPanel);

/* ------------------------------------------------------------- me-tab-group */
const groupTemplate = document.createElement('template');
groupTemplate.innerHTML = `
  <style>
    :host { display: block; }
    :host([hidden]) { display: none; }

    .nav {
      display: flex;
      justify-content: center;                          /* nav centralizada do app */
      border-bottom: 1px solid var(--me-color-border, #E2E2E9); /* border-gray-200 */
    }

    /* mt-8 do Tabs.vue — respiro entre a nav e o conteúdo do painel. */
    .body { margin-top: 32px; }
  </style>
  <div class="base" part="base">
    <div class="nav" part="nav" role="tablist"><slot name="nav"></slot></div>
    <div class="body" part="body"><slot></slot></div>
  </div>
`;

class MeTabGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(groupTemplate.content.cloneNode(true));

    // Re-sincroniza quando abas/painéis entram ou saem (conteúdo dinâmico).
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.#sync());
    }

    this.addEventListener('click', (event) => {
      const tab = event.target.closest('me-tab');
      if (tab && !tab.disabled && this.contains(tab)) this.#select(tab, { focus: false });
    });

    this.addEventListener('keydown', (event) => {
      const tabs = this.#enabledTabs();
      if (!tabs.length) return;
      const current = tabs.indexOf(event.target.closest('me-tab'));

      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
        const next = tabs[(current + (forward ? 1 : -1) + tabs.length) % tabs.length];
        this.#select(next, { focus: true }); // ativação automática (padrão do wa-tab-group)
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.#select(tabs[0], { focus: true });
      } else if (event.key === 'End') {
        event.preventDefault();
        this.#select(tabs[tabs.length - 1], { focus: true });
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        const tab = event.target.closest('me-tab');
        if (tab && !tab.disabled) this.#select(tab, { focus: true });
      }
    });
  }

  static get observedAttributes() {
    return ['active'];
  }

  attributeChangedCallback() {
    this.#sync();
  }

  connectedCallback() {
    this.#sync();
  }

  get active() { return this.getAttribute('active') ?? ''; }
  set active(value) { this.setAttribute('active', value); }

  #tabs() {
    return [...this.querySelectorAll('me-tab')].filter((t) => t.closest('me-tab-group') === this);
  }

  #panels() {
    return [...this.querySelectorAll('me-tab-panel')].filter((p) => p.closest('me-tab-group') === this);
  }

  #enabledTabs() {
    return this.#tabs().filter((t) => !t.disabled);
  }

  /* Seleção via interação do usuário: define active e emite change. */
  #select(tab, { focus }) {
    const name = tab.getAttribute('panel') ?? '';
    const changed = this.active !== name;
    this.active = name; // dispara attributeChangedCallback -> #sync
    if (focus) tab.focus();
    if (changed) {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { name },
      }));
    }
  }

  /* Reconcilia active/tabindex/ARIA das abas e a visibilidade dos painéis. */
  #sync() {
    const tabs = this.#tabs();
    const panels = this.#panels();
    if (!tabs.length) return;

    // active desconhecido/vazio cai na primeira aba habilitada (ou na primeira).
    let active = this.active;
    const known = tabs.some((t) => t.getAttribute('panel') === active);
    if (!known) active = (this.#enabledTabs()[0] ?? tabs[0]).getAttribute('panel') ?? '';

    let activeTab = null;
    for (const tab of tabs) {
      tab.slot = 'nav'; // move a aba para a barra de navegação do grupo
      const panel = panels.find((p) => p.getAttribute('name') === tab.getAttribute('panel'));
      if (panel) tab.setAttribute('aria-controls', panel.id);

      const isActive = tab.getAttribute('panel') === active;
      tab.active = isActive;
      if (isActive) activeTab = tab;
    }

    // Roving tabindex: um único tab stop no grupo (a aba ativa, ou a 1ª habilitada).
    const focusTarget = activeTab ?? this.#enabledTabs()[0];
    for (const tab of tabs) {
      tab.setAttribute('tabindex', tab === focusTarget && !tab.disabled ? '0' : '-1');
    }

    for (const panel of panels) {
      const owner = tabs.find((t) => t.getAttribute('panel') === panel.getAttribute('name'));
      if (owner) panel.setAttribute('aria-labelledby', owner.id);
      panel.active = panel.getAttribute('name') === active;
    }

    // Reflete o active resolvido no host. A recursão termina: no 2º passe
    // "known" já é verdadeiro e não setamos de novo.
    if (this.active !== active) this.active = active;
  }
}

window.customElements.define('me-tab-group', MeTabGroup);
