// src/services/cedarClient.js
// Tiny Cedar OS chat/presence adapter with graceful mock fallback.
// If REACT_APP_CEDAR_WS_URL + REACT_APP_CEDAR_API_KEY are missing, it runs locally with a nice demo feel.

const WS_URL = process.env.REACT_APP_CEDAR_WS_URL;
const API_KEY = process.env.REACT_APP_CEDAR_API_KEY;
const isMock = !WS_URL || !API_KEY;

// Log configuration status for debugging
if (isMock) {
  console.log('🔧 Cedar OS running in mock mode. Set REACT_APP_CEDAR_WS_URL and REACT_APP_CEDAR_API_KEY to use real API.');
} else {
  console.log('🚀 Cedar OS configured for real API usage.');
}

// --- teeny event emitter ---
function Emitter() {
  const map = new Map();
  return {
    on(event, fn) {
      if (!map.has(event)) map.set(event, new Set());
      map.get(event).add(fn);
      return () => map.get(event)?.delete(fn);
    },
    emit(event, payload) {
      map.get(event)?.forEach(fn => fn(payload));
    },
    clear() {
      map.clear();
    }
  };
}

// singleton so multiple components can share one connection
class CedarClient {
  constructor() {
    this.emitter = Emitter();
    this.ws = null;
    this.roomId = null;
    this.user = null;
    this._mockTimers = [];
    this._connected = false;
  }

  on(event, fn) {
    // events: "open","close","error","message","presence"
    return this.emitter.on(event, fn);
  }

  connect({ roomId, user, presenceOnly = false } = {}) {
    if (this._connected && this.roomId === roomId) return;
    this.roomId = roomId || "global";
    this.user = user || { id: "guest", name: "Guest", avatar: "" };

    if (isMock) {
      this._startMock(presenceOnly);
      this._connected = true;
      this.emitter.emit("open");
      return;
    }

    try {
      console.log(`🔌 Connecting to Cedar OS WebSocket: ${WS_URL}`);
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('✅ Cedar OS WebSocket connected');
        this._connected = true;
        this.emitter.emit("open");
        const hello = {
          type: "join",
          apiKey: API_KEY,
          roomId: this.roomId,
          user: { 
            id: this.user.id || this.user.name, 
            name: this.user.name, 
            avatar: this.user.avatar || "" 
          },
          presenceOnly
        };
        console.log('📤 Sending join message:', hello);
        this.ws.send(JSON.stringify(hello));
      };
      
      this.ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          console.log('📨 Received Cedar OS message:', msg);
          if (msg.type === "presence") {
            this.emitter.emit("presence", msg.count || 1);
          }
          if (msg.type === "message") {
            this.emitter.emit("message", msg);
          }
          if (msg.type === "error") {
            console.error('❌ Cedar OS error:', msg.error);
            this.emitter.emit("error", new Error(msg.error));
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse Cedar OS message:', evt.data, parseError);
        }
      };
      
      this.ws.onerror = (e) => {
        console.error('❌ Cedar OS WebSocket error:', e);
        this.emitter.emit("error", e);
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 Cedar OS WebSocket closed:', event.code, event.reason);
        this._connected = false;
        this.emitter.emit("close");
        
        // Auto-reconnect logic for unexpected disconnections
        if (event.code !== 1000 && event.code !== 1001) { // Not normal closure
          console.log('🔄 Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (!this._connected) {
              this.connect({ roomId: this.roomId, user: this.user, presenceOnly });
            }
          }, 3000);
        }
      };
    } catch (e) {
      console.error('❌ Failed to create Cedar OS WebSocket:', e);
      this.emitter.emit("error", e);
    }
  }

  sendMessage(text) {
    if (!text || !text.trim()) {
      console.warn('⚠️ Attempted to send empty message');
      return;
    }

    const payload = {
      type: "message",
      roomId: this.roomId,
      user: { 
        id: this.user.id || this.user.name, 
        name: this.user.name, 
        avatar: this.user.avatar || "" 
      },
      text: text.trim(),
      ts: Date.now()
    };

    if (isMock) {
      console.log('📤 Mock mode: Sending message:', payload);
      // echo + occasional bot quip
      setTimeout(() => this.emitter.emit("message", payload), 120);
      if (Math.random() < 0.25) {
        setTimeout(() => {
          const botMessage = {
            type: "message",
            roomId: this.roomId,
            user: { id: "coach-bot", name: "Coach Bot", avatar: "" },
            text: ["Huge momentum swing! 🔥", "QB rating trending up 📈", "Defense showing pressure looks.", "Win prob +3% last drive"][Math.floor(Math.random()*4)],
            ts: Date.now()
          };
          console.log('🤖 Mock bot response:', botMessage);
          this.emitter.emit("message", botMessage);
        }, 700);
      }
      return;
    }

    if (!this._connected || !this.ws) {
      console.error('❌ Cannot send message: WebSocket not connected');
      this.emitter.emit("error", new Error("WebSocket not connected"));
      return;
    }

    try {
      console.log('📤 Sending message to Cedar OS:', payload);
      this.ws.send(JSON.stringify(payload));
    } catch (e) {
      console.error('❌ Failed to send message:', e);
      this.emitter.emit("error", e);
    }
  }

  disconnect() {
    if (isMock) {
      this._stopMock();
      this._connected = false;
      this.emitter.emit("close");
      return;
    }
    try { this.ws?.close(); } catch {}
    this.ws = null;
    this._connected = false;
  }

  // ---------- mock presence/messages ----------
  _startMock(presenceOnly) {
    this._stopMock();
    // presence pulse
    let count = 8 + Math.floor(Math.random() * 8);
    this.emitter.emit("presence", count);
    this._mockTimers.push(setInterval(() => {
      const drift = [-1,0,1][Math.floor(Math.random()*3)];
      count = Math.max(2, Math.min(48, count + drift));
      this.emitter.emit("presence", count);
    }, 2000));

    if (!presenceOnly) {
      // occasional “other people chatting”
      this._mockTimers.push(setInterval(() => {
        if (Math.random() < 0.5) {
          this.emitter.emit("message", {
            type: "message",
            roomId: this.roomId,
            user: { id: "fan_"+Math.floor(Math.random()*1000), name: ["Alex","Sam","Jordan","Taylor"][Math.floor(Math.random()*4)], avatar: "" },
            text: ["That route was clean!", "Smash run incoming?", "Live odds look spicy.", "Hammer the over?"][Math.floor(Math.random()*4)],
            ts: Date.now()
          });
        }
      }, 3500));
    }
  }

  _stopMock() {
    this._mockTimers.forEach(t => clearInterval(t));
    this._mockTimers = [];
  }
}

export const cedarClient = new CedarClient();
export default cedarClient; // <-- add default export for convenience
