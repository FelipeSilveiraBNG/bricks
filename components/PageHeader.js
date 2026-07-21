/*
 * <me-page-header> — Cabeçalho de página do Minha Escala.
 *
 * Barra com título H5 + subtítulo cinza abaixo; área à direita para
 * ações (sino de notificação, avatar etc.) via slot "end".
 *
 * Atributos: heading, subheading (conveniência em texto puro).
 * Slots: heading, subheading (sobrepõem os atributos), end.
 * Parts: base, heading, subheading, end.
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
      color: var(--me-color-text, #16161D);
    }
    :host([hidden]) { display: none; }

    .base {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 48px;
    }

    .titles {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .heading {
      font-size: var(--me-font-size-h5, 24px);
      line-height: var(--me-line-height-h5, 32px);
      font-weight: var(--me-font-weight-bold, 700);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subheading {
      font-size: var(--me-font-size-small, 14px);
      line-height: var(--me-line-height-small, 18px);
      letter-spacing: var(--me-letter-spacing, 0.5px);
      color: var(--me-color-text-muted, #68688D);
    }
    .subheading:empty { display: none; }

    .end {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 24px; /* dimensiona me-icons slotted */
    }
  </style>
  <header class="base" part="base">
    <div class="titles">
      <div class="heading" part="heading"><slot name="heading"></slot></div>
      <div class="subheading" part="subheading"><slot name="subheading"></slot></div>
    </div>
    <div class="end" part="end"><slot name="end"></slot></div>
  </header>
`;

class MePageHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ['heading', 'subheading'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Atributos preenchem os slots como texto default (slot fallback).
    const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
    slot.textContent = newValue ?? '';
  }

  get heading() { return this.getAttribute('heading'); }
  set heading(value) {
    value == null ? this.removeAttribute('heading') : this.setAttribute('heading', value);
  }

  get subheading() { return this.getAttribute('subheading'); }
  set subheading(value) {
    value == null ? this.removeAttribute('subheading') : this.setAttribute('subheading', value);
  }
}

window.customElements.define('me-page-header', MePageHeader);
