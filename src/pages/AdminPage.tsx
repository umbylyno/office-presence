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

  useEffect(() => {
    supabase
      .from("invite_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setKeys((data ?? []) as InviteKeyRow[]));
  }, []);

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