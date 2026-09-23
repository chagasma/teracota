// Protocolo de eventos do personagem — compartilhado entre app, hooks e MCP.

export const DEFAULT_PORT = 7777;

export const EXPRESSIONS = ['neutral', 'happy', 'focused', 'confused', 'surprised', 'sleepy', 'sad'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const ANIMS = ['bob', 'type', 'sway', 'shake', 'jump', 'breathe', 'perk', 'wave'] as const;
export type Anim = (typeof ANIMS)[number];

export const STATES = [
  'idle', 'listening', 'thinking', 'reading', 'searching', 'typing', 'terminal', 'web',
  'delegating', 'error', 'attention', 'happy', 'sad', 'sleeping',
] as const;
export type StateName = (typeof STATES)[number];

export interface WaifuEvent {
  /** Atividade — define expressão/animação/ícone padrão */
  state?: StateName;
  /** Sobrescreve a expressão do estado (ou reação passageira, se não houver state) */
  expression?: Expression;
  /** Sobrescreve a animação do estado (ou reação passageira, se não houver state) */
  anim?: Anim;
  /** Texto do balão de fala */
  say?: string;
  /** ms até voltar ao estado base */
  duration?: number;
  /** Claude está no meio de uma tarefa (entre o prompt e o Stop) */
  working?: boolean;
  /** Projeto de origem — aparece no balão quando há várias sessões numa waifu só */
  from?: string;
}

export function getPort(): number {
  return Number(process.env.TERRACOTA_PORT) || DEFAULT_PORT;
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Valida um evento vindo de fora (HTTP); descarta campos inválidos. */
export function parseEvent(input: unknown): WaifuEvent | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const ev: WaifuEvent = {};
  if (isOneOf(STATES, o.state)) ev.state = o.state;
  if (isOneOf(EXPRESSIONS, o.expression)) ev.expression = o.expression;
  if (isOneOf(ANIMS, o.anim)) ev.anim = o.anim;
  if (typeof o.say === 'string' && o.say.trim()) ev.say = o.say.trim().slice(0, 280);
  if (typeof o.duration === 'number' && o.duration > 0) ev.duration = Math.min(o.duration, 60_000);
  if (typeof o.working === 'boolean') ev.working = o.working;
  if (typeof o.from === 'string' && o.from.trim()) ev.from = o.from.trim().slice(0, 40);
  return Object.keys(ev).length ? ev : null;
}
