// src/components/WatchPartyDock.jsx
import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { MessageCircle, Users, X } from "lucide-react";
import { useCedarChat } from "../community/useCedarChat";

const Dock = styled.div`
  position: fixed; right: 14px; bottom: 80px; z-index: 1001;
  display: grid; gap: 8px; justify-items: end;
`;

const BubbleBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(16,18,27,.9); color: #fff;
  padding: 10px 12px; border-radius: 999px; cursor: pointer;
  backdrop-filter: blur(8px);
`;

const Panel = styled.div`
  width: min(320px, 92vw);
  max-height: 56vh;
  background: rgba(16,18,27,.98); color: #fff;
  border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
`;

export default function WatchPartyDock({ roomId = "demo-game-1", user = { id:"guest", name:"Guest" } }) {
  const [open, setOpen] = useState(false);
  const { messages, presence, send } = useCedarChat({ roomId, user });
  const listRef = useRef(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  return (
    <Dock onClick={(e) => e.stopPropagation()}>
      <BubbleBtn onClick={() => setOpen((v) => !v)} title="Watch Party">
        <MessageCircle size={16} /> Chat
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginLeft:6, fontSize:12, opacity:.85 }}>
          <Users size={14} /> {presence}
        </span>
      </BubbleBtn>

      {open && (
        <Panel onClick={(e) => e.stopPropagation()}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontWeight:700, letterSpacing:".2px" }}>Watch Party</div>
            <button onClick={() => setOpen(false)} style={{ background:"transparent", border:0, color:"#fff", cursor:"pointer" }}>
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} style={{ padding:10, display:"grid", gap:8, maxHeight:"38vh", overflow:"auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"grid", gap:2 }}>
                <div style={{ fontSize:12, opacity:.7 }}>{m.user?.name || "User"} <span style={{ opacity:.5 }}>• {new Date(m.ts || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", padding:"8px 10px", borderRadius:10 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ opacity:.7, fontSize:13 }}>Be the first to say something! 🎉</div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t) return;
              send(t);
              setText("");
            }}
            style={{ display:"flex", gap:8, padding:10, borderTop:"1px solid rgba(255,255,255,.1)" }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a thought…"
              style={{ flex:1, background:"rgba(255,255,255,.06)", color:"#fff", border:"1px solid rgba(255,255,255,.18)", padding:"10px 12px", borderRadius:10 }}
            />
            <button type="submit" style={{ background:"#fff", color:"#111", border:0, padding:"10px 12px", borderRadius:10, fontWeight:700, cursor:"pointer" }}>
              Send
            </button>
          </form>
        </Panel>
      )}
    </Dock>
  );
}
