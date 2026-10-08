"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getGameHistory } from "@/lib/services/gameService";

const MODE_LABELS = { solo: "Solo", duel: "Duel", marathon: "Marathon", personnalise: "Personnalisé" };
const OUTCOME_LABELS = { win: "Victoire", over: "Terminée", banked: "Arrêtée" };

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getGameHistory(user.id, { limit: 200 }).then(h => { setHistory(h); setLoading(false); });
  }, [user, authLoading, router]);

  const filtered = filter === "tous" ? history : history.filter(h => h.mode === filter);

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>Historique</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["tous", "solo", "duel", "marathon", "personnalise"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: filter === f ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: filter === f ? "#04120D" : "#B9C4E0", border: "1px solid #1E4A3E" }}>
              {f === "tous" ? "Tous" : MODE_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>Aucune partie pour le moment.</div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map(h => (
              <div key={h.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{MODE_LABELS[h.mode]} · {OUTCOME_LABELS[h.outcome]}</div>
                  <div className="text-[11px]" style={{ color: "#546081" }}>{new Date(h.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: "#4FC3F7" }}>{h.correct_count}✓ {h.wrong_count}✗</div>
                  <div className="text-[11px]" style={{ color: "#E8B85C" }}>+{h.xp_gained} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
    
