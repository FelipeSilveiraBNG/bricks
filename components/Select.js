/*
 * <me-select> + <me-select-option> — Campo de seleção do Minha Escala.
 *
 * Funcionalidade base no <wa-select> do Web Awesome (multiple com chips,
 * clearable, form-associated, teclado de combobox). Aparência replicada do
 * SubjectsAutocomplete do app (v-autocomplete outlined density=compact),
 * MEDIDA nos estilos computados do Storybook, não estimada:
 *
 *   campo        radius 4px; borda de foco 2px em #3CA2B9 — que é exatamente o
 *                --me-color-brand-light que o me-input já usa (convergência
 *                confirmada, não coincidência)
 *   label        16px em repouso dentro do campo; 12px ao flutuar
 *   chip         pílula 26px, fonte 12px, padding 0 10px, SEM borda, fundo =
 *                brand a 12%, texto/ícone/× em #2F7F91 (= --me-color-brand),
 *                ícone e × de 18px
 *   opção        linha 48px, padding 4px/16px, ícone 24px,
 *                título 16px/24px, subtítulo 14px/16px
 *   painel       radius 4px, max-height 300px, encostado no campo (gap 0)
 *
 * DUAS DIVERGÊNCIAS DELIBERADAS em relação ao medido:
 *   1. Altura e cor de borda em repouso seguem o me-input (40px, gray-50) e não
 *      o Vuetify (44px, ~38% de preto). Motivo: no app esses dois campos JÁ
 *      divergem entre si, e num protótipo um me-input ao lado de um me-select
 *      com borda de peso diferente lê como defeito. Consistência dentro do kit
 *      vale mais que fidelidade a um default do Vuetify.
 *   2. O chip NÃO reaproveita o me-filter-tag. Medido: o filter-tag tem borda
 *      de 1px, fundo brand-soft e fonte 14px; o chip do autocomplete é sem
 *      borda, tint de 12% e fonte 12px. São dois chips diferentes no app.
 *
 * ISTO É UM CAMPO DE FORMULÁRIO, NÃO UM MENU. Tem valor, entra no FormData,
 * valida. Para menu de ações use o <me-dropdown>; para pílula de filtro fora de
 * formulário, o <me-select-filter>.
 *
 * A ancoragem, o top layer e o teclado vêm de internal/popover.js.
 *
 *   <me-select label="Adicionar Participantes ou Grupos" name="participantes"
 *              multiple searchable clearable empty-text="Nenhum usuário encontrado">
 *     <me-select-option value="1">
 *       <me-icon slot="icon" name="account"></me-icon>
 *       Dra. Ana Souza
 *       <span slot="description">Médica · CRM 12345</span>
 *     </me-select-option>
 *   </me-select>
 *
 * me-select
 *   Atributos: label, placeholder, name, multiple, searchable, clearable,
 *     required, disabled, loading, size (small|medium|large), error,
 *     error-message, max-tags (colapsa o excedente em "+n"), empty-text,
 *     filter (auto|manual), clear-on-select, placement, distance, open.
 *   Propriedades: value (string com multiple=false, array com multiple=true),
 *     selectedOptions (leitura).
 *   Eventos: input, change (detail { value }), me-select (detail { value,
 *     selected }), me-toggle (detail { open }), me-search (detail { term }),
 *     me-clear.
 *   Parts: base, label, tags, tag, tag-remove, input, clear, expand, panel,
 *     list, empty, loading, error.
 *
 * me-select-option
 *   Atributos: value, selected (refletido), disabled.
 *   Slots: default (título), icon, description (subtítulo). Part: base.
 *
 * SELEÇÃO DECLARATIVA é o atributo `selected` nas opções (mesma convenção do
 * me-option do Filters.js). Não existe atributo `value` no me-select: com
 * multiple ele exigiria uma convenção de separador e duas fontes de verdade
 * disputando na inicialização. A propriedade `value` é leitura e escrita.
 *
 * LIMITE DE ACESSIBILIDADE CONHECIDO: o padrão combobox pede
 * aria-activedescendant no input apontando para o id da opção ativa, e isso NÃO
 * funciona aqui — o input vive no shadow root e as opções no light DOM, e um
 * IDREF não atravessa essa fronteira. O componente marca a opção ativa com
 * data-active (visual e navegação por teclado corretos) e expõe role=option +
 * aria-selected, mas não finge ter o activedescendant. É a mesma limitação do
 * me-select-filter; some se um dia o kit adotar a Cross-root ARIA.
 */
