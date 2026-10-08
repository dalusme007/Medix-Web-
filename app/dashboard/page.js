"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile } from "@/lib/services/profileService";
import { getProgress, getGradeForXp } from "@/lib/services/progressService";
import { signOut } from "@/lib/services/authService";

// Tableau de bord principal - equivalent de l'ecran titre de l'artefact
// original, mais entierement branche sur Supabase (plus de window.storage).
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    (async () => {
      const p = await getProfile(user.id);
      // Pseudo temporaire = profil jamais complete -> on redirige vers l'etape de creation
      if (p.pseudo.startsWith("joueur_")) {
        router.push("/dashboard/setup");
        return;
      }
      setProfile(p);
      setProgress(await getProgress(user.id));
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (loading || !profile || !progress) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "#4FC3F7" }}>Chargement...</div>;
  }

  const gi = getGradeForXp(progress.total_xp);

  const modes = [
    { href: "/dashboard/play/solo", label: "Jouer (Solo)", primary: true },
    { href: "/dashboard/play/duel", label: "Mode 2 joueurs" },
    { href: "/dashboard/play/personnalise", label: "Mode personnalise" },
    { href: "/dashboard/marathon", label: "Grand Marathon Medix", gold: true },
  ];

  const links = [
    { href: "/dashboard/stats", label: "Stats" },
    { href: "/dashboard/history", label: "Historique" },
    { href: "/dashboard/badges", label: "Badges" },
    { href: "/dashboard/leaderboard", label: "Classement" },
    { href: "/dashboard/triads", label: "Triades" },
    { href: "/dashboard/partners", label: "Partenaires" },
    { href: "/dashboard/calculators", label: "Calculatrices" },
    { href: "/dashboard/search", label: "🔎 Recherche" },
    { href: "/dashboard/stephene", label: "Dr Stephene" },
    ...(profile.is_admin ? [{ href: "/dashboard/admin", label: "⚙️ Admin" }] : []),
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#123028", border: "1px solid #4FC3F7" }}>M</div>
            <div className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>MEDIX</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {links.map(l => (
              <a key={l.href} href={l.href} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>{l.label}</a>
            ))}
            <button onClick={signOut} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(232,102,79,0.1)", border: "1px solid #E8664F", color: "#F5A98F" }}>Deconnexion</button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl" style={{ background: "radial-gradient(circle at 35% 30%, #123028, #0D1F1B)", border: "3px solid #4FC3F7", boxShadow: "0 0 40px rgba(79,195,247,0.25)" }}>
            {profile.avatar}
          </div>
          <div className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F4EAD2" }}>{profile.pseudo}</div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-bold" style={{ color: "#4FC3F7" }}>{gi.grade.name}</div>
            <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#1B2038" }}>
              <div className="h-full rounded-full" style={{ width: `${gi.progressPct}%`, background: "#4FC3F7" }} />
            </div>
            <div className="text-[11px]" style={{ color: "#546081" }}>
              {progress.total_xp.toLocaleString("fr-FR")} XP{gi.next ? ` \u00b7 ${gi.xpToNext.toLocaleString("fr-FR")} XP avant ${gi.next.name}` : ""}
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(201,174,238,0.08)", border: "1px solid #A374DB", color: "#C9AEEE" }}>
            {progress.total_coins.toLocaleString("fr-FR")} Medix Coins
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {modes.map(m => (
            <a key={m.href} href={m.href} className="px-6 py-3.5 rounded-full font-bold text-center"
              style={{
                background: m.gold ? "linear-gradient(180deg,#E8B85C,#C9A227)" : m.primary ? "linear-gradient(180deg,#4FC3F7,#2E9BD6)" : "#123028",
                color: m.gold || m.primary ? "#04120D" : "#B9C4E0",
                border: m.gold || m.primary ? "none" : "1px solid #1E4A3E",
              }}>
              {m.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
