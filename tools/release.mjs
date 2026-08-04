/*
 * release.mjs — fonte única da versão publicada.
 *
 * O PROBLEMA: a versão do kit aparece em 12 lugares de 3 arquivos (URLs do
 * jsDelivr nos snippets de instalação, mais a prosa que explica a tag e o
 * fallback do badge). Nada garantia que os 12 andassem juntos, e o modo de
 * falha é silencioso: um protótipo copiado do README aponta para uma tag que
 * não existe, e ninguém descobre até quebrar na tela. Já aconteceu duas vezes
 * (2dea1c7 trocou @main por @v0.4.1 nos três arquivos; 95bd272 corrigiu um
 * placeholder de org publicado nessas mesmas URLs).
 *
 * A FONTE ÚNICA é a tag git. Este script é o único lugar que sabe QUAIS
 * arquivos carregam a versão, e serve os dois lados:
 *
 *   node tools/release.mjs --check              consistência interna (todo push)
 *   node tools/release.mjs --check --expect vX  docs == tag (push de tag)
 *   node tools/release.mjs 0.4.6                reescreve os 12 lugares
 *
 * POR QUE DUAS ASSERÇÕES E NÃO UMA: um push para main pode legitimamente ter
 * os docs já bumpados para uma tag que ainda não existe. Se a guarda comparasse
 * com a última tag em todo push, quebraria nesse caso normal e você aprenderia
 * a ignorá-la. Então: consistência entre si sempre, igualdade com a tag só no
 * release. A primeira pega o bump parcial (editou o README, esqueceu o AGENTS),
 * que é o erro provável; a segunda pega o release sem bump nenhum.
 *
 * A TERCEIRA ASSERÇÃO é a de arquivos não classificados, e ela varre TRACKED +
 * UNTRACKED (respeitando o .gitignore). Varrer só o índice, como fazia antes,
 * deixava um arquivo NOVO invisível exatamente na hora útil: rodava-se --check
 * antes de commitar, dava OK, e o CI reprovava depois — porque no commit o
 * arquivo passou a ser rastreado e só então contou. Foi assim que a v0.5.0 saiu
 * com CI vermelho. A mensagem dessa asserção aponta arquivo:linha e põe "apague
 * o número" como primeira saída, porque nas primeiras vezes que ela reprovou a
 * citação era prosa em comentário — e classificar o arquivo era a resposta
 * errada.
 *
 * O BUMP IMPRIME o contexto de publicação (última tag, e aviso se os docs
 * estavam numa versão nunca publicada). Não é trava: docs à frente da última tag
 * é estado legítimo entre o commit de bump e o push da tag, como explicado
 * acima. É que bumpar é fácil e publicar não — já aconteceu de os docs andarem
 * 0.5.0 → 0.6.0 → 0.7.0 → 0.8.0 em quatro passos de trabalho com a última tag
 * ainda em v0.4.6, e ninguém ver o acumulado até alguém estranhar o número.
 *
 * E O BUMP REVALIDA o que escreveu, antes de sugerir commit e tag. Antes ele
 * reescrevia e ia embora, deixando os 12 lugares em estado não verificado até o
 * CI conferir — longe do teclado. Agora o bump termina provado.
 *
 * ISTO NÃO REMOVE A DUPLICAÇÃO, torna o drift immergível. Remover de vez exige
 * faixa semver na URL (@0.4 em vez de @v0.4.5, que o jsDelivr resolve para o
 * último patch) — e isso troca imutabilidade por patches automáticos, decisão
 * que é do consumidor do snippet, não deste script.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Arquivos que carregam a versão ATUAL — todos bumpam junto no release.
 *   config-modelo-de-folha.html — demo que consome o CDN, como a auditoria ao
 *     lado dela em demo/prd32/, mas aqui a escolha foi a oposta: acompanha o kit
 *     em vez de ficar pinada. É protótipo em revisão, e revisar contra
 *     componente velho não serve.
 * Caminho de demo entra aqui com a pasta: mover a demo sem corrigir a linha faz
 * a guarda reprovar, porque o arquivo reaparece como citação não classificada.
 */
