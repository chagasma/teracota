# Teracota

[![CI](https://github.com/kyotodevIndie/teracota/actions/workflows/ci.yml/badge.svg)](https://github.com/kyotodevIndie/teracota/actions/workflows/ci.yml)

**Tera** é uma gatinha que mora no seu desktop e acompanha o seu trabalho no
[Claude Code](https://claude.com/claude-code): senta no notebook quando o Claude
está editando, fica confusa quando dá erro, acena quando ele precisa de você,
comemora quando termina — e passeia pela tela quando está tudo calmo.

Hoje ela acompanha o **Claude Code**. Outros agentes (OpenCode, Codex) estão no
[roadmap](docs/INTEGRACOES.md), e qualquer ferramenta já pode dar vida à Tera pela
[API local](docs/API.md).

> Projeto independente, não é afiliado à Anthropic.
>
> **Beta, só Windows por enquanto.** macOS e Linux estão no [roadmap](ROADMAP.md).

## Instalar

1. Baixe o instalador (`Teracota Setup x.y.z.exe`) na página de
   [Releases](https://github.com/kyotodevIndie/teracota/releases) e rode.
   O Windows pode mostrar o aviso do SmartScreen (o app ainda não é assinado):
   **Mais informações → Executar assim mesmo**.
2. Conecte ao Claude Code: botão direito na Tera → **Conectar ao Claude Code**.
   Ela instala o plugin sozinha. Se preferir fazer à mão, rode num terminal:
   ```
   claude plugin marketplace add kyotodevIndie/teracota; claude plugin install teracota@teracota
   ```
   ou, dentro do Claude Code, estes dois comandos **um de cada vez**:
   ```
   /plugin marketplace add kyotodevIndie/teracota
   /plugin install teracota@teracota
   ```
3. Pronto. Abra (ou reinicie) uma sessão do Claude Code e a Tera começa a reagir.

Com o app fechado, o plugin não atrapalha nada — os eventos só não chegam.

## Usando

| Ação | Reação |
|---|---|
| Clique | Ela reage — se estiver dormindo, acorda |
| Arrastar | Balança como pêndulo e fica onde você soltar |
| Passar o mouse de um lado pro outro em cima dela | Carinho ♥ |
| Botão direito nela ou no ícone da bandeja | Menu |

No menu:
- **Passear pela tela / Ficar parada**
- **Uma Tera só** (acompanha todas as sessões e diz de qual projeto veio cada aviso) ou
  **Uma por sessão de agente** (cada sessão ganha a sua Tera, com cor e plaquinha do projeto)
- **Skin**, **Voltar pro canto**, **Abrir com o Windows**, **Esconder**, **Sair**

O Claude também pode fazer a Tera falar e reagir quando quiser (ferramentas `say` e `emote`).

## Problemas comuns

**O Claude Code avisa que o MCP `teracota` falhou ao conectar.** O app está fechado.
Abra o Teracota e reinicie a sessão do Claude Code (ou rode `/mcp` pra reconectar).
Sem o app, nada quebra — a Tera só não aparece.

**A Tera sumiu.** Clique no ícone dela na bandeja do sistema (perto do relógio) →
**Voltar pro canto**. Se estiver escondida, **Mostrar Tera**.

**Não consigo clicar nela.** Só o desenho responde ao mouse — o fundo transparente
deixa o clique passar pra janela de trás, de propósito. Se nem o desenho responder,
[abra um bug](https://github.com/kyotodevIndie/teracota/issues/new/choose) contando o que você fazia antes.

## Privacidade

Tudo roda na sua máquina. O plugin manda os eventos do Claude Code só pro app, em
`127.0.0.1:7777`; nada sai pra internet. O servidor local recusa requisições de páginas web.
Detalhes em [SECURITY.md](SECURITY.md).

## Contribuindo

Contribuições são muito bem-vindas — código, skins, traduções, ideias e bugs.
Comece pelo [CONTRIBUTING.md](CONTRIBUTING.md) e veja o que vem por aí no
[ROADMAP.md](ROADMAP.md). O histórico de versões está no [CHANGELOG.md](CHANGELOG.md).

---

## Desenvolvimento

```bash
npm install
npm start          # builda e abre
npm run check      # typecheck + lint + testes
```

Todos os comandos, como conectar o seu Claude Code ao app em desenvolvimento e o
estilo de código estão no [CONTRIBUTING.md](CONTRIBUTING.md).

### Como funciona

```
 Claude Code ─ hooks (curl) ─► /hook ────────┐  adapter → sinal normalizado
 Qualquer ferramenta ─► /api/v1/event ───────┤
 MCP (say/emote) ─► /mcp ────────────────────┤
                                             ▼
             Companion Core (sessões, uma ou várias Teras) ─► renderer
             app Electron em 127.0.0.1:7777, uma janela transparente por Tera
```

Cada agente tem um **adapter** que traduz os eventos nativos dele pro protocolo do
Teracota; o core e o renderer não sabem de onde o evento veio. A integração não precisa
de Node na máquina do usuário (hooks via `curl`), e o MCP é servido pelo próprio app.

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): camadas, contratos e decisões
- [docs/INTEGRACOES.md](docs/INTEGRACOES.md): adapters, capabilities e como integrar outro agente
- [docs/API.md](docs/API.md): API local (`/api/v1/event`)
- Plugin do Claude Code: `plugin/` + `.claude-plugin/marketplace.json` (este repositório é o
  marketplace). Valide com `claude plugin validate ./plugin` e `claude plugin validate .`

### Skins

Ficam em `assets/skins/<id>/` ou `%APPDATA%/Teracota/skins/<id>/`, cada uma com um `skin.json`:

```json
{
  "name": "Tera",
  "size": 260,
  "facing": "right",
  "animations": {
    "idle": { "frames": ["frames/idle/01.png", "..."], "durations": [320, 320, 150, 320] },
    "work": { "frames": ["..."], "durations": ["..."], "scale": 0.84 },
    "drag": { "frames": ["..."], "durations": ["..."], "swing": { "feetRight": 0, "center": 1, "feetLeft": 2, "lean": 8 } },
    "land": { "frames": ["..."], "durations": ["..."], "loop": false }
  }
}
```

- Frames quadrados PNG transparentes, pés na mesma linha; `size` é o tamanho na tela.
- Poses: `idle` (obrigatória), `walk`, `drag`, `land`, `work`, `think`, `talk`, `happy`,
  `error`, `sad`, `sleep`, `wave`, `surprised`. Pose ausente cai numa parecida.
- `walk` olha pra `facing` (o outro lado é espelhado); `scale` corrige uma animação
  maior/menor que as outras; `swing` escolhe o frame de `drag` pelo balanço.
- Só a parte opaca do sprite responde ao mouse.

Importar um pacote no formato `desktop-pet-sprite-pack-v1`:

```bash
npm run build
npm run import-skin -- <pasta-do-pacote> <id> "<Nome>"
```

## Licença

Código: [MIT](LICENSE).

Arte da Tera (`assets/`): [CC BY 4.0](LICENSE-ART.md) — use à vontade, com crédito.
