import { createClient } from "@/lib/supabase/browserClient";

// Grand Marathon Medix : la finalisation hebdomadaire est geree cote
// serveur par le job pg_cron (migration 0012) - ce service ne fait
// que lire les resultats, jamais de logique de clash cote client.

export function getCurrentWeekKey() {
  const d = new Date();
  const day = d.getDay(); // 0 = dimanche
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().slice(0, 10);
}

export async function getWeeklyLeaderboard(weekKey = getCurrentWeekKey()) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix")
    .from("marathon_leaderboard")
    .select("user_id, correct_count, total_time_sec, quiz_category, shared_profiles:user_id(pseudo, avatar)")
    .eq("week_key", weekKey)
    .order("correct_count", { ascending: false })
    .order("total_time_sec", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getHallOfFame() {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix")
    .from("marathon_hall_of_fame")
    .select("*")
    .order("week_key", { ascending: false });
  if (error) throw error;
  return data;
}

// Nombre de participations restantes cette semaine, lu depuis
// player_progress (mis a jour automatiquement par record_game_result).
export function attemptsRemaining(progress) {
  const weekKey = getCurrentWeekKey();
  if (progress.marathon_week_key !== weekKey) return 2; // nouvelle semaine, pas encore synchronisee
  return Math.max(0, 2 - (progress.marathon_attempts_this_week || 0));
}
