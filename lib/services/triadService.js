import { createClient } from "@/lib/supabase/browserClient";

export async function searchTriads(query, specialty = null) {
  const supabase = createClient();
  let request = supabase.schema("medix").from("triads").select("*");
  if (specialty && specialty !== "Toutes") request = request.eq("specialty", specialty);
  if (query && query.trim()) {
    // Recherche plein texte francais sur l'index GIN cree en migration 0007
    request = request.textSearch("name", query.trim(), { type: "websearch", config: "french" });
  }
  const { data, error } = await request.order("id");
  if (error) throw error;
  return data;
}

export async function getAllTriads() {
  const supabase = createClient();
  const { data, error } = await supabase.schema("medix").from("triads").select("*").order("id");
  if (error) throw error;
  return data;
}
