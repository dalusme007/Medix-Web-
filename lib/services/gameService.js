import { createClient } from "@/lib/supabase/browserClient";

// Point d'entree UNIQUE pour enregistrer une partie (Solo, Duel,
// Marathon, Mode personnalise). Appelle la fonction RPC securisee
// medix.record_game_result (migration 0010) : le serveur recalcule
// XP/coins/score a partir des donnees brutes, le client ne peut rien
// falsifier.
//
// mode: "solo" | "duel" | "marathon" | "personnalise"
// outcome: "win" | "over" | "banked"
export async function recordGameResult({
  mode,
  outcome,
  levelIndex = null,       // 0-based, pertinent pour solo/duel uniquement
  correctCount = 0,
  wrongCount = 0,
  jokersUsed = 0,
  durationSec = null,
  categoryBreakdown = {},
  quizCategory = null,     // "fondamental" | "clinique" | "mixte"
  difficulty = null,
}) {
  const supabase = createClient();
  const { data, error } = await supabase.schema("medix").rpc("record_game_result", {
    p_mode: mode,
    p_outcome: outcome,
    p_level_index: levelIndex,
    p_correct_count: correctCount,
    p_wrong_count: wrongCount,
    p_jokers_used: jokersUsed,
    p_duration_sec: durationSec,
    p_category_breakdown: categoryBreakdown,
    p_quiz_category: quizCategory,
    p_difficulty: difficulty,
  });
  if (error) throw error;
  // data = { score, xp_gained, coins_gained, new_badges: [...] }
  return data;
}

export async function getGameHistory(userId, { limit = 50, mode = null } = {}) {
  const supabase = createClient();
  let query = supabase
    .schema("medix")
    .from("game_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (mode) query = query.eq("mode", mode);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
