// Contrato de IPC entre o processo principal e o renderer (via preload).
import type { WaifuEvent } from './protocol';
import type { SkinInfo } from './skin';

export const IPC = {
  event: 'waifu:event',
  walk: 'waifu:walk',
  cursor: 'waifu:cursor',
  mode: 'waifu:mode',
  identity: 'waifu:identity',
  leave: 'waifu:leave',
  setIgnoreMouse: 'waifu:set-ignore-mouse',
  contextMenu: 'waifu:context-menu',
  moveBy: 'waifu:move-by',
  dragEnd: 'waifu:drag-end',
  walkAllowed: 'waifu:walk-allowed',
  getSkin: 'waifu:get-skin',
} as const;

/** roam = passeia pela tela; stay = fica parado onde foi deixado */
export type MoveMode = 'roam' | 'stay';

/** single = uma waifu pra todas as sessões; multi = uma por sessão do Claude */
export type EntityMode = 'single' | 'multi';

export interface WalkInfo {
  walking: boolean;
  /** 1 = direita, -1 = esquerda */
  dir: 1 | -1;
}

export interface ModeInfo {
  mode: MoveMode;
  /** true quando o usuário acabou de trocar (o personagem comenta) */
  announce: boolean;
}

/** Quem a entidade representa: projeto (plaquinha) e cor */
export interface Identity {
  label: string | null;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface WaifuApi {
  /** Skin atual (null = personagem SVG) */
  getSkin(): Promise<SkinInfo | null>;
  onEvent(cb: (event: WaifuEvent) => void): void;
  onWalk(cb: (info: WalkInfo) => void): void;
  /** Posição do cursor relativa à janela */
  onCursor(cb: (p: Point) => void): void;
  onMode(cb: (info: ModeInfo) => void): void;
  onIdentity(cb: (identity: Identity) => void): void;
  /** A entidade vai embora (sessão encerrada) — a janela fecha logo depois */
  onLeave(cb: () => void): void;
  setIgnoreMouse(ignore: boolean): void;
  openContextMenu(): void;
  moveBy(dx: number, dy: number): void;
  dragEnd(): void;
  setWalkAllowed(allowed: boolean): void;
}

declare global {
  interface Window {
    waifu?: WaifuApi;
  }
}
