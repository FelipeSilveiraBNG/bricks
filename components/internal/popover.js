/*
 * internal/popover.js — núcleo de painel flutuante do me-bricks.
 *
 * NÃO é um componente. É um módulo de composição (como o define.js), consumido
 * por quem precisa abrir um painel ancorado num trigger: me-dropdown, me-select
 * e, depois da migração, me-select-filter.
 *
 * POR QUE ELE EXISTE — o painel do me-select-filter era `position: absolute`
 * dentro de um `:host { position: relative }`, e isso é recortado por qualquer
 * ancestral com overflow. MEDIDO no shell que o próprio AGENTS.md recomenda
 * (body overflow:hidden + área de conteúdo overflow-y:auto), com a pílula perto
 * da base: o painel passava 158px além do fim da caixa de rolagem e as três
 * sondas de elementFromPoint nessa faixa não encontravam o painel — ou seja,
 * aqueles pixels não eram pintados nem clicáveis. Como o Filters.js também não
 * tem flip (`top: calc(100% + 8px)` é fixo) e o body não rola, as opções ficavam
 * inalcançáveis. Ver test/panel-clipping.html.
 *
 * A CURA — top layer via atributo `popover` nativo + ancoragem por CSS anchor
 * positioning. Medido em Chrome (test da sonda, descartado):
 *   - `anchor-name` É ESCOPADO POR SHADOW TREE. Duas instâncias declarando o
 *     mesmo `--me-anchor` ancoraram cada uma no seu próprio trigger (dx=0 nas
 *     duas). Por isso o nome aqui é uma constante fixa e NÃO há contador de uid
 *     por instância (o Tabs.js precisa de um; este não).
 *   - O painel escapa do recorte: 103px além do scroller e as três sondas
 *     acertaram o painel dentro do shadow root.
 *   - `position-try-fallbacks: flip-block` vira o painel para cima quando falta
 *     espaço embaixo (trigger em y=880 → painel foi para 754..874).
 *
 * DUAS COISAS QUE VÊM DE GRAÇA com o popover nativo, e uma que custa:
 *   + light-dismiss (clique fora) e Esc, sem listener no document.
 *   + `popover=auto` é MUTUAMENTE EXCLUSIVO: abrir um fecha os outros. É o que
 *     a receita manual do AGENTS.md pedia para fazer à mão.
 *   − em troca, o painel pode fechar SEM o componente mandar. Por isso todo
 *     consumidor é obrigado a chamar syncOpenState(): sem isso o atributo
 *     `open` mente depois do primeiro clique fora.
 *
 * DEGRADAÇÃO — onde não há anchor positioning, o caminho do popover é
 * abandonado inteiro (um popover no top layer não pode ser posicionado em
 * relação a um ancestral: `absolute` ali resolve contra o bloco contêiner
 * inicial, não contra o host). Cai no painel `absolute` em fluxo, que é
 * exatamente o comportamento de hoje — sem regressão, só sem a cura.
 */

/* Capacidade, não navegador. Decide o caminho em runtime. */
export const SUPPORTS_ANCHOR =
  typeof CSS !== 'undefined' &&
  CSS.supports('anchor-name', '--x') &&
  CSS.supports('position-area', 'block-end');

/* Nome fixo: é escopado por shadow tree (ver cabeçalho), então não colide
   entre instâncias. Exportado para o consumidor não redigitar a string. */
export const ANCHOR_NAME = '--me-anchor';

/* position-area por placement. `span-inline-end` significa "começa na borda
   inline-start da âncora e se estende para o fim" — ou seja, alinhado à
   esquerda em LTR. O -end/-start do nome do placement é a borda de ALINHAMENTO,
   e por isso o span é o oposto dele. */
const AREA = {
  'bottom-start': 'block-end span-inline-end',
  'bottom-end': 'block-end span-inline-start',
  'top-start': 'block-start span-inline-end',
  'top-end': 'block-start span-inline-start',
};

export const PLACEMENTS = Object.keys(AREA);

/*
 * CSS do painel, interpolado no <style> do shadow root de cada consumidor.
 *
 * Variáveis de ajuste (o consumidor sobrescreve no seu próprio :host):
 *   --me-panel-min-width   default: a largura do trigger
 *   --me-panel-max-height  default: 300px (= maxHeight do menu do app)
 *   --me-panel-distance    default: 8px de respiro entre trigger e painel
 */
