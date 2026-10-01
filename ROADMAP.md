# Roadmap

Pra onde a Tera está indo. As datas não são fixas: a ordem é o que importa.
Itens com 🌱 são bons pra primeira contribuição. Quer pegar algum? Comente na issue
correspondente (ou abra uma) antes de começar.

**Objetivo de longo prazo:** *Connect your coding agent and give it a life on your desktop.*
O Claude Code segue como integração de primeira classe, mas o Teracota fica independente
de fornecedor. Detalhes em [docs/INTEGRACOES.md](docs/INTEGRACOES.md).

## ✅ v0.1 — Beta

- Tera reage ao Claude Code: lendo, digitando, terminal, web, subagentes, erro,
  pedindo atenção, terminou
- Hooks via `curl` + MCP servido pelo app (`say`, `emote`), sem Node no usuário
- **Uma Tera só** ou **uma por sessão** (até 5, com cor e plaquinha do projeto)
- Passeia pela tela ou fica parada; arrastar com balanço físico; clique; carinho
- Skins de sprite com movimento procedural; desenho clássico em SVG como reserva
- Bandeja do sistema, primeira execução guiada, abrir com o Windows
- Plugin do Claude Code + instalador do Windows

## v0.2 — Companion Core

- ✅ **Arquitetura de adapters:** o core não conhece nenhum agente; o Claude Code virou
  o primeiro adapter (`src/main/integrations/`), e um teste garante a separação
- ✅ **Capabilities** por agente, que já mudam o comportamento (sem aviso de conclusão,
  o "trabalhando" expira rápido)
- ✅ **Identidade do agente:** sessões por `provider:sessionId`; balão e plaquinha
  mostram "Agente · projeto" quando há agentes diferentes abertos
- ✅ **API local v1** (`/api/v1/event`) com `source`, pra qualquer ferramenta ganhar
  sessões e Teras próprias. Documentada em [docs/API.md](docs/API.md)
- ✅ Versão de desenvolvimento separada da instalada ("Teracota Dev")
- **Focus Mode** (a definir)

O Claude Code continua sendo a única integração obrigatória nesta versão.

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
[docs/INTEGRACOES.md](docs/INTEGRACOES.md#checklist-antes-de-integrar-um-agente-novo).

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
