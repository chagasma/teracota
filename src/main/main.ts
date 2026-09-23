// Processo principal: ciclo de vida do app, IPC e menu de contexto.
import { app, ipcMain, Menu, type IpcMainEvent, type MenuItemConstructorOptions } from 'electron';
import { CHARACTER_NAME } from '../shared/brand';
import { IPC } from '../shared/ipc';
import { getPort } from '../shared/protocol';
import { SVG_SKIN_ID } from '../shared/skin';
import { loadConfig } from './config';
import type { Entity } from './entity';
import { EntityManager, MAX_ENTITIES } from './manager';
import { startEventServer } from './server';
import { listSkins, loadSkin } from './skins';

let manager: EntityManager;

function skinMenu(): MenuItemConstructorOptions[] {
  const current = loadSkin(manager.skinId)?.id ?? SVG_SKIN_ID;
  return [
    ...listSkins().map((s): MenuItemConstructorOptions => ({
      label: s.name, type: 'radio', checked: s.id === current, click: () => manager.setSkin(s.id),
    })),
    { label: 'Clássica (desenho)', type: 'radio', checked: current === SVG_SKIN_ID, click: () => manager.setSkin(SVG_SKIN_ID) },
  ];
}

function showContextMenu(entity: Entity): void {
  const label = entity.identity.label;
  Menu.buildFromTemplate([
    ...(label ? [{ label: `📁 ${label}`, enabled: false }, { type: 'separator' as const }] : []),
    { label: 'Passear pela tela', type: 'radio', checked: manager.moveMode === 'roam', click: () => manager.setMoveMode('roam') },
    { label: 'Ficar parado aqui', type: 'radio', checked: manager.moveMode === 'stay', click: () => manager.setMoveMode('stay') },
    { type: 'separator' },
    { label: `Uma ${CHARACTER_NAME} só`, type: 'radio', checked: manager.mode === 'single', click: () => manager.setEntityMode('single') },
    {
      label: `Uma por sessão (até ${MAX_ENTITIES})`, type: 'radio', checked: manager.mode === 'multi',
      click: () => manager.setEntityMode('multi'),
    },
    { type: 'separator' },
    { label: 'Skin', submenu: skinMenu() },
    { label: 'Voltar pro canto', click: () => entity.resetPosition() },
    { label: 'Recarregar', click: () => entity.win.reload() },
    { label: 'DevTools', click: () => entity.win.webContents.openDevTools({ mode: 'detach' }) },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ]).popup({ window: entity.win });
}

/** Registra um handler de IPC já resolvendo de qual waifu veio a mensagem */
function onEntity<A extends unknown[]>(channel: string, fn: (entity: Entity, ...args: A) => void): void {
  ipcMain.on(channel, (e: IpcMainEvent, ...args: unknown[]) => {
    const entity = manager?.byWebContents(e.sender);
    if (entity) fn(entity, ...(args as A));
  });
}

onEntity<[boolean]>(IPC.setIgnoreMouse, (entity, ignore) => entity.setIgnoreMouse(ignore));
onEntity<[number, number]>(IPC.moveBy, (entity, dx, dy) => entity.moveBy(dx, dy));
onEntity(IPC.dragEnd, (entity) => entity.settle());
onEntity<[boolean]>(IPC.walkAllowed, (entity, allowed) => entity.setWalkAllowed(allowed));
onEntity(IPC.contextMenu, showContextMenu);
ipcMain.handle(IPC.getSkin, () => loadSkin(manager?.skinId));

// Só uma cópia do app (a porta é uma só)
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    manager?.broadcast({ state: 'attention', duration: 2500, say: 'Já tô aqui! 👋' });
  });

  app.whenReady().then(() => {
    manager = new EntityManager(loadConfig());
    manager.start();
    startEventServer(getPort(), {
      onHook: (input) => manager.handleHook(input),
      onEvent: (event) => manager.handleEvent(event),
      onMcp: (event) => manager.handleMcp(event),
    });
  });

  app.on('window-all-closed', () => app.quit());
}
