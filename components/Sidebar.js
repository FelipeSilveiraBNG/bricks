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
 * RESPONSIVO (abaixo de 800px): recolhida, a sidebar fica OCULTA (não ocupa
 * largura nenhuma); expandida, vira um DRAWER sobreposto (position:fixed +
 * backdrop) em vez de uma coluna em fluxo — 288px de menu não cabem ao lado de
 * 360px de viewport (medido: o conteúdo ficava com 102px e o título do header
 * desaparecia). Nos dois estados o conteúdo tem a viewport inteira.
 * O drawer fecha por Esc, clique no backdrop e ao tocar num item de menu; todos
 * emitem me-toggle, então o botão do header continua em sincronia. Uma página
 * que declara `expanded` e abre no telefone é recolhida automaticamente.
 * O backdrop se ajusta por --me-sidebar-backdrop. Part: backdrop.
 *
 * EM MOBILE O BOTÃO DO HEADER É OBRIGATÓRIO: oculta, a sidebar não tem como ser
 * aberta por ela mesma. Use <me-page-header menu> e ligue o me-menu nela (ver a
 * receita do shell no AGENTS.md), senão a página fica sem navegação no telefone.
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

    /* ===== MOBILE: aberta vira DRAWER sobreposto, não coluna em fluxo =====
     *
     * MEDIDO no shell que o AGENTS.md recomenda, viewport de 390px, sidebar
     * expandida em fluxo: o <main> ficava com 102px, o .titles do me-page-header
     * colapsava para 0 (o heading desaparecia por completo) e o slot "end" ia
     * para x=392 — fora da tela. 288px de menu simplesmente não convivem com
     * 360-390px de viewport lado a lado.
     *
     * A cura é sair do fluxo: position:fixed tira a sidebar do cálculo de
     * largura do flex do body, então o <main> recebe a viewport inteira e o
     * menu passa por cima.
     *
     * E RECOLHIDA ELA SOME (não vira trilho de 64px), como no app: lá o botão
     * de menu do Header.vue só existe em mobile, o que pressupõe uma sidebar
     * que não está na tela. Num viewport de 360px o trilho custaria 18% da
     * largura para mostrar só ícones.
     *
     * CONSEQUÊNCIA QUE O CONSUMIDOR PRECISA SABER: em mobile o único jeito de
     * abrir o menu é o botão do <me-page-header menu>. Uma página que usa
     * <me-sidebar> sem esse botão fica SEM navegação abaixo de 800px. A receita
     * do shell no AGENTS.md já liga os dois; se você montou o shell à mão,
     * ligue também.
     *
     * O 799px é o mesmo número do me-page-header (o botão mobile de lá só
     * aparece abaixo dele). Os dois TÊM que bater: é o botão que abre isto.
     * Media query não aceita var(), então o número se repete — ao mexer num,
     * mexa no outro. Ver o cabeçalho do PageHeader.js.
     */
    @media (max-width: 799px) {
      /* A transição de width do :host não vale aqui. Em desktop ela anima uma
         coluna que continua no fluxo — 64px <-> 288px é redimensionar. Em
         mobile a mesma troca de atributo muda de MODO (trilho em fluxo <->
         drawer fora do fluxo): o position não é animável, então o que se veria
         é a caixa saltando para fixed e só depois a largura crescendo em 300ms,
         arrastando relayout do <main> a cada frame. Modo se troca de uma vez.
         O respiro visual fica no fade do backdrop, que é opacity e não toca
         layout. */
      :host { transition: none; }

      /* Recolhida = fora da tela e fora do fluxo. display:none em vez de
         width:0: com largura zero o border-right de 1px do .base ainda pintava
         uma linha na borda esquerda da página, e o conteúdo seguia focável por
         Tab atrás do nada. */
      :host(:not([expanded])) { display: none; }

      :host([expanded]) {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        z-index: 100;
        /* Numa tela de 320px, 288px de drawer deixariam 32px de página à
           mostra; o teto relativo garante que sempre sobre uma faixa para o
           usuário perceber (e tocar) o que está atrás. */
        width: min(288px, calc(100vw - 56px));
        box-shadow: var(--me-shadow-overlay,
          0 10px 15px -3px rgb(0 0 0 / 0.1),
          0 4px 6px -4px rgb(0 0 0 / 0.1));
      }
      /* z-index negativo pinta atrás do .base mas DENTRO do contexto de
         empilhamento do host (z-index:100), ou seja, ainda acima da página.
         O fixed resolve contra a viewport, não contra o host, então o
         inset:0 cobre a tela toda apesar de o host ter 288px. */
      :host([expanded]) .backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: -1;
        background: var(--me-sidebar-backdrop, rgb(17 24 39 / 0.5));
        animation: me-sidebar-backdrop-in 0.2s ease-out;
      }
      @keyframes me-sidebar-backdrop-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        :host([expanded]) .backdrop { animation: none; }
      }
    }

    .backdrop { display: none; }

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
  <div class="backdrop" part="backdrop"></div>
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

/* Mesmo número do @media acima e do PageHeader.js. Uma consulta só, no escopo
   do módulo: matchMedia é barato de ler mas não de instanciar por elemento. */