export const PANEL_CSS = `
  /* Bloco contêiner do caminho legado. Inofensivo no caminho moderno: um
     popover no top layer não se posiciona em relação ao host. */
  :host { position: relative; }

  /* O anchor-name vai no WRAPPER do shadow tree, nunca via ::slotted(): o
     elemento projetado vive na árvore do documento, e escopo de anchor-name
     atravessando essa fronteira é terreno movediço. O wrapper encolhe no
     trigger, então ancorar nele é ancorar no trigger. */
  .trigger { anchor-name: ${ANCHOR_NAME}; }

  .panel {
    display: none;
    box-sizing: border-box;
    min-width: var(--me-panel-min-width, anchor-size(width));
    max-height: var(--me-panel-max-height, 300px);
    overflow-y: auto;
    /* Estes três desfazem o UA stylesheet do popover (que põe padding:1em,
       border e margin:auto). Ficam no seletor de classe, não no [popover]:
       estilo de autor já vence o do UA, e assim o consumidor ajusta o padding
       por --me-panel-padding sem disputar especificidade com o reset. */
    padding: var(--me-panel-padding, 0);
    margin: 0;
    background: var(--me-color-surface, #FFFFFF);
    border: 1px solid var(--me-color-border, #E2E2E9);
    border-radius: var(--me-radius-s, 4px);
    /* Elevação de menu suspenso — medida no v-autocomplete do app. */
    box-shadow: var(--me-shadow-panel,
      0 2px 4px -1px rgb(0 0 0 / 0.2),
      0 4px 5px 0 rgb(0 0 0 / 0.14),
      0 1px 10px 0 rgb(0 0 0 / 0.12));
    color: var(--me-color-text, #16161D);
    font-family: var(--me-font-family, 'Inter', system-ui, sans-serif);
  }

  /* Caminho moderno: top layer + ancoragem. */
  .panel[popover] {
    position: fixed;
    /* inset:auto desfaz o inset:0 do UA — sem isso o painel estica na viewport
       inteira antes de qualquer ancoragem valer. */
    inset: auto;
    position-anchor: ${ANCHOR_NAME};
    position-area: ${AREA['bottom-start']};
    /* Vira para o outro lado do bloco quando não cabe. Suporte mais estreito
       que o resto da ancoragem (Firefox 147+, Safari 26+); sem ele o painel
       simplesmente não vira, nada quebra. */
    position-try-fallbacks: flip-block;
    /* Nos dois eixos de bloco: só um deles encosta na âncora, e assim o
       respiro sobrevive ao flip. */
    margin-block: var(--me-panel-distance, 8px);
  }
  /* Especificidade maior que .panel{display:none} — e precisa ser explícito,
     porque um display:none de autor vence a regra do UA para :popover-open. */
  .panel[popover]:popover-open { display: block; }

  /* Caminho legado (sem anchor positioning): painel em fluxo, recortável.
     É o comportamento que o kit já tinha; existe para não piorar nada. */
  .panel:not([popover]) {
    position: absolute;
    z-index: 20;
    top: calc(100% + var(--me-panel-distance, 8px));
    left: 0;
    min-width: var(--me-panel-min-width, 100%);
  }
  :host([open]) .panel:not([popover]) { display: block; }
`;

/*
 * Prepara o painel. Chame UMA vez, no constructor, depois de montar o shadow
 * root. Marca o painel como popover só onde a ancoragem existe — é o atributo
 * que diferencia os dois caminhos no CSS acima.
 */
export function preparePanel(panel) {
  if (SUPPORTS_ANCHOR) panel.setAttribute('popover', 'auto');
  return panel;
}

/* Aplica o placement. Sem ancoragem o legado só sabe abrir para baixo à
   esquerda, então placement é ignorado — degradação silenciosa e documentada. */
export function setPlacement(panel, placement) {
  if (!SUPPORTS_ANCHOR) return;
  panel.style.positionArea = AREA[placement] ?? AREA['bottom-start'];
}

/* showPopover/hidePopover lançam InvalidStateError se já estão no estado
   pedido; o kit trata "abrir o que está aberto" como no-op. */
export function openPanel(panel) {
  if (!SUPPORTS_ANCHOR) return;
  try { panel.showPopover(); } catch { /* já aberto */ }
}

export function closePanel(panel) {
  if (!SUPPORTS_ANCHOR) return;
  try { panel.hidePopover(); } catch { /* já fechado */ }
}

