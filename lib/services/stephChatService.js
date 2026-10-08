import { createClient } from "@/lib/supabase/browserClient";

// Dr Stephene (IA) : cree/lit les conversations et messages, et appelle
// le backend securise (Edge Function) qui garde la cle API du
// fournisseur d'IA secrete cote serveur. Voir dossier
// dr-stephene-backend/ fourni precedemment pour le code de la fonction.

export async function createConversation(userId, firstMessage) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("stephene_conversations")
    .insert({ user_id: userId, title: firstMessage.slice(0, 60) })
    .select().single();
  if (error) throw error;
  return data;
}

export async function getConversations(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("stephene_conversations")
    .select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("stephene_messages")
    .select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

async function saveMessage(conversationId, role, content) {
  const supabase = createClient();
  const { error } = await supabase
    .schema("medix").from("stephene_messages")
    .insert({ conversation_id: conversationId, role, content });
  if (error) throw error;
  // Met a jour updated_at de la conversation (trigger SQL s'en charge
  // automatiquement a chaque update ; ici on touche juste la ligne).
  await supabase.schema("medix").from("stephene_conversations")
    .update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
}

// Envoie la question a Dr Stephene et enregistre l'echange complet.
// history: tableau [{role, content}] des messages precedents de cette
// conversation, envoye pour garder le contexte multi-tours.
export async function askDrStephene(conversationId, question, history) {
  await saveMessage(conversationId, "user", question);

  const response = await fetch(process.env.NEXT_PUBLIC_STEPHENE_BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [...history, { role: "user", content: question }] }),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.error || "Dr Stephene n'a pas pu repondre pour le moment.");
  }
  const data = await response.json();
  const text = (data.content || [])
    .map(block => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n");
  const answer = text || "Desole, je n'ai pas pu formuler de reponse cette fois-ci.";

  await saveMessage(conversationId, "assistant", answer);
  return answer;
}
