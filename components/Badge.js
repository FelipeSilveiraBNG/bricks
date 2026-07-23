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
 *   warning = laranja/alert ("Aberta"); yellow = amarelo ("Aguardando Auditoria");
 *   blue = azul/primária ("Auditoria em Progresso" — espelha o color="blue" do LabelBadge).
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

    /* Fundos quase brancos do LabelBadge (Tailwind *-50); borda mantém a cor da variante */
    :host([variant="success"]) .badge { --_color: var(--me-color-success-50, #198038);  --_bg: #f0fdf4; }
    :host([variant="danger"])  .badge { --_color: var(--me-color-negative-50, #DA1E28); --_bg: #fef2f2; }
    :host([variant="warning"]) .badge { --_color: var(--me-color-alert-50, #F18F1B);    --_bg: #fff7ed; }
    :host([variant="yellow"])  .badge { --_color: var(--me-color-warning-50, #F1C21B);  --_bg: #fefce8; }
    /* blue = paleta primária (teal): mesma cor do color="blue" do LabelBadge (border-primary bg-primary5) */
    :host([variant="blue"])    .badge { --_color: var(--me-color-primary-30, #2F7F91); --_bg: var(--me-color-primary-5, #D8EEF3); }
    /* neutral/gray espelha o LabelBadge gray: borda cinza clara, ícone gray-50 */
    :host([variant="neutral"]) .badge { --_color: #d1d5db; --_bg: #f3f4f6; }
    :host([variant="neutral"]) ::slotted(me-icon) { color: var(--me-color-gray-50, #323232); }

    ::slotted(me-icon) { font-size: 1.1em; color: var(--_color); }
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
