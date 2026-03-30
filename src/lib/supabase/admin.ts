import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    url && url.startsWith("http") ? url : "https://placeholder.supabase.co";
  const serviceKey = key && key !== "your-service-role-key" ? key : "placeholder-key";

  return createClient(supabaseUrl, serviceKey);
}
