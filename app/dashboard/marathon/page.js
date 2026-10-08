"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile } from "@/lib/services/profileService";
import { getProgress, getGradeForXp } from "@/lib/services/progressService";
import { getWeeklyLeaderboard, getHallOfFame, attemptsRemaining, getCurrentWeekKey } from "@/lib/services/marathonService";
import { recordGameResult } from "@/lib/services/gameService";
import { BANK } from "@/lib/data/questionBank";
import { MARATHON_BANDS, MARATHON_QUESTION_COUNT, MARATHON_UNLOCK_GRADE_INDEX, MARATHON_MILESTONES } from "@/lib/constants/marathon";

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

const MODES = [
  { key: "fondamental", name: "Fondamental", icon: "🧬", color: "#4FC3F7" },
  { key: "clinique", name: "Clinique", icon: "🩺", color: "#E8664F" },
  { key: "mixte", name: "Mixte", icon: "🔀", color: "#A374DB" },
];

function pickMarathonQuestions(modeKey) {
  const questions = [];
  MARATHON_BANDS.forEach(band => {
    const count = band.to - band.from;
    const inRange = q => q.level >= band.minLevel && q.level <= band.maxLevel;
    if (modeKey === "mixte") {
      const fond = BANK.filter(q => q.category === "Sciences Fondamentales" && inRange(q));
      const clin = BANK.filter(q => q.category === "Sciences Cliniques" && inRange(q));
      const half = Math.ceil(count / 2);
      let picked = [...shuffle(fond).slice(0, half), ...shuffle(clin).slice(0, count - half)];
      if (picked.length < count) {
        const combined = shuffle([...fond, ...clin]);
        while (picked.length < count && combined.length) picked.push(combined[picked.length % combined.length]);
      }
      questions.push(...shuffle(picked).slice(0, count));
    } else {
      const catFilter = modeKey === "fondamental" ? "Sciences Fondamentales" : "Sciences Cliniques";
      const pool = BANK.filter(q => q.category === catFilter && inRange(q));
      let picked = shuffle(pool).slice(0, count);
      if (picked.length < count) {
        const wider = shuffle(BANK.filter(q => q.category === catFilter));
        while (picked.length < count && wider.length) picked.push(wider[picked.length % wider.length]);
      }
      questions.push(...picked);
    }
  });
  return questions.map(shuffleOptions);
}

