import { describe, expect, it } from 'vitest';
import { parseEvent } from './protocol';

describe('parseEvent', () => {
  it('aceita um evento completo', () => {
    expect(parseEvent({ state: 'typing', expression: 'happy', anim: 'jump', say: 'oi', duration: 500, working: true, from: 'api' }))
      .toEqual({ state: 'typing', expression: 'happy', anim: 'jump', say: 'oi', duration: 500, working: true, from: 'api' });
  });

  it('descarta campos inválidos e mantém os válidos', () => {
    expect(parseEvent({ state: 'voando', expression: 'happy', duration: -1, working: 'sim' })).toEqual({ expression: 'happy' });
  });

  it('retorna null quando não sobra nada', () => {
    expect(parseEvent({ state: 'voando' })).toBeNull();
    expect(parseEvent(null)).toBeNull();
    expect(parseEvent('typing')).toBeNull();
    expect(parseEvent([])).toBeNull();
  });

  it('corta textos longos e limita a duração', () => {
    const ev = parseEvent({ say: `  ${'a'.repeat(500)}  `, from: 'x'.repeat(100), duration: 10 * 60_000 });
    expect(ev?.say).toHaveLength(280);
    expect(ev?.from).toHaveLength(40);
    expect(ev?.duration).toBe(60_000);
  });

  it('ignora fala vazia', () => {
    expect(parseEvent({ say: '   ', state: 'idle' })).toEqual({ state: 'idle' });
  });
});
