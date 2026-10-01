# Changelog

As mudanças de cada versão. Formato baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto segue [versionamento semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- **API local v1** (`POST /api/v1/event`, `/event` como alias): eventos com `source`
  (agente, sessão, projeto) e `lifecycle` entram no fluxo de sessões — qualquer
  ferramenta ganha Teras próprias no modo "uma por sessão". Documentada em `docs/API.md`
- Com agentes diferentes abertos, balão e plaquinha mostram "Agente · projeto"
- "Conectar ao Claude Code" instala o plugin sozinho pela CLI (antes copiava os
  comandos, que colavam juntos numa linha só)
- Na primeira vez, se achar um agente instalado e ainda não conectado, a Tera oferece:
  um clique nela e ela se conecta (sem instalar nada sem o clique)
- Na primeira execução do app instalado, já liga "Abrir com o Windows"
- `docs/ARQUITETURA.md`, `docs/INTEGRACOES.md` e `docs/API.md`

### Alterado
- **O app agora se chama Teracota** (plugin `teracota@teracota`, MCP `teracota`, repositório
  `kyotodevIndie/teracota`). As preferências do nome antigo são migradas sozinhas
- **Companion Core:** arquitetura de adapters por agente. O Claude Code virou o
  primeiro adapter (`src/main/integrations/claude-code/`); o core e o renderer não
  conhecem nenhum agente — um teste garante isso
- Capabilities por agente: sem aviso de conclusão, o "trabalhando" expira em 1 min
- Rodando pelo código, o app se chama "Teracota Dev" e não conflita com o instalado
- Nomes internos: `WaifuEvent` → `CompanionEvent`, `window.waifu` → `window.teracota`
- Menu: "Abrir ao iniciar o sistema" fora do Windows; sem ícone no Dock do macOS

### Corrigido
- Nome do projeto com caminhos do Windows quando o app roda em Linux/macOS

## [0.1.0] — beta

Primeira versão pública.

### Adicionado
- Tera, personagem de desktop que reage ao Claude Code: lendo, buscando, digitando,
  terminal, web, subagentes, erro, pedindo atenção e terminou
- Plugin do Claude Code (hooks via `curl`) e servidor MCP no próprio app com as
  ferramentas `say` e `emote`
- Modos **uma Tera só** (acompanha todas as sessões) e **uma por sessão** (até 5)
- Passeio pela tela ou ficar parada; arrastar com balanço físico; clique; carinho
- Skin de sprites com movimento procedural e desenho clássico em SVG
- Bandeja do sistema, apresentação na primeira execução, abrir com o Windows
- Instalador do Windows
