import React, { useEffect, useRef, useState } from "react";
import "./profe.css";

type Role = "user" | "assistant" | "system";
interface ChatMessage {
  role: Role;
  content: string;
}
interface Chat {
  id: number;
  title: string;
  messages: ChatMessage[];
}

const DIRECT_OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1:8b";

export default function ProfeNow() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      title: "Chat inicial",
      messages: [{ role: "assistant", content: "¡Hola! Soy Profe NOWI. ¿En qué puedo ayudarte hoy?" }],
    },
  ]);
  const [activeChat, setActiveChat] = useState<number>(1);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Listo");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const messages = chats.find((c) => c.id === activeChat)?.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };

    // Añadir mensajes
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? { ...chat, messages: [...chat.messages, userMsg, assistantPlaceholder] }
          : chat
      )
    );

    setLoading(true);
    setStatus("Pensando…");

    try {
      const history = [...messages, userMsg];
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
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === activeChat
                    ? {
                        ...chat,
                        messages: chat.messages.map((m, i) =>
                          i === chat.messages.length - 1 && m.role === "assistant"
                            ? { ...m, content: m.content + delta }
                            : m
                        ),
                      }
                    : chat
                )
              );
            }
          } catch {}
        }
      }

      setStatus("Listo");
      setLoading(false);
    } catch (err: any) {
      setStatus("Error");
      setLoading(false);
    }
  }

  function createNewChat() {
    const newChat: Chat = {
      id: Date.now(),
      title: `Chat ${chats.length + 1}`,
      messages: [
        {
          role: "assistant",
          content: "¡Hola! Soy Profe NOWI. ¿Listo para una nueva conversación?",
        },
      ],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
  }

  function deleteChat(id: number) {
    if (chats.length === 1) {
      alert("Debe haber al menos un chat activo.");
      return;
    }
    if (confirm("¿Seguro que quieres eliminar este chat?")) {
      const filtered = chats.filter((chat) => chat.id !== id);
      setChats(filtered);
      if (activeChat === id) {
        setActiveChat(filtered[0].id);
      }
    }
  }

  return (
    <div className="profenow-container">
      {/* Historial de chats */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h3>💬 Historial</h3>
          <button onClick={createNewChat} className="new-chat-btn">Nuevo Chat </button>
        </div>

        <ul className="chat-list">
          {chats.map((chat) => (
            <li
              key={chat.id}
              className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <span className="chat-title">{chat.title}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Zona principal del chat */}
      <main className="main-chat">
        <header className="header">
          <div className="tab">Profe NOWI</div>
          <div className="pill">Modo Offline</div>
        </header>

        <section className="chat">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "me" : ""}`}>
              <div className="avatar">{m.role === "user" ? "🙂" : "👨‍🏫"}</div>
              <div className={`bubble ${m.role === "user" ? "me" : ""}`}>
                {m.content}
              </div>
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