const ARQUIVOS_VERSIONADOS = [
  'README.md',
  'AGENTS.md',
  'index.html',
  'demo/prd32/config-modelo-de-folha.html',
];

/*
 * Arquivos que citam versões ANTIGAS de propósito e NÃO devem bumpar:
 *   define.js       — "@main + @v0.4.1" ilustra duas cópias na mesma página;
 *   collision.html  — carrega v0.4.0 + v0.4.1 de verdade, para reproduzir a
 *                     colisão de registro. Bumpar aqui destruiria o teste;
 *   release.mjs     — este arquivo. Os comentários acima citam as versões dos
 *                     dois hotfixes como evidência e a mensagem de uso traz
 *                     exemplos; nada disso é estado, é ilustração. Sem esta
 *                     entrada a guarda se auto-reprovaria no primeiro push.
 *   prd32/auditoria-…  — demo que consome o CDN em vez dos caminhos relativos
 *                     (é protótipo para compartilhar solto). Fica pinada na
 *                     @v0.4.1 contra a qual foi construída: decisão tomada ao
 *                     publicar a v0.4.6. Para passar a acompanhar o kit, mova
 *                     esta linha para ARQUIVOS_VERSIONADOS.
 * Ficar nesta lista é uma decisão, não um esquecimento.
 */
const ARQUIVOS_HISTORICOS = [
  'components/define.js',
  'test/collision.html',
  'tools/release.mjs',
  'demo/prd32/auditoria-folha-de-monitoramento.html',
];

/* Casa v0.4.5 tanto em bricks@v0.4.5/... quanto em "Design System · v0.4.5".
   O `v` literal é o que evita casar @mdi/font@7.4.47 e Inter:wght@400. */
const RE_VERSAO = /v(\d+)\.(\d+)\.(\d+)/g;

const ler = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const normalizar = (rel) => rel.split(sep).join('/');

/* Toda ocorrência de versão em um arquivo, com a linha, para mensagens úteis. */
function ocorrencias(rel) {
  const achados = [];
  ler(rel).split('\n').forEach((linha, i) => {
    for (const m of linha.matchAll(RE_VERSAO)) {
      achados.push({ arquivo: rel, linha: i + 1, versao: m[0] });
    }
  });
  return achados;
}

/*
 * Arquivos que citam versão fora das duas listas acima. Existe para que um doc
 * novo não se torne um 13º ponto de drift em silêncio.
 *
 * INCLUI UNTRACKED (--others --exclude-standard), e isso é o ponto todo. Com
 * `git ls-files` puro a guarda só via o índice, então um arquivo NOVO com
 * citação de versão era invisível justamente na hora em que ela importava: você
 * rodava --check antes de commitar, dava OK, e o CI reprovava depois — porque no
 * commit o arquivo passou a ser rastreado e só então contou. Foi assim que a
 * v0.5.0 saiu vermelha (test/panel-clipping.html citava uma versão em
 * comentário). --exclude-standard respeita o .gitignore, então node_modules e
 * afins seguem de fora.
 *
 * Devolve as OCORRÊNCIAS (arquivo, linha, versão), não só os caminhos: a
 * mensagem de erro precisa apontar a linha, senão sobra caçar num arquivo de
 * 300 linhas qual das citações incomodou.
 */
function ocorrenciasNaoClassificadas() {
  const listados = execFileSync(
    'git', ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: RAIZ, encoding: 'utf8' },
  ).split('\n').filter(Boolean).map(normalizar);

  const conhecidos = new Set([...ARQUIVOS_VERSIONADOS, ...ARQUIVOS_HISTORICOS]);
  const achados = [];
  // Set: `--cached --others` pode repetir um caminho em alguns estados do índice.
  for (const rel of new Set(listados)) {
    if (conhecidos.has(rel)) continue;
    if (relative(RAIZ, join(RAIZ, rel)).startsWith('..')) continue;
    try { achados.push(...ocorrencias(rel)); }
    catch { /* binário, ou listado mas ausente do disco */ }
  }
  return achados;
}

