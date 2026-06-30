import { useEffect, useRef, useState } from 'react';
import type { WsMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws';

type Listener = (msg: WsMessage) => void;

export function useWebSocket(onMessage: Listener) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenerRef = useRef(onMessage);
  const retryDelay = useRef(1000);
  listenerRef.current = onMessage;

  useEffect(() => {
    let pingTimer: ReturnType<typeof setInterval>;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryDelay.current = 1000; // reset backoff
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' }));
        }, 25000);
      };

      ws.onmessage = (ev) => {
        try {
          const msg: WsMessage = JSON.parse(ev.data);
          if (msg.type === 'PONG') return;
          listenerRef.current(msg);
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        setConnected(false);
        clearInterval(pingTimer);
        if (cancelled) return;
        // exponential backoff, capped at 15s
        setTimeout(connect, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 1.6, 15000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      cancelled = true;
      clearInterval(pingTimer);
      wsRef.current?.close();
    };
  }, []);

  return { connected };
}
