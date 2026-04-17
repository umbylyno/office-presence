import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vncubobyrausuyugxgtg.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuY3Vib2J5cmF1c3V5dWd4Z3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mzk5MzIsImV4cCI6MjA5MjAxNTkzMn0.ZRbRXVnSDV0_mt13FOocLes_iej0wiFAHu-tNIH2KrA";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDevUser() {
  try {
    console.log("Creazione utente dev...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "dev@office.local",
      password: "123456",
      email_confirm: true,
    });

    if (error) {
      console.error("Errore:", error.message);
      process.exit(1);
    }

    console.log("✅ Utente creato con successo!");
    console.log("Email: dev@office.local");
    console.log("Password: 123456");
    console.log("User ID:", data.user.id);
  } catch (err) {
    console.error("Errore:", err.message);
    process.exit(1);
  }
}

createDevUser();
