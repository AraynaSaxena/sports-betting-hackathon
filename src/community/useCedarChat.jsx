// import { useEffect, useState } from "react";
// import  { cedar} from '../services/cedarclient';
 

// export function useCedarChat({ roomId = "demo-room-1", user }) {
//   const [presence, setPresence] = useState(1);
//   const [messages, setMessages] = useState([
//     { id: "welcome", sys: true, text: "Welcome to the watch party! 🎉", ts: Date.now() - 5000 }
//   ]);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     cedar.connect({ roomId, user, presenceOnly: false });
//     const offOpen = cedar.on("open", () => setConnected(true));
//     const offClose = cedar.on("close", () => setConnected(false));
//     const offErr = cedar.on("error", (e) => console.warn("Cedar error", e));
//     const offPresence = cedar.on("presence", (n) => setPresence(n));
//     const offMsg = cedar.on("message", (m) => setMessages((prev) => [...prev, m]));
//     return () => { offOpen?.(); offClose?.(); offErr?.(); offPresence?.(); offMsg?.(); cedar.disconnect(); };
//   }, [roomId, user?.id]);

//   const send = (text) => cedar.sendMessage(text);

//   // helpers to post “system” lines using your message channel
//   const postSystem = (text) => setMessages((prev) => [...prev, { id: "sys-"+Date.now(), sys: true, text, ts: Date.now() }]);
//   const postPollOpen = (q) => postSystem(`🔥 New poll: ${q}`);
//   const postPollClose = (winnerLabel) => postSystem(`🧮 Poll closed. Result: ${winnerLabel}`);

//   return { connected, presence, messages, send, postPollOpen, postPollClose };
// }


// new import


// src/community/useCedarChat.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import cedarClient from "../services/cedarClient"; // ✅ default import, correct casing

export function useCedarChat({ roomId = "demo-game-1", user = { id: "guest", name: "Guest" } } = {}) {
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState(1);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const readyRef = useRef(false);

  // stable handlers
  const handleMsg = useCallback((m) => {
    console.log('📨 useCedarChat received message:', m);
    setMessages((prev) => (Array.isArray(prev) ? [...prev, m] : [m]));
  }, []);
  
  const handlePresence = useCallback((c) => {
    console.log('👥 useCedarChat presence update:', c);
    setPresence(c || 1);
  }, []);
  
  const handleOpen = useCallback(() => {
    console.log('✅ useCedarChat connected');
    setConnected(true);
    setError(null);
  }, []);
  
  const handleClose = useCallback(() => {
    console.log('🔌 useCedarChat disconnected');
    setConnected(false);
  }, []);
  
  const handleError = useCallback((e) => {
    console.error('❌ useCedarChat error:', e);
    setError(e.message || 'Connection error');
    setConnected(false);
  }, []);

  useEffect(() => {
    console.log(`🔌 useCedarChat connecting to room: ${roomId}`, user);
    cedarClient.connect({ roomId, user, presenceOnly: false });
    
    const offMsg = cedarClient.on("message", handleMsg);
    const offPre = cedarClient.on("presence", handlePresence);
    const offOpen = cedarClient.on("open", handleOpen);
    const offClose = cedarClient.on("close", handleClose);
    const offError = cedarClient.on("error", handleError);
    
    readyRef.current = true;
    
    return () => {
      console.log('🧹 useCedarChat cleanup');
      offMsg?.();
      offPre?.();
      offOpen?.();
      offClose?.();
      offError?.();
      cedarClient.disconnect();
      readyRef.current = false;
    };
  }, [roomId, user?.id, user?.name, handleMsg, handlePresence, handleOpen, handleClose, handleError]);

  const send = useCallback((text) => {
    if (!text?.trim()) {
      console.warn('⚠️ useCedarChat: Attempted to send empty message');
      return;
    }
    console.log('📤 useCedarChat sending:', text);
    cedarClient.sendMessage(text.trim());
  }, []);

  return useMemo(() => ({ 
    messages, 
    presence, 
    connected,
    error,
    send 
  }), [messages, presence, connected, error, send]);
}

