/*
 * check-syntax.mjs — guarda de sintaxe de todo componente do kit.
 *
 * O PROBLEMA, medido duas vezes no mesmo dia: os componentes montam o shadow DOM
 * com template literal, e os comentários dentro do CSS citam nomes de
 * propriedade. Escrever um desses nomes entre backticks ENCERRA a string, e o
 * arquivo vira SyntaxError. Aconteceu com `gap` no Dropdown.js e com `pt-4` no
 * Modal.js.
 *
 * POR QUE O MODO DE FALHA É CRUEL: o erro não aparece como "erro de sintaxe" para
 * quem está olhando a página. A exceção aborta a avaliação do módulo, nenhuma tag
 * se registra, e o sintoma na tela é "as tags <me-*> viraram texto cru" — que o
 * AGENTS.md ensina a diagnosticar como 404, cópia duplicada ou tag
 * self-closing. Ou seja: o sintoma aponta para três causas erradas antes da
 * certa. Um comentário avisando não resolveu (errei de novo depois de escrever
 * um); uma guarda resolve.
 *
 * COMO: importa cada arquivo de components/. Em Node não existe `document`,
 * então TODO componente falha com ReferenceError ao ser avaliado — e isso é
 * APROVAÇÃO, porque significa que o arquivo foi parseado inteiro antes de rodar.
 * Só SyntaxError reprova.
 *
 *   node tools/check-syntax.mjs
 */
import { readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTES = join(RAIZ, 'components');

function listarJs(dir) {
  const saida = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...listarJs(caminho));
    else if (entrada.name.endsWith('.js')) saida.push(caminho);
  }
  return saida;
}

const arquivos = listarJs(COMPONENTES).sort();
const falhas = [];

for (const arquivo of arquivos) {
  const nome = relative(RAIZ, arquivo).split('\\').join('/');
  try {
    await import(pathToFileURL(arquivo).href);
  } catch (erro) {
    // ReferenceError (document/window/CSS ausentes em Node) = parseou, aprovado.
    if (erro instanceof SyntaxError) {
      falhas.push({ nome, mensagem: erro.message });
      continue;
    }
  }
}

if (falhas.length > 0) {
  console.error('FALHA de sintaxe:\n');
  for (const f of falhas) {
    console.error(`::error file=${f.nome}::SyntaxError: ${f.mensagem}`);
    console.error(`  ${f.nome}: ${f.mensagem}`);
  }
  console.error(
    '\nCausa provável: backtick dentro de um template literal (ex.: um nome de\n' +
    'propriedade CSS citado entre backticks num comentário do <style>). Isso\n' +
    'encerra a string e derruba o módulo inteiro — e o sintoma na página é\n' +
    '"as tags <me-*> viraram texto cru", que não parece erro de sintaxe.'
  );
  process.exit(1);
}

console.log(`OK — ${arquivos.length} arquivo(s) de components/ sem erro de sintaxe.`);
