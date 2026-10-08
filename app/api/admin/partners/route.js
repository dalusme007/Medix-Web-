import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/serverClient";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const admin = createAdminClient();
  const { data, error: dbError } = await admin.schema("medix").from("partners").select("*").order("sort_order");
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  const admin = createAdminClient();
  const { data, error: dbError } = await admin.schema("medix").from("partners").insert(body).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const admin = createAdminClient();
  const { id, ...updates } = body;
  const { data, error: dbError } = await admin.schema("medix").from("partners").update(updates).eq("id", id).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const admin = createAdminClient();
  const { error: dbError } = await admin.schema("medix").from("partners").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