import { define } from './define.js';
import {
  PANEL_CSS, PLACEMENTS, SUPPORTS_ANCHOR, preparePanel, setPlacement,
  openPanel, closePanel, syncOpenState, rovingItems,
} from './internal/popover.js';

/* --------------------------------------------------------- me-select-option */
const optionTemplate = document.createElement('template');
optionTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    /* Linha de 48px, padding 4px/16px, ícone 24px — medido no v-list-item. */
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
    .base:hover { background: var(--me-color-neutral-10, #F0F0F4); }

    /* data-active = opção sob o cursor do teclado. Escrito pelo pai. */
    :host([data-active]) .base {
      background: var(--me-color-brand-hover, rgb(47 127 145 / 0.08));
      box-shadow: inset 2px 0 0 0 var(--me-color-brand, #2F7F91);
    }

    :host([selected]) .base {
      color: var(--me-color-brand, #2F7F91);
      font-weight: var(--me-font-weight-semibold, 600);
    }
    :host([disabled]) .base { opacity: 0.45; cursor: not-allowed; }

    /* Coluna de ícone reservada no SELECT inteiro (o pai publica a largura), do
       mesmo jeito que no me-dropdown: alinhamento é propriedade do conjunto, e
       sem isso a opção com ícone fica indentada a mais que a vizinha sem. A
       largura já embute o respiro porque a linha não usa gap. */
    .icon {
      flex: none;
      display: flex;
      align-items: center;
      width: var(--me-select-icon-space, 0px);
      overflow: hidden;
    }
    .icon ::slotted(*) {
      font-size: 24px;
      color: var(--me-color-text-muted, #68688D);
    }
    :host([selected]) .icon ::slotted(*) { color: inherit; }

    .text { min-width: 0; flex: 1; }
    /* display:block nos dois: são <span>, e inline deixaria o subtítulo na
       mesma linha do título. */
    .title {
      display: block;
      font-size: var(--me-font-size-body, 16px);
      line-height: 24px;
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    .description {
      display: block;
      font-size: var(--me-font-size-small, 14px);
      line-height: 16px;
      font-weight: var(--me-font-weight-regular, 400);
      color: var(--me-color-text-muted, #68688D);
    }
    /* Detecção por atributo no slotchange: ::slotted() não entra num :has(), e
       um slot sem conteúdo não casa :empty. Mesmo caminho do Input.js. */
    :host(:not([data-has-description])) .description { display: none; }
  </style>
  <div class="base" part="base">
    <span class="icon" part="icon"><slot name="icon"></slot></span>
    <span class="text">
      <span class="title"><slot></slot></span>
      <span class="description"><slot name="description"></slot></span>
    </span>
  </div>
`;

class MeSelectOption extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(optionTemplate.content.cloneNode(true));

    const slot = this.shadowRoot.querySelector('slot[name="description"]');
    const sync = () => this.toggleAttribute(
      'data-has-description', slot.assignedNodes({ flatten: true }).length > 0);
    slot.addEventListener('slotchange', sync);
    sync();
  }

  static get observedAttributes() { return ['selected', 'disabled']; }

  connectedCallback() {
    this.setAttribute('role', 'option');
    this.#syncAria();
  }

  attributeChangedCallback() { this.#syncAria(); }

  #syncAria() {
    this.setAttribute('aria-selected', String(this.selected));
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v); }

  get selected() { return this.hasAttribute('selected'); }
  set selected(v) { v ? this.setAttribute('selected', '') : this.removeAttribute('selected'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  /* Só o título: o texto de busca e o rótulo do chip não devem arrastar o
     subtítulo nem o ícone. */
  get label() {
    return [...this.childNodes]
      .filter((n) => !(n.nodeType === 1 && n.slot))
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }
}

define('me-select-option', MeSelectOption);

/* ---------------------------------------------------------------- me-select */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    /* 320px é a largura de repouso, não um trilho fixo. Medido: com os 320px
       fixos, numa viewport de 320px (coluna de 273px) o campo vazava 31px da
       coluna. Mesmo arranjo do me-input; para fixar de novo, --me-select-width. */
    :host {
      display: inline-block;
      width: 100%;
      max-width: var(--me-select-width, 320px);
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    ${PANEL_CSS}

    /* O painel acompanha a largura do campo e encosta nele (gap 0, medido). */
    .panel {
      --me-panel-distance: 0px;
      --me-panel-padding: 0;
    }

    /* ---- campo ---- */
    /* min-height e flex-wrap, não height: com multiple os chips empilham e o
       campo cresce, como no app. */
    .field {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-height: var(--me-control-height-m, 40px);
      padding: 4px 10px 4px 12px;
      border: 1px solid var(--me-color-gray-50, #323232);
      border-radius: var(--me-radius-s, 4px);
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-text, #16161D);
      cursor: text;
      /* SEM overflow:hidden: overflow recorta na caixa de padding, e a label
         flutuante precisa desenhar seu fundo por cima da borda superior. É o
         mesmo arranjo do me-input. Os chips não escapam porque o flex quebra
         linha e cada chip tem max-width. */
      transition: border-color var(--me-transition, 0.2s ease),
                  box-shadow var(--me-transition, 0.2s ease);
    }
    :host([size="small"]) .field { min-height: var(--me-control-height-s, 32px); }
    :host([size="large"]) .field { min-height: var(--me-control-height-l, 48px); }

    /* Borda de 2px no foco sem deslocar layout — mesmo truque do inset que o
       me-input usa para não dar o "pulo" de 1px. */
    .field:focus-within {
      border-color: var(--me-color-brand-light, #3CA2B9);
      box-shadow: inset 0 0 0 1px var(--me-color-brand-light, #3CA2B9);
    }
    :host([disabled]) .field {
      opacity: 0.45;
      background: var(--me-color-neutral-5, #FAFAFA);
      cursor: not-allowed;
    }

    /* ---- label flutuante (mesma mecânica do me-input) ---- */
    label {
      position: absolute;
      top: 50%;
      left: 12px;
      transform: translateY(-50%);
      margin: 0;
      max-width: calc(100% - 48px);
      color: var(--me-color-text-muted, #68688D);
      font-size: var(--me-font-size-body, 16px);
      line-height: 1.2;
      letter-spacing: var(--me-letter-spacing, 0.5px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      transition: top var(--me-transition, 0.2s ease), left var(--me-transition, 0.2s ease),
                  font-size var(--me-transition, 0.2s ease), color var(--me-transition, 0.2s ease);
    }
    label[hidden] { display: none; }
    /* 12px ao flutuar — medido. */
    .field:focus-within label,
    .field.filled label {
      top: 0;
      left: 10px;
      font-size: 12px;
      background: var(--me-color-surface, #FFFFFF);
      padding: 0 4px;
    }
    .field:focus-within label { color: var(--me-color-brand-light, #3CA2B9); }
    .asterisk { color: var(--me-color-negative-50, #DA1E28); }

    /* ---- chips ---- */
    /* display:contents faz os chips participarem do flex do .field, então eles
       quebram linha junto com o input em vez de virarem uma caixa rígida. */
    .tags { display: contents; }

    /* Pílula 26px, fonte 12px, padding 0 10px, sem borda, tint de 12% da marca
       — todos medidos no v-chip do app. O tint usa color-mix pelo mesmo idioma
       do --me-color-brand-hover (que é o mesmo cálculo a 8%). */
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-sizing: border-box;
      height: 26px;
      padding: 0 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--me-color-brand, #2F7F91) 12%, transparent);
      color: var(--me-color-brand, #2F7F91);
      font-size: 12px;
      line-height: 1;
      white-space: nowrap;
      max-width: 100%;
      /* SEM overflow:hidden aqui de propósito. Quem precisa recortar é o rótulo,
         e ele já recorta logo abaixo (com ellipsis, que o clip da pílula não
         daria). Na pílula o clip era redundante e cobrava um preço: MEDIDO, ele
         impedia a área de toque do × de passar da caixa de 18px do botão — com
         overflow:hidden a sonda a 11px do centro caía no campo, e com visible
         acertava o botão. */
      min-width: 0;
    }
    .tag span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tag button {
      flex: none;
      position: relative;   /* âncora da área de toque abaixo */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px; height: 18px;
      margin-right: -4px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: none;
      color: inherit;
      cursor: pointer;
    }
    /* Área de toque de 24×24 (o mínimo do WCAG 2.5.8) sem mexer no desenho: o
       botão tem 18px medidos no v-chip, e o hover pinta um círculo do tamanho da
       caixa — engordar a caixa engordaria o círculo. Um pseudo-elemento sem
       pintura estende só o alvo do ponteiro. Padding não serviria aqui: a caixa
       é border-box (medido: com padding:3px o botão continuou com 18×18). */
    .tag button::after {
      content: '';
      position: absolute;
      inset: -3px;
    }
    .tag button:hover { background: color-mix(in srgb, var(--me-color-brand, #2F7F91) 18%, transparent); }
    .tag button:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .tag svg { width: 14px; height: 14px; display: block; }
    /* Chip de excedente ("+2"), quando max-tags corta a lista. */
    .tag.overflow { background: var(--me-color-neutral-10, #F0F0F4); color: var(--me-color-text-muted, #68688D); }

    /* ---- input de busca ---- */
    input {
      flex: 1 1 60px;
      min-width: 60px;
      border: none;
      outline: none;
      padding: 0;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: var(--me-font-size-body, 16px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    :host([size="small"]) input { font-size: var(--me-font-size-small, 14px); }
    /* Ver Input.js: menos de 16px faz o Safari do iOS dar zoom ao focar e não
       desfazer. Em ponteiro grosso o texto digitado volta para 16px. */
    @media (pointer: coarse) {
      :host([size="small"]) input { font-size: var(--me-font-size-body, 16px); }
    }
    /* Sem searchable o campo não é digitável, mas segue focável pelo teclado. */
    :host(:not([searchable])) input { caret-color: transparent; cursor: pointer; }
    /* Enquanto a label repousa por cima, o placeholder nativo some (evita texto
       duplicado) e volta quando ela flutua. */
    .field.has-label input::placeholder { color: transparent; }
    .field.has-label:focus-within input::placeholder,
    .field.has-label.filled input::placeholder { color: var(--me-color-text-muted, #68688D); }

    /* ---- botões da direita ---- */
    .actions { flex: none; display: flex; align-items: center; gap: 2px; margin-left: auto; }
    .actions button, .actions .expand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px; height: 24px;
      padding: 0; border: 0; background: none;
      color: var(--me-color-text-muted, #68688D);
      cursor: pointer;
    }
    .actions svg { width: 18px; height: 18px; display: block; }
    .clear[hidden] { display: none; }
    .expand svg { transition: transform var(--me-transition, 0.2s ease); }
    :host([open]) .expand svg { transform: rotate(180deg); }
    .actions button:focus-visible {
      outline: none;
      border-radius: var(--me-radius-s, 4px);
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }

    /* ---- loading: barra fina na borda inferior do campo, como no app ---- */
    .loader {
      display: none;
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 2px;
      overflow: hidden;
      background: color-mix(in srgb, var(--me-color-brand-light, #3CA2B9) 25%, transparent);
    }
    :host([loading]) .loader { display: block; }
    .loader::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 40%;
      background: var(--me-color-brand-light, #3CA2B9);
      animation: me-select-loading 1.1s ease-in-out infinite;
    }
    @keyframes me-select-loading {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .loader::after { animation: none; width: 100%; opacity: 0.6; }
    }

    /* ---- lista e vazio ---- */
    .list { padding: 4px 0; }
    .empty {
      display: none;
      padding: 12px 16px;
      font-size: var(--me-font-size-small, 14px);
      font-style: italic;
      color: var(--me-color-neutral-50, #9E9EB7);
    }
    :host([data-empty]) .empty { display: block; }
    :host([data-empty]) .list { display: none; }

    /* ---- erro ---- */
    :host([error]) .field {
      border-color: var(--me-color-negative-50, #DA1E28);
      box-shadow: inset 0 0 0 1px var(--me-color-negative-50, #DA1E28);
    }
    :host([error]) .field label { color: var(--me-color-negative-50, #DA1E28); }
    .error-text {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.3;
      letter-spacing: var(--me-letter-spacing, 0.5px);
      color: var(--me-color-negative-50, #DA1E28);
    }
    .error-text[hidden] { display: none; }
  </style>
  <div class="field trigger" part="base">
    <label part="label" for="control" hidden><span class="text"></span><span class="asterisk" aria-hidden="true" hidden> *</span></label>
    <span class="tags" part="tags"></span>
    <input id="control" part="input" type="text" autocomplete="off" spellcheck="false"
           role="combobox" aria-expanded="false" aria-autocomplete="list" />
    <span class="actions">
      <button class="clear" part="clear" type="button" tabindex="-1" hidden aria-label="Limpar seleção">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="expand" part="expand" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </span>
    <span class="loader" part="loading"></span>
  </div>
  <div class="panel" part="panel" role="listbox">
    <div class="list" part="list"><slot></slot></div>
    <div class="empty" part="empty">Nenhum resultado</div>
  </div>
  <div class="error-text" id="error" part="error" hidden></div>
`;

class MeSelect extends HTMLElement {
  static formAssociated = true;

  #internals;
  #panel;
  #field;
  #input;
  #labelEl;
  #tagsEl;
  #clearBtn;
  #errorEl;
  #roving;
  #disposeSync;
  #initialSelection = null;
  #wasOpenOnPointerDown = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.#internals = this.attachInternals();

    this.#panel = this.shadowRoot.querySelector('.panel');
    this.#field = this.shadowRoot.querySelector('.field');
    this.#input = this.shadowRoot.querySelector('input');
    this.#labelEl = this.shadowRoot.querySelector('label');
    this.#tagsEl = this.shadowRoot.querySelector('.tags');
    this.#clearBtn = this.shadowRoot.querySelector('.clear');
    this.#errorEl = this.shadowRoot.querySelector('.error-text');

    preparePanel(this.#panel);
    this.#disposeSync = syncOpenState(this, this.#panel, (open) => this.#onToggled(open));

    this.#roving = rovingItems({
      getItems: () => this.#visibleOptions(),
      setActive: (option) => this.#setActiveOption(option),
      onActivate: (option) => this.#toggleOption(option),
      onClose: () => this.hide(),
      getLabel: (option) => option.label,
    });

    /* Clique no campo abre. O pointerdown guarda o estado porque o
       light-dismiss nativo fecha o popover ANTES do click chegar aqui — sem
       essa memória, clicar no campo aberto fecharia e reabriria no mesmo gesto. */
    this.#field.addEventListener('pointerdown', (event) => {
      this.#wasOpenOnPointerDown = this.open;
      // Não roubar o gesto dos botões da direita nem do × de um chip.
      if (event.target.closest('button')) this.#wasOpenOnPointerDown = null;
    });
    this.#field.addEventListener('click', (event) => {
      if (this.disabled || event.target.closest('button')) return;
      this.#input.focus();
      this.#wasOpenOnPointerDown ? this.hide() : this.show();
    });

    this.#clearBtn.addEventListener('click', () => this.#clear());

    this.#input.addEventListener('input', () => {
      if (!this.searchable) { this.#input.value = ''; return; }
      this.show();
      if (this.filter === 'manual') {
        this.dispatchEvent(new CustomEvent('me-search', {
          bubbles: true, composed: true, detail: { term: this.#input.value },
        }));
      } else {
        this.#applyFilter();
      }
      this.#syncFilled();
    });

    this.#input.addEventListener('keydown', (event) => this.#onKeydown(event));

    this.#panel.addEventListener('click', (event) => {
      const option = event.target.closest('me-select-option');
      if (!option || option.disabled || !this.contains(option)) return;
      this.#toggleOption(option);
    });

    this.shadowRoot.querySelector('.list slot').addEventListener('slotchange', () => {
      this.#syncColumns();
      this.#applyFilter();
      this.#renderTags();
      this.#syncFormValue();
    });
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'open', 'placement', 'distance', 'disabled',
            'required', 'error', 'error-message', 'empty-text', 'multiple', 'max-tags'];
  }

  connectedCallback() {
    // Snapshot da seleção declarada, para o formResetCallback poder voltar a ela.
    if (this.#initialSelection === null) {
      this.#initialSelection = this.#options().filter((o) => o.selected).map((o) => o.value);
    }
    setPlacement(this.#panel, this.placement);
    this.#syncDistance();
    this.#syncColumns();
    this.#renderTags();
    this.#syncFilled();
    this.#syncFormValue();
    this.#syncError();
  }

  disconnectedCallback() { this.#disposeSync?.(); }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'label':
        this.#labelEl.hidden = newValue == null;
        this.#labelEl.querySelector('.text').textContent = newValue ?? '';
        this.#field.classList.toggle('has-label', newValue != null);
        this.#input.setAttribute('aria-label', newValue ?? '');
        break;
      case 'placeholder':
        newValue == null
          ? this.#input.removeAttribute('placeholder')
          : this.#input.setAttribute('placeholder', newValue);
        break;
      case 'open': {
        const open = newValue !== null;
        open ? openPanel(this.#panel) : closePanel(this.#panel);
        this.#input.setAttribute('aria-expanded', String(open));
        // No caminho ancorado o me-toggle sai da ponte do popover, a única que
        // enxerga o dismiss nativo. No legado não há evento `toggle`.
        if (!SUPPORTS_ANCHOR) this.#afterToggle(open);
        break;
      }
      case 'placement': setPlacement(this.#panel, this.placement); break;
      case 'distance': this.#syncDistance(); break;
      case 'disabled':
        this.#input.disabled = newValue !== null;
        break;
      case 'required':
        this.#labelEl.querySelector('.asterisk').hidden = newValue === null;
        this.#syncValidity();
        break;
      case 'error':
      case 'error-message':
        this.#syncError();
        break;
      case 'empty-text':
        this.shadowRoot.querySelector('.empty').textContent = newValue ?? 'Nenhum resultado';
        break;
      case 'multiple':
      case 'max-tags':
        this.#renderTags();
        this.#syncFormValue();
        break;
    }
  }

  /* ---------------- atributos / propriedades ---------------- */
  get label() { return this.getAttribute('label') ?? ''; }
  set label(v) { this.setAttribute('label', v); }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(v) { v ? this.setAttribute('multiple', '') : this.removeAttribute('multiple'); }

  get searchable() { return this.hasAttribute('searchable'); }
  set searchable(v) { v ? this.setAttribute('searchable', '') : this.removeAttribute('searchable'); }

  get clearable() { return this.hasAttribute('clearable'); }
  set clearable(v) { v ? this.setAttribute('clearable', '') : this.removeAttribute('clearable'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get required() { return this.hasAttribute('required'); }
  set required(v) { v ? this.setAttribute('required', '') : this.removeAttribute('required'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(v) { v ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  get error() { return this.hasAttribute('error'); }
  set error(v) { v ? this.setAttribute('error', '') : this.removeAttribute('error'); }

  get errorMessage() { return this.getAttribute('error-message'); }
  set errorMessage(v) {
    v == null ? this.removeAttribute('error-message') : this.setAttribute('error-message', v);
  }

  get name() { return this.getAttribute('name'); }
  set name(v) { v == null ? this.removeAttribute('name') : this.setAttribute('name', v); }

  get filter() { return this.getAttribute('filter') === 'manual' ? 'manual' : 'auto'; }
  set filter(v) { this.setAttribute('filter', v); }

  get clearOnSelect() { return this.hasAttribute('clear-on-select'); }
  set clearOnSelect(v) {
    v ? this.setAttribute('clear-on-select', '') : this.removeAttribute('clear-on-select');
  }

  get maxTags() {
    const n = Number(this.getAttribute('max-tags'));
    return Number.isFinite(n) && n > 0 ? n : Infinity;
  }
  set maxTags(v) { this.setAttribute('max-tags', String(v)); }

  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.show() : this.hide(); }

  get placement() {
    const v = this.getAttribute('placement');
    return PLACEMENTS.includes(v) ? v : 'bottom-start';
  }
  set placement(v) { this.setAttribute('placement', v); }

  get distance() { return Number(this.getAttribute('distance') ?? 0); }
  set distance(v) { this.setAttribute('distance', String(v)); }

  get emptyText() { return this.getAttribute('empty-text') ?? 'Nenhum resultado'; }
  set emptyText(v) { this.setAttribute('empty-text', v); }

  get selectedOptions() { return this.#options().filter((o) => o.selected); }

  /* multiple → array; simples → string (mesma semântica do <select>). */
  get value() {
    const values = this.selectedOptions.map((o) => o.value);
    return this.multiple ? values : (values[0] ?? '');
  }

  set value(next) {
    const wanted = new Set(
      Array.isArray(next) ? next.map(String) : (next === '' || next == null ? [] : [String(next)]));
    for (const option of this.#options()) option.selected = wanted.has(option.value);
    this.#afterSelectionChange();
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
  focus(options) { this.#input.focus(options); }
  blur() { this.#input.blur(); }

  show() {
    if (this.disabled || this.open) return;
    this.setAttribute('open', '');
  }

  hide() {
    if (!this.open) return;
    this.removeAttribute('open');
  }

  /* ---------------- ciclo de vida form-associated ---------------- */
  formResetCallback() {
    const initial = new Set(this.#initialSelection ?? []);
    for (const option of this.#options()) option.selected = initial.has(option.value);
    this.#input.value = '';
    this.#applyFilter();
    this.#afterSelectionChange();
  }

  formDisabledCallback(disabled) {
    this.#input.disabled = disabled || this.disabled;
  }

  /* ---------------- internos ---------------- */
  #options() {
    return [...this.querySelectorAll('me-select-option')]
      .filter((o) => o.closest('me-select') === this);
  }

  /* Só as opções navegáveis: escondidas pelo filtro e desabilitadas ficam fora
     do alcance do teclado. */
  #visibleOptions() {
    return this.#options().filter((o) => !o.hidden);
  }

  #onKeydown(event) {
    if (this.disabled) return;

    // Backspace com a busca vazia remove o último chip — comportamento de
    // multi-select que o usuário espera (e que o wa-select também tem).
    if (event.key === 'Backspace' && this.multiple && this.#input.value === '') {
      const last = this.selectedOptions.at(-1);
      if (last) {
        event.preventDefault();
        this.#deselect(last);
        return;
      }
    }

    if (!this.open && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      event.preventDefault();
      this.show();
      event.key === 'ArrowUp' ? this.#roving.last() : this.#roving.first();
      return;
    }

    if (event.key === 'Escape') {
      if (this.open) {
        event.preventDefault();
        event.stopPropagation();
        this.hide();
      } else if (this.#input.value !== '') {
        this.#input.value = '';
        this.#applyFilter();
      }
      return;
    }

    if (!this.open) return;

    // Home/End só navegam a lista quando não há texto: com texto digitado elas
    // pertencem ao cursor do input, e sequestrá-las quebraria a edição.
    if ((event.key === 'Home' || event.key === 'End') && this.#input.value !== '') return;

    // O typeahead do núcleo é para lista sem campo de busca. Aqui a busca é o
    // input, então caractere imprimível não deve virar salto de foco.
    if (event.key.length === 1) return;

    if (this.#roving.handleKeydown(event)) event.preventDefault();
  }

  #setActiveOption(option) {
    for (const o of this.#options()) o.removeAttribute('data-active');
    if (!option) return;
    option.setAttribute('data-active', '');
    // block:'nearest' rola o painel só quando precisa, sem pular a lista.
    option.scrollIntoView({ block: 'nearest' });
  }

  #toggleOption(option) {
    if (this.multiple) {
      option.selected = !option.selected;
      if (this.clearOnSelect) {
        this.#input.value = '';
        this.#applyFilter();
      }
    } else {
      for (const o of this.#options()) o.selected = o === option;
      this.#input.value = '';
      this.#applyFilter();
      this.hide();
    }

    this.dispatchEvent(new CustomEvent('me-select', {
      bubbles: true, composed: true,
      detail: { value: option.value, selected: option.selected },
    }));
    this.#afterSelectionChange();
  }

  #deselect(option) {
    option.selected = false;
    this.dispatchEvent(new CustomEvent('me-select', {
      bubbles: true, composed: true,
      detail: { value: option.value, selected: false },
    }));
    this.#afterSelectionChange();
  }

  #clear() {
    if (this.disabled) return;
    for (const option of this.#options()) option.selected = false;
    this.#input.value = '';
    this.#applyFilter();
    this.dispatchEvent(new CustomEvent('me-clear', { bubbles: true, composed: true }));
    this.#afterSelectionChange();
  }

  /* Ponto único depois de QUALQUER mudança de seleção: redesenha os chips,
     atualiza o valor do form, a validade e emite input+change. */
  #afterSelectionChange() {
    this.#renderTags();
    this.#syncFilled();
    this.#syncFormValue();
    for (const type of ['input', 'change']) {
      this.dispatchEvent(new CustomEvent(type, {
        bubbles: true, composed: true, detail: { value: this.value },
      }));
    }
  }

  #renderTags() {
    this.#tagsEl.textContent = '';
    const selected = this.selectedOptions;

    // Sem multiple não há chip: o rótulo escolhido vira o texto do input, como
    // num <select> comum. Pode escrever sem ressalva porque o handler de
    // digitação NÃO passa por aqui — ele só filtra. Condicionar isso ao foco
    // deixava o campo em branco depois de escolher (o foco ainda está nele).
    if (!this.multiple) {
      this.#input.value = selected[0]?.label ?? '';
      this.#syncClearVisibility(selected.length > 0);
      return;
    }

    const limit = this.maxTags;
    const shown = selected.slice(0, limit === Infinity ? undefined : limit);

    for (const option of shown) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.setAttribute('part', 'tag');

      const text = document.createElement('span');
      text.textContent = option.label;
      tag.appendChild(text);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('part', 'tag-remove');
      remove.setAttribute('aria-label', `Remover ${option.label}`);
      remove.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#deselect(option);
        this.#input.focus();
      });
      tag.appendChild(remove);

      this.#tagsEl.appendChild(tag);
    }

    const hidden = selected.length - shown.length;
    if (hidden > 0) {
      const more = document.createElement('span');
      more.className = 'tag overflow';
      more.setAttribute('part', 'tag');
      more.textContent = `+${hidden}`;
      this.#tagsEl.appendChild(more);
    }

    this.#syncClearVisibility(selected.length > 0);
  }

  #syncClearVisibility(hasSelection) {
    this.#clearBtn.hidden = !(this.clearable && hasSelection && !this.disabled);
  }

  /* A label flutua quando há chip, texto digitado ou valor escolhido — mesma
     regra do me-input, estendida para os chips. */
  #syncFilled() {
    const filled = this.selectedOptions.length > 0 || this.#input.value !== '';
    this.#field.classList.toggle('filled', filled);
  }

  #applyFilter() {
    // No modo manual quem filtra é o consumidor (troca as opções); esconder
    // aqui brigaria com ele.
    const term = this.filter === 'manual' || !this.searchable
      ? '' : this.#input.value.trim().toLowerCase();
    let visible = 0;
    let mudou = false;
    for (const option of this.#options()) {
      const match = !term || option.label.toLowerCase().includes(term);
      if (option.hidden === match) mudou = true;   // o estado vai virar
      option.hidden = !match;
      if (match) visible++;
    }
    this.toggleAttribute('data-empty', visible === 0);

    /* Reset SÓ quando o conjunto visível mudou de fato. O índice do roving é
       uma posição dentro da lista visível, então filtrar o invalida — mas
       resetar sem mudança apagava a opção ativa por um caminho não óbvio: o
       evento `toggle` do popover é ASSÍNCRONO, então #afterToggle rodava depois
       do roving.first() do ArrowDown e limpava a marcação recém-feita. O
       sintoma era o teclado inteiro andar um passo atrás. */
    if (mudou) this.#roving.reset();
  }

  #syncColumns() {
    const hasIcon = this.#options()
      .some((o) => o.querySelector(':scope > [slot="icon"]') !== null);
    this.style.setProperty('--me-select-icon-space', hasIcon ? '36px' : '0px');
  }

  #syncFormValue() {
    if (!this.name) { this.#internals.setFormValue(null); this.#syncValidity(); return; }

    if (this.multiple) {
      // FormData com entradas repetidas do mesmo name: é assim que um
      // multi-select entra num <form> nativo de verdade (mesmo caminho do
      // me-checkbox-select). setFormValue(string) só carregaria um valor.
      const data = new FormData();
      for (const option of this.selectedOptions) data.append(this.name, option.value);
      this.#internals.setFormValue(data);
    } else {
      this.#internals.setFormValue(this.value);
    }
    this.#syncValidity();
  }

  #syncValidity() {
    const empty = this.selectedOptions.length === 0;
    if (this.required && empty) {
      this.#internals.setValidity(
        { valueMissing: true }, 'Selecione ao menos uma opção.', this.#input);
    } else {
      this.#internals.setValidity({});
    }
  }

  #onToggled(open) {
    if (open !== this.open) {
      open ? this.setAttribute('open', '') : this.removeAttribute('open');
      // No legado o setAttribute acima já passou pelo attributeChangedCallback,
      // que emitiu o me-toggle; emitir de novo aqui duplicaria.
      if (!SUPPORTS_ANCHOR) return;
    }
    this.#afterToggle(open);
  }

  #afterToggle(open) {
    if (!open) {
      this.#roving.reset();
      // Sem multiple, o input mostra o rótulo escolhido; ao fechar, texto de
      // busca não confirmado volta a ser o rótulo.
      if (!this.multiple) this.#renderTags();
      this.#syncFilled();
    }
    this.#input.setAttribute('aria-expanded', String(open));
    this.dispatchEvent(new CustomEvent('me-toggle', {
      bubbles: true, composed: true, detail: { open },
    }));
  }

  #syncDistance() {
    this.#panel.style.setProperty('--me-panel-distance', `${this.distance}px`);
  }

  #syncError() {
    const on = this.error;
    this.#input.setAttribute('aria-invalid', String(on));
    const message = this.errorMessage ?? '';
    this.#errorEl.textContent = message;
    const showing = on && message !== '';
    this.#errorEl.hidden = !showing;
    // aria-describedby só enquanto a mensagem está visível: referência para
    // elemento escondido anuncia descrição que não existe.
    if (showing) {
      this.#input.setAttribute('aria-describedby', 'error');
    } else {
      this.#input.removeAttribute('aria-describedby');
    }
  }
}

define('me-select', MeSelect);
