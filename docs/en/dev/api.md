---
description: Teracota's local HTTP API (/api/v1/event) for any tool or agent to make Tera react.
---

# Local API

Any tool can make Tera react, even without an official adapter: just send events over
HTTP to the app, which listens **only on `127.0.0.1:7777`**.

```
My agent / script / local CI
        │  POST http://127.0.0.1:7777/api/v1/event
        ▼
    Teracota
```

## `POST /api/v1/event`

`/event` is a compatible alias. JSON body; every field is optional, but there must be at
least one visual field or a `lifecycle`.

| Field | Type | What it does |
|---|---|---|
| `state` | see [states](#states) | Activity: sets pose, expression, animation and icon |
| `say` | text (up to 280) | Speech bubble |
| `expression` | `neutral` `happy` `focused` `confused` `surprised` `sleepy` `sad` | Overrides the expression (or a short reaction, without `state`) |
| `anim` | `bob` `type` `sway` `shake` `jump` `breathe` `perk` `wave` | Overrides the animation (or a short reaction, without `state`) |
| `duration` | ms (up to 60000) | How long until she returns to the base state |
| `working` | boolean | The tool is in the middle of a task |
| `source` | object | Where the event comes from (below) |
| `lifecycle` | `start` \| `end` | Session start/end (only with `source`) |

Invalid fields are silently dropped. Response: `204` when accepted, `400` when nothing
valid is left. Speech bubbles appear as sent (the app's own lines are in Portuguese, but
yours can be in any language).

### Without `source`: a standalone event

Goes to every Tera. Good for simple notifications:

```bash
curl -X POST http://127.0.0.1:7777/api/v1/event \
  -H "Content-Type: application/json" \
  -d '{"state":"happy","say":"Deploy finished!"}'
```

### With `source`: sessions

```json
{ "source": { "provider": "my-agent", "sessionId": "abc123", "project": "hera" } }
```

| Field | Rule |
|---|---|
| `provider` | Required. Slug: lowercase letters, digits, `.` `_` `-`; up to 40 characters |
| `sessionId` | Optional (default `default`). Different sessions = different Teras in one-per-session mode |
| `project` | Optional (default: the provider). Shown in the name tag and bubble |

With `source`, the event joins the same flow as the official integrations:

- **One per session mode:** each session gets its own Tera, with a color and name tag.
  `lifecycle: "end"` makes her say goodbye and leave.
- **One Tera mode:** she aggregates every session. With more than one session open, the
  bubble shows the origin; with different agents open, `provider · project`.
- **`working`:** community integrations aren't guaranteed to report completion, so
  "working" expires by itself after **1 minute** without events. Send `working: false`
  when you're done.

A full session:

```bash
E=http://127.0.0.1:7777/api/v1/event
S='"source":{"provider":"my-agent","sessionId":"abc123","project":"hera"}'

curl -X POST $E -H "Content-Type: application/json" -d "{$S,\"lifecycle\":\"start\",\"say\":\"Let's go!\"}"
curl -X POST $E -H "Content-Type: application/json" -d "{$S,\"state\":\"terminal\",\"working\":true}"
curl -X POST $E -H "Content-Type: application/json" -d "{$S,\"state\":\"happy\",\"working\":false,\"say\":\"Build finished!\"}"
curl -X POST $E -H "Content-Type: application/json" -d "{$S,\"lifecycle\":\"end\"}"
```

## States

| `state` | Meaning |
|---|---|
| `idle` | Standing around |
| `listening` | Received a request |
| `thinking` | Thinking |
| `reading` · `searching` · `typing` · `terminal` · `web` | Reading, searching, editing, running a command, browsing |
| `delegating` | Delegated to subagents |
| `error` | Something failed |
| `attention` | Needs the user (e.g. permission) |
| `happy` | Done / celebrating |
| `sad` | Sad |
| `sleeping` | Asleep |

## Good practices for integrators

- **Short timeout, fail silently.** The app may be closed, and your tool should carry on
  normally.
- **Don't send in a tight loop.** One event per state change is enough.
- **Send `working: false` and `lifecycle: "end"`** when the session ends.

## Security

The server only accepts connections from `127.0.0.1` and rejects requests with an
`Origin` header (web pages) or a `Host` other than `127.0.0.1`/`localhost` (DNS
rebinding). Events only change what Tera shows; they don't run anything. Details in
[SECURITY.md](https://github.com/kyotodevIndie/teracota/blob/main/SECURITY.md).

## Other routes

| Route | Use |
|---|---|
| `GET /health` | Answers `ok` when the app is running |
| `POST /mcp` | MCP server (Streamable HTTP, stateless) with the `say` and `emote` tools (Claude Code's optional speech) |
| `POST /hook` | Native Claude Code events (used by the plugin) |

## Versioning

`/api/v1/*` only changes in compatible ways: new fields are optional. Breaking changes go
to `/api/v2`. `/event` stays as an alias of v1.
