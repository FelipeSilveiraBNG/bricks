# me-bricks

Kit de web components para construção de **protótipos** do aplicativo **Minha Escala**.
JavaScript puro (Custom Elements + Shadow DOM), **sem TypeScript e sem build** — é abrir e usar.

Os componentes espelham o visual do app (UI Kit Minha Escala no Figma) e a API segue as
convenções do [Web Awesome](https://webawesome.com) e da biblioteca irmã bng-components.

> ⚠️ Kit para protótipos, não para produção.

## Começando

ES modules não carregam via `file://` — sirva a pasta com um servidor estático:

```bash
npx serve .
# ou
python -m http.server
```

Depois abra:

- `index.html` — **showcase**: todos os componentes, variantes e snippets de código.
  A rota `#/demos` lista todas as demos abaixo em cards; ao criar uma nova demo,
  acrescente o card lá (site estático não lista diretório).
- `demo/app-shell.html` — página completa composta (sidebar + header + cards + form).
- `demo/pages.html` — mini-app com rotas por hash (`me-pages` + sidebar sincronizada).
- `demo/registro-plantao.html` — tela de aprovações: filtros, tabela e ações em massa.
- `demo/PRD32-auditoria-folha-de-monitoramento.html` — jornada J1 da auditoria de folha.
  Único demo que carrega o kit pelo CDN, para abrir solto fora do repo — fica pinado na
  tag contra a qual foi construído (ver `ARQUIVOS_HISTORICOS` em `tools/release.mjs`).

## Usando num protótipo

Duas tags no `<head>` e pronto. Dentro deste repositório, por caminho relativo:

```html
<link rel="stylesheet" href="./tokens.css" />
<script type="module" src="./components/index.js"></script>
```

Fora dele (editor de HTML online, CodePen, outro projeto), pelo CDN — caminho relativo daria 404
e nenhuma tag `<me-*>` se registraria:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/bricks@v0.5.1/tokens.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/bricks@v0.5.1/components/index.js"></script>
```

A URL usa a tag de versão (`@v0.5.1`) — imutável e livre do cache de branch do CDN. Ao publicar
uma tag nova **não edite este número à mão**: rode `node tools/release.mjs <versão>`, que reescreve
de uma vez as 12 ocorrências espalhadas por este arquivo, pelo `AGENTS.md` e pelo `index.html`.
O CI recusa docs que discordem entre si ou da tag publicada.

> **Uma cópia por página.** Duas URLs diferentes do kit (`@main` + `@v0.5.1`, ou o `index.js`
> mais um componente avulso) são dois grafos de módulo: ambos tentam registrar as mesmas tags.
> A primeira cópia avaliada vence — o registro de custom elements não permite substituir uma
> tag já definida — e a segunda apenas avisa no console. Se um protótipo se comportar como uma
> versão que não é a declarada no `<head>`, procure o aviso `[me-bricks]` no console.

O `tokens.css` já importa a fonte **Inter** e a webfont de ícones **Material Design Icons** (CDN).
No `<body>` do seu protótipo, use fallback nos tokens de tipografia — `font-family: var(--me-font-family)`
sem fallback vira Times New Roman se o `tokens.css` não carregar:

```css
body { font-family: var(--me-font-family, 'Inter', system-ui, sans-serif); }
```

```html
<me-button>Confirmar</me-button>
<me-button appearance="outlined">Cancelar</me-button>
<me-badge variant="success">Extra</me-badge>
```

## Componentes

| Tag | Descrição |
| --- | --- |
| `<me-button>` | Botão. Primário (filled, default), secundário (`appearance="outlined"`), terciário (`appearance="plain"`); variantes `danger`/`success`/`warning`/`neutral`; `size`, `disabled`, `type="submit"`, `href` |
| `<me-input>` | Campo de texto com label notched e asterisco de obrigatório; tipos text/email/password/number/date/time; slots `start`/`end` para ícones; participa de `<form>` |
| `<me-switch>` | Toggle espelhado do app (anel branco + track teal); estados `disabled` e `loading`; semântica de checkbox no submit |
| `<me-checkbox>` + `<me-checkbox-select>` | Checkbox 18px do app (check FontAwesome sobre teal) e grupo em card com título/descrição; múltiplas entradas no `FormData` com o mesmo `name` |
| `<me-radio-group>` + `<me-radio>` | Seleção única com navegação por setas; `appearance="card"` para cards selecionáveis |
| `<me-badge>` | labelBadge de status: Extra=`success`, Cobertura=`danger`, Fixo=`brand`, Aberta=`warning`; `size="small|medium"`. `brand` e `blue` são sinônimos e são o default |
| `<me-card>` | Cartão com slots `header`/`footer` colapsáveis e `closable` (evento `me-close`) |
| `<me-dropdown>` + `<me-dropdown-item>` | Menu de ações (três pontinhos, menu de linha de tabela). Trigger por slot; itens com `value`, `type="checkbox"`, `variant="danger"`, slots `icon`/`description`/`details`; teclado completo (setas, Home/End, typeahead). O painel abre no top layer e vira para cima quando falta espaço. **Não é campo** — não tem valor nem entra em `<form>` |
| `<me-select>` + `<me-select-option>` | Campo de seleção espelhado do `SubjectsAutocomplete` do app: campo outlined com label flutuante, `multiple` com chips removíveis, `searchable` (filtro local ou `filter="manual"` para busca no servidor via `me-search`), `clearable`, `loading`, `max-tags`, `empty-text`; opções com slots `icon`/`description`. Form-associated — com `multiple` entra no `FormData` com entradas repetidas do mesmo `name` |
| `<me-modal>` | Modal espelhado do `Modal.vue` do app, sobre o `<dialog>` nativo: top layer (dropdowns de dentro flutuam por cima sem `z-index`), focus trap, `inert` e Esc nativos, trava a rolagem da página. Slots `header`/`footer`/`header-actions`; `size="small\|medium\|large"`; `without-header`, `header-border`, `footer-border`, `no-body-padding`. Fechar é sempre cancelável via `me-close`, com a origem em `detail.source` |
| `<me-page-header>` | Header de página: título + subtítulo + slot `end` (sino, avatar) |
| `<me-sidebar>` + `<me-sidebar-item>` (+ `<me-sidebar-preset>`) | Menu lateral espelhado do app: 64px/288px, toggle rosa 24px (evento `me-toggle`), item ativo teal semibold; sem "Sair" (como no app — slot `footer` disponível para casos especiais). Presets de menu via `<me-sidebar-preset>` + atributo `preset`, com persistência opcional em `localStorage` (`persist-key`, evento `me-preset-change`) |
| `<me-logo>` | Logotipo em SVG embutido: `variant="horizontal|stacked|variant|symbol|monotone"` (`variant` = lockup da sidebar do app) |
| `<me-icon>` | Ícone MDI (`name` do catálogo [pictogrammers.com/library/mdi](https://pictogrammers.com/library/mdi/)) |

## Utilitários

| Tag | Descrição |
| --- | --- |
| `<me-pages>` + `<me-page>` | Controle de renderização de páginas por hash (`#/rota`): deep-link e voltar/avançar nativos, evento `change`, rota refletida em `me-pages[page]`. Demo em `demo/pages.html` |

## Convenções

- **Prefixo `me-`** em todas as tags e nos eventos custom (`me-toggle`, `me-close`).
  Eventos com equivalente nativo mantêm o nome nativo (`input`, `change`, `click`) e
  são re-emitidos com `detail.value` cruzando o shadow DOM.
- **Eixos compartilhados**: `variant` (cor semântica), `appearance` (filled/outlined/plain), `size` (small/medium/large).
- **Ícones sempre via slot**: `<me-icon slot="start" name="plus">` — o `me-icon` renderiza em
  light DOM para a webfont MDI se aplicar.
- **Formulários**: `me-input`, `me-switch`, `me-radio-group` e `me-select` são form-associated
  (ElementInternals) — entram no `FormData` de um `<form>` comum, respondem a `reset` e
  `type="submit"` do `me-button` dispara o submit.

## Customização

**Tokens** (`tokens.css`, prefixo `--me-*`) são a única fonte de verdade de cor/tipografia/forma.
Os componentes consomem **aliases semânticos**, nunca a escala crua (`--me-color-primary-30`) —
é isso que faz um override chegar a todas as superfícies.

Para re-tematizar, sobrescreva o **grupo de marca** no `<head>` do seu HTML, depois do `tokens.css`:

```html
<style>
  :root {
    --me-color-brand:       #CB2957;  /* canônica: item ativo, marcado, foco */
    --me-color-brand-light: #E37796;  /* botão primário em repouso, foco do input */
    --me-color-brand-dark:  #A12145;  /* subtítulo do header */
    --me-color-brand-soft:  #FBE3EA;  /* fundos tintados */
  }
</style>
```

São quatro tokens e não um porque o app usa dois teais distintos como marca (o botão primário é
mais claro que o item ativo da sidebar), e os defaults do kit são os passos exatos do UI Kit em
vez de derivações calculadas. O quinto, `--me-color-brand-hover` (tint de 8% para hover de menu),
é derivado de `--me-color-brand` e acompanha sozinho.

> O override precisa estar no `<head>`, junto do carregamento. Injetar o `<style>` por JavaScript
> depois da página montar não re-estiliza de forma confiável os componentes já renderizados.

Para conferir uma re-tematização, sirva o repo e abra `test/retheme.html` — ele afirma que nenhuma
superfície de marca continua teal (18 verificações).

O `test/badge-variants.html` cobre o outro eixo do `<me-badge>`: que as sete variantes usam só
cores do `tokens.css`, e que `brand`/`blue`/sem-atributo são a mesma coisa.

**Partes internas** são estilizáveis via `::part()`:

```css
me-button::part(base) { border-radius: 999px; }
```

Os componentes têm fallback embutido em todo `var()` — continuam funcionando (com o tema
default) mesmo sem o `tokens.css`.

## Adicionando um componente

1. Crie `components/MeuComponente.js` seguindo a receita dos existentes
   (template em escopo de módulo + `attachShadow` + registro no final do arquivo).
2. Registre com o helper, **nunca** com `customElements.define` direto:
   ```js
   import { define } from './define.js';
   // ...
   define('me-meu-componente', MeMeuComponente);
   ```
   O `define()` ignora tags já registradas em vez de lançar — sem ele, uma
   colisão aborta a avaliação do módulo e derruba os componentes importados
   depois dele. O CI reprova `customElements.define` cru.
3. Adicione o import em `components/index.js`.
4. Documente uma seção nova no `index.html`.
5. Rode `test/collision.html` (com o repo servido) — deve dar PASS nas 4 verificações.

## Suporte

Navegadores evergreen (Chrome, Edge, Firefox, Safari atuais). Usa `ElementInternals`,
`color-mix()` e Custom Elements — sem polyfills.
