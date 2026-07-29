/*
 * <me-dropdown> + <me-dropdown-item> — Menu de ações do Minha Escala.
 *
 * Funcionalidade espelhada no <wa-dropdown> do Web Awesome: trigger por slot,
 * itens com valor, itens de marcar, variante destrutiva, navegação por teclado,
 * placement com flip. Aparência dos itens medida no v-list-item do
 * SubjectsAutocomplete do app: linha de 48px, ícone de 24px, título 16px/24px e
 * subtítulo 14px/16px em tom secundário.
 *
 * ISTO É UM MENU DE AÇÕES, NÃO UM CAMPO. Não tem valor, não entra em <form>,
 * não guarda seleção: clica, dispara, fecha. Para capturar um valor num
 * formulário use o <me-select>; para pílula de filtro, o <me-select-filter>.
 *
 * A ancoragem, o top layer e o teclado vêm de internal/popover.js — leia o
 * cabeçalho dele para entender por que o painel é um `popover` nativo e por que
 * syncOpenState é obrigatório.
 *
 *   <me-dropdown>
 *     <me-button slot="trigger" appearance="plain">
 *       <me-icon name="dots-vertical"></me-icon>
 *     </me-button>
 *     <me-dropdown-item value="editar">Editar</me-dropdown-item>
 *     <me-dropdown-item value="duplicar">
 *       Duplicar
 *       <span slot="description">Cria uma cópia nesta mesma escala</span>
 *     </me-dropdown-item>
 *     <me-dropdown-item value="excluir" variant="danger">Excluir</me-dropdown-item>
 *   </me-dropdown>
 *
 * me-dropdown
 *   Atributos: open (refletido), placement (bottom-start|bottom-end|top-start|
 *     top-end), distance (px), disabled.
 *   Slots: trigger (o que abre), default (os me-dropdown-item).
 *   Eventos: me-select (detail { value, item }; CANCELÁVEL — preventDefault()
 *     mantém o menu aberto, como no wa-dropdown), me-toggle (detail { open }).
 *   Métodos: show(), hide().
 *   Parts: trigger, menu.
 *
 * me-dropdown-item
 *   Atributos: value, type (normal|checkbox), checked, disabled,
 *     variant (default|danger).
 *   Slots: default (rótulo), icon, description (segunda linha), details (fim da
 *     linha, para atalho de teclado).
 *   Part: base.
 *
 * FORA DE ESCOPO nesta versão: submenu. O popover=auto é mutuamente exclusivo,
 * então aninhar exige empilhamento correto na árvore mais hover-intent com
 * timers — complexidade de outro componente. Um nível só, por enquanto.
 *
 * ACESSIBILIDADE: o painel é role="menu" e os itens são menuitem /
 * menuitemcheckbox. O padrão de menu manda o FOCO REAL andar entre os itens
 * (diferente de combobox, que usa aria-activedescendant), então os itens têm
 * tabindex="-1" e recebem focus(). O aria-haspopup/aria-expanded é escrito no
 * elemento projetado no slot "trigger", não no wrapper do shadow root: o
 * wrapper não é focável e anotar ele não diria nada ao leitor de tela.
 */
import { define } from './define.js';
import {
  PANEL_CSS, PLACEMENTS, SUPPORTS_ANCHOR, preparePanel, setPlacement,
  openPanel, closePanel, syncOpenState, rovingItems,
} from './internal/popover.js';

