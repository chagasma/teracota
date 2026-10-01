# Roadmap

Pra onde a Tera está indo. As datas não são fixas: a ordem é o que importa.
Itens com 🌱 são bons pra primeira contribuição. Quer pegar algum? Comente na issue
correspondente (ou abra uma) antes de começar.

**Objetivo de longo prazo:** *Connect your coding agent and give it a life on your desktop.*
O Claude Code segue como integração de primeira classe, mas o Teracota fica independente
de fornecedor. Detalhes em [docs/dev/integrations.md](docs/dev/integrations.md).

## ✅ v0.1 — Primeira beta pública (pronta, aguardando publicação)

- Tera reage ao Claude Code: lendo, digitando, terminal, web, subagentes, erro,
  pedindo atenção, terminou
- Plugin com hooks via `curl` (sem Node no usuário); falas pelo MCP (`say`, `emote`)
  opcionais
- **Uma Tera só** ou **uma por sessão** (até 5, com cor e plaquinha do projeto)
- Passeia pela tela ou fica parada; arrastar com balanço físico; clique; carinho
- Skins de sprite com movimento procedural; desenho clássico em SVG como reserva
- Bandeja do sistema, primeira execução guiada, conexão com um clique, abrir com o Windows
- **Companion Core:** arquitetura de adapters (o core não conhece nenhum agente; um teste
  garante), capabilities por agente, identidade do agente ("Agente · projeto")
- **API local v1** (`/api/v1/event`) com `source`. Documentada em [docs/dev/api.md](docs/dev/api.md)
- Instalador do Windows, site e documentação em português e inglês

## v0.2 — Sessões de foco

- **Focus Mode** (Pomodoro): sessões de foco e pausas com a Tera "trabalhando junto",
  convivendo com a atividade dos agentes. Escopo em definição.

O Claude Code continua sendo a única integração oficial nesta versão.

## v0.3 — Animação mais viva

- **Sprites com 8 frames** nas animações que mais aparecem (walk, idle, talk, work, drag)
- **Peças recortadas** por cima dos frames: rabo balançando, orelhas mexendo,
  piscadas de verdade e boca acompanhando a fala
- 🌱 Posição do ícone de atividade ajustável por pose na skin (hoje ele flutua longe
  da cabeça nas poses sentadas)
- 🌱 Tamanho da Tera configurável (pequena / média / grande)

## v0.4 — Várias Teras e experiência

- Teras desviam umas das outras, se cumprimentam e aplaudem quando outra termina
- Limite de Teras configurável
- Atualização automática pelo GitHub Releases
- Tela de configurações (hoje tudo é pelo menu)
- Aviso amigável quando o agente tenta falar com o app fechado
- 🌱 **Falas em inglês** (e estrutura pra outros idiomas)
- 🌱 Mais falas e variações por situação
- 🌱 Atalho de teclado pra mostrar/esconder
- Sons opcionais (e, quem sabe, voz)

As v0.3 e v0.4 **não esperam** por agentes novos.

## Marco: integrações com agentes

Depois que o Companion Core estabilizar:

1. **Adapter #2:** **OpenCode** ou **OpenAI Codex**, o que tiver a integração oficial
   mais madura na hora. Objetivo: validar que a arquitetura de adapters funciona de verdade.
2. **Adapter #3:** o outro. Objetivo: validar a abstração com três sistemas diferentes.
3. **Adapter SDK:** API pública mínima pra adapters da comunidade, só depois de
   aprender com os três. Nada de desenhar SDK em cima de hipóteses.

Regras: só interfaces oficiais e estáveis, nada de ler a UI/TUI do agente, e **não
anunciar suporte antes de validar o fluxo real**. Checklist completo em
[docs/dev/integrations.md](docs/dev/integrations.md#checklist-antes-de-integrar-um-agente-novo).

## v1.0 — Pra todo mundo

- **macOS** (build, assinatura e notarização) e **Linux**
- Instalador do Windows assinado (sem o aviso do SmartScreen)
- **Skins da comunidade**: instalar uma skin a partir de um `.zip` pelo menu
- Documentação em inglês

## Ideias sem data

- Personagens Live2D ou VRM (3D) como tipo de skin
- Adapters externos da comunidade (`teracota-adapter-foo`)
- Resumo do dia ("hoje o agente editou 42 arquivos e errou 3 vezes 😅")
- Reagir a eventos do sistema (build quebrou, testes passaram); a API local já permite
  fazer isso por fora

## Pra quem quer ajudar no código agora 🌱

- Testes do `EntityManager` (`src/main/manager.ts`) com o Electron mockado
- Exemplos de integração pela API local (script de CI, extensão de editor)
- Ícone de bandeja no formato "template" pro macOS
- Mensagens de erro melhores quando a porta 7777 já está em uso

Tem uma ideia que não está aqui? Abra uma [sugestão](https://github.com/kyotodevIndie/teracota/issues/new/choose).
