"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { searchTriads } from "@/lib/services/triadService";

const SPECIALTIES = ["Toutes", "Cardiovasculaire", "Neurologie", "Hépato-gastro-entérologie", "Néphrologie / Urologie", "Gynécologie-obstétrique", "Oncologie / Hématologie", "Oncologie", "Endocrinologie", "Pneumologie", "Rhumatologie", "ORL", "Infectiologie / Pédiatrie", "Pneumologie / Génétique", "Cardiologie pédiatrique", "Urologie", "Médecine interne / Rhumatologie", "Orthopédie / Rhumatologie", "Chirurgie digestive"];

export default function TriadsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Toutes");
  const [triads, setTriads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, search, specialty]);

  async function load() {
    setLoading(true);
    try { setTriads(await searchTriads(search, specialty)); } catch (e) { setTriads([]); }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>📋 Triades médicales</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une triade, une pathologie..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />

        <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }}>
          {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {loading ? (
          <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div>
        ) : triads.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E", color: "#8393B5" }}>Aucune triade ne correspond.</div>
        ) : (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {triads.map(t => (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold" style={{ color: "#F4EAD2" }}>{t.name}</div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(79,195,247,0.12)", color: "#4FC3F7" }}>{t.specialty}</span>
                </div>
                <div className="text-xs mb-3" style={{ color: "#8393B5" }}>{t.context}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  {t.components.map((c, i) => (
                    <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#DCE3F4" }}>{c}</div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#B9C4E0" }}>{t.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
    