/*
 * Liga o estado real do painel ao componente. OBRIGATÓRIO em todo consumidor.
 *
 * onToggle(open) recebe o estado novo; refletir o atributo e emitir o evento é
 * responsabilidade do consumidor (o núcleo não batiza eventos de ninguém).
 *
 * Os dois caminhos entregam a MESMA garantia por meios diferentes:
 *   - moderno: escuta o `toggle` do popover, que dispara inclusive quando o
 *     light-dismiss nativo fecha por conta própria. Sem esta ponte, `open`
 *     ficaria true para sempre depois do primeiro clique fora e o trigger
 *     pararia de reabrir.
 *   - legado: não há popover nem dismiss nativo, então o fechamento por clique
 *     fora e por Esc é reimplementado aqui — é o mesmo par de listeners que o
 *     Filters.js mantinha à mão.
 *
 * Devolve um disposer; chame-o no disconnectedCallback (no caminho legado ele
 * remove listeners do document, que sobreviveriam ao elemento).
 */
export function syncOpenState(host, panel, onToggle) {
  if (SUPPORTS_ANCHOR) {
    const onNativeToggle = (event) => onToggle(event.newState === 'open');
    panel.addEventListener('toggle', onNativeToggle);
    return () => panel.removeEventListener('toggle', onNativeToggle);
  }

  const onPointerDown = (event) => {
    // composedPath: o clique pode nascer dentro do shadow root do próprio host.
    if (host.hasAttribute('open') && !event.composedPath().includes(host)) onToggle(false);
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape' && host.hasAttribute('open')) onToggle(false);
  };
  document.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('keydown', onKeyDown);
  };
}

/*
 * Navegação por teclado numa lista de itens.
 *
 * O núcleo cuida do que é igual em menu e listbox — aritmética de índice,
 * pular item desabilitado/escondido, typeahead — e DELEGA como marcar o item
 * ativo, porque os dois padrões divergem justamente aí: menu move o foco de
 * verdade para o item; combobox mantém o foco no input e aponta com
 * aria-activedescendant. Tentar unificar isso dentro do núcleo produziria uma
 * abstração que serve mal aos dois.
 *
 *   getItems()            -> array de itens candidatos, em ordem de DOM
 *   setActive(item, i)    -> marca (foco real ou activedescendant). i === -1 limpa.
 *   onActivate(item)      -> Enter/Space no item ativo
 *   onClose()             -> Esc / Tab
 *   getLabel(item)        -> texto para o typeahead (default: textContent)
 */
export function rovingItems({ getItems, setActive, onActivate, onClose, getLabel }) {
  let index = -1;
  let buffer = '';
  let timer = 0;

  const usable = () => getItems().filter((el) => !el.disabled && !el.hidden);
  const labelOf = getLabel ?? ((el) => (el.textContent ?? '').trim());

  function move(to) {
    const items = usable();
    if (items.length === 0) { index = -1; return; }
    // Envolve nas pontas: é o que um menu nativo faz.
    const next = ((to % items.length) + items.length) % items.length;
    index = next;
    setActive(items[next], next);
  }

  function typeahead(key) {
    clearTimeout(timer);
    buffer += key.toLowerCase();
    timer = setTimeout(() => { buffer = ''; }, 500);

    const items = usable();
    // Começa a busca DEPOIS do item atual, para que teclar a mesma letra
    // repetidamente cicle entre os itens que começam com ela.
    const start = buffer.length === 1 ? index + 1 : index;
    for (let step = 0; step < items.length; step++) {
      const candidate = (start + step + items.length) % items.length;
      if (labelOf(items[candidate]).toLowerCase().startsWith(buffer)) {
        index = candidate;
        setActive(items[candidate], candidate);
        return true;
      }
    }
    return false;
  }

  return {
    get index() { return index; },

    reset() {
      index = -1;
      buffer = '';
      clearTimeout(timer);
      setActive(null, -1);
    },

    first() { move(0); },
    last() { move(usable().length - 1); },

    /* Devolve true se consumiu a tecla — o consumidor decide o preventDefault. */
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowDown': move(index + 1); return true;
        case 'ArrowUp': move(index - 1); return true;
        case 'Home': move(0); return true;
        case 'End': move(usable().length - 1); return true;
        case 'Enter':
        case ' ': {
          const item = usable()[index];
          if (!item) return false;
          onActivate?.(item);
          return true;
        }
        case 'Escape': onClose?.(); return true;
        case 'Tab': onClose?.(); return false;   // não consome: o Tab segue
        default:
          // Só caractere imprimível isolado vira typeahead.
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            return typeahead(event.key);
          }
          return false;
      }
    },
  };
}
