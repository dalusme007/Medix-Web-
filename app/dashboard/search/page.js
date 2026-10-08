"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { unifiedSearch } from "@/lib/services/searchService";

function SectionTitle({ children, count }) {
  return <div className="text-xs uppercase tracking-widest mt-4 mb-2" style={{ color: "#546081" }}>{children} ({count})</div>;
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ triads: [], formulas: [], questions: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!query.trim()) { setResults({ triads: [], formulas: [], questions: [] }); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      setResults(await unifiedSearch(query));
      setLoading(false);
    }, 250); // debounce
    return () => clearTimeout(t);
  }, [query]);

  if (!user) return null;
  const totalResults = results.triads.length + results.formulas.length + results.questions.length;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>🔎 Recherche</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Triade, formule, question, mot-clé..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />

        {!query.trim() ? (
          <div className="text-center text-xs pt-8" style={{ color: "#546081" }}>Recherchez dans les triades, calculatrices et la banque de questions.</div>
        ) : loading ? (
          <div className="text-center text-sm" style={{ color: "#8393B5" }}>Recherche...</div>
        ) : totalResults === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>Aucun résultat pour "{query}".</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {results.triads.length > 0 && (
              <>
                <SectionTitle count={results.triads.length}>📋 Triades</SectionTitle>
                <div className="space-y-2">
                  {results.triads.map(t => (
                    <a key={t.id} href="/dashboard/triads" className="block rounded-xl p-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                      <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: "#8393B5" }}>{t.context}</div>
                    </a>
                  ))}
                </div>
              </>
            )}
            {results.formulas.length > 0 && (
              <>
                <SectionTitle count={results.formulas.length}>🧮 Calculatrices</SectionTitle>
                <div className="space-y-2">
                  {results.formulas.map(f => (
                    <a key={f.id} href="/dashboard/calculators" className="block rounded-xl p-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                      <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{f.name}</div>
                      <div className="text-[11px]" style={{ color: "#8393B5" }}>{f.description}</div>
                    </a>
                  ))}
                </div>
              </>
            )}
            {results.questions.length > 0 && (
              <>
                <SectionTitle count={results.questions.length}>❓ Questions</SectionTitle>
                <div className="space-y-2">
                  {results.questions.map(q => (
                    <div key={q.id} className="rounded-xl p-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                      <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#5B9BD5" }}>{q.sub} · Niveau {q.level}</div>
                      <div className="text-sm" style={{ color: "#F4EAD2" }}>{q.q}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
  
