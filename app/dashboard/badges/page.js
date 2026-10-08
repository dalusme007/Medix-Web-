"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { getAllBadges, getUnlockedBadgeIds } from "@/lib/services/badgeService";

export default function BadgesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    (async () => {
      setBadges(await getAllBadges());
      setUnlocked(await getUnlockedBadgeIds(user.id));
    })();
  }, [user, authLoading, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#4FC3F7" }}>
            Badges — {unlocked.length}/{badges.length}
          </div>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "#123028", border: "1px solid #1E4A3E", color: "#B9C4E0" }}>← Retour</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map(b => {
            const isUnlocked = unlocked.includes(b.id);
            return (
              <div key={b.id} className="rounded-2xl p-4 text-center" style={{ background: isUnlocked ? "rgba(79,195,247,0.08)" : "#0D1F1B", border: `1px solid ${isUnlocked ? "#4FC3F7" : "#1E4A3E"}`, opacity: isUnlocked ? 1 : 0.5 }}>
                <div className="text-3xl mb-2">{isUnlocked ? b.icon : "🔒"}</div>
                <div className="text-xs font-bold" style={{ color: isUnlocked ? "#F4EAD2" : "#546081" }}>{b.name}</div>
                <div className="text-[10px] mt-1" style={{ color: "#546081" }}>{b.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
              }
              
