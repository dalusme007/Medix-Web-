import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/serverClient";

// GET /api/admin/users : vue d'ensemble (lecture seule) des joueurs.
// Deux requetes simples puis fusion en JS, plutot qu'un embed
// PostgREST cross-schema (plus fragile a configurer correctement).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const admin = createAdminClient();

  const { data: profiles, error: pErr } = await admin
    .schema("shared").from("profiles")
    .select("id, pseudo, avatar, created_at, is_admin")
    .order("created_at", { ascending: false })
    .limit(200);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const ids = profiles.map(p => p.id);
  const { data: progress, error: prErr } = await admin
    .schema("medix").from("player_progress")
    .select("user_id, total_xp, total_coins, games_played")
    .in("user_id", ids);
  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });

  const progressByUser = Object.fromEntries(progress.map(p => [p.user_id, p]));
  const merged = profiles.map(p => ({ ...p, progress: progressByUser[p.id] || null }));

  return NextResponse.json(merged);
    }
