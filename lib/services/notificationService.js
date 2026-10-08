import { createClient } from "@/lib/supabase/browserClient";

export async function getUnreadNotifications(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("medix").from("notifications")
    .select("*").eq("user_id", userId).eq("read", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function markAsRead(notificationId) {
  const supabase = createClient();
  const { error } = await supabase
    .schema("medix").from("notifications")
    .update({ read: true }).eq("id", notificationId);
  if (error) throw error;
}
