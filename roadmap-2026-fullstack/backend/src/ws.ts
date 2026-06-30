import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WsMessage, WsEventType } from './types';

const clients = new Set<WebSocket>();

export function initWss(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    // Clients send pings to keep the connection alive
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
      } catch { /* ignore malformed */ }
    });
  });

  console.log('🔌 WebSocket server ready on /ws');
  return wss;
}

/**
 * Broadcast a message to every connected client.
 * Called by route handlers after successful DB mutations.
 */
export function broadcast<T>(type: WsEventType, payload: T) {
  const msg: WsMessage<T> = { type, payload, ts: Date.now() };
  const json = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

export function connectedCount() {
  return clients.size;
}
