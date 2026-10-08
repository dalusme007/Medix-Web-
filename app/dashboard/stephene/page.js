"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { createConversation, getMessages, askDrStephene } from "@/lib/services/stephChatService";

export default function StephenePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setError(null);
    setInput("");
    setLoading(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await createConversation(user.id, q);
        convId = conv.id;
        setConversationId(convId);
      }
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      setMessages(m => [...m, { role: "user", content: q }]);
      const answer = await askDrStephene(convId, q, history);
      setMessages(m => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setError(e.message || "Dr Stephene n'a pas pu répondre pour le moment.");
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col" style={{ height: "88vh" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>Demander à Dr Stephene</div>
            <div className="text-[10px]" style={{ color: "#546081" }}>Questions médicales · réponses éducatives avec référence</div>
          </div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
          {messages.length === 0 && (
            <div className="rounded-xl p-3" style={{ background: "rgba(79,195,247,0.06)", border: "1px solid #1E4A3E" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#4FC3F7" }}>Dr Stephene</div>
              <p className="text-xs" style={{ color: "#DCE3F4" }}>Bonjour ! Posez-moi une question médicale et je vous répondrai avec une explication et une référence.</p>
            </div>
          )}
          {messages.map((m, i) => m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm" style={{ background: "linear-gradient(180deg,#2E9BD6,#1B6FA0)", color: "#F4EAD2" }}>{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-xl p-3" style={{ background: "rgba(79,195,247,0.06)", border: "1px solid #1E4A3E" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#4FC3F7" }}>Dr Stephene</div>
                <p className="text-xs whitespace-pre-wrap" style={{ color: "#DCE3F4" }}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading && <div className="text-xs" style={{ color: "#546081" }}>Dr Stephene réfléchit…</div>}
          {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}
          <div ref={endRef} />
        </div>

        <div className="flex items-end gap-2 pt-2" style={{ borderTop: "1px solid #1E4A3E" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ex : Quel est le mécanisme d'action des IEC ?" rows={2}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <button onClick={send} disabled={!input.trim() || loading} className="px-5 py-2.5 rounded-full font-bold text-sm"
            style={{ background: input.trim() && !loading ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: input.trim() && !loading ? "#04120D" : "#546081" }}>
            Envoyer
          </button>
        </div>
        <div className="text-[10px] text-center mt-2" style={{ color: "#3E5C5C" }}>Contenu à visée pédagogique — ne remplace pas une consultation médicale réelle.</div>
      </div>
    </div>
  );
               }
