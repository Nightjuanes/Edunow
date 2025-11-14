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
}

// Using IPC through Electron preload

export default function ProfeNow() {
  const studentId = 1; // TODO: Get from login context
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChats() {
    if (!window.edunow) {
      console.error('window.edunow not available');
      return;
    }
    try {
      const dbChats = await window.edunow.db.getChatsForStudent(studentId);
      setChats(dbChats.map(c => ({ id: c.id_chat, title: c.titulo })));
      if (dbChats.length > 0 && !activeChat) {
        setActiveChat(dbChats[0].id_chat);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  async function loadMessages(chatId: number) {
    if (!window.edunow) {
      console.error('window.edunow not available');
      return;
    }
    try {
      const dbMessages = await window.edunow.db.getMessagesForChat(chatId);
      setMessages(dbMessages.map(m => ({ role: m.role as Role, content: m.content })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }


  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !activeChat) return;

    if (!window.edunow) {
      setLoading(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: IPC no disponible. Asegúrate de que la app esté ejecutándose en Electron." }]);
      return;
    }

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };

    // Add user message to DB and state
    await window.edunow.db.addMessage(activeChat, userMsg.role, userMsg.content);
    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);

    setLoading(true);

    const systemMessage: ChatMessage = {
      role: "system",
      content: "Eres un profesor amigable para adolescentes. Explica los temas de manera sencilla, clara y entretenida, usando un lenguaje cercano y evitando jerga compleja."
    };

    const history = [systemMessage, ...messages, userMsg];

    const chatId = Date.now().toString();

    const stream = window.edunow.chatStream(history, chatId);

    stream.onChunk((delta: string) => {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant"
          ? { ...m, content: m.content + delta }
          : m
      ));
    });

    stream.onDone(async (payload: any) => {
      setLoading(false);
      if (payload.error) {
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 && m.role === "assistant"
            ? { ...m, content: "Error: " + payload.error }
            : m
        ));
      } else {
        // Save the final assistant message to DB
        const finalMsg = messages[messages.length - 1];
        if (finalMsg.role === "assistant") {
          await window.edunow!.db.addMessage(activeChat, finalMsg.role, finalMsg.content);
        }
      }
    });
  }

  async function createNewChat() {
    if (!window.edunow) {
      console.error('window.edunow not available');
      return;
    }
    try {
      const title = `Chat ${chats.length + 1}`;
      const chatId = await window.edunow.db.createChat(studentId, title);
      await window.edunow!.db.addMessage(chatId, "assistant", "Soy Profe NOWI. ¿Listo para una nueva conversación?");
      setChats(prev => [...prev, { id: chatId, title }]);
      setActiveChat(chatId);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }

  async function deleteChat(id: number) {
    if (!window.edunow) {
      console.error('window.edunow not available');
      return;
    }
    if (confirm("¿Seguro que quieres eliminar este chat?")) {
      try {
        await window.edunow.db.deleteChat(id);
        const filtered = chats.filter((chat) => chat.id !== id);
        setChats(filtered);
        if (activeChat === id) {
          setActiveChat(filtered[0]?.id || null);
          if (filtered[0]) {
            await loadMessages(filtered[0].id);
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  }

  function startEditingChat(chatId: number, currentTitle: string) {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  }

  async function saveChatTitle() {
    if (!editingChatId || !editingTitle.trim()) return;
    if (!window.edunow) {
      console.error('window.edunow not available');
      return;
    }
    try {
      await window.edunow.db.updateChatTitle(editingChatId, editingTitle.trim());
      setChats(prev => prev.map(chat => chat.id === editingChatId ? { ...chat, title: editingTitle.trim() } : chat));
      setEditingChatId(null);
      setEditingTitle("");
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }

  function cancelEditing() {
    setEditingChatId(null);
    setEditingTitle("");
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
              {editingChatId === chat.id ? (
                <div className="edit-container">
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="edit-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveChatTitle();
                    }}
                    className="save-btn"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEditing();
                    }}
                    className="cancel-btn"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="chat-title">{chat.title}</span>
              )}
              <button
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditingChat(chat.id, chat.title);
                }}
              >
                ✏️
              </button>
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
          <div className="pill">Modo Experto</div>
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
        </footer>
      </main>
    </div>
  );
}
