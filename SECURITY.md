# Segurança

## Como o app se expõe

O Terracota abre um servidor HTTP local em `127.0.0.1:7777` para receber os eventos
do Claude Code (hooks) e servir o MCP. Por projeto:

- Ele só escuta em `127.0.0.1` (não aceita conexões de outras máquinas).
- Recusa requisições com header `Origin` (páginas web) e com `Host` diferente de
  `127.0.0.1`/`localhost` (proteção contra DNS rebinding).
- Os eventos só mudam o que a Tera mostra: não executam comandos nem leem arquivos.
- Os hooks do plugin só repassam o JSON do evento pra esse endereço.

## Reportando uma falha

**Não abra issue pública.** Use o
[relato privado de vulnerabilidade](https://github.com/OWNER/terracota/security/advisories/new)
do GitHub, com os passos pra reproduzir e o impacto que você imagina.

Respondemos assim que possível e combinamos com você quando divulgar a correção.

## Versões suportadas

Só a versão mais recente recebe correções de segurança.
