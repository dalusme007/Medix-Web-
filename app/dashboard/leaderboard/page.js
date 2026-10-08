"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getGlobalLeaderboard, getWeeklyXpLeaderboard, getMonthlyXpLeaderboard } from "@/lib/services/leaderboardService";

const TABS = [
  { key: "global", label: "Mondial" },
  { key: "weekly", label: "Hebdomadaire" },
  { key: "monthly", label: "Mensuel" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("global");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, tab]);

  async function load(t) {
    setLoading(true);
    try {
      let data;
      if (t === "global") data = await getGlobalLeaderboard({ limit: 100 });
      else if (t === "weekly") data = await getWeeklyXpLeaderboard({ limit: 100 });
      else data = await getMonthlyXpLeaderboard({ limit: 100 });
      setEntries(data);
    } catch (e) {
      setEntries([]);
    }
    setLoading(false);
  }

  function xpValue(e) {
    if (tab === "global") return e.total_xp;
    if (tab === "weekly") return e.xp_this_week;
    return e.xp_this_month;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>🌍 Classement</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 py-2 rounded-full text-xs font-semibold"
              style={{ background: tab === t.key ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: tab === t.key ? "#04120D" : "#B9C4E0", border: "1px solid #1E4A3E" }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>
            Aucun joueur n'a activé le classement public pour le moment.
          </div>
        ) : (
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {entries.map((e, i) => (
              <div key={e.user_id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: e.user_id === user.id ? "rgba(79,195,247,0.1)" : "#0D1F1B", border: `1px solid ${i === 0 ? "#E8B85C" : "#1E4A3E"}` }}>
                <div className="w-8 text-center font-bold" style={{ color: i === 0 ? "#E8B85C" : i < 3 ? "#5B9BD5" : "#546081" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>
                <span className="text-xl">{e.avatar}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{e.pseudo}</div>
                  {tab === "global" && e.grade_name && <div className="text-[11px]" style={{ color: "#8393B5" }}>{e.grade_name}</div>}
                </div>
                <div className="text-sm font-bold" style={{ color: "#4FC3F7" }}>{(xpValue(e) || 0).toLocaleString("fr-FR")} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
