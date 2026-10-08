"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { FORMULAS, CALC_CATEGORIES, searchFormulas } from "@/lib/data/formulas";

export default function CalculatorsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [selectedId, setSelectedId] = useState(null);
  const [values, setValues] = useState({});

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  function selectFormula(id) {
    setSelectedId(id);
    const f = FORMULAS.find(f => f.id === id);
    const defaults = {};
    f.inputs.forEach(inp => { defaults[inp.key] = inp.type === "select" ? inp.options[0].value : ""; });
    setValues(defaults);
  }

  if (!user) return null;
  const selected = FORMULAS.find(f => f.id === selectedId);

  if (selected) {
    const allFilled = selected.inputs.every(inp => values[inp.key] !== "" && values[inp.key] !== undefined);
    let result = null;
    if (allFilled) {
      try {
        const numeric = {};
        selected.inputs.forEach(inp => { numeric[inp.key] = inp.type === "select" ? Number(values[inp.key]) : parseFloat(values[inp.key]); });
        result = selected.compute(numeric);
      } catch (e) { result = null; }
    }
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-md mx-auto space-y-4">
          <button onClick={() => setSelectedId(null)} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Liste</button>
          <div className="text-lg font-bold" style={{ color: "#F4EAD2" }}>{selected.name}</div>
          <p className="text-xs" style={{ color: "#8393B5" }}>{selected.description}</p>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
            {selected.inputs.map(inp => (
              <div key={inp.key}>
                <div className="text-xs mb-1.5" style={{ color: "#8393B5" }}>{inp.label}{inp.unit ? ` (${inp.unit})` : ""}</div>
                {inp.type === "select" ? (
                  <select value={values[inp.key] ?? ""} onChange={e => setValues(v => ({ ...v, [inp.key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }}>
                    {inp.options.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type="number" value={values[inp.key] ?? ""} onChange={e => setValues(v => ({ ...v, [inp.key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
                )}
              </div>
            ))}
          </div>
          {result ? (
            <div className="rounded-2xl p-5 text-center space-y-2" style={{ background: `${result.color}14`, border: `1px solid ${result.color}` }}>
              <div className="text-3xl font-black" style={{ color: result.color }}>{Number.isFinite(result.value) ? result.value.toFixed(2) : "—"} <span className="text-sm font-normal">{result.unit}</span></div>
              <div className="text-sm font-semibold" style={{ color: result.color }}>{result.interpretation}</div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 text-center text-xs" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#546081" }}>Renseignez toutes les valeurs.</div>
          )}
          <div className="text-[10px] text-center" style={{ color: "#3E5C5C" }}>Référence : {selected.reference}</div>
        </div>
      </div>
    );
  }

  const results = searchFormulas(search, category);
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>🧮 Calculatrices médicales</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une formule..." className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
        <div className="flex flex-wrap gap-2">
          {CALC_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: category === c ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: category === c ? "#04120D" : "#B9C4E0", border: "1px solid #1E4A3E" }}>{c}</button>
          ))}
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {results.map(f => (
            <button key={f.id} onClick={() => selectFormula(f.id)} className="w-full text-left rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{f.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#8393B5" }}>{f.description}</div>
              </div>
              <span style={{ color: "#4FC3F7" }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
  
