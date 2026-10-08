"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminTriadsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [triads, setTriads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", context: "", explanation: "", specialty: "", components: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/triads");
    if (res.status === 403) { router.push("/dashboard"); return; }
    const data = await res.json();
    setTriads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ id: "", name: "", context: "", explanation: "", specialty: "", components: "" });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name, context: form.context, explanation: form.explanation, specialty: form.specialty,
      components: form.components.split(",").map(c => c.trim()).filter(Boolean),
    };
    if (form.id) payload.id = Number(form.id);
    else payload.id = Math.max(0, ...triads.map(t => t.id)) + 1;

    const method = triads.some(t => t.id === payload.id) ? "PUT" : "POST";
    const res = await fetch("/api/admin/triads", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    resetForm();
    await load();
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Supprimer cette triade ?")) return;
    await fetch(`/api/admin/triads?id=${id}`, { method: "DELETE" });
    await load();
  }

  function edit(t) {
    setForm({ id: String(t.id), name: t.name, context: t.context, explanation: t.explanation, specialty: t.specialty, components: t.components.join(", ") });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: "#E8B85C" }}>📋 Gestion des triades</div>
          <button onClick={() => router.push("/dashboard/admin")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-4 space-y-2" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
          <div className="text-xs font-bold mb-1" style={{ color: "#E8B85C" }}>{form.id ? "Modifier" : "Ajouter"} une triade</div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom" required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Contexte / pathologie" required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Spécialité" required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <input value={form.components} onChange={e => setForm(f => ({ ...f, components: e.target.value }))} placeholder="Composants séparés par des virgules" required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Explication" required rows={3} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          {error && <div className="text-xs" style={{ color: "#E8664F" }}>{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-full font-bold text-sm" style={{ background: "linear-gradient(180deg,#E8B85C,#C9A227)", color: "#04120D" }}>{saving ? "..." : form.id ? "Mettre à jour" : "Ajouter"}</button>
            {form.id && <button type="button" onClick={resetForm} className="px-4 py-2 rounded-full text-sm" style={{ background: "#123028", color: "#B9C4E0", border: "1px solid #1E4A3E" }}>Annuler</button>}
          </div>
        </form>

        {loading ? <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div> : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {triads.map(t => (
              <div key={t.id} className="rounded-xl p-3 flex items-center justify-between gap-2" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                <div className="text-sm" style={{ color: "#F4EAD2" }}>{t.name}</div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => edit(t)} className="px-2 py-1 rounded-full text-xs" style={{ background: "#123028", color: "#4FC3F7", border: "1px solid #4FC3F7" }}>Modifier</button>
                  <button onClick={() => remove(t.id)} className="px-2 py-1 rounded-full text-xs" style={{ background: "#123028", color: "#E8664F", border: "1px solid #E8664F" }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                            }
    
