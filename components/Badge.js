/*
 * <me-badge> — labelBadge do Minha Escala.
 *
 * Chip de status: borda 1px colorida, fundo tintado, texto colorido.
 * Mapeamento de status do app (StatusPlantaoBadge):
 *   Extra     → variant="success"  (verde)
 *   Cobertura → variant="danger"   (vermelho)
 *   Fixo      → variant="brand"    (teal)
 *   Aberta    → variant="warning"  (laranja)
 *
 * Atributos: variant (brand|blue|danger|success|warning|yellow|neutral), size (small|medium).
 *   warning = laranja/alert ("Aberta"); yellow = amarelo ("Aguardando Auditoria").
 *   brand e blue são SINÔNIMOS, e ambos são o default: <me-badge>,
 *   <me-badge variant="brand"> e <me-badge variant="blue"> renderizam igual. Os
 *   dois nomes existem porque o LabelBadge do app chama a variante de marca de
 *   color="blue" ("Auditoria em Progresso"), e o kit não quer forçar a renomear
 *   na hora de portar. test/badge-variants.html afirma a equivalência.
 *
 * Todas as cores vêm do tokens.css — nenhum valor literal fora dos fallbacks
 * embutidos em var(). test/badge-variants.html trava isso.
 * Slots: default (texto), start (ícone).
 * Part: base.
 */
import { define } from './define.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .badge {
      /* Default = variante de marca. As variantes abaixo só trocam estas três. */
      --_color: var(--me-color-brand, #2F7F91);
      --_bg: var(--me-color-brand-soft, #D8EEF3);
      --_icon: var(--_color);

      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;            /* px-2.5 py-1 do LabelBadge (altura natural) */
      border: 1px solid var(--_color);
      border-radius: var(--me-radius-s, 4px);
      background: var(--_bg);
      /* Texto sempre escuro; a cor da variante fica só na borda e no ícone (como o LabelBadge). */
      color: var(--me-color-text, #16161D);
      font-size: var(--me-font-size-small, 14px);
      font-weight: var(--me-font-weight-medium, 500);
      line-height: 1;
      white-space: nowrap;
    }

    :host([size="small"]) .badge { padding: 2px 8px; font-size: 12px; }

    /* "brand" e "blue" são sinônimos do default: o LabelBadge do app chama a
       variante de marca de color="blue". Declarados para a API ser grep-ável e
       para sobreviver a um refactor que aperte a especificidade do default. */
    :host([variant="brand"]) .badge,
    :host([variant="blue"])  .badge {
      --_color: var(--me-color-brand, #2F7F91);
      --_bg: var(--me-color-brand-soft, #D8EEF3);
    }

    /* Fundo = o par -5 de cada família de feedback; borda = o passo -50.
       ATENÇÃO ao cruzamento de nomes (ver tokens.css): variant="warning" é o
       LARANJA e usa a família alert; variant="yellow" é o AMARELO e usa a
       família warning. */
    :host([variant="success"]) .badge { --_color: var(--me-color-success-50, #198038);  --_bg: var(--me-color-success-5, #EAFBEF); }
    :host([variant="danger"])  .badge { --_color: var(--me-color-negative-50, #DA1E28); --_bg: var(--me-color-negative-5, #FCE9EA); }
    :host([variant="warning"]) .badge { --_color: var(--me-color-alert-50, #F18F1B);    --_bg: var(--me-color-alert-5, #FEF3E7); }
    :host([variant="yellow"])  .badge { --_color: var(--me-color-warning-50, #F1C21B);  --_bg: var(--me-color-warning-5, #FEF9E7); }

    /* neutral: a borda é clara demais para servir de cor de ícone, então --_icon
       acompanha o rótulo em vez de --_color. */
    :host([variant="neutral"]) .badge {
      --_color: var(--me-color-neutral-30, #D8D8E2);
      --_bg: var(--me-color-neutral-10, #F0F0F4);
      --_icon: var(--me-color-text, #16161D);
    }

    ::slotted(me-icon) { font-size: 1.1em; color: var(--_icon); }
  </style>
  <span class="badge" part="base">
    <slot name="start"></slot>
    <slot></slot>
  </span>
`;

class MeBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

define('me-badge', MeBadge);
