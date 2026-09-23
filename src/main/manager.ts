// Decide qual waifu recebe cada evento, conforme o modo:
// - single: uma waifu só; agrega o estado de todas as sessões
// - multi:  uma waifu por sessão; a primeira ("de casa") nunca vai embora
import type { WebContents } from 'electron';
import { screen } from 'electron';
import { ENTITY_COLORS } from '../shared/brand';
import type { EntityMode, Identity, MoveMode, Point } from '../shared/ipc';
import type { WaifuEvent } from '../shared/protocol';
import { saveConfig, type Config } from './config';
import { Entity, SIZE, cornerPosition, isOnScreen } from './entity';
import { WAIFU_TOOL_PREFIX, translateHook, type HookInput } from './hooks';
import { SessionTracker, projectName } from './sessions';

export const MAX_ENTITIES = 5;
const PRUNE_EVERY_MS = 30_000;
/** Janela pra casar a chamada MCP com o PreToolUse que a precedeu */
const MCP_MATCH_MS = 5000;

const HOME_IDENTITY: Identity = { label: null, color: ENTITY_COLORS[0] };

export class EntityManager {
  private entities: Entity[] = [];
  private readonly sessions = new SessionTracker();
  private pendingMcp: { sessionId: string; at: number } | null = null;

  constructor(private config: Config) {
    setInterval(() => this.prune(), PRUNE_EVERY_MS);
  }

  get mode(): EntityMode {
    return this.config.entityMode;
  }

  get moveMode(): MoveMode {
    return this.config.moveMode;
  }

  start(): void {
    this.spawnHome();
  }

  byWebContents(wc: WebContents): Entity | undefined {
    return this.entities.find((e) => e.alive && e.win.webContents === wc);
  }

  // ---------- entrada de eventos ----------

  handleHook(input: HookInput): void {
    const name = input.hook_event_name;
    const id = input.session_id ?? 'default';
    const project = projectName(input.cwd);
    const session = this.sessions.touch(id, project);

    if (name === 'UserPromptSubmit' || name === 'PreToolUse') session.working = true;
    if (name === 'Stop' || name === 'SessionEnd') session.working = false;
    if (name === 'PreToolUse' && input.tool_name?.startsWith(WAIFU_TOOL_PREFIX)) {
      this.pendingMcp = { sessionId: id, at: Date.now() };
    }
    if (name === 'SessionEnd') this.sessions.remove(id);

    const event = translateHook(input);
    if (this.mode === 'single') this.routeSingle(name, project, event);
    else this.routeMulti(name, id, project, event);
  }

  /** Evento genérico (POST /event, demo): sem sessão, vai pra todas */
  handleEvent(event: WaifuEvent): void {
    this.broadcast(event);
  }

  /** Evento vindo do MCP: vai pra waifu da sessão que chamou a ferramenta */
  handleMcp(event: WaifuEvent): void {
    const pending = this.pendingMcp && Date.now() - this.pendingMcp.at < MCP_MATCH_MS ? this.pendingMcp : null;
    this.pendingMcp = null;
    const sessionId = pending?.sessionId ?? this.sessions.list()[0]?.id;
    const target = (sessionId && this.entityFor(sessionId)) || this.entities[0];
    target?.send(event);
  }

  broadcast(event: WaifuEvent): void {
    for (const e of this.entities) e.send(event);
  }

  // ---------- modos ----------

  setEntityMode(mode: EntityMode): void {
    if (mode === this.mode) return;
    this.updateConfig({ entityMode: mode });
    // cria a nova antes de fechar as antigas — senão 'window-all-closed' encerra o app
    const old = this.entities;
    this.entities = [];
    this.spawnHome();
    for (const e of old) e.destroy();
    if (mode === 'multi') {
      for (const s of this.sessions.list().slice(0, MAX_ENTITIES)) this.assign(s.id, s.project);
      this.broadcast({ state: 'happy', say: 'Uma pra cada sessão! 👯' });
    } else {
      this.entities[0]?.send({ state: 'happy', working: this.sessions.anyWorking(), say: 'Deixa comigo, cuido de tudo!' });
    }
  }

  get skinId(): string | undefined {
    return this.config.skin;
  }

  /** Troca a skin de todas as waifus (recarrega as janelas) */
  setSkin(id: string): void {
    this.updateConfig({ skin: id });
    for (const e of this.entities) e.win.reload();
  }

