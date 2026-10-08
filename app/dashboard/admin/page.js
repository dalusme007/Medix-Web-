"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile } from "@/lib/services/profileService";

// Hub admin - protection cote client (redirection si non-admin) EN PLUS
// de la protection serveur (requireAdmin dans chaque Route Handler, qui
// est la vraie barriere de securite). Ne jamais se fier uniquement a
// cette verification cote client.
export default function AdminHubPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getProfile(user.id).then(p => {
      setIsAdmin(!!p.is_admin);
      setChecking(false);
      if (!p.is_admin) router.push("/dashboard");
    });
  }, [user, authLoading, router]);

  if (checking || !isAdmin) return <div className="min-h-screen flex items-center justify-center" style={{ color: "#4FC3F7" }}>Verification...</div>;

  const links = [
    { href: "/dashboard/admin/triads", label: "Triades medicales", icon: "📋" },
    { href: "/dashboard/admin/partners", label: "Partenaires", icon: "🤝" },
    { href: "/dashboard/admin/users", label: "Utilisateurs", icon: "👥" },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: "#E8B85C" }}>⚙️ Panneau administrateur</div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} className="rounded-2xl p-5 text-center" style={{ background: "#0D1F1B", border: "1px solid #E8B85C55" }}>
              <div className="text-3xl mb-2">{l.icon}</div>
              <div className="text-sm font-bold" style={{ color: "#F4EAD2" }}>{l.label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
