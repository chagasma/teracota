---
description: How Tera integrates with Claude Code (plugin, hooks, sessions and MCP speech).
---

# Claude Code

The Claude Code integration is a **plugin** (`teracota@teracota`), and this repository is
its marketplace. Installation is covered in the
[installation guide](./installation#_3-connect-to-claude-code).

## How it works

The plugin registers **hooks** in Claude Code. On every event, `curl` sends the event's
JSON to the app at `http://127.0.0.1:7777/hook`, and Tera reacts:

| Claude Code event | Reaction |
|---|---|
| `SessionStart` | Says hi (not repeated after the conversation is compacted) |
| `UserPromptSubmit` | Perks up: work started |
| `PreToolUse` | By tool: `Read` → reading · `Grep`/`Glob` → searching · `Edit`/`Write` → editing · `Bash`/`PowerShell` → terminal · `WebFetch`/browser → web · `Agent` → delegating · others → thinking |
| `PostToolUseFailure` | Error |
| `Notification` | Permission request: she waves |
| `Stop` | Done: she celebrates |
| `SessionEnd` | Says goodbye |

**With Teracota closed, nothing happens:** `curl` fails silently (`|| exit 0`) and Claude
Code carries on as usual. The plugin needs no Node or Python.

## Multiple sessions

Every event carries the session id and the project folder, so Tera knows which terminal
each one came from:

- in **one Tera** mode, the speech bubble shows the project;
- in **one per session** mode, each session gets its own Tera.

See [Using Tera → one Tera or many](./usage#one-tera-or-many).

## Sessions that were already open

The plugin applies to new sessions. In sessions that were already open, run
`/reload-plugins` (menu → **Conectar sessões já abertas** copies it) or restart them.

## Speech via MCP (optional)

Besides the hooks, the app serves an **MCP** server with two tools: `say` (a speech
bubble) and `emote` (expression and animation). With them, Claude itself can, for example,
celebrate a fixed bug. The server's instructions ask it to use them sparingly.

Speech is **off by default** and lives outside the plugin, for one reason: with the MCP
server configured and Teracota **closed**, Claude Code shows an MCP connection error when
a session starts. The hooks, on the other hand, fail silently.

- **Turn on:** menu → **Deixar o Claude Code falar pela Tera**. This runs
  `claude mcp add --scope user --transport http teracota http://127.0.0.1:7777/mcp`.
  It applies to new sessions.
- **Turn off:** the same menu item, or `claude mcp remove --scope user teracota`.

## Disconnecting

```bash
claude plugin uninstall teracota@teracota
claude plugin marketplace remove teracota
```

## Common problems

See the [FAQ](./faq#tera-doesn-t-react-to-claude-code).
