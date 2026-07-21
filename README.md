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
- `demo/app-shell.html` — página completa composta (sidebar + header + cards + form).
- `demo/pages.html` — mini-app com rotas por hash (`me-pages` + sidebar sincronizada).

## Usando num protótipo

Duas tags no `<head>` e pronto:

```html
<link rel="stylesheet" href="./tokens.css" />
<script type="module" src="./components/index.js"></script>
```

O `tokens.css` já importa a fonte **Inter** e a webfont de ícones **Material Design Icons** (CDN).

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
| `<me-radio-group>` + `<me-radio>` | Seleção única com navegação por setas; `appearance="card"` para cards selecionáveis |
| `<me-badge>` | labelBadge de status: Extra=`success`, Cobertura=`danger`, Fixo=`brand`, Aberta=`warning`; `size="small|medium"` |
| `<me-card>` | Cartão com slots `header`/`footer` colapsáveis e `closable` (evento `me-close`) |
| `<me-page-header>` | Header de página: título + subtítulo + slot `end` (sino, avatar) |
| `<me-sidebar>` + `<me-sidebar-item>` | Menu lateral espelhado do app: 64px/288px, toggle rosa 24px (evento `me-toggle`), item ativo teal semibold; sem "Sair" (como no app — slot `footer` disponível para casos especiais) |
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
- **Formulários**: `me-input`, `me-switch` e `me-radio-group` são form-associated
  (ElementInternals) — entram no `FormData` de um `<form>` comum, respondem a `reset` e
  `type="submit"` do `me-button` dispara o submit.

## Customização

**Tokens** (`tokens.css`, prefixo `--me-*`) são a única fonte de verdade de cor/tipografia/forma.
Para re-tematizar um protótipo inteiro, basta sobrescrever no seu HTML:

```html
<style>
  :root { --me-color-brand: #CB2957; }
</style>
```

**Partes internas** são estilizáveis via `::part()`:

```css
me-button::part(base) { border-radius: 999px; }
```

Os componentes têm fallback embutido em todo `var()` — continuam funcionando (com o tema
default) mesmo sem o `tokens.css`.

## Adicionando um componente

1. Crie `components/MeuComponente.js` seguindo a receita dos existentes
   (template em escopo de módulo + `attachShadow` + `customElements.define('me-...')`).
2. Adicione o import em `components/index.js`.
3. Documente uma seção nova no `index.html`.

## Suporte

Navegadores evergreen (Chrome, Edge, Firefox, Safari atuais). Usa `ElementInternals`,
`color-mix()` e Custom Elements — sem polyfills.
