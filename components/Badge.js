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
 * Atributos: variant (brand|danger|success|warning|neutral), size (small|medium).
 * Slots: default (texto), start (ícone).
 * Part: base.
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
    }
    :host([hidden]) { display: none; }

    .badge {
      --_color: var(--me-color-brand, #2F7F91);
      --_bg: var(--me-color-brand-soft, #D8EEF3);

      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 32px;                 /* medium (default) */
      padding: 0 8px;
      border: 1px solid var(--_color);
      border-radius: var(--me-radius-m, 6px);
      background: var(--_bg);
      color: var(--_color);
      font-size: var(--me-font-size-small, 14px);
      font-weight: var(--me-font-weight-medium, 500);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      line-height: 1;
      white-space: nowrap;
    }

    :host([size="small"]) .badge { height: 26px; padding: 0 6px; }

    :host([variant="success"]) .badge { --_color: var(--me-color-success-50, #198038);  --_bg: var(--me-color-success-5, #EAFBEF); }
    :host([variant="danger"])  .badge { --_color: var(--me-color-negative-50, #DA1E28); --_bg: var(--me-color-negative-5, #FCE9EA); }
    :host([variant="warning"]) .badge { --_color: var(--me-color-alert-50, #F18F1B);    --_bg: var(--me-color-alert-5, #FEF3E7); }
    :host([variant="neutral"]) .badge { --_color: var(--me-color-secondary-10, #68688D); --_bg: var(--me-color-neutral-5, #FAFAFA); }

    ::slotted(me-icon) { font-size: 1.1em; }
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

window.customElements.define('me-badge', MeBadge);
