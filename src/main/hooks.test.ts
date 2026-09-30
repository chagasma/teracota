import { describe, expect, it } from 'vitest';
import { WAIFU_TOOL_PREFIX, parseHookInput, translateHook } from './hooks';

describe('parseHookInput', () => {
  it('pega só os campos que o app usa', () => {
    expect(parseHookInput({
      hook_event_name: 'PreToolUse', session_id: 's1', cwd: 'C:\\dev\\api', tool_name: 'Edit',
      tool_input: { file_path: 'x' }, transcript_path: 'y',
    })).toEqual({ hook_event_name: 'PreToolUse', session_id: 's1', cwd: 'C:\\dev\\api', tool_name: 'Edit', source: undefined });
  });

  it('rejeita payload sem nome de evento', () => {
    expect(parseHookInput({ session_id: 's1' })).toBeNull();
    expect(parseHookInput(null)).toBeNull();
    expect(parseHookInput({ hook_event_name: 42 })).toBeNull();
  });
});

describe('translateHook', () => {
  const tool = (tool_name: string) => translateHook({ hook_event_name: 'PreToolUse', tool_name });

  it('mapeia ferramentas pra atividades', () => {
    expect(tool('Read')?.state).toBe('reading');
    expect(tool('Grep')?.state).toBe('searching');
    expect(tool('Edit')?.state).toBe('typing');
    expect(tool('Bash')?.state).toBe('terminal');
    expect(tool('PowerShell')?.state).toBe('terminal');
    expect(tool('WebFetch')?.state).toBe('web');
    expect(tool('mcp__Claude_Browser__navigate')?.state).toBe('web');
    expect(tool('Agent')?.state).toBe('delegating');
  });

  it('ferramenta desconhecida vira "pensando"', () => {
    expect(tool('mcp__outro__qualquer')).toEqual({ state: 'thinking', working: true });
  });

  it('ignora as ferramentas do próprio MCP (elas já controlam a Tera)', () => {
    expect(tool(`${WAIFU_TOOL_PREFIX}say`)).toBeNull();
  });

  it('marca o começo e o fim do trabalho', () => {
    expect(translateHook({ hook_event_name: 'UserPromptSubmit' })).toMatchObject({ state: 'listening', working: true });
    expect(translateHook({ hook_event_name: 'Stop' })).toMatchObject({ state: 'happy', working: false });
    expect(translateHook({ hook_event_name: 'SessionEnd' })).toMatchObject({ state: 'sleeping', working: false });
  });

  it('erro, atenção e cumprimento', () => {
    expect(translateHook({ hook_event_name: 'PostToolUseFailure' })?.state).toBe('error');
    expect(translateHook({ hook_event_name: 'Notification' })?.state).toBe('attention');
    expect(translateHook({ hook_event_name: 'SessionStart', source: 'startup' })?.state).toBe('attention');
  });

  it('não cumprimenta de novo depois de compactar a conversa', () => {
    expect(translateHook({ hook_event_name: 'SessionStart', source: 'compact' })).toBeNull();
  });

  it('eventos desconhecidos são ignorados', () => {
    expect(translateHook({ hook_event_name: 'PreCompact' })).toBeNull();
  });
});
