// Preferências persistidas: modos e última posição da waifu principal.
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { EntityMode, MoveMode } from '../shared/ipc';

export interface Config {
  moveMode: MoveMode;
  entityMode: EntityMode;
  /** id da skin; ausente = primeira disponível */
  skin?: string;
  x?: number;
  y?: number;
}

const file = () => path.join(app.getPath('userData'), 'config.json');

export function loadConfig(): Config {
  try {
    const raw = JSON.parse(fs.readFileSync(file(), 'utf8')) as Partial<Config> & { mode?: string };
    const moveMode = raw.moveMode ?? raw.mode; // 'mode' era o nome antigo
    return {
      moveMode: moveMode === 'stay' ? 'stay' : 'roam',
      entityMode: raw.entityMode === 'multi' ? 'multi' : 'single',
      ...(typeof raw.skin === 'string' && { skin: raw.skin }),
      ...(typeof raw.x === 'number' && typeof raw.y === 'number' && { x: raw.x, y: raw.y }),
    };
  } catch {
    return { moveMode: 'roam', entityMode: 'single' };
  }
}

let saveTimer: NodeJS.Timeout | undefined;

export function saveConfig(config: Config): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(file(), JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('[waifu] não consegui salvar config:', err);
    }
  }, 500);
}
