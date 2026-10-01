// Conexão com agentes, genérica pra qualquer adapter que ofereça `connect`:
// - "Conectar ao <agente>" no menu
// - oferta na primeira vez: a Tera avisa que achou o agente e um clique nela conecta
import { clipboard } from 'electron';
import { ADAPTERS } from './integrations';
import type { AgentAdapter } from './integrations/types';
import type { EntityManager } from './manager';

/** Por quanto tempo um clique na Tera ainda aceita a oferta */
const OFFER_VALID_MS = 2 * 60 * 1000;

let connecting = false;
let offer: { adapter: AgentAdapter; until: number } | null = null;

/** Roda a conexão oferecida por um adapter e a Tera conta como foi */
export async function connectAgent(manager: EntityManager, adapter: AgentAdapter): Promise<void> {
  const connector = adapter.connect;
  if (!connector || connecting) return;
  connecting = true;
  offer = null;
  manager.setVisible(true);
  manager.broadcast({ state: 'thinking', say: `Conectando ao ${adapter.displayName}... ⏳` });
  const result = await connector.run();
  connecting = false;

  if (result.ok) {
    manager.markConnectOffered();
    manager.broadcast({
      state: 'happy',
      duration: 8000,
      say: 'Pronto, conectei! Sessões que já estavam abertas precisam ser reiniciadas 😊',
    });
    return;
  }
  clipboard.writeText(connector.manualCommand);
  if (result.reason === 'failed') console.error(`[teracota] falha ao conectar ${adapter.id}:\n`, result.output);
  manager.broadcast({
    state: result.reason === 'not-found' ? 'attention' : 'error',
    duration: 9000,
    say: result.reason === 'not-found'
      ? `Não achei o ${adapter.displayName} aqui 🤔 Copiei um comando: cola num terminal e aperta Enter!`
      : 'Algo deu errado 😣 Copiei o comando: cola num terminal pra ver o que houve.',
  });
}

/**
 * Oferece a conexão (uma vez por instalação) se algum agente estiver instalado e
 * ainda não conectado. Não instala nada sozinha: espera o clique — mexer na
 * configuração do agente precisa do consentimento de quem usa.
 */
export async function offerConnection(manager: EntityManager): Promise<void> {
  if (manager.connectOffered) return;
  for (const adapter of ADAPTERS) {
    if (!adapter.connect) continue;
    const status = await adapter.connect.status().catch(() => 'unavailable' as const);
    if (status === 'connected') {
      manager.markConnectOffered(); // já integrado: nunca precisa oferecer
      return;
    }
    if (status !== 'available') continue;
    manager.markConnectOffered();
    offer = { adapter, until: Date.now() + OFFER_VALID_MS };
    manager.broadcast({
      state: 'attention',
      duration: 12_000,
      say: `Achei o ${adapter.displayName}! Clica em mim que eu me conecto 🔌`,
    });
    return;
  }
}

/** Clique numa Tera: com oferta pendente, aceita e conecta */
export function onTeraClicked(manager: EntityManager): void {
  if (!offer) return;
  const { adapter, until } = offer;
  offer = null;
  if (Date.now() <= until) void connectAgent(manager, adapter);
}
