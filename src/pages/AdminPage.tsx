import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [keys, setKeys] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("invite_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setKeys(data || []));
  }, []);

  return (
    <div className="min-h-screen p-6 bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Area admin</h1>
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
          <h2 className="text-xl font-medium">Chiavi invito</h2>
          <ul className="mt-4 space-y-3">
            {keys.map((k) => (
              <li key={k.id} className="rounded-2xl bg-stone-50 p-4">
                <p className="font-medium">{k.key_value}</p>
                <p className="text-sm text-stone-500">
                  usi: {k.used_count} / {k.max_uses ?? "∞"} · attiva: {k.enabled ? "sì" : "no"}
                </p>
              </li>
            ))}
            {keys.length === 0 && <p className="text-stone-500">Nessuna chiave trovata.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
