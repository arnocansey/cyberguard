"use client";

import { MessageSquare, Send, Wifi, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../lib/api";

const starter = {
  id: "welcome",
  role: "assistant",
  content: "SOC Copilot online. Ask about threats, triage, incident workflow, or dashboard tuning.",
  suggestions: [
    "What should I investigate first today?",
    "Give me SQL injection treatment steps.",
    "How do I triage alerts fast?"
  ]
};

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export default function SocChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([starter]);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const inflightRef = useRef(new Map());
  const sendMessageRef = useRef(null);

  const historyPayload = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  const getTenantId = () => (typeof window !== "undefined" ? localStorage.getItem("tenantId") : "") || "default";

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token }
    });

    socketRef.current = socket;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("chat:chunk", ({ requestId, delta }) => {
      const messageId = inflightRef.current.get(requestId);
      if (!messageId) return;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: `${m.content || ""}${delta || ""}` } : m)));
    });

    socket.on("chat:done", ({ requestId, data }) => {
      const messageId = inflightRef.current.get(requestId);
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: m.content || "No response from copilot.",
                suggestions: data?.suggestedPrompts || [],
                degraded: Boolean(data?.degraded)
              }
            : m
        )
      );

      inflightRef.current.delete(requestId);
      setSending(false);
    });

    socket.on("chat:error", ({ requestId, message }) => {
      const messageId = inflightRef.current.get(requestId);
      if (messageId) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: `Copilot error: ${message || "request failed"}`, degraded: true } : m)));
        inflightRef.current.delete(requestId);
      }
      setError(message || "Copilot request failed");
      setSending(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendViaRest = useCallback(
    async (value) => {
      const { data } = await api.post("/chat/assist", {
        message: value,
        history: historyPayload,
        tenantId: getTenantId()
      });

      const assistantMsg = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: data?.reply || "No response from copilot.",
        suggestions: data?.suggestedPrompts || [],
        degraded: Boolean(data?.degraded)
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    [historyPayload]
  );

  const sendViaSocket = useCallback(
    async (value) => {
      const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const assistantId = `${Date.now()}-a-stream`;

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
      if (socketRef.current) {
        socketRef.current.auth = { token };
        if (!socketRef.current.connected) socketRef.current.connect();
      }

      inflightRef.current.set(requestId, assistantId);
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      socketRef.current.emit("chat:ask", {
        requestId,
        message: value,
        history: historyPayload,
        tenantId: getTenantId()
      });
    },
    [historyPayload]
  );

  const sendMessage = useCallback(
    async (text) => {
      const value = (text || input).trim();
      if (!value || sending) return;

      setError("");
      const userMsg = { id: `${Date.now()}-u`, role: "user", content: value };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        setSending(true);
        if (socketRef.current?.connected) {
          await sendViaSocket(value);
        } else {
          await sendViaRest(value);
          setSending(false);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Copilot request failed");
        setSending(false);
      }
    },
    [input, sending, sendViaRest, sendViaSocket]
  );

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    const handler = (event) => {
      const prompt = event?.detail?.prompt;
      const autoSend = Boolean(event?.detail?.autoSend);
      if (!prompt) return;
      setOpen(true);
      if (autoSend) {
        setTimeout(() => {
          sendMessageRef.current?.(prompt);
        }, 0);
      } else {
        setInput(prompt);
      }
    };

    window.addEventListener("soc-copilot:ask", handler);
    return () => window.removeEventListener("soc-copilot:ask", handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[70vh] w-[min(92vw,420px)] flex-col rounded-xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-orange-300">AI Assistant</div>
              <div className="text-sm font-semibold text-slate-100">SOC Copilot</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] ${socketConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                {socketConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {socketConnected ? "Live" : "Fallback"}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-white/20 p-1 text-slate-200">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-orange-500 text-black" : "border border-white/10 bg-slate-800 text-slate-100"}`}>
                  {m.content || (sending && m.role === "assistant" ? "..." : "")}
                </div>

                {m.role === "assistant" && m.degraded && <div className="mt-1 text-xs text-yellow-300">AI service unavailable. Showing fallback guidance.</div>}

                {m.role === "assistant" && m.suggestions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.suggestions.slice(0, 3).map((s) => (
                      <button key={`${m.id}-${s}`} type="button" onClick={() => sendMessage(s)} className="rounded border border-orange-400/50 px-2 py-1 text-xs text-orange-200 hover:bg-orange-500/20">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-3">
            {error && <div className="mb-2 text-xs text-red-300">{error}</div>}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask SOC Copilot..."
                className="flex-1 rounded border border-white/15 bg-black/20 px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => sendMessage()} disabled={sending || !input.trim()} className="rounded bg-orange-500 p-2 text-black disabled:cursor-not-allowed disabled:opacity-50">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-orange-400/50 bg-slate-900 px-4 py-2 text-sm font-semibold text-orange-200 shadow-xl">
        <MessageSquare size={16} />
        SOC Copilot
      </button>
    </div>
  );
}
