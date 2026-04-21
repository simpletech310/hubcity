import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjkxNzUsImV4cCI6MjA5MDIwNTE3NX0.5OBSBqeG4CdvPRpYG-C6t_kOOGqCcQFDWqifxsiJJqY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'fene310@hubcity.app',
    password: 'HubCity2026!'
  });

  if (error) {
    console.error("Login Error:", error.message);
    if (error.status) console.error("Status:", error.status);
    if (error.name) console.error("Name:", error.name);
  } else {
    console.log("Login Success! User ID:", data.user?.id);
    
    console.log("Attempting to read profile...");
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profErr) {
      console.error("Profile fetch error:", profErr.message, profErr.details, profErr.hint);
    } else {
      console.log("Profile ok:", profile.handle);
    }
  }
}

testLogin();
