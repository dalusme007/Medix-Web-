"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { BANK } from "@/lib/data/questionBank";
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

const MODES = [
  { key: "fondamental", name: "Fondamental", icon: "🧬", color: "#4FC3F7", desc: "Anatomie, physiologie, biochimie" },
  { key: "clinique", name: "Clinique", icon: "🩺", color: "#E8664F", desc: "Sémiologie, pathologie, pharmacologie" },
  { key: "mixte", name: "Mixte", icon: "🔀", color: "#A374DB", desc: "Un peu des deux mondes" },
];
const DIFFICULTIES = [
  { key: "debutant", name: "Débutant", min: 1, max: 5 },
  { key: "intermediaire", name: "Intermédiaire", min: 4, max: 9 },
  { key: "avance", name: "Avancé", min: 8, max: 12 },
  { key: "expert", name: "Expert", min: 11, max: 15 },
];
const COUNT_OPTIONS = [10, 20, 50];
const TIME_OPTIONS = [30, 45, 60];

export default function CustomQuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState("mode"); // mode | config | play | result
  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState("intermediaire");
  const [count, setCount] = useState(20);
  const [timePerQ, setTimePerQ] = useState(45);

  const [run, setRun] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [answers, setAnswers] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (step !== "play" || locked) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, index, locked]);

  function startQuiz() {
    const diff = DIFFICULTIES.find(d => d.key === difficulty);
    const inRange = q => q.level >= diff.min && q.level <= diff.max;
    let pool;
    if (mode === "mixte") pool = BANK.filter(inRange);
    else {
      const cat = mode === "fondamental" ? "Sciences Fondamentales" : "Sciences Cliniques";
      pool = BANK.filter(q => q.category === cat && inRange(q));
    }
    let picked = shuffle(pool).slice(0, count);
    if (picked.length < count) {
      const wider = shuffle(pool.length ? pool : BANK);
      while (picked.length < count && wider.length) picked.push(wider[picked.length % wider.length]);
    }
    setRun(picked.map(shuffleOptions));
    setIndex(0); setSelected(null); setLocked(false); setAnswers([]); setTimeLeft(timePerQ);
    setStartedAt(Date.now());
    setStep("play");
  }

  function choose(i) {
    if (locked) return;
    clearInterval(timerRef.current);
    setSelected(i); setLocked(true);
    const q = run[index];
    const correct = i === q.answer;
    setAnswers(a => [...a, { correct, sub: q.sub, category: q.category }]);
  }

  function handleTimeout() {
    if (locked) return;
    setSelected(null); setLocked(true);
    const q = run[index];
    setAnswers(a => [...a, { correct: false, sub: q.sub, category: q.category }]);
  }

  function next() {
    if (index + 1 >= run.length) { finish(); return; }
    setIndex(i => i + 1); setSelected(null); setLocked(false); setTimeLeft(timePerQ);
  }

  async function finish() {
    setSaving(true);
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const correctCount = answers.filter(a => a.correct).length;
    const breakdown = {};
    answers.forEach(a => {
      breakdown[a.sub] = breakdown[a.sub] || { correct: 0, wrong: 0 };
      if (a.correct) breakdown[a.sub].correct++; else breakdown[a.sub].wrong++;
    });
    try {
      const data = await recordGameResult({
        mode: "personnalise",
        outcome: correctCount === run.length ? "win" : "over",
        correctCount, wrongCount: run.length - correctCount,
        durationSec, categoryBreakdown: breakdown,
        quizCategory: mode, difficulty,
      });
      setResult({ ...data, correctCount });
    } catch (e) {
      setResult({ error: e.message });
    }
    setSaving(false);
    setStep("result");
  }

  if (!user) return null;

  if (step === "mode") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold" style={{ color: "#A374DB" }}>🎯 Mode personnalisé</div>
            <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MODES.map(m => (
              <button key={m.key} onClick={() => { setMode(m.key); setStep("config"); }} className="rounded-2xl p-5 text-left space-y-2" style={{ background: `${m.color}14`, border: `1px solid ${m.color}` }}>
                <div className="text-4xl">{m.icon}</div>
                <div className="text-base font-bold" style={{ color: m.color }}>{m.name}</div>
                <p className="text-xs" style={{ color: "#B9C4E0" }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-lg font-bold text-center" style={{ color: "#A374DB" }}>Configuration</div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Nombre de questions</div>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map(c => (
                <button key={c} onClick={() => setCount(c)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: count === c ? "linear-gradient(180deg,#A374DB,#7C4FC9)" : "#123028", color: count === c ? "#fff" : "#8393B5", border: "1px solid #1E4A3E" }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Temps par question</div>
            <div className="flex gap-2">
              {TIME_OPTIONS.map(t => (
                <button key={t} onClick={() => setTimePerQ(t)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: timePerQ === t ? "linear-gradient(180deg,#A374DB,#7C4FC9)" : "#123028", color: timePerQ === t ? "#fff" : "#8393B5", border: "1px solid #1E4A3E" }}>{t}s</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Difficulté</div>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.key} onClick={() => setDifficulty(d.key)} className="py-2 rounded-lg text-sm font-semibold" style={{ background: difficulty === d.key ? "linear-gradient(180deg,#A374DB,#7C4FC9)" : "#123028", color: difficulty === d.key ? "#fff" : "#8393B5", border: "1px solid #1E4A3E" }}>{d.name}</button>
              ))}
            </div>
          </div>
          <button onClick={startQuiz} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#A374DB,#7C4FC9)", color: "#fff" }}>Lancer le quiz</button>
          <div className="text-center"><button onClick={() => setStep("mode")} className="text-xs" style={{ color: "#546081" }}>← Retour</button></div>
        </div>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center p-6">
        <div className="text-4xl">{result?.correctCount === run.length ? "🏆" : "📚"}</div>
        <div className="text-3xl font-black" style={{ color: "#F4EAD2" }}>{result?.correctCount} / {run.length}</div>
        {saving && <div className="text-xs" style={{ color: "#546081" }}>Enregistrement...</div>}
        {result && !result.error && (
          <div className="flex gap-4 text-sm">
            <span style={{ color: "#E8B85C" }}>+{result.xp_gained} XP</span>
            <span style={{ color: "#C9AEEE" }}>+{result.coins_gained} 🪙</span>
          </div>
        )}
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#A374DB,#7C4FC9)", color: "#fff" }}>Retour</button>
      </div>
    );
  }

  // step === "play"
  const q = run[index];
  if (!q) return null;
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold" style={{ color: "#A374DB" }}>Question {index + 1}/{run.length}</div>
          <div className="text-sm font-mono font-bold" style={{ color: timeLeft <= 10 ? "#E8664F" : "#8393B5" }}>{timeLeft}s</div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
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
              <button onClick={next} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#A374DB,#7C4FC9)", color: "#fff" }}>
                {index + 1 >= run.length ? "Voir les résultats" : "Suivant →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
