# me-bricks — Guia para agentes de IA

Este guia ensina a **consumir** a biblioteca me-bricks ao gerar protótipos do app
Minha Escala. Leia antes de escrever qualquer HTML de protótipo.

## Setup obrigatório de toda página

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protótipo — Minha Escala</title>
  <link rel="stylesheet" href="./tokens.css" />
  <script type="module" src="./components/index.js"></script>
</head>
```

Ajuste os caminhos relativos conforme a pasta da página (ex.: `../tokens.css` dentro de `demo/`).
A página precisa ser servida via HTTP (`npx serve .`) — ES modules não funcionam em `file://`.

**Os caminhos relativos só valem para páginas dentro deste repositório.** Protótipos que vão
rodar em qualquer outro lugar (editor de HTML online, CodePen, um HTML solto, outro projeto)
precisam das URLs absolutas do CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/bricks@v0.5.1/tokens.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/bricks@v0.5.1/components/index.js"></script>
```

Use sempre a tag de versão (`@v0.5.1`), nunca `@main` — a tag é imutável e não fica presa ao
cache de branch do CDN.

**Nunca edite a versão à mão.** Ela vive em 12 lugares (`README.md`, este arquivo e
`index.html`); `node tools/release.mjs <versão>` reescreve os 12 e o CI recusa docs em desacordo
entre si ou com a tag publicada. Ver o cabeçalho de `tools/release.mjs`.

**Carregue o kit UMA vez por página.** Duas URLs diferentes (`@main` + `@v0.5.1`, ou o
`index.js` mais um componente avulso como `Sidebar.js`) são dois grafos de módulo distintos e
ambos tentam registrar as mesmas tags. A primeira cópia avaliada vence e a segunda emite um
aviso `[me-bricks]` no console — as tags seguem funcionando, mas com a definição da primeira,
que pode não ser a versão declarada no `<head>`.

Se as tags `<me-*>` renderizarem como texto cru sem estilo, verifique nesta ordem:

1. **O `index.js` não carregou** — 404 no caminho relativo, CSP do editor. Sem ele, nenhum
   componente se registra. Confira a aba Network.
2. **Duas cópias do kit** — procure o aviso `[me-bricks]` no console e remova a duplicada.
3. **Tag `<me-*>` self-closing** (`<me-icon />`) — o parser HTML engole o resto do markup.

Estilo base recomendado para o `<body>` (sempre com fallback nos `var()`: sem o `tokens.css`,
`font-family: var(--me-font-family)` sozinho é inválido e o texto cai em Times New Roman):

```css
body {
  margin: 0;
  font-family: var(--me-font-family, 'Inter', system-ui, -apple-system, sans-serif);
  color: var(--me-color-text, #16161D);
  background: var(--me-color-page, #FAFAFA);
  letter-spacing: var(--me-letter-spacing, 0.5px);
}
```

## Regras de ouro

1. **Nunca reestilize os componentes por dentro** — use os atributos (`variant`, `appearance`,
   `size`) e, se precisar, tokens `--me-*` ou `::part()`.
2. **Ícones sempre por slot**: `<me-icon slot="start" name="...">`. Nomes do catálogo MDI
   (https://pictogrammers.com/library/mdi/). Nunca coloque `<i class="mdi">` direto.
3. **Tags custom nunca são self-closing**: `<me-icon name="x"></me-icon>`, jamais `<me-icon />`.
4. Textos de UI em **pt-BR**.
5. Botões seguem o mapeamento do app: primário = default, secundário = `appearance="outlined"`,
   terciário = `appearance="plain"`, destrutivo = `variant="danger" appearance="outlined"`.

## Receitas copy-paste

### Botões
```html
<me-button>Confirmar</me-button>
<me-button appearance="outlined">Cancelar</me-button>
<me-button appearance="plain">Ver mais</me-button>
<me-button variant="danger" appearance="outlined">Excluir</me-button>
<me-button size="small"><me-icon slot="start" name="plus"></me-icon>Nova regra</me-button>
<me-button type="submit">Enviar</me-button>
<me-button href="/detalhes" appearance="plain">Como link</me-button>
```

### Campo de texto / data / hora
```html
<me-input label="Nome do médico" name="nome" required placeholder="Digite o nome"></me-input>
<me-input label="Data" type="date" name="data">
  <me-icon slot="start" name="calendar"></me-icon>
</me-input>
<me-input label="Hora" type="time" name="hora" size="small">
  <me-icon slot="start" name="clock-outline"></me-icon>
</me-input>
<!-- A label flutua (placeholder que sobe ao focar/preencher). Estado de erro: -->
<me-input label="E-mail" type="email" error error-message="E-mail inválido"></me-input>
```

### Switch
```html
<me-switch name="noturno" checked>Aceito plantão noturno</me-switch>
<me-switch size="small">Compacto</me-switch>
<me-switch disabled checked>Desabilitado</me-switch>
<me-switch loading>Carregando (aria-busy, bloqueia interação)</me-switch>
```

### Checkbox (simples e grupo com título)
```html
<me-checkbox name="unidades" value="central" checked>Hospital Central</me-checkbox>

<me-checkbox-select heading="Turnos de interesse"
  description="Selecione os turnos em que você pode assumir plantões.">
  <me-checkbox name="turnos" value="diurno" checked>Diurno</me-checkbox>
  <me-checkbox name="turnos" value="noturno">Noturno</me-checkbox>
</me-checkbox-select>
```

### Radio (simples e em cards)
```html
<me-radio-group name="turno" value="diurno" label="Turno">
  <me-radio value="diurno">Diurno</me-radio>
  <me-radio value="noturno">Noturno</me-radio>
</me-radio-group>

<me-radio-group name="regra" value="limite" orientation="horizontal" label="Regras">
  <me-radio value="limite" appearance="card">
    Proporcional com limite
    <span slot="description">Desconto por atraso, sem pagamento adicional.</span>
  </me-radio>
  <me-radio value="integral" appearance="card">
    Integral
    <span slot="description">Pagamento integral da vaga.</span>
  </me-radio>
</me-radio-group>
```

### Badges de status de plantão
```html
<me-badge variant="success">Extra</me-badge>
<me-badge variant="danger">Cobertura</me-badge>
<me-badge>Fixo</me-badge>
<me-badge variant="warning">Aberta</me-badge>       <!-- laranja -->
<me-badge variant="yellow">Aguardando</me-badge>  <!-- amarelo -->
<me-badge variant="blue">Em progresso</me-badge>  <!-- sinônimo de brand = o default -->
<me-badge variant="neutral">Externo</me-badge>    <!-- cinza -->
```

### Filtros (pílula com dropdown + tags de filtro ativo)
Espelham `SelectFilter.vue` e `ActiveFilters.vue`. As opções são `me-option`
filhas (light DOM). `multiple` mantém o dropdown aberto e mostra badge de
contagem; `searchable` adiciona campo de busca; `disabled` desativa a pílula.
```html
<me-select-filter label="Status" multiple>
  <me-icon slot="start" name="format-list-checks"></me-icon>
  <me-option value="PENDING_AUDIT" selected>Aguardando Auditoria</me-option>
  <me-option value="APPROVED">Aprovado</me-option>
</me-select-filter>

<me-select-filter label="Unidades" multiple searchable>
  <me-icon slot="start" name="office-building-outline"></me-icon>
  <me-option value="1">Hospital São Lucas</me-option>
  <me-option value="2">Hospital Santa Casa</me-option>
</me-select-filter>

<!-- Tag de filtro ativo (removível). O × emite me-remove. -->
<me-filter-tag value="PENDING_AUDIT">Aguardando Auditoria</me-filter-tag>
```
`me-select-filter.value` (leitura) devolve o array de values selecionados.
Abre/fecha sozinho (clique fora, Esc) e **só um filtro fica aberto por vez** —
abrir um fecha os outros, sem código nenhum. O painel abre no top layer, então
não é recortado por contêiner com `overflow` (card, modal, área que rola) e vira
para cima se faltar espaço embaixo. Setas, Home/End e Enter navegam as opções.

### Campo de seleção (autocomplete com chips)
Espelha o `SubjectsAutocomplete.vue`. É **campo de formulário**: tem valor, entra
no `FormData`, valida. A seleção inicial se declara com `selected` na opção (não
existe atributo `value`). Com `multiple`, os escolhidos viram chips removíveis e
o `FormData` recebe uma entrada por chip, todas com o mesmo `name`.
```html
<me-select label="Adicionar Participantes ou Grupos" name="participantes"
           multiple searchable clearable clear-on-select
           empty-text="Nenhum usuário encontrado">
  <me-select-option value="1">
    <me-icon slot="icon" name="account"></me-icon>
    Dra. Ana Souza
    <span slot="description">Médica · CRM 12345</span>
  </me-select-option>
  <me-select-option value="2">
    <me-icon slot="icon" name="account-group"></me-icon>
    Equipe Cardiologia
    <span slot="description">Grupo · 8 membros</span>
  </me-select-option>
</me-select>

<!-- Seleção única: sem chips, o rótulo escolhido vira o texto do campo -->
<me-select label="Permissão" name="permissao">
  <me-select-option value="reader" selected>Leitor básico</me-select-option>
  <me-select-option value="editor">Editor básico</me-select-option>
</me-select>

<!-- Estados -->
<me-select label="Buscando" loading searchable></me-select>
<me-select label="Unidades" multiple max-tags="2"></me-select>  <!-- excedente vira "+n" -->
<me-select label="Participantes" required error error-message="Selecione ao menos um"></me-select>
```
`.value` devolve string (seleção única) ou array (`multiple`). Busca no servidor:
use `filter="manual"`, ouça `me-search` (`detail.term`) e troque as opções —
nesse modo o componente não filtra sozinho.

### Menu de ações (três pontinhos, menu de linha)
Para **disparar comandos**, não para capturar valor — se o usuário escolhe algo
que precisa ir num `<form>`, o componente é outro (filtro: `me-select-filter`).
O que abre o menu vai no slot `trigger`. O painel abre no top layer, então não é
recortado por contêiner com `overflow` e vira para cima se faltar espaço.
```html
<me-dropdown>
  <me-button slot="trigger" appearance="plain">
    <me-icon name="dots-vertical"></me-icon>
  </me-button>
  <me-dropdown-item value="editar">
    <me-icon slot="icon" name="pencil"></me-icon>
    Editar
    <span slot="details">Ctrl+E</span>
  </me-dropdown-item>
  <me-dropdown-item value="duplicar">
    Duplicar
    <span slot="description">Cria uma cópia nesta mesma escala</span>
  </me-dropdown-item>
  <me-dropdown-item value="arquivadas" type="checkbox">Mostrar arquivadas</me-dropdown-item>
  <me-dropdown-item value="excluir" variant="danger">
    <me-icon slot="icon" name="delete-outline"></me-icon>
    Excluir
  </me-dropdown-item>
</me-dropdown>
<script>
  document.querySelector('me-dropdown').addEventListener('me-select', (e) => {
    console.log(e.detail.value);
    // e.preventDefault() mantém o menu aberto (útil em item type="checkbox")
  });
</script>
```
`placement` aceita `bottom-start` (default), `bottom-end`, `top-start`, `top-end`;
`distance` é o respiro em px. Só um menu fica aberto por vez na página — abrir um
fecha os outros, sem código nenhum.

### Paginação
Funcionamento inspirado na TOAST UI Pagination (JS puro), janela com reticências
igual ao `v-pagination` e aparência teal do app. Total via `total-pages` ou
`total-items`+`items-per-page`. Auto-gerencia o estado; navegar emite `change`.
```html
<me-pagination total-pages="20" page="1" visible-pages="5"></me-pagination>
<me-pagination total-items="95" items-per-page="10"></me-pagination>
<me-pagination total-pages="20" page="10" first-last></me-pagination>
```
Métodos: `movePageTo(n)`, `reset(totalItems?)`, `setItemsPerPage(n)`,
`setTotalItems(n)`, `getCurrentPage()`, `getTotalPages()`. O evento
`me-before-move` é cancelável (`preventDefault()` impede a troca).

### Card (e dialog de confirmação)
```html
<me-card closable>
  <span slot="header">Detalhes do plantão</span>
  Conteúdo…
  <div slot="footer" style="display:flex; gap:16px; width:100%;">
    <me-button style="flex:1">Candidatar-se</me-button>
    <me-button style="flex:1" appearance="outlined">Fechar</me-button>
  </div>
</me-card>

<!-- ATENÇÃO: para dialog/modal use o <me-modal> (receita abaixo), não um card
     centrado. Este bloco só serve para um card estático de destaque. -->
<me-card style="max-width:520px; text-align:center;">
  <strong>Excluir Cartão?</strong><br />
  Tem certeza que deseja excluir esse card?
  <div slot="footer" style="display:flex; gap:16px; width:100%;">
    <me-button style="flex:1">Cancelar</me-button>
    <me-button style="flex:1" variant="danger" appearance="outlined">Confirmar</me-button>
  </div>
</me-card>
```

### Modal / dialog
Espelha o `Modal.vue` do app, sobre o `<dialog>` nativo. Abre no **top layer**,
então dropdowns e campos de dentro dele flutuam por cima sem escada de
`z-index` — e ganha focus trap, `inert` no resto da página e Esc de graça.
Começa fechado; abre por `show()` ou pelo atributo `open`.
```html
<me-button onclick="document.getElementById('m').show()">Editar</me-button>

<me-modal id="m" label="Editar plantão" header-border footer-border>
  <span slot="header">Editar plantão</span>
  <me-input label="Nome do médico" name="nome"></me-input>
  <div slot="footer" style="display:flex; gap:16px; justify-content:flex-end;">
    <me-button appearance="outlined" onclick="document.getElementById('m').hide()">Cancelar</me-button>
    <me-button>Confirmar</me-button>
  </div>
</me-modal>

<!-- Confirmação destrutiva: compacto, botões full-width -->
<me-modal id="del" label="Excluir cartão" size="small" header-border footer-border>
  <span slot="header">Excluir cartão?</span>
  Tem certeza que deseja excluir esse card?
  <div slot="footer" style="display:flex; gap:16px;">
    <me-button style="flex:1" appearance="outlined"
               onclick="document.getElementById('del').hide()">Cancelar</me-button>
    <me-button style="flex:1" variant="danger" appearance="outlined">Confirmar</me-button>
  </div>
</me-modal>
```
`size`: `small` (448px), default (896px), `large` (80vw) — ou
`--me-modal-width` para um valor próprio. Outros atributos: `without-header`,
`without-close-button`, `no-body-padding`, `header-border`, `footer-border`,
`max-height` (default 90vh), `min-height`.

Fecha pelo × , pelo clique no overlay e por Esc — **todos** passam pelo evento
`me-close`, que é cancelável e diz a origem em `detail.source`
(`close-button` | `overlay` | `escape` | `api`). Para proteger um formulário:
```html
<script>
  document.getElementById('m').addEventListener('me-close', (e) => {
    if (e.detail.source !== 'close-button' && temAlteracao) e.preventDefault();
  });
</script>
```
O corpo é quem rola (o header e o footer ficam parados), e a rolagem da página
fica travada enquanto há modal aberto. Para escolher o foco inicial, ponha
`autofocus` no elemento desejado.

### Shell de aplicação (sidebar + header)
Sidebar e header ficam **fixos**; só o conteúdo rola. Para isso o `body` não
rola (`height:100vh; overflow:hidden`) e a rolagem fica na área de conteúdo
(`overflow-y:auto`) — evite `position:sticky` + scroll no documento, que deixa
a sidebar escapar ao rolar.
```html
<body style="display:flex; margin:0; height:100vh; overflow:hidden;">
  <!-- Menu por perfil vem de components/sidebar-presets.js (não se declaram
       itens aqui). Escolha o preset e o item ativo pela key. -->
  <me-sidebar expanded id="nav" preset="gestor" active-item="dashboard" style="flex:none; height:100vh;"></me-sidebar>
  <main style="flex:1; min-width:0; display:flex; flex-direction:column; height:100vh; overflow:hidden;">
    <!-- me-page-header já é uma barra branca com padding próprio (16px/32px):
         deixe-o full-bleed e fixo no topo (flex:none) e role só o conteúdo.
         O atributo "menu" mostra o botão de abrir a sidebar em telas < 800px. -->
    <me-page-header id="hdr" menu menu-open heading="Dashboard" subheading="Visão geral" style="flex:none;">
      <span slot="end" style="display:flex; align-items:center; gap:16px;">
        <me-icon name="bell-outline" label="Notificações"></me-icon>
        <me-icon name="account-circle" label="Perfil" style="font-size:36px; color:var(--me-color-brand);"></me-icon>
      </span>
    </me-page-header>
    <div style="flex:1; overflow-y:auto; padding:24px 32px;">
      <!-- conteúdo (rola aqui) -->
    </div>
  </main>
  <script type="module">
    // Liga o botão mobile do header à sidebar (< 800px).
    const nav = document.getElementById('nav'), hdr = document.getElementById('hdr');
    hdr.addEventListener('me-menu', (e) => { nav.expanded = hdr.menuOpen = e.detail.open; });
    nav.addEventListener('me-toggle', (e) => { hdr.menuOpen = e.detail.expanded; });
  </script>
</body>
```

**Presets de menu (dentro do componente)**: os menus por perfil ficam em
`components/sidebar-presets.js` (fonte única de verdade). O consumidor não
declara itens — só escolhe o `preset` (ex.: `gestor`, `medico`) e o item ativo
via `active-item` (a `key` do item). A seleção do preset é do consumidor (o
componente não renderiza seletor) e pode ser persistida em `localStorage` via
`persist-key`. Trocar emite `me-preset-change` (`{ name }`). Para adicionar ou
editar um menu, edite `sidebar-presets.js`. **Sem** `preset`, você ainda pode
declarar `<me-sidebar-item>` à mão para um menu custom (ver rotas por hash abaixo).

### Logo
```html
<me-logo style="height:48px"></me-logo>                <!-- horizontal (default) -->
<me-logo variant="stacked" style="height:64px"></me-logo> <!-- empilhado (alias: full) -->
<me-logo variant="symbol" style="height:42px"></me-logo>  <!-- só o glifo (alias: small) -->
<me-logo variant="monotone" style="color:#CB2957"></me-logo>
<!-- Fundo escuro (telas de login): wordmark branco -->
<me-logo variant="stacked-white" style="height:64px"></me-logo>
```

### Múltiplas páginas num só arquivo (rotas por hash)
Protótipos com navegação usam `<me-pages>`: cada `<me-page name="...">` é uma rota
`#/nome`. Links são `<a href="#/nome">` — funciona com deep-link e voltar/avançar.

```html
<me-sidebar expanded id="nav">
  <me-sidebar-item href="#/inicio" data-page="inicio" active>
    <me-icon slot="start" name="monitor"></me-icon>Início
  </me-sidebar-item>
  <me-sidebar-item href="#/escalas" data-page="escalas">
    <me-icon slot="start" name="calendar-edit"></me-icon>Escalas
  </me-sidebar-item>
</me-sidebar>

<main>
  <me-pages default="inicio" id="router">
    <me-page name="inicio"><!-- conteúdo --></me-page>
    <me-page name="escalas"><!-- conteúdo --></me-page>
  </me-pages>
</main>

<script>
  // Sincroniza o item ativo da sidebar com a rota atual
  document.getElementById('router').addEventListener('change', (e) => {
    for (const item of document.querySelectorAll('me-sidebar-item[data-page]')) {
      item.toggleAttribute('active', item.dataset.page === e.detail.page);
    }
  });
</script>
```

### Formulário completo
Os controles são form-associated: basta um `<form>` nativo.

```html
<form id="f">
  <me-input label="Nome" name="nome" required></me-input>
  <me-switch name="noturno">Plantão noturno</me-switch>
  <me-button type="submit">Enviar</me-button>
</form>
<script>
  document.getElementById('f').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(Object.fromEntries(new FormData(e.target)));
  });
</script>
```

## Eventos

| Evento | Origem | detail |
| --- | --- | --- |
| `input` / `change` | `me-input` | `{ value }` |
| `change` | `me-switch` | `{ checked }` |
| `change` | `me-checkbox` | `{ checked, value }` |
| `change` | `me-checkbox-select` | `{ value: [marcados] }` |
| `change` | `me-radio-group` | `{ value }` |
| `me-toggle` | `me-sidebar` | `{ expanded }` |
| `me-preset-change` | `me-sidebar` (ao trocar de preset via `preset`/API) | `{ name }` |
| `me-menu` | `me-page-header` (botão mobile, atributo `menu`) | `{ open }` |
| `change` | `me-pages` (ao trocar de rota) | `{ page }` |
| `me-close` | `me-card` (cancelável; sem `preventDefault` o card se esconde) | — |
| `me-select` | `me-select-filter` (opção alternada) | `{ value, selected }` |
| `change` | `me-select-filter` (lista completa após alternar) | `{ value: [values] }` |
| `me-toggle` | `me-select-filter` (dropdown abre/fecha) | `{ open }` |
| `me-remove` | `me-filter-tag` (clique no ×) | `{ value }` |
| `me-select` | `me-dropdown` (item acionado; cancelável — `preventDefault()` mantém aberto) | `{ value, item }` |
| `input` / `change` | `me-select` (a cada mudança de seleção) | `{ value }` (string ou array) |
| `me-select` | `me-select` (opção alternada) | `{ value, selected }` |
| `me-search` | `me-select` com `filter="manual"` (texto digitado) | `{ term }` |
| `me-clear` | `me-select` (botão de limpar) | — |
| `me-toggle` | `me-select` (painel abre/fecha) | `{ open }` |
| `me-close` | `me-modal` (× / overlay / Esc / `hide()`; **cancelável**) | `{ source }` |
| `me-after-close` | `me-modal` (depois de fechar) | — |
| `me-toggle` | `me-dropdown` (menu abre/fecha, inclusive por clique fora) | `{ open }` |
| `me-before-move` | `me-pagination` (antes de trocar de página; cancelável) | `{ page }` |
| `change` | `me-pagination` (após trocar de página) | `{ page }` |

## Tokens mais usados

| Token | Valor | Uso |
| --- | --- | --- |
| `--me-color-brand` | `#2F7F91` | Teal da marca (botões, item ativo) |
| `--me-color-brand-soft` | `#D8EEF3` | Fundos tintados |
| `--me-color-text` | `#16161D` | Texto padrão |
| `--me-color-text-muted` | `#68688D` | Texto secundário |
| `--me-color-tertiary-30` | `#CB2957` | Rosa (toggle da sidebar) |
| `--me-color-negative-50` | `#DA1E28` | Ações destrutivas |
| `--me-color-page` | `#FAFAFA` | Fundo de página |
| `--me-radius-l` | `8px` | Cards |
| `--me-shadow-card` | sombra sutil | Cards/sidebar |
