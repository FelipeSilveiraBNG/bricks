/*
 * <me-pages> + <me-page> — Controle de renderização de páginas.
 * (Porte fiel do bng-pages/bng-page da bng-components.)
 *
 * "Engine" de seleção de páginas: transforma uma página única em uma
 * aplicação com rotas, usando o hash da URL (#/nome-da-pagina).
 *
 *   <me-pages default="inicio">
 *     <me-page name="inicio">...</me-page>
 *     <me-page name="sobre">...</me-page>
 *   </me-pages>
 *
 *   <a href="#/inicio">Início</a>
 *   <a href="#/sobre">Sobre</a>
 *
 * Como a rota vive no hash, tudo funciona em hospedagem estática
 * (GitHub Pages, Azure Static Web Apps...) sem servidor nem build:
 * deep-link (#/sobre abre direto na página) e os botões voltar/avançar
 * do navegador funcionam de graça, via evento "hashchange".
 *
 * São DOIS custom elements (mesmo padrão do wa-tab-group/wa-tab-panel
 * do Web Awesome): o <me-pages> decide QUEM aparece, e cada
 * <me-page> é uma página com um "name" de rota.
 *
 * Evento: change (detail.page) ao trocar de página.
 * O host reflete a página atual: me-pages[page="inicio"].
 */
import { define } from './define.js';

/* ----------------------- <me-page> ----------------------- */

const pageTemplate = document.createElement('template');
pageTemplate.innerHTML = `
  <style>
    :host {
      display: block;
    }

    /* A página só aparece quando o seletor marca o atributo "active".
       Quem gerencia esse atributo é o <me-pages> — o consumidor
       não precisa (nem deve) mexer nele manualmente.
       O !important (deviação do bng) impede que um CSS de página como
       "me-page { display:flex }" vaze e mostre todas as rotas de uma vez:
       regras do documento sempre vencem :host sem !important. */
    :host(:not([active])) {
      display: none !important;
    }
  </style>
  <slot></slot>
`;

class MePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(pageTemplate.content.cloneNode(true));
  }
}

/* ----------------------- <me-pages> ----------------------- */

const routerTemplate = document.createElement('template');
routerTemplate.innerHTML = `
  <style>
    :host {
      display: block;
    }
  </style>
  <slot></slot>
`;

class MePages extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(routerTemplate.content.cloneNode(true));

    // Guardamos a função com o "this" já amarrado para conseguir REMOVER
    // o listener depois (removeEventListener exige a MESMA referência).
    this._onHashChange = () => this._applyRoute();
  }

  connectedCallback() {
    // "hashchange" dispara sempre que o #/rota da URL muda — inclusive
    // pelos botões voltar/avançar do navegador.
    window.addEventListener('hashchange', this._onHashChange);

    // Aplica a rota inicial (deep-link): se a página foi aberta já com
    // #/rota na URL, começamos direto nela.
    this._applyRoute();
  }

  disconnectedCallback() {
    // Sempre limpe listeners de window ao sair do DOM, senão o elemento
    // nunca é liberado da memória (vazamento).
    window.removeEventListener('hashchange', this._onHashChange);
  }

  // Todas as <me-page> filhas (diretas ou não)
  get _pages() {
    return Array.from(this.querySelectorAll('me-page'));
  }

  _applyRoute() {
    const hash = window.location.hash; // ex.: "#/inicio"
    const pages = this._pages;
    if (pages.length === 0) return;

    // Extrai o nome da rota do hash ("#/inicio" -> "inicio")
    let name = hash.startsWith('#/') ? decodeURIComponent(hash.slice(2)) : '';
    let target = pages.find((p) => p.getAttribute('name') === name);

    // Rota vazia ou desconhecida: cai na página do atributo "default"
    // (ou, na falta dele, na primeira página declarada).
    if (!target) {
      const defaultName = this.getAttribute('default');
      target = pages.find((p) => p.getAttribute('name') === defaultName) || pages[0];
      name = target.getAttribute('name');
    }

    // Mostra só a página alvo; esconde as demais
    pages.forEach((p) => {
      if (p === target) {
        p.setAttribute('active', '');
      } else {
        p.removeAttribute('active');
      }
    });

    // Se a rota não mudou de fato (ex.: hash inválido repetido), paramos
    // aqui para não disparar eventos duplicados.
    if (this.getAttribute('page') === name) return;

    // Reflete a página atual no host — permite estilização externa via
    // me-pages[page="inicio"] e facilita depuração no inspetor.
    this.setAttribute('page', name);

    // Trocar de página deve levar o usuário ao topo, como numa navegação real
    window.scrollTo(0, 0);

    this.dispatchEvent(new CustomEvent('change', {
      // "bubbles: true" permite que o evento suba na árvore do DOM.
      // "composed: true" permite que o evento "atravesse" a fronteira do Shadow DOM.
      bubbles: true,
      composed: true,
      detail: { page: name }
    }));
  }
}

define('me-page', MePage);
define('me-pages', MePages);
