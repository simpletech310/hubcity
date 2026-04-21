import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debug() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from("profiles").select("count").limit(1);
  if (error) {
    console.error("Profiles query error:", error.message, error.code);
  } else {
    console.log("Profiles query success:", data);
  }

  console.log("Testing Auth admin...");
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth admin error:", authError.message, authError.status);
    console.dir(authError);
  } else {
    console.log("Auth admin success. Found users:", users?.users?.length);
  }
}

debug();
