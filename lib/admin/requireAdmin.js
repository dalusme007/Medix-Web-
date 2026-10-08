import { createClient } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";

// Verifie que l'utilisateur courant (via son cookie de session) est
// bien authentifie ET marque is_admin=true dans shared.profiles.
// A appeler en tout debut de chaque Route Handler admin.
// Retourne { user } si autorise, ou une NextResponse d'erreur sinon.
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Non authentifie" }, { status: 401 }) };
  }

  const { data: profile, error } = await supabase
    .schema("shared").from("profiles").select("is_admin").eq("id", user.id).single();

  if (error || !profile?.is_admin) {
    return { error: NextResponse.json({ error: "Acces reserve aux administrateurs" }, { status: 403 }) };
  }

  return { user };
    }
