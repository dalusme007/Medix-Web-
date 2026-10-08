import { createClient } from "@/lib/supabase/browserClient";

// medix.player_progress : XP, coins, compteurs. LECTURE SEULE cote
// client - toute ecriture passe par gameService.recordGameResult()
// (fonction RPC securisee), jamais par un update direct ici.

export async function getProgress(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix")
    .from("player_progress")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Reference des grades, mise en miroir de la table medix.grades pour
// un affichage instantane sans aller-retour reseau a chaque rendu.
// La source de verite reste la fonction SQL medix.grade_for_xp().
export const GRADES = [
  { minXp: 0, name: "Externe I" }, { minXp: 300, name: "Externe II" }, { minXp: 700, name: "Externe III" },
  { minXp: 1300, name: "Interne I" }, { minXp: 2200, name: "Interne II" }, { minXp: 3500, name: "Interne III" },
  { minXp: 5200, name: "Resident I" }, { minXp: 7400, name: "Resident II" }, { minXp: 10200, name: "Resident III" },
  { minXp: 13800, name: "Resident IV" }, { minXp: 18500, name: "Chef de Clinique" }, { minXp: 24500, name: "Chef de Service" },
  { minXp: 32000, name: "Professeur Assistant" }, { minXp: 41500, name: "Professeur" }, { minXp: 53000, name: "Professeur Agrege" },
];

export function getGradeForXp(xp) {
  let current = GRADES[0];
  let index = 0;
  for (let i = 0; i < GRADES.length; i++) {
    if (xp >= GRADES[i].minXp) { current = GRADES[i]; index = i; }
    else break;
  }
  const next = GRADES[index + 1] || null;
  const xpToNext = next ? next.minXp - xp : 0;
  const progressPct = next ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)) : 100;
  return { grade: current, index, next, xpToNext, progressPct };
}