function verificar(esperada) {
  const achados = ARQUIVOS_VERSIONADOS.flatMap(ocorrencias);
  const erros = [];

  if (achados.length === 0) {
    erros.push(`nenhuma string de versão encontrada em ${ARQUIVOS_VERSIONADOS.join(', ')} — ` +
               `o regex ou a lista de arquivos ficou obsoleta`);
  }

  /* 1) Consistência interna: as 12 ocorrências têm de ser a MESMA versão. */
  const distintas = [...new Set(achados.map((a) => a.versao))];
  if (distintas.length > 1) {
    erros.push(`bump parcial — ${distintas.length} versões diferentes nos docs: ${distintas.join(', ')}`);
    for (const versao of distintas) {
      const onde = achados.filter((a) => a.versao === versao)
        .map((a) => `${a.arquivo}:${a.linha}`).join(', ');
      erros.push(`  ${versao} em ${onde}`);
    }
  }

  /* 2) Só no release: os docs têm de bater com a tag sendo publicada. */
  if (esperada && distintas.length === 1 && distintas[0] !== esperada) {
    erros.push(`os docs dizem ${distintas[0]} mas a tag publicada é ${esperada} — ` +
               `rode "node tools/release.mjs ${esperada.replace(/^v/, '')}" e comite antes de tagear`);
  }

  /* 3) Nenhum ponto de drift novo e não classificado. */
  const orfaos = ocorrenciasNaoClassificadas();
  if (orfaos.length > 0) {
    const arquivos = [...new Set(orfaos.map((o) => o.arquivo))];
    /* Aponta LINHA e versão de cada citação. Na prática as três primeiras vezes
       que esta guarda reprovou, a citação era prosa em comentário — e as duas
       opções que a mensagem oferecia eram as erradas. Por isso a terceira
       alternativa vem primeiro na lista de saídas. */
    const detalhe = orfaos
      .map((o) => `      ${o.arquivo}:${o.linha}  →  ${o.versao}`)
      .join('\n');
    erros.push(
      `${arquivos.length} arquivo(s) citando versão fora das listas de tools/release.mjs:\n` +
      `${detalhe}\n` +
      `  escolha uma saída para cada citação:\n` +
      `    a) APAGUE o número, se for prosa descrevendo uma mudança ("migrado na\n` +
      `       v0.7.0" etc.) — número em comentário envelhece e vira mentira;\n` +
      `    b) ARQUIVOS_VERSIONADOS, se for uma URL/label que deve bumpar no release;\n` +
      `    c) ARQUIVOS_HISTORICOS, se cita versão antiga de propósito.`);
  }

  if (erros.length > 0) {
    console.error('FALHA na guarda de versão:\n' + erros.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }

  const porArquivo = ARQUIVOS_VERSIONADOS
    .map((f) => `${f} (${achados.filter((a) => a.arquivo === f).length})`).join(', ');
  console.log(`OK — ${achados.length} ocorrências, todas ${distintas[0]}: ${porArquivo}` +
              (esperada ? `; confere com a tag ${esperada}` : ''));
}

/* Tags v* publicadas, da mais nova para a mais antiga. Tolerante: repo sem tags
   ou sem git devolve lista vazia, e o bump segue — isto é informação, não trava. */
function tagsPublicadas() {
  try {
    return execFileSync('git', ['tag', '--list', 'v*', '--sort=-v:refname'],
      { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function reescrever(alvo) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(alvo);
  if (!m) {
    console.error(`versão inválida: "${alvo}" — use MAJOR.MINOR.PATCH (ex.: 0.4.6)`);
    process.exit(1);
  }
  const nova = `v${m[1]}.${m[2]}.${m[3]}`;

  const atuais = [...new Set(ARQUIVOS_VERSIONADOS.flatMap(ocorrencias).map((a) => a.versao))];
  if (atuais.length === 1) {
    const peso = (v) => v.replace(/^v/, '').split('.').map(Number)
      .reduce((acc, n) => acc * 1000 + n, 0);
    if (peso(nova) <= peso(atuais[0])) {
      console.error(`${nova} não é maior que a versão atual ${atuais[0]} — ` +
                    `se o retrocesso é intencional, edite os arquivos à mão`);
      process.exit(1);
    }
  }

  /*
   * Contexto de publicação, ANTES de reescrever. Existe porque bumpar é fácil e
   * publicar não: já aconteceu de os docs andarem 0.5.0 → 0.6.0 → 0.7.0 → 0.8.0
   * em quatro passos de trabalho enquanto a última tag seguia v0.4.6, e ninguém
   * viu o acumulado até alguém estranhar o número. Aqui é informação, não trava:
   * os docs à frente da última tag é estado LEGÍTIMO entre o commit de bump e o
   * push da tag — é por isso que --expect só roda no push de tag.
   */
  const tags = tagsPublicadas();
  const anterior = atuais.length === 1 ? atuais[0] : null;
  console.log(`última tag publicada: ${tags[0] ?? '(nenhuma)'}`);
  if (anterior && !tags.includes(anterior)) {
    console.log(
      `ATENÇÃO: os docs estavam em ${anterior}, que NÃO está publicada.\n` +
      `  Bumpar agora empilha mais uma versão não publicada. Se a ${anterior} não\n` +
      `  vai sair, o número a publicar provavelmente é outro — confira antes de tagear.`);
  }
  console.log('');

  let total = 0;
  for (const rel of ARQUIVOS_VERSIONADOS) {
    const antes = ler(rel);
    let n = 0;
    const depois = antes.replace(RE_VERSAO, () => (n++, nova));
    if (n > 0) writeFileSync(join(RAIZ, rel), depois);
    console.log(`  ${rel}: ${n} ocorrência(s)`);
    total += n;
  }

  /*
   * REVALIDA O QUE ACABOU DE SER ESCRITO, antes de sugerir commit e tag.
   *
   * Antes, o script reescrevia e ia embora: quem bumpava saía com os 12 lugares
   * em estado NÃO verificado, e a validação só chegava depois — no push, pelo
   * CI, longe do teclado. Rodar a mesma asserção aqui fecha essa lacuna e faz o
   * bump terminar provado em vez de presumido.
   *
   * Vem ANTES do "próximos passos" de propósito: se a verificação reprovar,
   * sugerir "git commit && git tag" seria orientação errada. E como verificar()
   * encerra com exit 1, a reescrita já está no disco quando isso acontece — o
   * que é o certo: você precisa ver o estado quebrado para consertar e rodar de
   * novo, não um rollback silencioso.
   */
  console.log('');
  verificar(null);

  console.log(`\n${total} string(s) reescritas para ${nova}. Próximos passos:\n` +
              `  git diff                     # revise\n` +
              `  git commit -am "release: ${nova}"\n` +
              `  git tag ${nova} && git push origin main ${nova}`);
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  const i = args.indexOf('--expect');
  verificar(i === -1 ? null : args[i + 1]);
} else if (args.length === 1 && !args[0].startsWith('-')) {
  reescrever(args[0]);
} else {
  console.error('uso:\n' +
    '  node tools/release.mjs --check                 verifica consistência interna\n' +
    '  node tools/release.mjs --check --expect v0.4.6 verifica também contra a tag\n' +
    '  node tools/release.mjs 0.4.6                   reescreve a versão nos docs');
  process.exit(1);
}
