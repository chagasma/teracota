# Segurança

## Como o app se expõe

O Teracota abre um servidor HTTP local em `127.0.0.1:7777` para receber os eventos
dos agentes (hooks do plugin do Claude Code e a API local) e servir o MCP, usado pelas
falas opcionais. Por projeto:

- Ele só escuta em `127.0.0.1` (não aceita conexões de outras máquinas).
- Recusa requisições com header `Origin` (páginas web) e com `Host` diferente de
  `127.0.0.1`/`localhost` (proteção contra DNS rebinding).
- Os eventos só mudam o que a Tera mostra: não executam comandos nem leem arquivos.
- Os hooks do plugin só repassam o JSON do evento pra esse endereço. O app lê só o nome do
  evento, o id da sessão, a pasta do projeto e o nome da ferramenta, e não guarda nem envia nada.
- O app não abre conexões pra fora. O que ele executa é a CLI do Claude, se ela estiver
  instalada: ao abrir, só comandos de leitura (`claude plugin list`, `claude mcp get teracota`)
  pra saber se a integração está ativa; e, quando você pede no menu, os de instalação ou
  remoção (`claude plugin marketplace add/install`, `claude mcp add/remove`).

## Reportando uma falha

**Não abra issue pública.** Use o
[relato privado de vulnerabilidade](https://github.com/kyotodevIndie/teracota/security/advisories/new)
do GitHub, com os passos pra reproduzir e o impacto que você imagina.

Respondemos assim que possível e combinamos com você quando divulgar a correção.

## Versões suportadas

Só a versão mais recente recebe correções de segurança.
