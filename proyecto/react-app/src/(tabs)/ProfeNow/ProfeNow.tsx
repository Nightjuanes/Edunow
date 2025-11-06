// proyecto/react-app/src/tabs/ProfeNow.tsx
import React, { useEffect, useRef, useState } from "react";
import "./styles.css";

type Role = "user" | "assistant" | "system";
interface ChatMessage { role: Role; content: string; }

const DIRECT_OLLAMA_URL = "http://localhost:11434/api/chat"; // fallback navegador
const MODEL = "llama3.1:8b";

export default function ProfeNow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "¡Hola! Soy Profe NOWI. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Listo");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    // placeholder assistant
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setLoading(true);
    setStatus("Pensando…");

    const history = [...messages, userMsg];

    const isElectron = typeof window !== "undefined" && !!window.edunow;

    try {
      if (isElectron) {
        // === Vía IPC con Electron ===
        const stream = window.edunow!.chatStream(history);
        const detach = stream.onChunk((delta) => {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") last.content += delta;
            return copy;
          });
        });
        stream.onDone((payload) => {
          detach();
          setStatus(payload.error ? `Error: ${payload.error}` : "Listo");
          setLoading(false);
        });
      } else {
        // === Fallback directo a Ollama (navegador) ===
        const res = await fetch(DIRECT_OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL, messages: history, stream: true }),
        });
        if (!res.ok || !res.body) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            try {
              const json = JSON.parse(line);
              const delta = json?.message?.content || "";
              if (delta) {
                setMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last?.role === "assistant") last.content += delta;
                  return copy;
                });
              }
            } catch {}
          }
        }
        setStatus("Listo");
        setLoading(false);
      }
    } catch (err: any) {
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") last.content = `⚠️ Error: ${err?.message ?? "desconocido"}`;
        return copy;
      });
      setStatus("Error");
      setLoading(false);
    }
  }

  return (
    <div className="app-grid">
      {/* ... tu sidebar igual ... */}

      <main className="main">
        <header className="header">
          <div className="tab">Profe NOWI</div>
          <div className="pill">Modo Offline</div>
        </header>

        <section className="chat">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "me" : ""}`}>
              <div className="avatar">{m.role === "user" ? "🙂" : "👨‍🏫"}</div>
              <div className={`bubble ${m.role === "user" ? "me" : ""}`}>{m.content}</div>
            </div>
          ))}
          <div ref={endRef} />
        </section>

        <footer className="composer">
          <form onSubmit={send} className="composer-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="input"
            />
            <button type="submit" disabled={loading} className="btn">
              {loading ? "Enviando…" : "Enviar"}
            </button>
          </form>
          <div className="status pill">{status}</div>
        </footer>
      </main>
    </div>
  );
}