/* --------------------------------------------------------- me-dropdown-item */
const itemTemplate = document.createElement('template');
itemTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      outline: none;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* Linha de 48px com padding 4px/16px — medido no v-list-item do app.
       SEM gap: as colunas de marca e de ícone têm largura reservada pelo pai
       e podem valer 0px; com gap, uma coluna de largura zero ainda abriria
       espaço e os rótulos de um menu misto ficariam desalinhados entre si. O
       respiro vai embutido na largura reservada. */
    .base {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      min-height: 48px;
      padding: 4px 16px;
      color: var(--me-color-text, #16161D);
      cursor: pointer;
      user-select: none;
      transition: background var(--me-transition, 0.2s ease);
    }

    /* O token --me-color-brand-hover existe no tokens.css justamente com a
       descrição "hover de item de menu". É este o consumidor. */
    .base:hover,
    :host(:focus) .base {
      background: var(--me-color-brand-hover, rgb(47 127 145 / 0.08));
    }
    /* Foco visível sem anel: o item ativo de um menu se marca pelo fundo, e o
       anel de foco dentro de um painel estreito briga com a borda dele. */
    :host(:focus-visible) .base {
      background: var(--me-color-brand-hover, rgb(47 127 145 / 0.08));
      box-shadow: inset 2px 0 0 0 var(--me-color-brand, #2F7F91);
    }

    :host([disabled]) .base { opacity: 0.45; cursor: not-allowed; }
    :host([variant="danger"]) .base { color: var(--me-color-negative-50, #DA1E28); }

    /* Colunas de largura RESERVADA pelo pai. As duas custom properties são
       publicadas pelo me-dropdown no light DOM e descem por herança até aqui:
       valem 0px quando nenhum item do menu usa aquela coluna, e a largura cheia
       (ícone + respiro) quando algum usa. É o que mantém os rótulos de um menu
       misto na mesma sangria — sem isso, um item com ícone fica indentado a
       mais que o vizinho sem. Mesma ideia do "padding auto-aligns" do
       wa-dropdown. */
    .check {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: var(--me-dropdown-check-space, 0px);
      overflow: hidden;
      color: var(--me-color-brand, #2F7F91);
    }
    .check svg { width: 18px; height: 18px; display: block; }
    /* Explícito porque o display:block acima (autor) vence o [hidden] do UA
       stylesheet. A coluna não colapsa: a largura é do .check, não do svg. */
    .check svg[hidden] { display: none; }

    /* Ícone do slot: 24px, medido no v-list-item. A webfont MDI não atravessa
       shadow DOM, mas o <me-icon> projetado do light DOM funciona (ele
       renderiza fora daqui, no documento). */
    .icon {
      flex: none;
      display: flex;
      align-items: center;
      width: var(--me-dropdown-icon-space, 0px);
      overflow: hidden;
    }
    .icon ::slotted(*) {
      font-size: 24px;
      color: var(--me-color-text-muted, #68688D);
    }
    :host([variant="danger"]) .icon ::slotted(*) { color: inherit; }

    .text { min-width: 0; flex: 1; }
    /* display:block nos dois: são <span>, e inline deixaria o subtítulo na
       mesma linha do rótulo em vez de virar a segunda linha. */
    .label {
      display: block;
      font-size: var(--me-font-size-body, 16px);
      line-height: 24px;
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    /* Subtítulo: 14px/16px em tom secundário — medido. */
    .description {
      display: block;
      font-size: var(--me-font-size-small, 14px);
      line-height: 16px;
      color: var(--me-color-text-muted, #68688D);
    }
    /* Slot vazio não deve ocupar linha. A detecção é por atributo escrito no
       slotchange, e não em CSS: ::slotted() não pode entrar num :has(), e um
       slot sem conteúdo não casa :empty (o elemento <slot> existe sempre). É o
       mesmo caminho que o Input.js usa no #syncStart(). */
    :host(:not([data-has-description])) .description { display: none; }

    /* Atalho de teclado etc., encostado no fim da linha. */
    .details {
      flex: none;
      margin-inline-start: 12px;
      font-size: var(--me-font-size-small, 14px);
      color: var(--me-color-text-muted, #68688D);
    }
    :host(:not([data-has-details])) .details { display: none; }
  </style>
  <div class="base" part="base">
    <span class="check" part="check">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden>
        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <span class="icon" part="icon"><slot name="icon"></slot></span>
    <span class="text">
      <span class="label"><slot></slot></span>
      <span class="description"><slot name="description"></slot></span>
    </span>
    <span class="details" part="details"><slot name="details"></slot></span>
  </div>
`;

class MeDropdownItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(itemTemplate.content.cloneNode(true));

    for (const name of ['icon', 'description', 'details']) {
      const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
      const sync = () => this.toggleAttribute(
        `data-has-${name}`,
        slot.assignedNodes({ flatten: true }).length > 0,
      );
      slot.addEventListener('slotchange', sync);
      sync();
    }
  }

  static get observedAttributes() {
    return ['type', 'checked', 'disabled'];
  }

  connectedCallback() {
    // tabindex -1: o item não entra na ordem de tabulação da página, mas pode
    // receber focus() programático — é assim que o padrão de menu anda.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
    this.#syncRole();
  }

  attributeChangedCallback() {
    this.#syncRole();
  }

  #syncRole() {
    const checkbox = this.type === 'checkbox';
    this.setAttribute('role', checkbox ? 'menuitemcheckbox' : 'menuitem');
    if (checkbox) {
      this.setAttribute('aria-checked', String(this.checked));
    } else {
      this.removeAttribute('aria-checked');
    }
    this.setAttribute('aria-disabled', String(this.disabled));
    // toggleAttribute, NÃO `.hidden = ...`: <svg> é SVGSVGElement e a
    // propriedade `hidden` só existe em HTMLElement. Atribuir ali cria um
    // expando silencioso e o atributo nunca muda — o aria-checked atualizava e
    // a marca visual, não.
    this.shadowRoot.querySelector('.check svg')
      .toggleAttribute('hidden', !(checkbox && this.checked));
  }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v); }

  get type() { return this.getAttribute('type') ?? 'normal'; }
  set type(v) { this.setAttribute('type', v); }

  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* Texto do typeahead: só o rótulo, sem o subtítulo nem o atalho — teclar "d"
     deve casar com "Duplicar", não com a descrição dele. */
  get label() {
    return [...this.childNodes]
      .filter((n) => !(n.nodeType === 1 && n.slot))
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }
}

define('me-dropdown-item', MeDropdownItem);

/* -------------------------------------------------------------- me-dropdown */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }
    :host([disabled]) { pointer-events: none; opacity: 0.5; }

    .trigger { display: inline-flex; }

    ${PANEL_CSS}

    /* Menu não estica na largura do trigger (um ícone de 3 pontinhos daria um
       painel de 24px). Campo é que acompanha a largura; menu tem mínimo próprio.
       O anchor-size() só existe no caminho ancorado — no legado, mínimo fixo. */
    .panel { --me-panel-min-width: max(anchor-size(width), 200px); }
    .panel:not([popover]) { --me-panel-min-width: 200px; }
    /* Respiro vertical do painel, via a variável do núcleo: mexer no padding
       direto disputaria especificidade com o reset do UA stylesheet. */
    .panel { --me-panel-padding: 4px 0; }
  </style>
  <span class="trigger" part="trigger"><slot name="trigger"></slot></span>
  <div class="panel" part="menu" role="menu"><slot></slot></div>
`;

class MeDropdown extends HTMLElement {
  #panel;
  #triggerWrapper;
  #roving;
  #disposeSync;
  /* Estado do painel no momento do pointerdown no trigger. O light-dismiss
     nativo fecha o popover antes do nosso click chegar, então sem esta memória
     o clique no trigger com o menu aberto fecharia (dismiss) e reabriria
     (nosso handler) no mesmo gesto — o menu nunca fechava pelo trigger. */
  #wasOpenOnPointerDown = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#panel = this.shadowRoot.querySelector('.panel');
    this.#triggerWrapper = this.shadowRoot.querySelector('.trigger');
    preparePanel(this.#panel);

    // Ponte obrigatória: o painel pode fechar sozinho (clique fora, Esc).
    this.#disposeSync = syncOpenState(this, this.#panel, (open) => this.#onToggled(open));

    this.#roving = rovingItems({
      getItems: () => this.#items(),
      setActive: (item) => item?.focus(),
      onActivate: (item) => this.#activate(item),
      onClose: () => { this.hide(); this.#focusTrigger(); },
      getLabel: (item) => item.label,
    });

    this.#triggerWrapper.addEventListener('pointerdown', () => {
      this.#wasOpenOnPointerDown = this.open;
    });
    this.#triggerWrapper.addEventListener('click', () => {
      if (this.disabled) return;
      // Se estava aberto no pointerdown, este gesto é o de fechar. O dismiss
      // nativo já cuidou disso; só garantimos o estado.
      this.#wasOpenOnPointerDown ? this.hide() : this.show();
    });

    this.#triggerWrapper.addEventListener('keydown', (event) => {
      if (this.disabled) return;
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.show();
        this.#roving.first();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.show();
        this.#roving.last();
      }
    });

    // Teclado dentro do painel. Fica no painel (e não no host) para não
    // sequestrar teclas digitadas no trigger quando o menu está fechado.
    this.#panel.addEventListener('keydown', (event) => {
      const consumed = this.#roving.handleKeydown(event);
      if (consumed) event.preventDefault();
      if (event.key === 'Escape') event.stopPropagation();
    });

    this.#panel.addEventListener('click', (event) => {
      const item = event.target.closest('me-dropdown-item');
      if (!item || item.disabled || !this.contains(item)) return;
      this.#activate(item);
    });

    // Espaço da marca de seleção: reservado só se houver item de marcar.
    this.shadowRoot.querySelector('.panel slot')
      .addEventListener('slotchange', () => this.#syncColumns());
    this.shadowRoot.querySelector('slot[name="trigger"]')
      .addEventListener('slotchange', () => this.#syncTriggerAria());
  }

  static get observedAttributes() {
    return ['open', 'placement', 'distance', 'disabled'];
  }

  connectedCallback() {
    this.#syncColumns();
    this.#syncTriggerAria();
    setPlacement(this.#panel, this.placement);
    this.#syncDistance();
  }

  disconnectedCallback() {
    this.#disposeSync?.();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'open': {
        // Reflexão em ambos os sentidos: quem escreve o atributo à mão
        // (open / removeAttribute) também abre e fecha de verdade.
        const open = newValue !== null;
        open ? openPanel(this.#panel) : closePanel(this.#panel);
        this.#syncTriggerAria();
        // No caminho ancorado, o me-toggle sai da ponte do popover — que é a
        // única que também enxerga o dismiss nativo. No legado não existe
        // evento `toggle`, então a notificação tem que sair daqui.
        if (!SUPPORTS_ANCHOR) this.#afterToggle(open);
        break;
      }
      case 'placement': setPlacement(this.#panel, this.placement); break;
      case 'distance': this.#syncDistance(); break;
      case 'disabled': this.#syncTriggerAria(); break;
    }
  }

  /* ---- propriedades ---- */
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.show() : this.hide(); }

  get placement() {
    const value = this.getAttribute('placement');
    return PLACEMENTS.includes(value) ? value : 'bottom-start';
  }
  set placement(v) { this.setAttribute('placement', v); }

  get distance() { return Number(this.getAttribute('distance') ?? 8); }
  set distance(v) { this.setAttribute('distance', String(v)); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* ---- métodos ---- */
  show() {
    if (this.disabled || this.open) return;
    this.setAttribute('open', '');   // attributeChangedCallback abre o painel
  }

  hide() {
    if (!this.open) return;
    this.removeAttribute('open');
  }

  /* ---- internos ---- */
  #items() {
    return [...this.querySelectorAll('me-dropdown-item')]
      .filter((i) => i.closest('me-dropdown') === this);
  }

  /* Chamado pela ponte do popover: o estado real mudou (inclusive por dismiss
     nativo). Alinha o atributo SEM reentrar no show/hide e emite o me-toggle. */
  #onToggled(open) {
    if (open !== this.open) {
      // Divergiu: foi o dismiss nativo. Alinha o atributo.
      open ? this.setAttribute('open', '') : this.removeAttribute('open');
      // No legado, esse setAttribute acabou de passar pelo
      // attributeChangedCallback, que já emitiu o me-toggle. Emitir de novo
      // aqui daria evento duplicado.
      if (!SUPPORTS_ANCHOR) return;
    }
    this.#afterToggle(open);
  }

  #afterToggle(open) {
    if (!open) this.#roving.reset();
    this.#syncTriggerAria();
    this.dispatchEvent(new CustomEvent('me-toggle', {
      bubbles: true, composed: true, detail: { open },
    }));
  }

  #activate(item) {
    if (item.type === 'checkbox') item.checked = !item.checked;

    const event = new CustomEvent('me-select', {
      bubbles: true, composed: true, cancelable: true,
      detail: { value: item.value, item },
    });
    this.dispatchEvent(event);

    // Como no wa-dropdown: fecha por padrão, preventDefault() mantém aberto.
    if (!event.defaultPrevented) {
      this.hide();
      this.#focusTrigger();
    }
  }

  #focusTrigger() {
    const el = this.#slottedTrigger();
    el?.focus?.();
  }

  #slottedTrigger() {
    return this.shadowRoot.querySelector('slot[name="trigger"]')
      .assignedElements({ flatten: true })[0] ?? null;
  }

  /* O trigger real é light DOM do consumidor. É nele que a semântica tem que
     morar — o wrapper do shadow root não é focável. */
  #syncTriggerAria() {
    const el = this.#slottedTrigger();
    if (!el) return;
    el.setAttribute('aria-haspopup', 'menu');
    el.setAttribute('aria-expanded', String(this.open));
    if (this.disabled) {
      el.setAttribute('aria-disabled', 'true');
    } else {
      el.removeAttribute('aria-disabled');
    }
  }

  /* Reserva as colunas de marca e de ícone no MENU inteiro, não item por item:
     alinhamento é propriedade do conjunto. As larguras já embutem o respiro
     (18+8 e 24+12) porque a linha do item não usa `gap` — ver o CSS do item.
     Publicado no host (light DOM) para descer por herança até o shadow root
     dos itens, que é onde a largura é consumida. */
  #syncColumns() {
    const items = this.#items();
    const hasCheckbox = items.some((i) => i.type === 'checkbox');
    // Lê o light DOM em vez do data-has-icon do item: aquele atributo é escrito
    // no constructor do item, e se o pai fizer o slotchange antes dos filhos
    // subirem de classe (upgrade), ele ainda não existe. A presença do
    // slot="icon" no markup é verdade independente da ordem de upgrade.
    const hasIcon = items.some((i) => i.querySelector(':scope > [slot="icon"]') !== null);
    this.style.setProperty('--me-dropdown-check-space', hasCheckbox ? '26px' : '0px');
    this.style.setProperty('--me-dropdown-icon-space', hasIcon ? '36px' : '0px');
  }

  #syncDistance() {
    this.#panel.style.setProperty('--me-panel-distance', `${this.distance}px`);
  }
}

define('me-dropdown', MeDropdown);
