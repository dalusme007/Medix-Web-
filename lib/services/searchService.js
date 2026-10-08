import { BANK } from "@/lib/data/questionBank";
import { FORMULAS } from "@/lib/data/formulas";
import { searchTriads } from "@/lib/services/triadService";

// Recherche unifiee : triades (Supabase), calculatrices et questions
// (statiques, donc recherche instantanee cote client). Plafonne les
// resultats de questions pour rester lisible et performant.
export async function unifiedSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return { triads: [], formulas: [], questions: [] };

  const [triads, formulasResults, questionResults] = await Promise.all([
    searchTriads(query).catch(() => []),
    Promise.resolve(FORMULAS.filter(f => (f.name + " " + f.description + " " + f.category).toLowerCase().includes(q))),
    Promise.resolve(BANK.filter(qz => (qz.q + " " + qz.sub + " " + (qz.kw || []).join(" ")).toLowerCase().includes(q)).slice(0, 30)),
  ]);

  return { triads, formulas: formulasResults, questions: questionResults };
}