  setMoveMode(mode: MoveMode): void {
    this.updateConfig({ moveMode: mode });
    for (const e of this.entities) e.setMoveMode(mode, true);
  }

  // ---------- roteamento ----------

  private routeSingle(name: string | undefined, project: string, event: WaifuEvent | null): void {
    const home = this.entities[0];
    if (!home || !event) return;
    event.working = this.sessions.anyWorking();
    if (name === 'SessionEnd' && this.sessions.size > 0) {
      // ainda há outras sessões: só se despede daquela, sem dormir
      home.send({ say: 'Tchau! 👋', from: project, working: event.working });
      return;
    }
    if (this.sessions.size > 1 && event.say) event.from = project;
    home.send(event);
  }

  private routeMulti(name: string | undefined, id: string, project: string, event: WaifuEvent | null): void {
    let entity = this.entityFor(id);
    if (name === 'SessionEnd') {
      if (entity) this.release(entity);
      return;
    }
    entity ??= this.assign(id, project) ?? undefined;
    if (!entity) return;
    if (entity.identity.label !== project) entity.setIdentity(id, { ...entity.identity, label: project });
    if (event) entity.send(event);
  }

  private entityFor(sessionId: string): Entity | undefined {
    return this.entities.find((e) => e.sessionId === sessionId);
  }

  /** Dá uma waifu pra sessão: reaproveita a de casa se estiver livre, senão cria outra */
  private assign(sessionId: string, project: string): Entity | null {
    const free = this.entities.find((e) => e.sessionId === null);
    if (free) {
      free.setIdentity(sessionId, { ...free.identity, label: project });
      return free;
    }
    if (this.entities.length >= MAX_ENTITIES) return null;
    const used = new Set(this.entities.map((e) => e.identity.color));
    const color = ENTITY_COLORS.find((c) => !used.has(c)) ?? ENTITY_COLORS[0];
    const entity = this.spawn(this.freeSpot(), { label: project, color });
    entity.sessionId = sessionId;
    return entity;
  }

  /** Sessão acabou: a última waifu volta a ser "de casa"; as outras vão embora */
  private release(entity: Entity): void {
    if (this.entities.length === 1) {
      entity.setIdentity(null, HOME_IDENTITY);
      entity.send({ state: 'idle', working: false, say: 'Tchau! 👋' });
      return;
    }
    this.entities = this.entities.filter((e) => e !== entity);
    entity.leave();
  }

  private prune(): void {
    const { removed, workingChanged } = this.sessions.prune();
    if (this.mode === 'multi') {
      for (const id of removed) {
        const e = this.entityFor(id);
        if (e) this.release(e);
      }
    } else if (workingChanged) {
      this.entities[0]?.send({ working: this.sessions.anyWorking() });
    }
  }

  // ---------- criação ----------

  private spawnHome(): void {
    const { x, y } = this.config;
    const saved = x !== undefined && y !== undefined ? { x, y } : null;
    this.spawn(saved && isOnScreen(saved) ? saved : cornerPosition(), HOME_IDENTITY, true);
  }

  private spawn(position: Point, identity: Identity, persist = false): Entity {
    const entity = new Entity({
      position,
      identity,
      moveMode: this.moveMode,
      // só a primeira waifu lembra a posição entre execuções
      onSettle: persist ? ({ x, y }) => this.updateConfig({ x, y }) : undefined,
    });
    entity.win.on('closed', () => { this.entities = this.entities.filter((e) => e !== entity); });
    this.entities.push(entity);
    return entity;
  }

  /** Um lugar no rodapé da tela longe das outras waifus */
  private freeSpot(): Point {
    const area = screen.getPrimaryDisplay().workArea;
    const y = area.y + area.height - SIZE.height;
    const others = this.entities.map((e) => e.position.x);
    let best = { x: area.x, score: -1 };
    for (let i = 0; i < 12; i++) {
      const x = area.x + Math.random() * (area.width - SIZE.width);
      const score = Math.min(Infinity, ...others.map((o) => Math.abs(o - x)));
      if (score > best.score) best = { x, score };
    }
    return { x: best.x, y };
  }

  private updateConfig(patch: Partial<Config>): void {
    this.config = { ...this.config, ...patch };
    saveConfig(this.config);
  }
}
