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
  /** Já se apresentou na primeira execução */
  onboarded?: boolean;
  x?: number;
  y?: number;
}

const file = () => path.join(app.getPath('userData'), 'config.json');
/** Onde a config ficava quando o app se chamava waifu-claude */
const legacyFile = () => path.join(app.getPath('appData'), 'waifu-claude', 'config.json');

export function loadConfig(): Config {
  try {
    const source = fs.existsSync(file()) ? file() : legacyFile();
    const raw = JSON.parse(fs.readFileSync(source, 'utf8')) as Partial<Config> & { mode?: string };
    const moveMode = raw.moveMode ?? raw.mode; // 'mode' era o nome antigo
    return {
      moveMode: moveMode === 'stay' ? 'stay' : 'roam',
      entityMode: raw.entityMode === 'multi' ? 'multi' : 'single',
      ...(typeof raw.skin === 'string' && { skin: raw.skin }),
      ...(raw.onboarded === true && { onboarded: true }),
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
      console.error('[terracota] não consegui salvar config:', err);
    }
  }, 500);
}
