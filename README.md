# Terracota

[![CI](https://github.com/kyotodevIndie/tera-agent-companion/actions/workflows/ci.yml/badge.svg)](https://github.com/kyotodevIndie/tera-agent-companion/actions/workflows/ci.yml)

**Tera** é uma gatinha que mora no seu desktop e acompanha o seu trabalho no
[Claude Code](https://claude.com/claude-code): senta no notebook quando o Claude
está editando, fica confusa quando dá erro, acena quando ele precisa de você,
comemora quando termina — e passeia pela tela quando está tudo calmo.

> Projeto independente, não é afiliado à Anthropic.
>
> **Beta, só Windows por enquanto.** macOS e Linux estão no [roadmap](ROADMAP.md).

## Instalar

1. Baixe o instalador (`Terracota Setup x.y.z.exe`) na página de
   [Releases](https://github.com/kyotodevIndie/tera-agent-companion/releases) e rode.
   O Windows pode mostrar o aviso do SmartScreen (o app ainda não é assinado):
   **Mais informações → Executar assim mesmo**.
2. Conecte ao Claude Code — no Claude Code, rode:
   ```
   /plugin marketplace add kyotodevIndie/tera-agent-companion
   /plugin install terracota@terracota
   ```
   (ou clique com o botão direito na Tera → **Conectar ao Claude Code**, que copia esses comandos.)
3. Pronto. Abra uma sessão do Claude Code e a Tera começa a reagir.

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
  **Uma por sessão** (cada sessão do Claude ganha a sua Tera, com cor e plaquinha do projeto)
- **Skin**, **Voltar pro canto**, **Abrir com o Windows**, **Esconder**, **Sair**

O Claude também pode fazer a Tera falar e reagir quando quiser (ferramentas `say` e `emote`).

## Problemas comuns

**O Claude Code avisa que o MCP `terracota` falhou ao conectar.** O app está fechado.
Abra o Terracota e reinicie a sessão do Claude Code (ou rode `/mcp` pra reconectar).
Sem o app, nada quebra — a Tera só não aparece.

**A Tera sumiu.** Clique no ícone dela na bandeja do sistema (perto do relógio) →
**Voltar pro canto**. Se estiver escondida, **Mostrar Tera**.

**Não consigo clicar nela.** Só o desenho responde ao mouse — o fundo transparente
deixa o clique passar pra janela de trás, de propósito. Se nem o desenho responder,
[abra um bug](../../issues/new/choose) contando o que você fazia antes.

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
Claude Code ──hooks (curl)──► POST /hook ──┐
     │                                      ▼
     └──MCP (HTTP)──────────► POST /mcp ──► app Electron (127.0.0.1:7777)
                                            uma janela transparente por Tera
```

- **Hooks** (`plugin/hooks/hooks.json`): `curl` repassa o JSON cru de cada evento; o app
  traduz em estados (lendo, digitando, terminal, erro, pedindo atenção, terminou...).
  Não precisa de Node na máquina do usuário.
- **MCP**: servido pelo próprio app em `/mcp` (Streamable HTTP, sem estado). A chamada
  vai pra Tera da sessão que a fez.
- **Plugin**: `plugin/` + `.claude-plugin/marketplace.json` (este repositório é o marketplace).
  Valide com `claude plugin validate ./plugin` e `claude plugin validate .`.

```
src/
  shared/    protocol.ts (eventos + validação) · ipc.ts · skin.ts · brand.ts (nomes, repo, cores)
  main/      main.ts (ciclo de vida, bandeja) · menu.ts · manager.ts (roteia eventos entre Teras)
             entity.ts (janela) · walker.ts (passeio) · sessions.ts · hooks.ts · mcp.ts
             server.ts · skins.ts · config.ts · paths.ts
  preload/   preload.ts
  renderer/  app.ts (estados + mouse) · character.ts (interface) · sprite-character.ts
             svg-character.ts · wobble.ts (movimento procedural) · pendulum.ts (balanço)
             look.ts · states.ts · bubble.ts · pet.ts
assets/      skins/ (Tera) · icons/
plugin/      plugin do Claude Code
scripts/     demo.ts · import-skin.ts
```

### HTTP local

Só aceita `127.0.0.1` sem header `Origin`.

| Rota | Corpo |
|---|---|
| `POST /hook` | JSON cru de um hook do Claude Code |
| `POST /event` | evento pronto — vai pra todas as Teras |
| `POST /mcp` | MCP Streamable HTTP |
| `GET /health` | — |

Evento (`/event`): `state` (`idle`, `listening`, `thinking`, `reading`, `searching`, `typing`,
`terminal`, `web`, `delegating`, `error`, `attention`, `happy`, `sad`, `sleeping`),
`expression`, `anim`, `say`, `from`, `duration` (ms), `working`.

### Skins

Ficam em `assets/skins/<id>/` ou `%APPDATA%/Terracota/skins/<id>/`, cada uma com um `skin.json`:

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
