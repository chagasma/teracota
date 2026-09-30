import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_TIMEOUT_MS, SessionTracker, projectName } from './sessions';

describe('projectName', () => {
  it('usa o nome da pasta', () => {
    expect(projectName('K:\\dev\\front')).toBe('front');
    expect(projectName('/home/ana/api-server/')).toBe('api-server');
  });

  it('cai em "claude" sem pasta', () => {
    expect(projectName(undefined)).toBe('claude');
    expect(projectName('')).toBe('claude');
  });
});

describe('SessionTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => vi.useRealTimers());

  it('lista as sessões da mais recente pra mais antiga', () => {
    const t = new SessionTracker();
    t.touch('a', 'api');
    vi.advanceTimersByTime(1000);
    t.touch('b', 'front');
    expect(t.list().map((s) => s.id)).toEqual(['b', 'a']);
    expect(t.size).toBe(2);
  });

  it('sabe se alguma sessão está trabalhando', () => {
    const t = new SessionTracker();
    t.touch('a', 'api');
    t.touch('b', 'front').working = true;
    expect(t.anyWorking()).toBe(true);
    t.remove('b');
    expect(t.anyWorking()).toBe(false);
  });

  it('solta o "trabalhando" travado depois de 10 min sem eventos', () => {
    const t = new SessionTracker();
    t.touch('a', 'api').working = true;
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(t.prune()).toEqual({ removed: [], workingChanged: true });
    expect(t.anyWorking()).toBe(false);
  });

  it('expira sessões sumidas (terminal fechado à força)', () => {
    const t = new SessionTracker();
    t.touch('velha', 'api');
    vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 1000);
    t.touch('nova', 'front');
    vi.advanceTimersByTime(2000);
    expect(t.prune().removed).toEqual(['velha']);
    expect(t.list().map((s) => s.id)).toEqual(['nova']);
  });
});
