// "Conectar ao Claude Code": instala o plugin rodando a CLI do Claude por você.
// Se a CLI não estiver no PATH, devolve um comando de uma linha pra colar no terminal.
import { execFile } from 'node:child_process';
import { GITHUB_REPO, PLUGIN_ID } from '../shared/brand';

const STEPS: string[][] = [
  ['plugin', 'marketplace', 'add', GITHUB_REPO],
  ['plugin', 'install', PLUGIN_ID],
];

/** Uma linha só, que funciona no PowerShell, bash e zsh (o `;` roda um depois do outro) */
export const TERMINAL_COMMAND = STEPS.map((args) => `claude ${args.join(' ')}`).join('; ');

export type ConnectResult = { ok: true } | { ok: false; reason: 'not-found' | 'failed'; output: string };

interface RunResult {
  ok: boolean;
  output: string;
}

function run(file: string, args: string[], shell = false): Promise<RunResult> {
  return new Promise((resolve) => {
    // shell só no Windows quando a CLI é um .cmd (instalação via npm); os argumentos
    // são fixos, então não há o que escapar
    execFile(file, args, { shell, timeout: 120_000, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: `${stdout}\n${stderr}`.trim() });
    });
  });
}

/** Caminho da CLI do Claude, se estiver no PATH */
async function findClaude(): Promise<string | null> {
  const lookup = process.platform === 'win32' ? await run('where.exe', ['claude']) : await run('which', ['claude']);
  if (!lookup.ok) return null;
  return lookup.output.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? null;
}

export async function installPlugin(): Promise<ConnectResult> {
  const cli = await findClaude();
  if (!cli) return { ok: false, reason: 'not-found', output: '' };
  const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(cli);

  const log: string[] = [];
  for (const args of STEPS) {
    const r = await run(cli, args, shell);
    log.push(`$ claude ${args.join(' ')}\n${r.output}`);
    // "já adicionado"/"já instalado" não é erro: seguimos e conferimos no fim
    if (!r.ok && !/already/i.test(r.output)) return { ok: false, reason: 'failed', output: log.join('\n\n') };
  }
  const list = await run(cli, ['plugin', 'list'], shell);
  return list.output.includes(PLUGIN_ID.split('@')[0]!)
    ? { ok: true }
    : { ok: false, reason: 'failed', output: `${log.join('\n\n')}\n\n$ claude plugin list\n${list.output}` };
}
