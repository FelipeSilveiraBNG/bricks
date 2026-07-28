/*
 * define() — registro de custom element tolerante a colisão de nome.
 *
 * O PROBLEMA: customElements.define lança NotSupportedError quando a tag já
 * existe. Como a chamada fica no topo do módulo, a exceção aborta a avaliação
 * do módulo — e, em cascata, dos imports seguintes de quem o importou. Duas
 * cópias do kit na mesma página (URLs diferentes: @main + @v0.4.1, ou um
 * componente avulso + o index.js) são grafos de módulo distintos, porque o
 * module map é indexado por URL resolvida. Resultado medido antes desta guarda:
 * uma colisão em Sidebar.js derrubava Pages, Tabs, Filters e Pagination junto —
 * 14 das 23 tags registradas, o resto renderizando como texto cru.
 *
 * A POLÍTICA: first-wins. Isso não é uma escolha — o CustomElementRegistry é
 * append-only, não existe redefinir uma tag. A primeira cópia avaliada vence;
 * as seguintes são ignoradas com aviso e nunca lançam.
 *
 * ISTO É CONTENÇÃO DE DANO, NÃO CURA: com duas cópias na página, as tags
 * seguem usando a definição da primeira, então a versão que o consumidor
 * declarou no <head> pode não ser a que está rodando. O aviso existe para que
 * isso seja diagnosticável em vez de silencioso. A cura é carregar uma cópia só.
 */

// Estado de escopo de módulo — ou seja, POR CÓPIA do kit. Cada cópia duplicada
// emite exatamente um aviso agregado, em vez de um por tag.
const collided = [];
let scheduled = false;

export function define(tag, ctor) {
  const existing = customElements.get(tag);
  if (existing) {
    // existing === ctor só ocorreria chamando define() duas vezes no mesmo
    // módulo; colisão real tem construtor diferente = outra cópia do kit.
    if (existing !== ctor) {
      collided.push(tag);
      if (!scheduled) {
        scheduled = true;
        // O grafo de módulos avalia num único job, então o microtask agrega
        // todas as colisões da cópia num aviso só.
        queueMicrotask(report);
      }
    }
    return false;
  }
  customElements.define(tag, ctor);
  return true;
}

function report() {
  console.warn(
    `[me-bricks] ${collided.length} tag(s) já estavam registradas e foram ignoradas: ` +
    `${collided.join(', ')}.\n` +
    `Há mais de uma cópia do me-bricks nesta página (URLs ou versões diferentes). ` +
    `Mantenha um único <script type="module"> do kit — as tags acima seguem usando ` +
    `a definição da cópia que carregou primeiro.`
  );
  collided.length = 0;
  scheduled = false;
}
