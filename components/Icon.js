/*
 * <me-icon> — Ícone Material Design Icons (via webfont @mdi/font no CDN).
 *
 * Renderiza em LIGHT DOM (sem shadow root) de propósito: a webfont e as
 * classes .mdi-* são registradas no documento pelo tokens.css e não
 * penetram shadow DOM. Por isso os demais componentes recebem ícones
 * sempre via slots (o me-icon slotted permanece no light DOM).
 *
 * Uso:
 *   <me-icon name="bell"></me-icon>                        (decorativo)
 *   <me-icon name="bell" label="Notificações"></me-icon>   (semântico)
 *
 * Tamanho e cor herdam de font-size/color do contexto.
 * Catálogo de nomes: https://pictogrammers.com/library/mdi/
 */
import { define } from './define.js';

class MeIcon extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'label'];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  get name() { return this.getAttribute('name') || ''; }
  set name(value) { this.setAttribute('name', value); }

  get label() { return this.getAttribute('label'); }
  set label(value) {
    value == null ? this.removeAttribute('label') : this.setAttribute('label', value);
  }

  #render() {
    this.innerHTML = `<i class="mdi mdi-${this.name}"></i>`;
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      // Sem label = decorativo: escondido de leitores de tela.
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }
  }
}

define('me-icon', MeIcon);
