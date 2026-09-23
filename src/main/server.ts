// Servidor HTTP local (só 127.0.0.1):
//   POST /hook   JSON cru do hook do Claude Code (enviado por curl)
//   POST /event  evento do personagem já pronto (demo, integrações)
//   POST /mcp    servidor MCP (Streamable HTTP)
//   GET  /health
import http from 'node:http';
import { parseEvent, type WaifuEvent } from '../shared/protocol';
import { parseHookInput, type HookInput } from './hooks';
import { handleMcpRequest } from './mcp';

/** Hooks podem trazer payloads grandes (ex.: conteúdo de ferramentas) */
const MAX_BODY = 8 * 1024 * 1024;

export interface ServerHandlers {
  onHook(input: HookInput): void;
  onEvent(event: WaifuEvent): void;
  onMcp(event: WaifuEvent): void;
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('payload grande demais'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Bloqueia páginas web: navegadores mandam Origin em POST cross-origin, e um Host
 * diferente de localhost indica DNS rebinding. curl e o Claude Code não fazem nenhum dos dois.
 */
function isLocalClient(req: http.IncomingMessage, port: number): boolean {
  if (req.headers.origin) return false;
  const host = req.headers.host ?? '';
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

export function startEventServer(port: number, handlers: ServerHandlers): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = (req.url ?? '').split('?')[0];

    if (!isLocalClient(req, port)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === 'GET' && url === '/health') {
      res.writeHead(200).end('ok');
      return;
    }
    if (url === '/mcp' && req.method !== 'POST') {
      // modo sem estado: sem stream SSE (GET) nem encerramento de sessão (DELETE)
      res.writeHead(405, { 'content-type': 'application/json', allow: 'POST' }).end(
        JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null }),
      );
      return;
    }
    if (req.method !== 'POST' || !['/hook', '/event', '/mcp'].includes(url ?? '')) {
      res.writeHead(404).end();
      return;
    }

    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      if (!res.headersSent) res.writeHead(400).end('invalid json');
      return;
    }

    if (url === '/mcp') {
      try {
        await handleMcpRequest(req, res, body, handlers.onMcp);
      } catch (err) {
        console.error('[waifu] erro no MCP:', err);
        if (!res.headersSent) res.writeHead(500).end();
      }
      return;
    }

    if (url === '/hook') {
      const input = parseHookInput(body);
      if (input) handlers.onHook(input);
      res.writeHead(204).end(); // hook nunca recebe erro: não pode atrapalhar o Claude
      return;
    }

    const event = parseEvent(body);
    if (!event) {
      res.writeHead(400).end('invalid event');
      return;
    }
    handlers.onEvent(event);
    res.writeHead(204).end();
  });
  server.on('error', (err) => console.error(`[waifu] servidor na porta ${port} falhou:`, err.message));
  server.listen(port, '127.0.0.1', () => console.log(`[waifu] ouvindo em http://127.0.0.1:${port}`));
  return server;
}
