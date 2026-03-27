import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [eventType, setEventType] = useState("compleanno");
  const [offerType, setOfferType] = useState("in_loco");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function savePresence() {
    if (!userId) return;

    const { error } = await supabase.from("presences").upsert(
      {
        user_id: userId,
        presence_date: date,
        note: note || null,
      },
      { onConflict: "user_id,presence_date" }
    );

    setMessage(error ? error.message : "Presenza salvata");
  }

  async function saveEvent() {
    if (!userId) return;

    const { error } = await supabase.from("special_events").insert({
      user_id: userId,
      event_date: date,
      event_type: eventType,
      offer_type: offerType,
      title: title || null,
      description: null,
    });

    setMessage(error ? error.message : "Evento salvato");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 text-stone-800">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Dashboard presenze
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Scegli la data in cui sarai in ufficio e condividi eventuali eventi
            speciali.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="min-w-0 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-stone-900">Presenza</h2>

            <div className="mt-5 space-y-4">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full min-w-0 box-border appearance-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Nota
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Es. arrivo alle 9:30"
                  rows={4}
                  className="block w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </div>

              <button
                onClick={savePresence}
                className="inline-flex rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Salva presenza
              </button>
            </div>
          </section>

          <section className="min-w-0 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-stone-900">
              Evento speciale
            </h2>

            <div className="mt-5 space-y-4">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full min-w-0 box-border appearance-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Tipo evento
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="block w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                >
                  <option value="compleanno">Compleanno</option>
                  <option value="onomastico">Onomastico</option>
                  <option value="varie">Cause varie</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Offerta
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  className="block w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                >
                  <option value="in_loco">Offerta in loco</option>
                  <option value="da_casa">Offerta da casa</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Titolo
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Colazione per tutti"
                  className="block w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </div>

              <button
                onClick={saveEvent}
                className="inline-flex rounded-2xl bg-amber-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-amber-700"
              >
                Salva evento
              </button>
            </div>
          </section>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
