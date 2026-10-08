import { createClient } from "@/lib/supabase/browserClient";

// shared.profiles : identite generale du joueur (pseudo, avatar, universite...)

export async function getProfile(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("shared")
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Utilise a la creation du profil (apres inscription) pour renseigner
// pseudo/avatar/infos complementaires - le trigger SQL a deja cree la
// ligne avec des valeurs par defaut, on la complete ici.
export async function updateProfile(userId, updates) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("shared")
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isPseudoAvailable(pseudo) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("shared")
    .from("profiles")
    .select("id")
    .ilike("pseudo", pseudo)
    .maybeSingle();
  if (error) throw error;
  return !data;
}