const MOBILE = typeof matchMedia === 'function'
  ? matchMedia('(max-width: 799px)')
  // Sem matchMedia (SSR, ambiente de teste sem DOM completo) o kit se comporta
  // como desktop. O par add/remove tem que existir: o disconnectedCallback
  // chama o remove, e um objeto só com add lançaria ao desmontar.
  : { matches: false, addEventListener() {}, removeEventListener() {} };

class MeSidebar extends HTMLElement {
  #hydrated = false;
  #activeName = null;
  #focoAnterior = null;
  #onBreakpoint = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(sidebarTemplate.content.cloneNode(true));

    this.toggleButton = this.shadowRoot.querySelector('.toggle');
    this.toggleButton.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.#emitToggle();
    });

    /* Drawer sobreposto pede as duas saídas de sempre: clique fora e Esc. O
       backdrop cobre a viewport inteira, então ele É o "fora". */
    this.shadowRoot.querySelector('.backdrop')
      .addEventListener('click', () => this.#fecharDrawer());

    this.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !this.#modoDrawer()) return;
      event.stopPropagation();
      this.#fecharDrawer();
    });

    /* Navegar fecha o drawer: num menu sobreposto, o destino do link está
       atrás do próprio menu. Em desktop a sidebar é persistente e não fecha. */
    this.addEventListener('click', (event) => {
      if (!this.#modoDrawer()) return;
      if (event.target.closest('me-sidebar-item')) this.#fecharDrawer();
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
    if (name === 'expanded') {
      this.#syncCollapsed();
      // Abriu sobreposto: o foco entra no drawer (habilita o Esc).
      if (newValue !== null && MOBILE.matches) this.#focarDrawer();
      return;
    }
    if (name === 'active-item') { this.#syncActive(); return; }
    if (name === 'preset') {
      if (newValue === this.#activeName) return;  // idempotente, evita loop
      this.#setPreset(newValue, { emit: true, persist: true });
    }
  }

  connectedCallback() {
    this.#hydrate();

    /* Auto-recolher ao ENTRAR em mobile. Sem isto, uma página que declara
       <me-sidebar expanded> (é o que a receita do AGENTS.md faz) abre no
       telefone com o drawer já cobrindo o conteúdo — e o usuário toma um
       backdrop na cara antes de ver a tela. */
    this.#onBreakpoint = () => {
      if (MOBILE.matches && this.expanded) {
        this.expanded = false;
        this.#emitToggle();
      }
    };
    MOBILE.addEventListener('change', this.#onBreakpoint);
    /* No primeiro carregamento o recolhimento é SILENCIOSO (sem me-toggle), de
       propósito. O connectedCallback roda durante o parse do HTML, antes de o
       <script type="module"> do consumidor rodar, então um evento síncrono aqui
       não teria ouvinte; e adiar num rAF não serve — o Modal.js já registra que
       rAF não dispara em aba oculta/automatizada, e amarrar estado a ele deixa
       o componente inconsistente justamente no ambiente de teste.
       Quem sincroniza o estado inicial é o consumidor, com uma linha na
       inicialização (`hdr.menuOpen = nav.expanded`) — está na receita do shell
       no AGENTS.md e na demo. Só a MUDANÇA de breakpoint emite, e aí os
       ouvintes já existem. */
    if (MOBILE.matches && this.expanded) this.expanded = false;
  }

  disconnectedCallback() {
    MOBILE.removeEventListener('change', this.#onBreakpoint);
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

  /* -------- drawer (só abaixo do breakpoint) -------- */
  /* "Está sobreposta agora?" — expandida E em mobile. Serve de guarda para
     Esc, clique-fora e fechar-ao-navegar, que em desktop não devem existir:
     lá a sidebar é uma coluna persistente. */
  #modoDrawer() { return MOBILE.matches && this.expanded; }

  #fecharDrawer() {
    if (!this.#modoDrawer()) return;
    this.expanded = false;
    this.#emitToggle();
    // Devolve o foco a quem abriu (o botão do me-page-header, em geral).
    this.#focoAnterior?.focus?.();
    this.#focoAnterior = null;
  }

  #emitToggle() {
    this.dispatchEvent(new CustomEvent('me-toggle', {
      bubbles: true,
      composed: true,
      detail: { expanded: this.expanded },
    }));
  }

  /* Ao abrir sobreposto, o foco tem que entrar no drawer: senão o Esc não
     chega aqui (o keydown é escutado no host) e o teclado continua navegando a
     página que está atrás do backdrop.
     LIMITE CONHECIDO E ASSUMIDO: não há focus trap nem `inert` no resto da
     página — é o que o <dialog> dá de graça ao me-modal e que aqui custaria
     uma varredura de irmãos. Tab acaba saindo do drawer. Para protótipo o
     ganho de Esc + clique-fora + foco inicial já é o essencial. */
  #focarDrawer() {
    this.#focoAnterior = document.activeElement;
    const primeiro = this.querySelector('me-sidebar-item');
    const alvo = primeiro?.shadowRoot?.querySelector('.base') ?? this.toggleButton;
    alvo?.focus?.();
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
