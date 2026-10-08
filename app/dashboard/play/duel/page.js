"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile } from "@/lib/services/profileService";
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
  return { ...q, options: idxs.map(i => q.options[i]), answer: idxs.indexOf(q.answer) };
}

// Mode Duel : 2 joueurs sur le meme appareil, tour par tour sur la meme
// echelle de niveaux. Joueur 1 = compte reel (XP enregistre en base via
// record_game_result). Joueur 2 = invite local, sans compte, ses reponses
// ne sont pas persistees (comme dans le prototype d'origine).
export default function DuelPlayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);

  const [phase, setPhase] = useState("setup"); // setup | handoff | play | result
  const [player2Name, setPlayer2Name] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 ou 2
  const [levelIndex1, setLevelIndex1] = useState(0);
  const [levelIndex2, setLevelIndex2] = useState(0);
  const [eliminated1, setEliminated1] = useState(false);
  const [eliminated2, setEliminated2] = useState(false);
  const [current, setCurrent] = useState(null);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [p1Correct, setP1Correct] = useState(0);
  const [p1Wrong, setP1Wrong] = useState(0);
  const [p1Breakdown, setP1Breakdown] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getProfile(user.id).then(setProfile);
  }, [user, authLoading, router]);

  function startDuel() {
    if (!player2Name.trim()) return;
    setStartedAt(Date.now());
    setCurrentPlayer(1);
    pickQuestion(0);
    setPhase("play");
  }

  function pickQuestion(idx) {
    const lvl = LADDER[idx].level;
    const pool = BANK.filter(q => q.level === lvl);
    const q = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(shuffleOptions(q));
    setSelected(null);
    setLocked(false);
  }

  function choose(i) {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const correct = i === current.answer;

    if (currentPlayer === 1) {
      if (correct) setP1Correct(c => c + 1); else setP1Wrong(c => c + 1);
      setP1Breakdown(b => {
        const prev = b[current.sub] || { correct: 0, wrong: 0 };
        return { ...b, [current.sub]: { correct: prev.correct + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) } };
      });
      if (!correct) setEliminated1(true);
    } else {
      if (!correct) setEliminated2(true);
    }
  }

  function nextTurn() {
    const p1Done = eliminated1 || levelIndex1 + 1 >= LADDER.length;
    const p2Done = eliminated2 || levelIndex2 + 1 >= LADDER.length;

    // Avancer le niveau du joueur qui vient de jouer, si sa reponse etait correcte
    if (currentPlayer === 1 && !eliminated1) setLevelIndex1(i => Math.min(i + 1, LADDER.length - 1));
    if (currentPlayer === 2 && !eliminated2) setLevelIndex2(i => Math.min(i + 1, LADDER.length - 1));

    const bothDone =
      (eliminated1 || levelIndex1 + (currentPlayer === 1 && !eliminated1 ? 1 : 0) >= LADDER.length) &&
      (eliminated2 || levelIndex2 + (currentPlayer === 2 && !eliminated2 ? 1 : 0) >= LADDER.length);

    if (bothDone) {
      finishDuel();
      return;
    }

    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const nextEliminated = nextPlayer === 1 ? eliminated1 : eliminated2;
    if (nextEliminated) {
      // Le joueur suivant est deja elimine, on repasse au premier encore actif
      finishIfNeededElse(nextPlayer);
      return;
    }
    setCurrentPlayer(nextPlayer);
    const nextLevel = nextPlayer === 1 ? levelIndex1 : levelIndex2;
    pickQuestion(nextLevel);
    setPhase("handoff");
  }

  function finishIfNeededElse(skippedPlayer) {
    const otherPlayer = skippedPlayer === 1 ? 2 : 1;
    const otherEliminated = otherPlayer === 1 ? eliminated1 : eliminated2;
    if (otherEliminated) { finishDuel(); return; }
    setCurrentPlayer(otherPlayer);
    const lvl = otherPlayer === 1 ? levelIndex1 : levelIndex2;
    pickQuestion(lvl);
    setPhase("handoff");
  }

  function confirmHandoff() {
    setPhase("play");
  }

  async function finishDuel() {
    setSaving(true);
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const p1Level = eliminated1 ? levelIndex1 : levelIndex1;
    const p1Won = !eliminated1 && levelIndex1 + 1 >= LADDER.length && (eliminated2 || levelIndex2 <= levelIndex1);
    try {
      const data = await recordGameResult({
        mode: "duel",
        outcome: p1Won ? "win" : "over",
        levelIndex: p1Level,
        correctCount: p1Correct,
        wrongCount: p1Wrong,
        durationSec,
        categoryBreakdown: p1Breakdown,
      });
      setResult({ ...data, p1Won });
    } catch (e) {
      setResult({ error: e.message });
    }
    setSaving(false);
    setPhase("result");
  }

  if (!user) return null;

  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
          <div className="text-lg font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>Mode 2 joueurs</div>
          <p className="text-xs text-center" style={{ color: "#8393B5" }}>
            {profile?.pseudo} affronte un invite sur le meme appareil, tour par tour.
          </p>
          <input value={player2Name} onChange={e => setPlayer2Name(e.target.value)} placeholder="Pseudo du joueur 2"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <button onClick={startDuel} disabled={!player2Name.trim()} className="w-full py-3 rounded-full font-bold"
            style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: player2Name.trim() ? 1 : 0.5 }}>
            Lancer le duel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "handoff") {
    const name = currentPlayer === 1 ? profile?.pseudo : player2Name;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="text-2xl">🔄</div>
        <div className="text-lg font-bold" style={{ color: "#F4EAD2" }}>Au tour de {name}</div>
        <p className="text-xs" style={{ color: "#8393B5" }}>Passez l'appareil, puis continuez quand vous etes pret.</p>
        <button onClick={confirmHandoff} className="px-6 py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
          Je suis pret
        </button>
      </div>
    );
  }

  if (phase === "result") {
    const name1 = profile?.pseudo, name2 = player2Name;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="text-3xl">🏁</div>
        <div className="text-lg font-bold" style={{ color: "#F4EAD2" }}>
          {result?.p1Won ? `${name1} remporte le duel !` : eliminated1 && !eliminated2 ? `${name2} remporte le duel !` : "Duel termine"}
        </div>
        <div className="flex gap-6 text-sm" style={{ color: "#9FB0C8" }}>
          <div>{name1} : niveau {levelIndex1 + 1}{eliminated1 ? " (elimine)" : ""}</div>
          <div>{name2} : niveau {levelIndex2 + 1}{eliminated2 ? " (elimine)" : ""}</div>
        </div>
        {saving && <div className="text-xs" style={{ color: "#546081" }}>Enregistrement en cours...</div>}
        {result && !result.error && (
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#E8B85C" }}>+{result.xp_gained} XP</span>
            <span style={{ color: "#C9AEEE" }}>+{result.coins_gained} 🪙</span>
          </div>
        )}
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // phase === "play"
  if (!current) return null;
  const activeName = currentPlayer === 1 ? profile?.pseudo : player2Name;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>
            ← Quitter
          </button>
          <div className="text-sm font-bold" style={{ color: "#4FC3F7" }}>Tour de {activeName} — Niveau {(currentPlayer === 1 ? levelIndex1 : levelIndex2) + 1}/15</div>
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
                <button key={i} onClick={() => choose(i)} disabled={locked} className="text-left px-4 py-3 rounded-xl text-sm"
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
              <button onClick={nextTurn} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D" }}>
                Continuer →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
    
