import React, { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages = [], onSend, presence = 1, className = "" }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  return (
    <div className={`bg-zinc-950/80 ring-1 ring-zinc-800 rounded-2xl h-full flex flex-col ${className}`}>
      <div className="p-3 border-b border-zinc-800 text-sm text-zinc-300 flex items-center justify-between">
        <span>💬 Watch Party Chat</span>
        <span className="text-xs text-zinc-400">{presence} online</span>
      </div>
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`text-sm ${m.sys ? "text-zinc-400" : "text-zinc-100"}`}>
            {m.sys ? m.text : <><strong>{m.user?.name || "You"}:</strong> {m.text}</>}
          </div>
        ))}
      </div>
      <form
        className="p-2 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend?.(text.trim()); setText(""); } }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="flex-1 bg-zinc-900 rounded-xl px-3 py-2 text-sm outline-none ring-1 ring-zinc-800 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
        />
        <button className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm">Send</button>
      </form>
    </div>
  );
}
