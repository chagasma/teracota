# Roadmap

Pra onde a Tera está indo. As datas não são fixas: a ordem é o que importa.
Itens com 🌱 são bons pra primeira contribuição. Quer pegar algum? Comente na issue
correspondente (ou abra uma) antes de começar.

## ✅ v0.1 — Beta (pronto, aguardando lançamento)

- Tera reage ao Claude Code: lendo, digitando, terminal, web, subagentes, erro,
  pedindo atenção, terminou
- Hooks via `curl` + MCP servido pelo app (`say`, `emote`) — sem Node no usuário
- **Uma Tera só** ou **uma por sessão** (até 5, com cor e plaquinha do projeto)
- Passeia pela tela ou fica parada; arrastar com balanço físico; clique; carinho
- Skins de sprite com movimento procedural; desenho clássico em SVG como reserva
- Bandeja do sistema, primeira execução guiada, abrir com o Windows
- Plugin do Claude Code + instalador do Windows

**Falta pra lançar:** repositório no GitHub, licença da arte, testar o instalador e o
plugin numa máquina limpa.

## v0.2 — Animação mais viva

- **Sprites com 8 frames** nas animações que mais aparecem (walk, idle, talk, work, drag)
- **Peças recortadas** por cima dos frames: rabo balançando, orelhas mexendo,
  piscadas de verdade e boca acompanhando a fala
- 🌱 Posição do ícone de atividade ajustável por pose na skin (hoje ele flutua longe
  da cabeça nas poses sentadas)
- 🌱 Tamanho da Tera configurável (pequena / média / grande)

## v0.3 — Várias Teras

- Desviam umas das outras ao passear
- Se cumprimentam quando se encontram
- Aplaudem quando outra termina uma tarefa
- Limite de Teras configurável

## v0.4 — Experiência

- Atualização automática pelo GitHub Releases
- Tela de configurações (hoje tudo é pelo menu)
- Aviso amigável quando o Claude Code tenta falar com o app fechado
- 🌱 **Falas em inglês** (e estrutura pra outros idiomas)
- 🌱 Mais falas e variações por situação
- 🌱 Atalho de teclado pra mostrar/esconder
- Sons opcionais (e, quem sabe, voz)

## v1.0 — Pra todo mundo

- **macOS** (build, assinatura e notarização) e **Linux**
- Instalador do Windows assinado (sem o aviso do SmartScreen)
- **Skins da comunidade**: instalar uma skin a partir de um `.zip` pelo menu
- Documentação em inglês

## Ideias sem data

- Personagens Live2D ou VRM (3D) como tipo de skin
- Funcionar com outros agentes de código além do Claude Code
- Resumo do dia ("hoje o Claude editou 42 arquivos e errou 3 vezes 😅")
- Reagir a eventos do sistema (build quebrou, testes passaram)

## Pra quem quer ajudar no código agora 🌱

- Testes do `EntityManager` (`src/main/manager.ts`) com o Electron mockado
- Ícone de bandeja no formato "template" pro macOS
- Mensagens de erro melhores quando a porta 7777 já está em uso

Tem uma ideia que não está aqui? Abra uma [sugestão](../../issues/new/choose).
