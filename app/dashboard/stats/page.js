"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getProgress, getGradeForXp } from "@/lib/services/progressService";
import { getGameHistory } from "@/lib/services/gameService";

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
      <div className="text-[11px] uppercase tracking-widest" style={{ color: "#546081" }}>{label}</div>
      <div className="text-xl font-bold mt-1" style={{ color: color || "#F4EAD2" }}>{value}</div>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    (async () => {
      setProgress(await getProgress(user.id));
      setHistory(await getGameHistory(user.id, { limit: 500 }));
    })();
  }, [user, authLoading, router]);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const totalGames = history.length;
    const totalCorrect = history.reduce((s, h) => s + h.correct_count, 0);
    const totalWrong = history.reduce((s, h) => s + h.wrong_count, 0);
    const precision = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
    const bestScore = Math.max(...history.map(h => h.score));
    const avgDuration = Math.round(history.reduce((s, h) => s + (h.duration_sec || 0), 0) / totalGames);

    const catStats = {};
    history.forEach(h => {
      Object.entries(h.category_breakdown || {}).forEach(([sub, v]) => {
        catStats[sub] = catStats[sub] || { correct: 0, wrong: 0 };
        catStats[sub].correct += v.correct || 0;
        catStats[sub].wrong += v.wrong || 0;
      });
    });
    const withPrecision = Object.entries(catStats)
      .map(([sub, v]) => ({ sub, precision: v.correct + v.wrong > 0 ? v.correct / (v.correct + v.wrong) : 0, total: v.correct + v.wrong }))
      .filter(s => s.total >= 3);
    const strongest = withPrecision.sort((a, b) => b.precision - a.precision)[0];
    const weakest = withPrecision.sort((a, b) => a.precision - b.precision)[0];

    return { totalGames, totalCorrect, totalWrong, precision, bestScore, avgDuration, strongest, weakest };
  }, [history]);

  if (!user || !progress) return null;
  const gi = getGradeForXp(progress.total_xp);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>Statistiques</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        {!stats ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>
            Jouez votre première partie pour voir vos statistiques.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Parties jouées" value={stats.totalGames} />
              <StatCard label="Précision" value={`${stats.precision}%`} color="#4FC3F7" />
              <StatCard label="Meilleur score" value={stats.bestScore.toLocaleString("fr-FR")} color="#E8B85C" />
              <StatCard label="Durée moyenne" value={`${Math.floor(stats.avgDuration / 60)}min ${stats.avgDuration % 60}s`} />
              <StatCard label="Bonnes réponses" value={stats.totalCorrect} color="#4FA876" />
              <StatCard label="Mauvaises réponses" value={stats.totalWrong} color="#E8664F" />
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#546081" }}>Progression</div>
              <div className="text-sm font-bold mb-2" style={{ color: "#4FC3F7" }}>{gi.grade.name}</div>
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "#1B2038" }}>
                <div className="h-full" style={{ width: `${gi.progressPct}%`, background: "#4FC3F7" }} />
              </div>
              {gi.next && <div className="text-[11px]" style={{ color: "#546081" }}>{gi.xpToNext.toLocaleString("fr-FR")} XP avant {gi.next.name}</div>}
            </div>

            {stats.strongest && (
              <div className="rounded-xl p-4" style={{ background: "rgba(79,168,118,0.08)", border: "1px solid #4FA876" }}>
                <div className="text-xs" style={{ color: "#4FA876" }}>Matière la plus forte</div>
                <div className="text-sm font-bold mt-1" style={{ color: "#F4EAD2" }}>{stats.strongest.sub} — {Math.round(stats.strongest.precision * 100)}%</div>
              </div>
            )}
            {stats.weakest && (
              <div className="rounded-xl p-4" style={{ background: "rgba(232,102,79,0.08)", border: "1px solid #E8664F" }}>
                <div className="text-xs" style={{ color: "#E8664F" }}>À travailler en priorité</div>
                <div className="text-sm font-bold mt-1" style={{ color: "#F4EAD2" }}>{stats.weakest.sub} — {Math.round(stats.weakest.precision * 100)}%</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
  }
  
