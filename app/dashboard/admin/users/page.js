"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    (async () => {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { router.push("/dashboard"); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ color: "#E8B85C" }}>👥 Utilisateurs ({users.length})</div>
          <button onClick={() => router.push("/dashboard/admin")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>
        {loading ? <div className="text-center text-sm" style={{ color: "#8393B5" }}>Chargement...</div> : (
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {users.map(u => (
              <div key={u.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#0D1F1B", border: "1px solid #1E4A3E" }}>
                <span className="text-xl">{u.avatar}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "#F4EAD2" }}>{u.pseudo} {u.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style={{ background: "rgba(232,184,92,0.15)", color: "#E8B85C" }}>admin</span>}</div>
                  <div className="text-[11px]" style={{ color: "#546081" }}>Inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}</div>
                </div>
                <div className="text-right text-xs" style={{ color: "#8393B5" }}>
                  <div>{(u.progress?.total_xp || 0).toLocaleString("fr-FR")} XP</div>
                  <div>{u.progress?.games_played || 0} parties</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
                                                                                          
