// Tradução dos eventos de hook do Claude Code (JSON cru vindo do curl) para
// eventos do personagem.
import { MCP_SERVER_NAME } from '../shared/brand';
import type { StateName, WaifuEvent } from '../shared/protocol';

export interface HookInput {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  source?: string;
}

export const WAIFU_TOOL_PREFIX = `mcp__${MCP_SERVER_NAME}__`;

const TOOL_STATES: Record<string, StateName> = {
  Read: 'reading', NotebookRead: 'reading',
  Grep: 'searching', Glob: 'searching', ToolSearch: 'searching',
  Edit: 'typing', Write: 'typing', MultiEdit: 'typing', NotebookEdit: 'typing',
  Bash: 'terminal', PowerShell: 'terminal', Monitor: 'terminal',
  WebFetch: 'web', WebSearch: 'web',
  Agent: 'delegating', Task: 'delegating',
};

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;

function toolState(name = ''): StateName | null {
  if (name.startsWith(WAIFU_TOOL_PREFIX)) return null; // o próprio MCP já controla o personagem
  if (TOOL_STATES[name]) return TOOL_STATES[name];
  if (/browser|chrome/i.test(name)) return 'web';
  return 'thinking';
}

export function parseHookInput(input: unknown): HookInput | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const hook: HookInput = {
    hook_event_name: str(o.hook_event_name),
    session_id: str(o.session_id),
    cwd: str(o.cwd),
    tool_name: str(o.tool_name),
    source: str(o.source),
  };
  return hook.hook_event_name ? hook : null;
}

export function translateHook(input: HookInput): WaifuEvent | null {
  switch (input.hook_event_name) {
    case 'SessionStart':
      // /clear e compactação também disparam SessionStart — só cumprimenta em sessão nova
      if (input.source === 'compact') return null;
      return { state: 'attention', duration: 3000, say: pick(['Oi! Bora trabalhar?', 'Cheguei! ✨', 'Pronta pra codar!']) };
    case 'UserPromptSubmit':
      return { state: 'listening', working: true };
    case 'PreToolUse': {
      const state = toolState(input.tool_name);
      return state ? { state, working: true } : null;
    }
    case 'PostToolUseFailure':
      return { state: 'error', say: pick(['Ops...', 'Hmm, deu erro.', 'Eita!']) };
    case 'Notification':
      return { state: 'attention', say: pick(['Ei, preciso de você!', 'Psiu! Dá uma olhada?', 'Tô esperando você 👀']) };
    case 'Stop':
      return { state: 'happy', working: false, say: pick(['Pronto!', 'Terminei! ✨', 'Feito!', 'Tá aí!']) };
    case 'SessionEnd':
      return { state: 'sleeping', working: false, say: 'Até mais! 💤' };
    default:
      return null;
  }
}
