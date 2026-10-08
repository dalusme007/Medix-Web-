"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminPartnersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", type: "Université", logo_text: "", description: "", website: "", since_year: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/partners");
    if (res.status === 403) { router.push("/dashboard"); return; }
    const data = await res.json();
    setPartners(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function resetForm() { setForm({ id: "", name: "", type: "Université", logo_text: "", description: "", website: "", since_year: "" }); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      name: form.name, type: form.type, logo_text: form.logo_text, description: form.description,
      website: form.website || null, since_year: form.since_year ? Number(form.since_year) : null, sort_order: partners.length + 1,
    };
    if (form.id) payload.id = Number(form.id);
    const method = form.id ? "PUT" : "POST";
    const res = await fetch("/api/admin/partners", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    resetForm(); await load(); setSaving(false);
  }

  async function remove(id) {
    if (!confirm("Supprimer ce partenaire ?")) return;
    await fetch(`/api/admin/partners?id=${id}`, { method: "DELETE" });
    await load();
  }

  function edit(p) {
    setForm({ id: String(p.id), name: p.name, type: p.type, logo_text: p.logo_text, description: p.description, website: p.website || "", since_year: p.since_year || "" });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: "#E8B85C" }}>🤝 Gestion des partenaires</div>
          <button onClick={() => router.push("/dashboard/admin")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-4 space-y-2" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
          <div className="text-xs font-bold mb-1" style={{ color: "#E8B85C" }}>{form.id ? "Modifier" : "Ajouter"} un partenaire</div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom" required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }}>
            {["Université", "Hôpital", "Société savante", "Institution", "Partenaire technologique"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={form.logo_text} onChange={e => setForm(f => ({ ...f, logo_text: e.target.value }))} placeholder="Initiales (2-4 lettres)" maxLength={4} required className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" required rows={2} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="Site web (optionnel)" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          <input type="number" value={form.since_year} onChange={e => setForm(f => ({ ...f, since_year: e.target.value }))} placeholder="Année de début" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          {error && <div className="text-xs" style={{ color: "#E8664F" }}>{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-full font-bold text-sm" style={{ background: "linear-gradient(180deg,#E8B85C,#C9A227)", color: "#04120D" }}>{saving ? "..." : form.id ? "Mettre à jour" : "Ajouter"}</button>
            {form.id && <button type="button" onClick={resetForm} className="px-4 py-2 rounded-full text-sm" style={{ background: "#123028", color: "#B9C4E0", border: "1px solid #1E4A3E" }}>Annuler</button>}
          </div>
        </form>

        {loading ? <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div> : (
          <div className="space-y-2">
            {partners.map(p => (
              <div key={p.id} className="rounded-xl p-3 flex items-center justify-between gap-2" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                <div className="text-sm" style={{ color: "#F4EAD2" }}>{p.name} <span className="text-[10px]" style={{ color: "#546081" }}>({p.type})</span></div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => edit(p)} className="px-2 py-1 rounded-full text-xs" style={{ background: "#123028", color: "#4FC3F7", border: "1px solid #4FC3F7" }}>Modifier</button>
                  <button onClick={() => remove(p.id)} className="px-2 py-1 rounded-full text-xs" style={{ background: "#123028", color: "#E8664F", border: "1px solid #E8664F" }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  }
    
