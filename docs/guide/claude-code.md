---
description: Como a Tera se integra ao Claude Code (plugin, hooks, sessões e falas pelo MCP).
---

# Claude Code

A integração com o Claude Code é feita por um **plugin** (`teracota@teracota`), e este
repositório é o marketplace dele. A instalação está no
[guia de instalação](./installation#_3-conectar-ao-claude-code).

## Como funciona

O plugin registra **hooks** no Claude Code. A cada evento, um `curl` manda o JSON do
evento pro app, em `http://127.0.0.1:7777/hook`, e a Tera reage:

| Evento do Claude Code | Reação |
|---|---|
| `SessionStart` | Cumprimenta (não repete depois de compactar a conversa) |
| `UserPromptSubmit` | Atenta, começou a trabalhar |
| `PreToolUse` | Pela ferramenta: `Read` → lendo · `Grep`/`Glob` → buscando · `Edit`/`Write` → editando · `Bash`/`PowerShell` → terminal · `WebFetch`/navegador → web · `Agent` → delegando · outras → pensando |
| `PostToolUseFailure` | Erro |
| `Notification` | Pedido de permissão: ela acena |
| `Stop` | Terminou: comemora |
| `SessionEnd` | Se despede |

**Com o Teracota fechado, nada acontece:** o `curl` falha em silêncio (`|| exit 0`), e o
Claude Code segue normal. O plugin não precisa de Node nem de Python.

## Várias sessões

Cada evento traz o id da sessão e a pasta do projeto. Então a Tera sabe de qual
terminal veio cada coisa:

- no modo **uma Tera só**, o balão mostra o projeto;
- no modo **uma por sessão**, cada sessão ganha a sua Tera.

Veja [Usando a Tera → Uma Tera ou várias](./usage#uma-tera-ou-varias).

## Sessões que já estavam abertas

O plugin vale pra sessões novas. Nas que já estavam abertas, rode `/reload-plugins`
(menu → **Conectar sessões já abertas** copia o comando) ou reinicie a sessão.

## Falas pelo MCP (opcional)

Além dos hooks, o app serve um servidor **MCP** com duas ferramentas: `say` (fala num
balão) e `emote` (expressão e animação). Com isso, o próprio Claude pode, por exemplo,
comemorar um bug resolvido. As instruções do servidor pedem pra ele usar isso com
moderação.

As falas ficam **desligadas por padrão** e fora do plugin, por um motivo: com o MCP
configurado e o Teracota **fechado**, o Claude Code mostra um erro de conexão do MCP ao
abrir a sessão. Os hooks, ao contrário, falham em silêncio.

- **Ligar:** menu → **Deixar o Claude Code falar pela Tera**. Isso roda
  `claude mcp add --scope user --transport http teracota http://127.0.0.1:7777/mcp`.
  Vale pras próximas sessões.
- **Desligar:** a mesma opção do menu, ou `claude mcp remove --scope user teracota`.

## Desconectar

```bash
claude plugin uninstall teracota@teracota
claude plugin marketplace remove teracota
```

## Problemas comuns

Estão no [FAQ](./faq#a-tera-nao-reage-ao-claude-code).
