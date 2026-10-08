import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/serverClient";

// GET /api/admin/triads : liste complete (pour l'ecran admin)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const admin = createAdminClient();
  const { data, error: dbError } = await admin.schema("medix").from("triads").select("*").order("id");
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/triads : creer une nouvelle triade
export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  const admin = createAdminClient();
  const { data, error: dbError } = await admin.schema("medix").from("triads").insert(body).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT /api/admin/triads : mettre a jour une triade existante (body doit contenir id)
export async function PUT(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const admin = createAdminClient();
  const { id, ...updates } = body;
  const { data, error: dbError } = await admin.schema("medix").from("triads").update(updates).eq("id", id).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/triads?id=123
export async function DELETE(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const admin = createAdminClient();
  const { error: dbError } = await admin.schema("medix").from("triads").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
    }
