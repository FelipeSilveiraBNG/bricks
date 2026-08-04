/*
 * <me-modal> — Modal do Minha Escala, sobre o <dialog> nativo.
 *
 * Funcionalidade base no <wa-dialog> do Web Awesome (open, label, slots
 * header/footer/header-actions, evento de fechar CANCELÁVEL com a origem).
 * Aparência replicada do Modal.vue do app — o componente mais usado do design
 * system deles: 98 arquivos o consomem.
 *
 * SPEC MEDIDA (Storybook + demo/prd32/auditoria-folha-de-monitoramento.html,
 * que já reproduzia esses modais à mão):
 *   backdrop     #111827 a 50%
 *   caixa        branco, radius 8px, max-height 90vh, overflow hidden, coluna
 *   sombra       shadow-lg — o mesmo valor que o painel do me-select-filter
 *                usava inline; virou o token --me-shadow-overlay
 *   largura      896px default (max-w-4xl), 448px compacto (max-w-md),
 *                80vw largo
 *   header       padding 24px 24px 16px, título 20px/28px bold,
 *                borda inferior opcional de 2px
 *   body         padding 16px 24px, rola sozinho (flex:1; min-height:0)
 *   footer       padding 16px 24px, borda superior opcional de 2px
 *   fechar       40x40 em 16px/16px, círculo, ícone 24px, hover cinza claro
 *   transição    opacity 0.3s ease
 *
 * POR QUE <dialog> NATIVO E NÃO UM OVERLAY À MÃO (como o app faz):
 *   - top layer de graça. A demo do PRD32 precisou de uma escada manual de
 *     z-index (overlay 80 / modal 90 / popovers 100) com este comentário:
 *     "dropdowns e popovers precisam flutuar sobre a superfície que os abriu —
 *     dentro do modal de reprovação, um valor menor os deixaria atrás e
 *     inclicáveis". Com top layer a escada inteira desaparece.
 *   - focus trap, `inert` no resto da página e Esc, que o Modal.vue do app NÃO
 *     tem. Era um defeito de acessibilidade que não valia replicar.
 *
 * CONVIVÊNCIA COM O POPOVER — MEDIDO, não suposto. Com um me-select aberto
 * dentro de um me-modal: o painel pinta ACIMA do modal (hit-test confirmou), a
 * ancoragem acha o trigger de dentro do modal, e clique real no corpo do modal
 * fecha só o painel (`dialog` segue aberto). O modal é primo do popover, não
 * consumidor: NÃO usa internal/popover.js.
 *
 * FOCO INICIAL É REQUISITO, NÃO REFINAMENTO. Medido: quando o activeElement era
 * o <body>, o Esc ficava MORTO — não fechava nada, quatro tentativas. O
 * showModal() sozinho não garantiu foco dentro do diálogo nas nossas medições,
 * então #focusInitial() é obrigatório para o Esc nativo funcionar.
 *
 *   <me-modal id="m" label="Editar plantão">
 *     <span slot="header">Editar plantão</span>
 *     Conteúdo…
 *     <div slot="footer" style="display:flex; gap:16px; justify-content:flex-end;">
 *       <me-button appearance="outlined">Cancelar</me-button>
 *       <me-button>Confirmar</me-button>
 *     </div>
 *   </me-modal>
 *   <script>document.getElementById('m').show();</script>
 *
 * Atributos: open (refletido), label, size (small|medium|large),
 *   without-header, without-close-button, header-border, footer-border,
 *   no-body-padding, max-height, min-height.
 * Slots: header, default (corpo), footer, header-actions.
 * Métodos: show(), hide().
 * Eventos: me-close — CANCELÁVEL, detail { source } com
 *   'close-button' | 'overlay' | 'escape' | 'api'; me-after-close (o diálogo
 *   fechou — dispara no fechamento, NÃO no fim da animação de saída).
 * Parts: base, header, title, header-actions, close, body, footer.
 * CSS vars: --me-modal-width, --me-modal-backdrop, --me-modal-max-height.
 *
 * Fechar pelo clique no overlay é o comportamento DEFAULT, como no app (o
 * wa-dialog pede opt-in). Quem precisa proteger formulário usa o me-close:
 *   modal.addEventListener('me-close', (e) => {
 *     if (e.detail.source === 'overlay' && sujo) e.preventDefault();
 *   });
 */
import { define } from './define.js';

