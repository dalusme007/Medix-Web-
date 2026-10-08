import { createClient } from "@/lib/supabase/browserClient";

// Classements : lisent exclusivement les VUES definies en migration 0011
// (leaderboard_global / weekly / monthly), qui n'exposent que les
// colonnes necessaires et uniquement pour les joueurs ayant active
// public_leaderboard. Jamais de lecture directe de shared.profiles
// ou medix.player_progress pour d'autres utilisateurs.

export async function getGlobalLeaderboard({ limit = 100, universite = null, nationalite = null } = {}) {
  const supabase = createClient();
  let query = supabase.schema("medix").from("leaderboard_global").select("*").limit(limit);
  if (universite) query = query.eq("universite", universite);
  if (nationalite) query = query.eq("nationalite", nationalite);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getWeeklyXpLeaderboard({ limit = 100 } = {}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("leaderboard_weekly").select("*").limit(limit);
  if (error) throw error;
  return data;
}

export async function getMonthlyXpLeaderboard({ limit = 100 } = {}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("leaderboard_monthly").select("*").limit(limit);
  if (error) throw error;
  return data;
}