export default function MarathonPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [screen, setScreen] = useState("hub"); // hub | mode | countdown | play | result | leaderboard | hof
  const [leaderboard, setLeaderboard] = useState([]);
  const [hof, setHof] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const [countdown, setCountdown] = useState(3);
  const [run, setRun] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    (async () => {
      setProfile(await getProfile(user.id));
      setProgress(await getProgress(user.id));
    })();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) {
      setStartedAt(Date.now());
      setScreen("play");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [screen, countdown]);

  async function openLeaderboard() {
    setLoadingBoard(true);
    setScreen("leaderboard");
    try { setLeaderboard(await getWeeklyLeaderboard()); } catch (e) { setLeaderboard([]); }
    setLoadingBoard(false);
  }
  async function openHof() {
    setLoadingBoard(true);
    setScreen("hof");
    try { setHof(await getHallOfFame()); } catch (e) { setHof([]); }
    setLoadingBoard(false);
  }

  function chooseMode(modeKey) {
    setSelectedMode(modeKey);
    setRun(pickMarathonQuestions(modeKey));
    setIndex(0); setSelected(null); setLocked(false); setCorrectCount(0); setAnswers([]); setCountdown(3);
    setScreen("countdown");
  }

  function choose(i) {
    if (locked) return;
    setSelected(i); setLocked(true);
    const q = run[index];
    const correct = i === q.answer;
    if (correct) setCorrectCount(c => c + 1);
    setAnswers(a => [...a, { correct, sub: q.sub, category: q.category }]);
  }

  function next() {
    const justAnswered = index + 1;
    if (MARATHON_MILESTONES[justAnswered]) {
      setMilestoneToast(MARATHON_MILESTONES[justAnswered]);
      setTimeout(() => setMilestoneToast(null), 3200);
    }
    if (index + 1 >= run.length) { finish(); return; }
    setIndex(i => i + 1); setSelected(null); setLocked(false);
  }

  async function finish() {
    setSaving(true);
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const breakdown = {};
    answers.forEach(a => {
      breakdown[a.sub] = breakdown[a.sub] || { correct: 0, wrong: 0 };
      if (a.correct) breakdown[a.sub].correct++; else breakdown[a.sub].wrong++;
    });
    try {
      const data = await recordGameResult({
        mode: "marathon",
        outcome: correctCount === MARATHON_QUESTION_COUNT ? "win" : "over",
        correctCount,
        wrongCount: answers.length - correctCount,
        durationSec,
        categoryBreakdown: breakdown,
        quizCategory: selectedMode,
      });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setSaving(false);
    setScreen("result");
  }

  if (!user || !profile || !progress) return null;

  const gi = getGradeForXp(progress.total_xp);
  const unlocked = gi.index >= MARATHON_UNLOCK_GRADE_INDEX;
  const attemptsLeft = attemptsRemaining(progress);

  if (screen === "hub") {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#E8B85C" }}>🏆 Grand Marathon Medix</div>
            <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
          </div>

          {!unlocked ? (
            <div className="rounded-2xl p-6 text-center space-y-2" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
              <div className="text-4xl">🔒</div>
              <p className="text-sm" style={{ color: "#B9C4E0" }}>Réservé aux joueurs ayant atteint le grade <strong style={{ color: "#5B9BD5" }}>Interne</strong>.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl p-6 space-y-4 text-center" style={{ background: "linear-gradient(180deg,#0D1F1B,#123028)", border: "1px solid #E8B85C55" }}>
                <div className="text-xs uppercase tracking-widest" style={{ color: "#5B9BD5" }}>Participations cette semaine</div>
                <div className="text-3xl">{"🏅".repeat(2 - attemptsLeft)}{"⭐".repeat(attemptsLeft)}</div>
                <div className="text-sm font-bold" style={{ color: "#F4EAD2" }}>{attemptsLeft} / 2 restantes</div>
                {attemptsLeft <= 0 ? (
                  <div className="text-sm rounded-lg px-4 py-3" style={{ background: "rgba(232,102,79,0.08)", border: "1px solid #E8664F", color: "#F5A98F" }}>
                    Vous avez utilisé vos participations cette semaine.
                  </div>
                ) : (
                  <button onClick={() => setScreen("mode")} className="px-8 py-3.5 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#E8B85C,#C9A227)", color: "#04120D" }}>
                    Participer maintenant
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={openLeaderboard} className="flex-1 py-3 rounded-full text-sm font-semibold" style={{ background: "#123028", color: "#5B9BD5", border: "1px solid #5B9BD5" }}>📊 Classement</button>
                <button onClick={openHof} className="flex-1 py-3 rounded-full text-sm font-semibold" style={{ background: "#123028", color: "#E8B85C", border: "1px solid #E8B85C" }}>👑 Hall of Fame</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (screen === "mode") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center text-lg font-bold" style={{ color: "#E8B85C" }}>Choisissez votre catégorie</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MODES.map(m => (
              <button key={m.key} onClick={() => chooseMode(m.key)} className="rounded-2xl p-5 text-left space-y-2" style={{ background: `${m.color}14`, border: `1px solid ${m.color}` }}>
                <div className="text-4xl">{m.icon}</div>
                <div className="text-base font-bold" style={{ color: m.color }}>{m.name}</div>
              </button>
            ))}
          </div>
          <div className="text-center"><button onClick={() => setScreen("hub")} className="text-xs" style={{ color: "#546081" }}>← Retour</button></div>
        </div>
      </div>
    );
  }

  if (screen === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-xs uppercase tracking-widest" style={{ color: "#5B9BD5" }}>Le Marathon commence dans</div>
        <div className="text-8xl font-black" style={{ color: "#E8B85C" }}>{countdown > 0 ? countdown : "GO"}</div>
      </div>
    );
  }

  if (screen === "result") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center p-6">
        <div className="text-5xl">{correctCount === 100 ? "🏆" : "🏅"}</div>
        <div className="text-4xl font-black" style={{ color: "#F4EAD2" }}>{correctCount} / 100</div>
        {saving && <div className="text-xs" style={{ color: "#546081" }}>Enregistrement...</div>}
        {result && !result.error && (
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#E8B85C" }}>+{result.xp_gained} XP</span>
            <span style={{ color: "#C9AEEE" }}>+{result.coins_gained} 🪙</span>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={openLeaderboard} className="px-6 py-3 rounded-full font-bold" style={{ background: "#123028", color: "#5B9BD5", border: "1px solid #5B9BD5" }}>Classement</button>
          <button onClick={() => setScreen("hub")} className="px-6 py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#E8B85C,#C9A227)", color: "#04120D" }}>Retour</button>
        </div>
      </div>
    );
  }

  if (screen === "leaderboard" || screen === "hof") {
    const list = screen === "leaderboard" ? leaderboard : hof;
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold" style={{ color: "#E8B85C" }}>{screen === "leaderboard" ? "Classement hebdomadaire" : "👑 Hall of Fame"}</div>
            <button onClick={() => setScreen("hub")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
          </div>
          {loadingBoard ? <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div> :
            list.length === 0 ? <div className="text-center text-sm rounded-2xl p-8" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>Rien pour le moment.</div> :
            <div className="space-y-2">
              {screen === "leaderboard" ? list.map((e, i) => (
                <div key={e.user_id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                  <div className="w-8 text-center font-bold" style={{ color: i === 0 ? "#E8B85C" : "#546081" }}>{i + 1}</div>
                  <div className="flex-1 text-sm" style={{ color: "#F4EAD2" }}>{e.shared_profiles?.pseudo}</div>
                  <div className="text-sm font-bold" style={{ color: "#E8B85C" }}>{e.correct_count}/100</div>
                </div>
              )) : list.map(w => (
                <div key={w.week_key} className="rounded-2xl p-4" style={{ background: "#0D1F1B", border: "1px solid #E8B85C33" }}>
                  <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "#546081" }}>Semaine du {w.week_key}</div>
                  <div className="text-sm" style={{ color: "#F4EAD2" }}>{w.total_participants} participant(s)</div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    );
  }

  // screen === "play"
  const q = run[index];
  if (!q) return null;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {milestoneToast && (
          <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 max-w-sm" style={{ width: "90%" }}>
            <div className="rounded-xl p-3 text-xs text-center" style={{ background: "#0D1F1B", border: "1px solid #E8B85C", color: "#E8B85C" }}>{milestoneToast}</div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold" style={{ color: "#E8B85C" }}>🏆 Marathon</div>
          <div className="text-sm font-bold font-mono" style={{ color: "#5B9BD5" }}>{correctCount}/{index + (locked ? 1 : 0)}</div>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#123028" }}>
          <div className="h-full" style={{ width: `${((index + (locked ? 1 : 0)) / 100) * 100}%`, background: "linear-gradient(90deg,#5B9BD5,#E8B85C)" }} />
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#0D1F1B", border: "1px solid #E8B85C33" }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#5B9BD5" }}>{q.sub}</div>
          <h2 className="text-base font-semibold mb-6" style={{ color: "#F4EAD2" }}>{q.q}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              let bg = "#123028", border = "#1E4A3E", color = "#DCE3F4";
              if (locked) {
                if (i === q.answer) { bg = "#1B3A52"; border = "#4FC3F7"; color = "#D6ECF5"; }
                else if (i === selected) { bg = "#3B1B1B"; border = "#E8664F"; color = "#F5D0C7"; }
              }
              return <button key={i} onClick={() => choose(i)} disabled={locked} className="text-left px-4 py-3 rounded-xl text-sm" style={{ background: bg, border: `1px solid ${border}`, color }}>{opt}</button>;
            })}
          </div>
          {locked && (
            <div className="mt-5 space-y-3">
              <div className="text-sm rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>{q.explain}</div>
              <button onClick={next} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#E8B85C,#C9A227)", color: "#04120D" }}>
                {index + 1 >= 100 ? "Voir les résultats" : "Suivant →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
      }
                               
