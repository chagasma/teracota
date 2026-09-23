// Descobre e carrega skins de:
//   <app>/assets/skins/<id>/skin.json      (skins que vêm com o app)
//   <userData>/skins/<id>/skin.json        (skins instaladas pelo usuário)
import { app, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  HIT_MASK_SIZE, SVG_SKIN_ID, parseSkinManifest,
  type Pose, type SkinAnimation, type SkinInfo, type SkinManifest,
} from '../shared/skin';

export interface SkinEntry {
  id: string;
  name: string;
}

function skinRoots(): string[] {
  return [path.join(app.getAppPath(), 'assets', 'skins'), path.join(app.getPath('userData'), 'skins')];
}

function findSkinDir(id: string): string | null {
  for (const root of skinRoots()) {
    const dir = path.join(root, id);
    if (fs.existsSync(path.join(dir, 'skin.json'))) return dir;
  }
  return null;
}

function readManifest(dir: string): SkinManifest | null {
  try {
    return parseSkinManifest(JSON.parse(fs.readFileSync(path.join(dir, 'skin.json'), 'utf8')));
  } catch (err) {
    console.error(`[terracota] skin em "${dir}" inválida:`, err);
    return null;
  }
}

/** Canal alfa do frame reduzido pra HIT_MASK_SIZE² */
function hitMask(file: string): Uint8Array {
  const img = nativeImage.createFromPath(file).resize({ width: HIT_MASK_SIZE, height: HIT_MASK_SIZE, quality: 'good' });
  const px = img.toBitmap(); // BGRA ou RGBA conforme a plataforma — o alfa é sempre o 4º byte
  const mask = new Uint8Array(HIT_MASK_SIZE * HIT_MASK_SIZE);
  for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] ?? 0;
  return mask;
}

const cache = new Map<string, SkinInfo>();

function readSkin(id: string): SkinInfo | null {
  const cached = cache.get(id);
  if (cached) return cached;
  const dir = findSkinDir(id);
  const manifest = dir && readManifest(dir);
  if (!dir || !manifest) return null;
  const hitMasks: SkinInfo['hitMasks'] = {};
  for (const [pose, anim] of Object.entries(manifest.animations) as [Pose, SkinAnimation][]) {
    hitMasks[pose] = anim.frames.map((f) => hitMask(path.join(dir, f)));
  }
  const skin: SkinInfo = { id, baseUrl: `${pathToFileURL(dir).href}/`, manifest, hitMasks };
  cache.set(id, skin);
  return skin;
}

export function listSkins(): SkinEntry[] {
  const seen = new Map<string, SkinEntry>();
  for (const root of skinRoots()) {
    if (!fs.existsSync(root)) continue;
    for (const id of fs.readdirSync(root)) {
      if (seen.has(id)) continue;
      const manifest = readManifest(path.join(root, id));
      if (manifest) seen.set(id, { id, name: manifest.name });
    }
  }
  return [...seen.values()];
}

/** A skin configurada; sem configuração, a primeira disponível; null = personagem SVG */
export function loadSkin(id: string | undefined): SkinInfo | null {
  if (id === SVG_SKIN_ID) return null;
  if (id) {
    const skin = readSkin(id);
    if (skin) return skin;
  }
  const first = listSkins()[0];
  return first ? readSkin(first.id) : null;
}
