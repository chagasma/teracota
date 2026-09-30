// Menu do app — o mesmo no botão direito da Tera e no ícone da bandeja.
import { app, clipboard, Menu, type MenuItemConstructorOptions } from 'electron';
import { APP_NAME, CHARACTER_NAME } from '../shared/brand';
import { SVG_SKIN_ID } from '../shared/skin';
import { installPlugin, TERMINAL_COMMAND } from './connect';
import type { Entity } from './entity';
import { MAX_ENTITIES, type EntityManager } from './manager';
import { listSkins, loadSkin } from './skins';

function skinItems(manager: EntityManager): MenuItemConstructorOptions[] {
  const current = loadSkin(manager.skinId)?.id ?? SVG_SKIN_ID;
  return [
    ...listSkins().map((s): MenuItemConstructorOptions => ({
      label: s.name, type: 'radio', checked: s.id === current, click: () => manager.setSkin(s.id),
    })),
    { label: 'Clássica (desenho)', type: 'radio', checked: current === SVG_SKIN_ID, click: () => manager.setSkin(SVG_SKIN_ID) },
  ];
}

const STARTUP_LABEL = process.platform === 'win32' ? 'Abrir com o Windows' : 'Abrir ao iniciar o sistema';

let connecting = false;

async function connectToClaude(manager: EntityManager): Promise<void> {
  if (connecting) return;
  connecting = true;
  manager.setVisible(true);
  manager.broadcast({ state: 'thinking', say: 'Conectando ao Claude Code... ⏳' });
  const result = await installPlugin();
  connecting = false;

  if (result.ok) {
    manager.broadcast({
      state: 'happy',
      duration: 8000,
      say: 'Pronto, conectei! Sessões do Claude que já estavam abertas precisam ser reiniciadas 😊',
    });
    return;
  }
  clipboard.writeText(TERMINAL_COMMAND);
  if (result.reason === 'failed') console.error('[terracota] falha ao instalar o plugin:\n', result.output);
  manager.broadcast({
    state: result.reason === 'not-found' ? 'attention' : 'error',
    duration: 9000,
    say: result.reason === 'not-found'
      ? 'Não achei o Claude Code aqui 🤔 Copiei um comando: cola num terminal e aperta Enter!'
      : 'Algo deu errado 😣 Copiei o comando: cola num terminal pra ver o que houve.',
  });
}

/** @param entity a Tera clicada (ausente quando o menu vem da bandeja) */
export function buildMenu(manager: EntityManager, entity?: Entity): Menu {
  const label = entity?.identity.label;
  const autoStart = app.getLoginItemSettings().openAtLogin;

  const template: MenuItemConstructorOptions[] = [
    ...(label ? [{ label: `📁 ${label}`, enabled: false }, { type: 'separator' as const }] : []),
    manager.isVisible
      ? { label: `Esconder ${CHARACTER_NAME}`, click: () => manager.setVisible(false) }
      : { label: `Mostrar ${CHARACTER_NAME}`, click: () => manager.setVisible(true) },
    { type: 'separator' },
    { label: 'Passear pela tela', type: 'radio', checked: manager.moveMode === 'roam', click: () => manager.setMoveMode('roam') },
    { label: 'Ficar parada', type: 'radio', checked: manager.moveMode === 'stay', click: () => manager.setMoveMode('stay') },
    { type: 'separator' },
    { label: `Uma ${CHARACTER_NAME} só`, type: 'radio', checked: manager.mode === 'single', click: () => manager.setEntityMode('single') },
    {
      label: `Uma por sessão do Claude (até ${MAX_ENTITIES})`, type: 'radio', checked: manager.mode === 'multi',
      click: () => manager.setEntityMode('multi'),
    },
    { type: 'separator' },
    { label: 'Skin', submenu: skinItems(manager) },
    { label: 'Voltar pro canto', click: () => (entity ? entity.resetPosition() : manager.resetPositions()) },
    { type: 'separator' },
    { label: 'Conectar ao Claude Code', click: () => void connectToClaude(manager) },
    {
      label: app.isPackaged ? STARTUP_LABEL : `${STARTUP_LABEL} (só no app instalado)`,
      type: 'checkbox',
      checked: autoStart,
      enabled: app.isPackaged,
      click: () => app.setLoginItemSettings({ openAtLogin: !autoStart }),
    },
    { type: 'separator' },
    ...(!app.isPackaged && entity
      ? [
        { label: 'Recarregar', click: () => entity.win.reload() },
        { label: 'DevTools', click: () => entity.win.webContents.openDevTools({ mode: 'detach' }) },
        { type: 'separator' as const },
      ]
      : []),
    { label: `Sair do ${APP_NAME}`, click: () => app.quit() },
  ];
  return Menu.buildFromTemplate(template);
}
