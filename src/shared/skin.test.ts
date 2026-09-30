import { describe, expect, it } from 'vitest';
import { parseSkinManifest } from './skin';

const frames = (n: number) => Array.from({ length: n }, (_, i) => `f${i}.png`);

describe('parseSkinManifest', () => {
  it('lê uma skin válida com os padrões', () => {
    const skin = parseSkinManifest({ name: 'Tera', animations: { idle: { frames: frames(2), durations: [100, 200] } } });
    expect(skin).toEqual({
      name: 'Tera',
      size: 260,
      facing: 'right',
      animations: { idle: { frames: frames(2), durations: [100, 200], loop: true, scale: 1 } },
    });
  });

  it('exige a pose idle', () => {
    expect(parseSkinManifest({ animations: { walk: { frames: frames(1) } } })).toBeNull();
    expect(parseSkinManifest({})).toBeNull();
    expect(parseSkinManifest(null)).toBeNull();
  });

  it('ignora poses desconhecidas e completa durações faltando', () => {
    const skin = parseSkinManifest({
      animations: { idle: { frames: frames(3), durations: [100] }, voar: { frames: frames(1) } },
    });
    expect(skin?.animations.idle?.durations).toEqual([100, 150, 150]);
    expect(Object.keys(skin!.animations)).toEqual(['idle']);
  });

  it('aceita loop, scale e swing válidos', () => {
    const skin = parseSkinManifest({
      animations: {
        idle: { frames: frames(1) },
        land: { frames: frames(4), loop: false },
        work: { frames: frames(4), scale: 0.84 },
        drag: { frames: frames(4), swing: { feetRight: 0, center: 1, feetLeft: 2, lean: 8 } },
      },
    });
    expect(skin?.animations.land?.loop).toBe(false);
    expect(skin?.animations.work?.scale).toBe(0.84);
    expect(skin?.animations.drag?.swing).toEqual({ feetRight: 0, center: 1, feetLeft: 2, lean: 8 });
  });

  it('descarta scale absurdo e swing apontando pra frame inexistente', () => {
    const skin = parseSkinManifest({
      animations: {
        idle: { frames: frames(1), scale: 50 },
        drag: { frames: frames(2), swing: { feetRight: 0, center: 1, feetLeft: 5 } },
      },
    });
    expect(skin?.animations.idle?.scale).toBe(1);
    expect(skin?.animations.drag?.swing).toBeUndefined();
  });
});
