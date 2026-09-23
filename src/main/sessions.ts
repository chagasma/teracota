// Acompanha as sessões do Claude Code que estão mandando eventos.
import path from 'node:path';

export interface Session {
  id: string;
  project: string;
  working: boolean;
  lastSeen: number;
}

/** Sem eventos por esse tempo → sessão considerada encerrada (terminal fechado à força) */
export const SESSION_TIMEOUT_MS = 45 * 60 * 1000;
/** "Trabalhando" sem eventos por esse tempo → provavelmente foi interrompido (Esc) */
const WORKING_STALE_MS = 10 * 60 * 1000;

export function projectName(cwd: string | undefined): string {
  return (cwd && path.basename(cwd.replace(/[\\/]+$/, ''))) || 'claude';
}

export class SessionTracker {
  private readonly sessions = new Map<string, Session>();

  get size(): number {
    return this.sessions.size;
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  touch(id: string, project: string): Session {
    let s = this.sessions.get(id);
    if (!s) {
      s = { id, project, working: false, lastSeen: 0 };
      this.sessions.set(id, s);
    }
    s.project = project;
    s.lastSeen = Date.now();
    return s;
  }

  remove(id: string): void {
    this.sessions.delete(id);
  }

  anyWorking(): boolean {
    return [...this.sessions.values()].some((s) => s.working);
  }

  /** Mais recentes primeiro */
  list(): Session[] {
    return [...this.sessions.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  }

  /**
   * Expira sessões sumidas e "trabalhando" travados.
   * Retorna os ids removidos e se algum estado de trabalho mudou.
   */
  prune(now = Date.now()): { removed: string[]; workingChanged: boolean } {
    const removed: string[] = [];
    let workingChanged = false;
    for (const s of this.sessions.values()) {
      const idle = now - s.lastSeen;
      if (idle > SESSION_TIMEOUT_MS) {
        this.sessions.delete(s.id);
        removed.push(s.id);
        if (s.working) workingChanged = true;
      } else if (s.working && idle > WORKING_STALE_MS) {
        s.working = false;
        workingChanged = true;
      }
    }
    return { removed, workingChanged };
  }
}
