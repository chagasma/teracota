# waifu-claude

Personagem de desktop que reage ao que o Claude Code está fazendo, passeia pela
tela e interage com você — uma só pra todas as sessões, ou uma por sessão.

```
Claude Code ──hooks (curl)──► POST /hook ──┐
     │                                      ▼
     └──MCP (HTTP)──────────► POST /mcp ──► app Electron (127.0.0.1:7777)
                                            uma janela transparente por waifu
```

Não precisa de Node pra integração: os hooks são uma linha de `curl` (já vem no
Windows 10+, macOS e Linux) e o MCP é servido pelo próprio app.

## Rodar

```bash
npm install
npm start          # builda e abre
npm run watch      # rebuild automático (depois: botão direito → Recarregar)
npm run typecheck  # checa os tipos (o esbuild não checa)
npm run demo       # com o app aberto: passa por todos os estados
```

## Interação

| Ação | Reação |
|---|---|
| Clique | Reage (acena, pula, "Hm?") — se estiver dormindo, acorda |
| Arrastar | Balança como pêndulo conforme a velocidade do arrasto (o corpo fica pra trás e assenta quando você para); fica onde você soltar |
| Passar o mouse de um lado pro outro em cima dela | Carinho ♥ |
| Mouse pela tela | Os olhos acompanham o cursor |
| Botão direito | Modos, voltar pro canto, recarregar, sair |

## Modos (botão direito)

**Movimento:** *Passear pela tela* (só quando ociosa) ou *Ficar parado aqui*.

**Sessões:**
- **Uma só** — acompanha todas as sessões do Claude; só comemora "de verdade" quando
  todas terminam, e com várias ativas o balão mostra o projeto (`front` Terminei!).
- **Uma por sessão** (até 5) — cada sessão ganha uma waifu com cor e plaquinha do
  projeto. Quando a sessão fecha, ela acena e vai embora; a última fica "em casa".
  Sessões que somem sem avisar (terminal fechado à força) expiram após 45 min.

Preferências e posição ficam em `%APPDATA%/waifu-claude/config.json`.
Só roda uma cópia do app por vez.

## Integração com o Claude Code

- **Hooks** (`.claude/settings.json`): `curl` repassa o JSON cru de cada evento pro app,
  que traduz em estados — lendo, buscando, digitando, terminal, web, subagentes, erro,
  pedindo atenção, terminou. Se o app estiver fechado, falha em silêncio.
- **MCP** (`.mcp.json`): `http://127.0.0.1:7777/mcp` com as ferramentas `say` e `emote`.
  A chamada vai pra waifu da sessão que a fez.

Por enquanto isso vale só **dentro desta pasta**. Para todos os projetos, copie o bloco
`hooks` para `~/.claude/settings.json` e registre o MCP no escopo de usuário:

```bash
claude mcp add --scope user --transport http waifu http://127.0.0.1:7777/mcp
```

(Vai virar um plugin do Claude Code — ver roadmap.)

## Estrutura

```
src/
  shared/    protocol.ts (eventos + validação) · ipc.ts · brand.ts (nome, cores)
  main/      main.ts · manager.ts (roteia eventos entre waifus) · entity.ts (janela)
             sessions.ts · hooks.ts (hook → estado) · mcp.ts · server.ts
             walker.ts (passeio) · config.ts
  main/      skins.ts (descobre skins, gera máscaras de clique)
  preload/   preload.ts
  renderer/  app.ts (estados + mouse) · character.ts (interface) · look.ts
             sprite-character.ts · svg-character.ts · bubble.ts · pet.ts · states.ts
assets/skins/  skins que vêm com o app
scripts/       demo.ts · import-skin.ts
```

## HTTP local

Só aceita conexões de `127.0.0.1` sem header `Origin` (bloqueia páginas web).

| Rota | Corpo |
|---|---|
| `POST /hook` | JSON cru de um hook do Claude Code |
| `POST /event` | evento pronto (abaixo) — vai pra todas as waifus |
| `POST /mcp` | MCP Streamable HTTP (sem estado) |
| `GET /health` | — |

Evento (`/event`, campos inválidos são descartados):

| campo        | valores                         |
|--------------|---------------------------------|
| `state`      | `idle`, `listening`, `thinking`, `reading`, `searching`, `typing`, `terminal`, `web`, `delegating`, `error`, `attention`, `happy`, `sad`, `sleeping` |
| `expression` | `neutral`, `happy`, `focused`, `confused`, `surprised`, `sleepy`, `sad` |
| `anim`       | `bob`, `type`, `sway`, `shake`, `jump`, `breathe`, `perk`, `wave` |
| `say`        | texto do balão (até 280 caracteres) |
| `from`       | etiqueta de origem no balão |
| `duration`   | ms até voltar ao estado base    |
| `working`    | `true`/`false` — Claude está no meio de uma tarefa |

## Skins

O visual vem de uma **skin** (pacote de sprites), escolhida no botão direito → **Skin**.
A opção *Clássica (desenho)* usa o personagem em SVG, que também é o fallback.

Skins ficam em `assets/skins/<id>/` (vêm com o app) ou `%APPDATA%/waifu-claude/skins/<id>/`
(instaladas pelo usuário), cada uma com um `skin.json`:

```json
{
  "name": "Tera",
  "size": 260,
  "facing": "right",
  "animations": {
    "idle": { "frames": ["frames/idle/01.png", "..."], "durations": [320, 320, 150, 320] },
    "work": { "frames": ["..."], "durations": ["..."], "scale": 0.84 },
    "land": { "frames": ["..."], "durations": ["..."], "loop": false }
  }
}
```

- Frames quadrados PNG transparentes, pés na mesma linha de base; `size` é o tamanho na tela.
- Poses: `idle` (obrigatória), `walk`, `drag`, `land`, `work`, `think`, `talk`, `happy`,
  `error`, `sad`, `sleep`, `wave`, `surprised`. Pose ausente cai numa parecida.
- `walk` olha pra `facing`; o outro lado é espelhado.
- `scale` corrige uma animação que veio maior/menor que as outras (ancorado nos pés).
- Por cima dos frames roda um movimento procedural (respirar, quicar, pêndulo) — `src/renderer/wobble.ts`.
- Só a parte opaca do sprite responde ao mouse — o resto da janela deixa o clique passar.

Pra importar um pacote no formato `desktop-pet-sprite-pack-v1` (o que o GPT gerou):

```bash
npm run build
npm run import-skin -- <pasta-do-pacote> <id> "<Nome>"
```

Uma implementação totalmente nova (Live2D, VRM) só precisa implementar a
interface `Character` em `src/renderer/character.ts`.

## Roadmap

- [x] Sprites (`SpriteCharacter`) e sistema de skins
- [ ] Interações entre waifus (desviar, cumprimentar, aplaudir)
- [ ] Plugin do Claude Code (hooks + MCP), instalador (electron-builder), bandeja, iniciar com o Windows
