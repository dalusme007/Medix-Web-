import { createClient } from "@/lib/supabase/browserClient";

export async function getAllBadges() {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("badges").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getUnlockedBadgeIds(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("user_badges").select("badge_id").eq("user_id", userId);
  if (error) throw error;
  return data.map(row => row.badge_id);
  // Rappel : le deblocage d'un badge se fait uniquement via la fonction
  // RPC record_game_result (medix.check_and_award_badges cote serveur),
  // jamais par un insert direct depuis ce service.
}
