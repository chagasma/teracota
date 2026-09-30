# Contribuindo com o Terracota

Que bom que você quer ajudar a Tera! 🐾 Toda contribuição conta: reportar um bug,
sugerir uma ideia, melhorar o código, desenhar uma skin ou traduzir falas.

- [Formas de contribuir](#formas-de-contribuir)
- [Rodando o projeto](#rodando-o-projeto)
- [Conectando o seu Claude Code ao app em desenvolvimento](#conectando-o-seu-claude-code-ao-app-em-desenvolvimento)
- [Onde fica cada coisa](#onde-fica-cada-coisa)
- [Estilo de código](#estilo-de-código)
- [Testes](#testes)
- [Commits e pull requests](#commits-e-pull-requests)
- [Skins](#skins)
- [Lançando uma versão](#lançando-uma-versão-mantenedores)

## Formas de contribuir

- **Achou um bug?** Abra uma issue com o formulário de bug. Diga o que você estava
  fazendo logo antes e quais monitores/escala usa — muita coisa depende disso.
- **Tem uma ideia?** Dê uma olhada no [ROADMAP](ROADMAP.md) e abra uma sugestão.
- **Quer programar?** Procure issues com **`good first issue`** ou algum item do
  roadmap. Pra algo grande, abra uma issue antes pra combinar a abordagem.
- **Desenha?** Skins novas são muito bem-vindas — veja [Skins](#skins).

Participando, você concorda com o [Código de Conduta](CODE_OF_CONDUCT.md).

## Rodando o projeto

Precisa de **Node.js 22+** e **Windows** (é a plataforma suportada por enquanto;
macOS e Linux estão no roadmap — ajuda bem-vinda).

```bash
git clone https://github.com/kyotodevIndie/tera-agent-companion.git
cd tera-agent-companion
npm install
npm start
```

A Tera aparece no canto da tela e um ícone surge na bandeja do sistema.

| Comando | O que faz |
|---|---|
| `npm start` | Builda e abre o app |
| `npm run watch` | Rebuild automático; depois é só botão direito na Tera → **Recarregar** |
| `npm run check` | Typecheck + lint + testes — **rode antes de abrir um PR** |
| `npm test` | Só os testes (`npm run test:watch` pra deixar rodando) |
| `npm run demo` | Com o app aberto, passa por todos os estados da Tera |
| `npm run pack` | Gera o app desempacotado em `release/win-unpacked` |
| `npm run dist` | Gera o instalador em `release/` |

Pra testar reações sem o Claude Code, mande eventos direto pro app:

```bash
curl -X POST http://127.0.0.1:7777/event -H "Content-Type: application/json" \
  -d '{"state":"happy","say":"Oi!"}'
```

## Conectando o seu Claude Code ao app em desenvolvimento

O app recebe eventos do Claude Code por hooks. Pra desenvolver sem instalar o plugin:

1. Copie `.claude/settings.example.json` para `.claude/settings.local.json`
   (esse arquivo é pessoal e não vai pro git).
2. Abra uma sessão do Claude Code **nesta pasta** e aprove o servidor MCP `terracota`
   quando ele perguntar (vem do `.mcp.json`).

Assim, o próprio Claude que te ajuda a programar faz a Tera reagir. 😄

> Se você também tiver o **plugin** instalado, não use as duas coisas na mesma pasta:
> os eventos chegariam em dobro.

## Onde fica cada coisa

A visão geral da arquitetura está no [README](README.md#como-funciona). Atalhos:

| Quero mudar... | Arquivo |
|---|---|
| Como cada ferramenta do Claude vira uma reação | `src/main/hooks.ts` |
| Estados (pose, expressão, ícone, duração) | `src/renderer/states.ts` |
| Falas da Tera | `src/main/hooks.ts` (eventos) e `src/renderer/app.ts` (cliques, carinho) |
| Movimento contínuo (respirar, quicar) | `src/renderer/wobble.ts` |
| Balanço ao ser arrastada | `src/renderer/pendulum.ts` |
| Passeio pela tela | `src/main/walker.ts` |
| Uma Tera por sessão, roteamento de eventos | `src/main/manager.ts` |
| Menu e bandeja | `src/main/menu.ts`, `src/main/main.ts` |
| Ferramentas MCP (`say`, `emote`) | `src/main/mcp.ts` |
| Nome, cores, repositório | `src/shared/brand.ts` |
| Plugin do Claude Code | `plugin/` e `.claude-plugin/marketplace.json` |

O app tem três partes que conversam por IPC: **main** (Node/Electron: janelas,
servidor HTTP, sessões), **preload** (a ponte) e **renderer** (a página da Tera).
O contrato entre elas está em `src/shared/ipc.ts`.

## Estilo de código

- **TypeScript estrito.** Nada de `any`; prefira tipos do `src/shared/`.
- **Siga o estilo do arquivo ao redor.** Não usamos formatador automático (ele
  desfaria o alinhamento das tabelas de estados e expressões); o `.editorconfig`
  cuida do básico e o **Biome** (`npm run lint`) aponta problemas.
- **Nomes no código em inglês, comentários em português.** Comente o *porquê*,
  não o *o quê*.
- **Nada de dependência nova sem motivo forte** — o app fica aberto o dia todo;
  leve importa.
- Mudou algo que roda a cada quadro (renderer)? Olhe o consumo de CPU antes e depois.

## Testes

Os testes usam **Vitest** e ficam ao lado do código (`arquivo.test.ts`). Cobrimos a
lógica que não depende do Electron: validação de eventos, tradução de hooks,
sessões, física do pêndulo, leitura de skins.

Corrigiu um bug nessa lógica? Adicione um teste que falharia antes da correção.
Mexeu em algo visual? Descreva no PR como testou — um gif vale ouro.

## Commits e pull requests

1. Faça um fork e crie uma branch a partir da `main` (`fix/clique-travado`,
   `feat/falas-em-ingles`...).
2. Commits pequenos, com mensagem em português no imperativo e um corpo explicando
   o porquê quando não for óbvio:
   ```
   Corrige Tera às vezes impossível de clicar

   A detecção dependia só dos eventos repassados pelo setIgnoreMouseEvents...
   ```
3. Rode `npm run check`.
4. Abra o PR preenchendo o template. O CI roda typecheck, lint, testes e build.
5. Um mantenedor revisa; pode ser que peça ajustes — é normal e faz parte. 💛

## Skins

Uma skin é uma pasta com um `skin.json` e os frames em PNG. O formato completo está
no [README](README.md#skins); o essencial:

- **Frames quadrados, fundo transparente**, personagem centralizado e com os **pés
  sempre na mesma linha** — senão ela "pula" ao trocar de animação.
- Só a pose **`idle`** é obrigatória. As outras (`walk`, `drag`, `land`, `work`,
  `think`, `talk`, `happy`, `error`, `sad`, `sleep`, `wave`, `surprised`) caem numa
  parecida quando faltam.
- **`walk`** olhando pra um lado só (o outro é espelhado).
- Poses sentadas costumam sair maiores: corrija com `"scale"` na animação.

Pra testar, coloque a pasta em `%APPDATA%/Terracota/skins/<id>/` e escolha no menu
**Skin**. Pacotes no formato `desktop-pet-sprite-pack-v1` podem ser convertidos com
`npm run import-skin -- <pasta> <id> "<Nome>"`.

**Licença:** só envie arte que você fez ou tem direito de distribuir. Personagens de
terceiros (anime, jogos, marcas) não entram no repositório.

## Lançando uma versão (mantenedores)

1. Atualize a versão em `package.json` **e** em `plugin/.claude-plugin/plugin.json`.
2. Mova os itens de "Não lançado" do [CHANGELOG](CHANGELOG.md) pra nova versão.
3. Commit, depois `git tag vX.Y.Z && git push --tags`.
4. O workflow **Release** gera o instalador e cria um **rascunho** de release com ele
   anexado. Revise as notas e publique.
