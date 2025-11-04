import React, { useEffect, useRef, useState, type JSX } from "react";
import "./styles.css";

/**
 * EDUNOW — Profe NOWI (React + CSS puro)
 * Vista offline SIN conexión real (mock streaming).
 */

type Role = "user" | "assistant";
interface ChatMessage { role: Role; content: string; }

const USE_MOCK = true;

function Avatar({ me }: { me: boolean }) {
  return <div className="avatar">{me ? "🙂" : "👨‍🏫"}</div>;
}

function Message({ m }: { m: ChatMessage }) {
  const me = m.role === "user";
  return (
    <div className={`msg ${me ? "me" : ""}`}>
      <Avatar me={me} />
      <div className="bubble">{m.content}</div>
    </div>
  );
}

async function mockStreamResponse(prompt: string, onChunk: (delta: string) => void) {
  const simulated =
    "Esta es una respuesta simulada del modelo IA local 🤖.\n" +
    "Puedes seguir diseñando la interfaz sin depender de la conexión.\n\n" +
    "• Tip: cuando tengas el backend, sustituye este mock por un fetch.\n" +
    "• Tip: mantén el historial en `messages` como ya está en esta vista.";
  const parts = simulated.split(/(\s+)/);
  for (const part of parts) {
    await new Promise((r) => setTimeout(r, 25));
    onChunk(part);
  }
}

export default function EduNowChat(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "¡Hola! Soy Profe NOWI. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Listo");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const asstMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, asstMsg]);

    setIsLoading(true);
    setStatus("Pensando…");

    try {
      if (USE_MOCK) {
        await mockStreamResponse(text, (delta) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") last.content += delta;
            return copy;
          });
        });
      } else {
        // Aquí irá tu fetch real cuando conectes el backend/LLM local.
      }
      setStatus("Listo");
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") last.content = `⚠️ Error: ${err?.message ?? "desconocido"}`;
        return copy;
      });
      setStatus("Error");
    } finally {
      setIsLoading(false);
    }
  }

  function loadDemo() {
    setMessages([
      { role: "user", content: "Hola, dame más información sobre como funciona Arduino" },
      {
        role: "assistant",
        content:
          "Arduino es una plataforma de hardware y software libre para crear prototipos electrónicos.\n" +
          "• Placa (hardware) con microcontrolador.\n" +
          "• IDE para programar y cargar el código.",
      },
      { role: "user", content: "¡Gracias!" },
    ]);
  }

  return (
    <div className="app-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-badge">EN</div>
          <div>
            <div className="logo-title">EDUNOW</div>
            <div className="logo-sub">Profe NOWI</div>
          </div>
        </div>

        <nav className="nav">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link active">Profe NOWI</a>
          <a href="#" className="nav-link">Cursos</a>
          <a href="#" className="nav-link">Progreso</a>
        </nav>

        <div className="section-title">Conversaciones</div>
        <div className="threads">
          <button onClick={loadDemo} className="thread">
            <div>
              <div className="title">Arduino</div>
              <div className="snippet">Hola, dame más informa…</div>
            </div>
            <div className="time">10 min</div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="header">
          <div className="tab">Profe NOWI</div>
          <div className="pill">Modo Offline</div>
        </header>

        <section className="chat">
          {messages.map((m, i) => <Message key={i} m={m} />)}
          <div ref={endRef} />
        </section>

        <footer className="composer">
          <form onSubmit={sendMessage} className="composer-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="input"
            />
            <button type="submit" disabled={isLoading} className="btn">
              {isLoading ? "Enviando…" : "Enviar"}
            </button>
          </form>
          <div className="status pill">{status}</div>
        </footer>
      </main>
    </div>
  );
}
