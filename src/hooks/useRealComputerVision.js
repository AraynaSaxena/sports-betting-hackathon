import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Real-time CV hook (WebSocket)
 * - Always call this hook unconditionally in your component.
 * - Pass { enabled } to toggle behavior. When disabled, it no-ops safely.
 *
 * Server message contract (example):
 *   { type: "detections", detections: [...], stats: { fps, avg_latency_ms } }
 * Client send contract:
 *   { type: "frame", frame_data_url: "data:image/jpeg;base64,..." }
 */
export function useRealComputerVision(options = {}) {
  const {
    wsUrl = "ws://localhost:8001/ws/cv",
    enabled = true,
  } = options;

  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [cvStats, setCvStats] = useState(null); // { fps, avg_latency_ms }

  // Stable no-op when disabled or disconnected
  const noop = useCallback(() => {}, []);

  const sendFrame = useCallback(
    (base64Image) => {
      if (!enabled) return; // no-op when disabled
      const ws = wsRef.current;
      if (!ws || ws.readyState !== 1) return;
      try {
        ws.send(JSON.stringify({ type: "frame", frame_data_url: base64Image }));
      } catch {
        /* swallow */
      }
    },
    [enabled]
  );

  // Open/close the WS based on `enabled` or `wsUrl`
  useEffect(() => {
    // tear down when disabled
    if (!enabled) {
      setIsConnected(false);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg?.type === "detections") {
          setDetections(Array.isArray(msg.detections) ? msg.detections : []);
          // accept either stats or individual fields
          const s = msg.stats ?? null;
          setCvStats(s ? { ...s } : null);
        }
      } catch {
        // ignore malformed packet
      }
    };

    return () => {
      try { ws.close(); } catch {}
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [wsUrl, enabled]);

  // Optional helpers (parent usually controls `enabled`)
  const enable = useCallback(() => {}, []);
  const disable = useCallback(() => {}, []);

  return {
    isConnected,
    detections,
    cvStats,
    sendFrame: enabled ? sendFrame : noop,
    enable,
    disable,
  };
}

// Provide a default export alias too, in case some files still import default.
const _default = useRealComputerVision;
export default _default;
