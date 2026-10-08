"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { updateProfile, isPseudoAvailable } from "@/lib/services/profileService";
import { AVATARS, PROFESSIONS } from "@/lib/constants/profileOptions";

// Etape obligatoire apres l'inscription Supabase : la ligne shared.profiles
// existe deja (creee par le trigger SQL) mais avec un pseudo temporaire.
// On la complete ici avec les vraies informations du joueur.
export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [pseudo, setPseudo] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [medical, setMedical] = useState(null);
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [universitaire, setUniversitaire] = useState(null);
  const [universite, setUniversite] = useState("");
  const [nationalite, setNationalite] = useState("");
  const [publicLeaderboard, setPublicLeaderboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!pseudo.trim()) { setError("Le pseudo est requis."); return; }
    setLoading(true);
    try {
      const available = await isPseudoAvailable(pseudo.trim());
      if (!available) {
        setError("Ce pseudo est deja pris, choisissez-en un autre.");
        setLoading(false);
        return;
      }
      await updateProfile(user.id, {
        pseudo: pseudo.trim(),
        avatar,
        nom: nom.trim() || null,
        prenom: prenom.trim() || null,
        medical: !!medical,
        profession: medical ? profession : null,
        universitaire: !!universitaire,
        universite: universitaire ? universite.trim() : null,
        nationalite: nationalite.trim() || null,
        public_leaderboard: !!publicLeaderboard,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    }
    setLoading(false);
  }

  if (!user) return null; // le middleware/layout protege deja cette route

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl p-6 space-y-5" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
        <div className="text-center">
          <div className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>Creez votre profil</div>
          <div className="text-xs mt-1" style={{ color: "#8393B5" }}>Derniere etape avant de commencer</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Avatar</div>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => setAvatar(a)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: avatar === a ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", border: `1px solid ${avatar === a ? "#2E9BD6" : "#1E4A3E"}` }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Pseudonyme *</div>
          <input value={pseudo} onChange={e => setPseudo(e.target.value)} maxLength={20} placeholder="Ex: DrHouse92"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Nom</div>
            <input value={nom} onChange={e => setNom(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Prenom</div>
            <input value={prenom} onChange={e => setPrenom(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Domaine medical ?</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMedical(true)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: medical === true ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: medical === true ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>Oui</button>
            <button type="button" onClick={() => setMedical(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: medical === false ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: medical === false ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>Non</button>
          </div>
        </div>

        {medical === true && (
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Profession</div>
            <select value={profession} onChange={e => setProfession(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }}>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Etes-vous universitaire ?</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUniversitaire(true)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: universitaire === true ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: universitaire === true ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>Oui</button>
            <button type="button" onClick={() => setUniversitaire(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: universitaire === false ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: universitaire === false ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>Non</button>
          </div>
        </div>

        {universitaire === true && (
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Nom de l'universite</div>
            <input value={universite} onChange={e => setUniversite(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Nationalite</div>
          <input value={nationalite} onChange={e => setNationalite(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#F4EAD2" }} />
        </div>

        <div className="rounded-lg p-3" style={{ background: "#123028", border: "1px solid #1E4A3E" }}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8393B5" }}>Classement partage</div>
          <p className="text-[11px] mb-3" style={{ color: "#8393B5" }}>
            Si vous acceptez, votre pseudo, avatar, XP, grade, universite et nationalite seront visibles par les autres joueurs dans le classement.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPublicLeaderboard(true)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: publicLeaderboard === true ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: publicLeaderboard === true ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>J'accepte</button>
            <button type="button" onClick={() => setPublicLeaderboard(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: publicLeaderboard === false ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028", color: publicLeaderboard === false ? "#04120D" : "#8393B5", border: "1px solid #1E4A3E" }}>Rester prive</button>
          </div>
        </div>

        {error && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>{error}</div>}

        <button type="submit" disabled={loading || !pseudo.trim()} className="w-full py-3 rounded-full font-bold" style={{ background: "linear-gradient(180deg,#4FC3F7,#2E9BD6)", color: "#04120D", opacity: loading || !pseudo.trim() ? 0.6 : 1 }}>
          {loading ? "Creation..." : "Creer mon profil"}
        </button>
      </form>
    </div>
  );
}
  