/* Trava de rolagem do documento. CONTADOR e não booleano: modais podem
   empilhar (o showModal aceita), e um close ingênuo devolveria a rolagem
   enquanto o de baixo ainda está aberto. Escopo de módulo = por cópia do kit,
   igual ao define.js. */
let abertos = 0;
let overflowAnterior = '';

function travarRolagem() {
  if (abertos === 0) {
    overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  abertos++;
}

function liberarRolagem() {
  abertos = Math.max(0, abertos - 1);
  if (abertos === 0) document.body.style.overflow = overflowAnterior;
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: contents; }

    /* A própria <dialog> é a caixa: um wrapper interno só adicionaria um nível
       sem ganho, e é nela que ::backdrop se pendura. O UA centraliza diálogo
       modal por margin:auto — não recriamos posicionamento. */
    dialog {
      box-sizing: border-box;
      display: none;
      flex-direction: column;
      width: calc(100vw - 48px);
      max-width: var(--me-modal-width, 896px);
      /* Duas declarações, não uma: dvh desconta a barra de endereço que aparece
         e desaparece no Safari/Chrome mobile, e 90vh ali significa 90% da tela
         COM a barra recolhida — ou seja, mais alto que a área visível quando ela
         está aberta. Onde dvh não existe, a primeira linha vale. */
      max-height: var(--me-modal-max-height, 90vh);
      max-height: var(--me-modal-max-height, 90dvh);
      overflow: hidden;
      padding: 0;
      border: 0;
      border-radius: var(--me-radius-l, 8px);
      background: var(--me-color-surface, #FFFFFF);
      color: var(--me-color-text, #16161D);
      box-shadow: var(--me-shadow-overlay,
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1));
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      text-align: left;
    }
    dialog[open] { display: flex; }

    /* 448px = max-w-md (o "modal de filtro" do app); 80vw = o modal largo da
       conciliação. O default de 896px é o max-w-4xl do Modal.vue. */
    :host([size="small"]) dialog { max-width: var(--me-modal-width, 448px); }
    /* O max() é o conserto de um defeito medido: com 80vw puro, o large ficava
       MAIS ESTREITO que o default em telas pequenas (390px de viewport → 312px
       no large contra 342px no default), porque 80vw é menor que
       calc(100vw - 48px) em qualquer viewport acima de 240px. Com o piso em
       896px — o teto do default — o large nunca é mais estreito que ele, e em
       desktop volta a valer os 80vw. */
    :host([size="large"]) dialog { max-width: var(--me-modal-width, max(80vw, 896px)); }

    /* #111827 a 50%, medido. Sem token do kit para esta cor — o mais próximo
       (--me-color-gray-50) é bem mais claro —, então fica var local. */
    dialog::backdrop { background: var(--me-modal-backdrop, rgb(17 24 39 / 0.5)); }

    /* Animação de entrada/saída de um elemento que alterna display: precisa de
       allow-discrete nas propriedades discretas, e do @starting-style para
       existir um estado inicial de onde animar. */
    dialog, dialog::backdrop {
      opacity: 0;
      transition: opacity 0.3s ease, display 0.3s allow-discrete, overlay 0.3s allow-discrete;
    }
    dialog[open], dialog[open]::backdrop { opacity: 1; }
    @starting-style {
      dialog[open], dialog[open]::backdrop { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      dialog, dialog::backdrop { transition: none; }
    }

    /* ---- fechar: 40x40 em 16/16, medido ---- */
    .close {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: none;
      color: var(--me-color-gray-40, #4D4D4D);
      cursor: pointer;
      transition: background var(--me-transition, 0.2s ease);
    }
    .close:hover { background: var(--me-color-neutral-10, #F0F0F4); }
    .close:focus-visible {
      outline: none;
      box-shadow: var(--me-focus-ring, 0 0 0 3px rgb(47 127 145 / 0.35));
    }
    .close svg { width: 24px; height: 24px; display: block; }
    :host([without-header]) .close,
    :host([without-close-button]) .close { display: none; }

    /* ---- header ---- */
    /* Título de 20px/28px bold — vale para texto solto no slot; um <h2> do
       consumidor herda o tamanho e ganha margin:0. O 72px à direita reserva a
       calha do botão fechar, para o título não passar por baixo dele. */
    .header {
      flex: none;
      /* 24px topo/lados, 16px baixo. Vem da demo do PRD32, que resolveu uma
         ambiguidade do markup do app: lá o header tem pt-4/md:pt-6 E
         py-3/md:py-4, duas classes disputando o mesmo padding-top. */
      padding: 24px 72px 16px 24px;
      font-size: 20px;
      line-height: 28px;
      font-weight: var(--me-font-weight-bold, 700);
      color: var(--me-color-text, #16161D);
    }
    .header ::slotted(*) { margin: 0; }
    :host([header-border]) .header { border-bottom: 2px solid var(--me-color-neutral-10, #F0F0F4); }
    :host([without-header]) .header,
    :host(:not([data-has-header])) .header { display: none; }
    /* Sem o botão fechar, o título pode usar a largura toda. */
    :host([without-close-button]) .header { padding-right: 24px; }

    .header-actions { display: none; }
    :host([data-has-header-actions]) .header-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      /* Ao lado do botão fechar, não embaixo dele. */
      position: absolute;
      top: 16px;
      right: 64px;
      z-index: 1;
    }
    :host([without-close-button][data-has-header-actions]) .header-actions,
    :host([without-header][data-has-header-actions]) .header-actions { right: 16px; }

    /* ---- corpo: quem rola ---- */
    .body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 16px 24px;
      font-size: var(--me-font-size-body, 16px);
      line-height: var(--me-line-height-body, 24px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
    }
    :host([no-body-padding]) .body { padding: 0; }
    /* Sem header, o corpo precisa do respiro de cima de volta — senão o texto
       encosta na borda e some atrás do botão fechar. */
    :host([without-header]) .body,
    :host(:not([data-has-header])) .body { padding-top: 24px; }
    :host([without-header][no-body-padding]) .body,
    :host(:not([data-has-header])[no-body-padding]) .body { padding-top: 0; }

    /* ---- footer ---- */
    .footer { flex: none; padding: 16px 24px; }
    :host([footer-border]) .footer { border-top: 2px solid var(--me-color-neutral-10, #F0F0F4); }
    :host(:not([data-has-footer])) .footer { display: none; }
  </style>
  <dialog part="base">
    <button class="close" part="close" type="button" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span class="header-actions" part="header-actions"><slot name="header-actions"></slot></span>
    <header class="header" part="header"><slot name="header"></slot></header>
    <div class="body" part="body"><slot></slot></div>
    <footer class="footer" part="footer"><slot name="footer"></slot></footer>
  </dialog>
`;

class MeModal extends HTMLElement {
  #dialog;
  #travou = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.#dialog = this.shadowRoot.querySelector('dialog');

    for (const [name, attr] of [['header', 'data-has-header'],
                                ['footer', 'data-has-footer'],
                                ['header-actions', 'data-has-header-actions']]) {
      const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
      const sync = () => this.toggleAttribute(
        attr, slot.assignedNodes({ flatten: true }).length > 0);
      slot.addEventListener('slotchange', sync);
      sync();
    }

    this.shadowRoot.querySelector('.close')
      .addEventListener('click', () => this.#pedirFechar('close-button'));

    /* Esc nativo. O <dialog> emite `cancel` e o preventDefault dele impede o
       fechamento — é o encaixe perfeito para o me-close cancelável. */
    this.#dialog.addEventListener('cancel', (event) => {
      event.preventDefault();          // sempre: quem decide é o me-close
      this.#pedirFechar('escape');
    });

    /* Clique no overlay. O <dialog> não emite evento para o ::backdrop, e o
       clique nele tem como target a própria <dialog> — então a distinção é
       geométrica: dentro ou fora da caixa. Compara com o rect em vez de
       confiar no target, que também é a <dialog> em clique de borda. */
    this.#dialog.addEventListener('click', (event) => {
      if (event.target !== this.#dialog) return;   // clique no conteúdo
      const r = this.#dialog.getBoundingClientRect();
      const dentro = event.clientX >= r.left && event.clientX <= r.right
                  && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!dentro) this.#pedirFechar('overlay');
    });

    /* REDE DE SEGURANÇA, não o caminho principal. Cobre fechamento que não
       passou pelo #fechar() — o caso real é um <form method="dialog"> submetido
       dentro do modal, que fecha o diálogo por conta do navegador.
       A limpeza NÃO depende deste evento: medi que o `close` nativo não chegou a
       disparar neste ambiente (inclusive num <dialog> de controle criado na
       hora), então a liberação da rolagem e o me-after-close acontecem de forma
       síncrona no #fechar(). Depender de um evento cuja entrega eu não consegui
       confirmar deixaria a rolagem travada para sempre. */
    this.#dialog.addEventListener('close', () => {
      if (this.hasAttribute('open')) this.removeAttribute('open');
      else this.#fechar();   // idempotente: só completa a limpeza pendente
    });
  }

  static get observedAttributes() {
    return ['open', 'label', 'max-height', 'min-height'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'open':
        newValue === null ? this.#fechar() : this.#abrir();
        break;
      case 'label':
        newValue == null
          ? this.#dialog.removeAttribute('aria-label')
          : this.#dialog.setAttribute('aria-label', newValue);
        break;
      case 'max-height':
        this.#dialog.style.maxHeight = newValue ?? '';
        break;
      case 'min-height':
        this.#dialog.style.minHeight = newValue ?? '';
        break;
    }
  }

  /* `<me-modal open>` no HTML, ou `open` escrito antes de inserir o elemento:
     nos dois casos o attributeChangedCallback roda com o elemento fora do
     documento, e showModal() lança InvalidStateError ali. O #abrir() se protege
     com isConnected, e aqui a abertura é retomada. */
  connectedCallback() {
    if (this.open && !this.#dialog.open) this.#abrir();
  }

  disconnectedCallback() {
    // Sair do DOM aberto deixaria a rolagem travada para sempre.
    if (this.#travou) { liberarRolagem(); this.#travou = false; }
  }

  /* ---- propriedades ---- */
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.show() : this.hide(); }

  get label() { return this.getAttribute('label') ?? ''; }
  set label(v) { this.setAttribute('label', v); }

  get size() { return this.getAttribute('size') ?? 'medium'; }
  set size(v) { this.setAttribute('size', v); }

  /* ---- métodos ---- */
  show() {
    if (this.open) return;
    this.setAttribute('open', '');
  }

  /* Passa pelo me-close, como qualquer outro caminho de fechamento: assim um
     preventDefault protege o formulário mesmo quando o fechamento vem da API. */
  hide() {
    if (!this.open) return;
    this.#pedirFechar('api');
  }

  /* ---- internos ---- */
  #abrir() {
    if (this.#dialog.open) return;
    // showModal() lança se o elemento não está no documento; o
    // connectedCallback retoma.
    if (!this.isConnected) return;
    this.#dialog.showModal();
    if (!this.#travou) { travarRolagem(); this.#travou = true; }
    this.#focarInicial();
  }

  /* Fecha e limpa, de forma SÍNCRONA e idempotente. O #travou faz as duas
     vezes de "estava aberto": ele guarda a rolagem e serve de guarda contra
     rodar a limpeza duas vezes (o `close` nativo pode chegar depois). A
     animação de saída não sofre: ela é CSS, não depende desta limpeza. */
  #fechar() {
    if (this.#dialog.open) this.#dialog.close();
    if (!this.#travou) return;
    liberarRolagem();
    this.#travou = false;
    this.dispatchEvent(new CustomEvent('me-after-close', {
      bubbles: true, composed: true,
    }));
  }

  /* Fonte única de fechamento: emite o me-close cancelável e só fecha se
     ninguém barrar. */
  #pedirFechar(source) {
    const event = new CustomEvent('me-close', {
      bubbles: true, composed: true, cancelable: true,
      detail: { source },
    });
    this.dispatchEvent(event);
    if (event.defaultPrevented) return false;
    this.removeAttribute('open');   // attributeChangedCallback fecha o dialog
    return true;
  }

  /* OBRIGATÓRIO: sem foco dentro do diálogo o Esc nativo não dispara — medido,
     com o activeElement no <body> o Esc ficava morto. Ordem: autofocus
     declarado pelo consumidor, primeiro focável do conteúdo, botão fechar, e
     por último a própria <dialog>. */
  #focarInicial() {
    const declarado = this.querySelector('[autofocus]');
    if (declarado?.focus) { declarado.focus(); return; }

    const focavel = this.querySelector(
      'button, [href], input, select, textarea, me-button, me-input, me-select, ' +
      'me-switch, me-checkbox, [tabindex]:not([tabindex="-1"])');
    if (focavel?.focus) { focavel.focus(); return; }

    const fechar = this.shadowRoot.querySelector('.close');
    if (this.hasAttribute('without-header') || this.hasAttribute('without-close-button')) {
      this.#dialog.tabIndex = -1;
      this.#dialog.focus();
    } else {
      fechar.focus();
    }
  }
}

define('me-modal', MeModal);
