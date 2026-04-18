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

async function addFakePresences() {
  try {
    console.log("Aggiungendo presenze fittizie...");

    // Prendi l'utente dev
    const { data: devUser, error: devError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", "dev")
      .single();

    if (devError || !devUser) {
      console.error("Utente dev non trovato");
      return;
    }

    const devId = devUser.id;
    console.log("Dev ID:", devId);

    // Genera dati fittizi per i giorni feriali di aprile (dal 1 al 17)
    const fakePresences = [
      { user_id: devId, presence_date: "2026-04-01", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-02", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-03", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-06", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-07", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-08", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-09", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-10", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-13", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-14", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-15", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-16", name: "Dev" },
      { user_id: devId, presence_date: "2026-04-17", name: "Dev" },
    ];

    const { error } = await supabase
      .from("presences")
      .upsert(fakePresences, { onConflict: "user_id,presence_date" });

    if (error) {
      console.error("Errore inserimento presenze:", error.message);
      return;
    }

    console.log(`✅ Aggiunti ${fakePresences.length} giorni di presenze fittizie per Dev!`);
  } catch (err) {
    console.error("Errore:", err instanceof Error ? err.message : err);
  }
}

addFakePresences();
