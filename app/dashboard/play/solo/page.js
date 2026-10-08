"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { BANK } from "@/lib/data/questionBank";
import { LADDER } from "@/lib/constants/ladder";
import { recordGameResult } from "@/lib/services/gameService";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q) {
  const idxs = shuffle([0, 1, 2, 3]);
  return {
    ...q,
    options: idxs.map(i => q.options[i]),
    answer: idxs.indexOf(q.answer),
  };
}

// Mode Solo : echelle a 15 paliers. La logique de recompense (XP/coins/score)
// est entierement recalculee cote serveur par record_game_result - ce
// composant n'envoie que des donnees brutes (bonnes/mauvaises reponses,
// niveau atteint), jamais de score deja calcule.
export default function SoloPlayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [levelIndex, setLevelIndex] = useState(0); // 0-based
  const [current, setCurrent] = useState(null);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [screen, setScreen] = useState("play"); // play | reveal | win | over
  const [startedAt] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    pickQuestion(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  function pickQuestion(idx) {
    const lvl = LADDER[idx].level;
    const pool = BANK.filter(q => q.level === lvl);
    const q = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(shuffleOptions(q));
    setSelected(null);
    setLocked(false);
    setScreen("play");
  }

  function choose(i) {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const correct = i === current.answer;
    if (correct) setCorrectCount(c => c + 1);
    else setWrongCount(c => c + 1);
    setCategoryBreakdown(b => {
      const prev = b[current.sub] || { correct: 0, wrong: 0 };
      return { ...b, [current.sub]: { correct: prev.correct + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) } };
    });
    setScreen("reveal");
  }

  async function proceed() {
    const isLastLevel = levelIndex + 1 >= LADDER.length;
    const wasCorrect = selected === current.answer;

    if (!wasCorrect) {
      await finishGame("over");
      return;
    }
    if (isLastLevel) {
      await finishGame("win");
      return;
    }
    setLevelIndex(i => i + 1);
  }

  async function finishGame(outcome) {
    setSaving(true);
    try {
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      const data = await recordGameResult({
        mode: "solo",
        outcome,
        levelIndex,
        correctCount,
        wrongCount,
        durationSec,
        categoryBreakdown,
      });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setSaving(false);
    setScreen(outcome);
  }

  const progressPct = useMemo(() => Math.round(((levelIndex) / LADDER.length) * 100), [levelIndex]);

  if (!user || !current) return <div className="min-h-screen flex items-center justify-center" style={{ color: "#4FC3F7" }}>Chargement...</div>;

  if (screen === "win" || screen === "over") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center gap-5 p-6">
        <div className="text-4xl">{screen === "win" ? "🏆" : "📚"}</div>
        <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4EAD2" }}>
          {screen === "win" ? "Parcours parfait !" : "Partie terminee"}
        </div>
        <div className="text-sm" style={{ color: "#9FB0C8" }}>
          {correctCount} bonnes reponses, {wrongCount} erreur{wrongCount !== 1 ? "s" : ""}
        </div>
        {saving && <div className="text-xs" style={{ color: "#546081" }}>Enregistrement en cours...</div>}
        {result && !result.error && (
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#E8B85C" }}>+{result.xp_gained} XP</span>
            <span style={{ color: "#C9AEEE" }}>+{result.coins_gained} 🪙</span>
          </div>
        )}
        {result?.error && (
          <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>
            {result.error}
          </div>
        )}
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>
            ← Quitter
          </button>
          <div className="text-sm font-bold" style={{ color: "#4FC3F7" }}>{LADDER[levelIndex].title} — Niveau {levelIndex + 1}/15</div>
        </div>

        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1B2038" }}>
          <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "#4FC3F7", transition: "width .3s" }} />
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#5B9BD5" }}>{current.sub}</div>
          <h2 className="text-base font-semibold mb-6" style={{ color: "#F4EAD2" }}>{current.q}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.options.map((opt, i) => {
              let bg = "#123028", border = "#1E4A3E", color = "#DCE3F4";
              if (locked) {
                if (i === current.answer) { bg = "#1B3A52"; border = "#4FC3F7"; color = "#D6ECF5"; }
                else if (i === selected) { bg = "#3B1B1B"; border = "#E8664F"; color = "#F5D0C7"; }
              }
              return (
                <button key={i} onClick={() => choose(i)} disabled={locked}
                  className="text-left px-4 py-3 rounded-xl text-sm"
                  style={{ background: bg, border: `1px solid ${border}`, color }}>
                  {opt}
                </button>
              );
            })}
          </div>

          {locked && (
            <div className="mt-5 space-y-3">
              <div className="text-sm rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>
                <div>{current.explain}</div>
                <div className="mt-2 text-xs" style={{ color: "#546081" }}>Ref. {current.ref}</div>
              </div>
              <button onClick={proceed} disabled={saving} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
                {saving ? "..." : "Continuer →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
