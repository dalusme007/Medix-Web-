import { createClient } from "@/lib/supabase/browserClient";

export async function getPartners(type = null) {
  const supabase = createClient();
  let request = supabase.schema("medix").from("partners").select("*").order("sort_order");
  if (type && type !== "Tous") request = request.eq("type", type);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}
