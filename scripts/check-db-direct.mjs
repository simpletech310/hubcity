import pkg from 'pg';
const { Client } = pkg;

const c = new Client('postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres');

async function check() {
  try {
    console.log("Connecting to DB...");
    await c.connect();
    console.log("Connected! Checking auth.users schema...");
    const cols = await c.query("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users'");
    console.log("Schema:", JSON.stringify(cols.rows, null, 2));

    const r = await c.query('SELECT id, email FROM auth.users WHERE email = $1', ['fene310@hubcity.app']);
    console.log("Query result:", JSON.stringify(r.rows));
    
    if (r.rows.length === 0) {
      console.log("User fene310@hubcity.app does not exist in auth.users.");
    } else {
      console.log("User found with ID:", r.rows[0].id);
    }
    
    await c.end();
  } catch (err) {
    console.error("DB Error:", err.message);
    if (err.code) console.error("Error Code:", err.code);
  }
}

check();
