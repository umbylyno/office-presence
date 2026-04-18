import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type InviteKeyRow = {
  id: string;
  key_value: string;
  used_count: number;
  max_uses: number | null;
  enabled: boolean;
  created_at?: string | null;
};

export default function AdminPage() {
  const [keys, setKeys] = useState<InviteKeyRow[]>([]);
  const [resetUsername, setResetUsername] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  

  useEffect(() => {
    supabase
      .from("invite_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setKeys((data ?? []) as InviteKeyRow[]));
  }, []);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    const username = resetUsername.trim();
    if (!username) {
      setResetError("Inserisci uno username valido.");
      return;
    }

    const resetUrl = import.meta.env.VITE_RESET_PASSWORD_FUNCTION_URL;
    if (!resetUrl) {
      setResetError("Endpoint reset password non configurato.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(resetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password: "claudiooffri",
        }),
      });
      //console.log("Reset password response:", { response});

      const data = await response.json();
      

      if (!response.ok) {
        throw new Error(data.error || "Errore durante il reset password.");
      }

      setResetMessage(`Password predefinita reimpostata per ${username}.`);
      setResetUsername("");
    } catch (error: any) {
      setResetError(error?.message || "Errore durante il reset password.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 text-stone-800">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
            Area admin
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Consulta le chiavi invito disponibili e il loro stato di utilizzo.
          </p>
        </div>

        <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">
            Reset password
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            Reimposta la password di un utente a <span className="font-semibold">claudiooffri</span> usando lo username.
          </p>

          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            <input
              type="text"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />

            {resetError && <p className="text-sm text-red-600">{resetError}</p>}
            {resetMessage && <p className="text-sm text-emerald-700">{resetMessage}</p>}

            <button
              type="submit"
              disabled={resetLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Reimposta..." : "Reimposta password"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">
            Chiavi invito
          </h3>

          <div className="mt-5 space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
              >
                <p className="font-mono text-sm text-stone-900">
                  {k.key_value}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  usi: {k.used_count} / {k.max_uses ?? "∞"} · attiva:{" "}
                  {k.enabled ? "sì" : "no"}
                </p>
              </div>
            ))}

            {keys.length === 0 && (
              <p className="text-sm text-stone-500">
                Nessuna chiave trovata.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}