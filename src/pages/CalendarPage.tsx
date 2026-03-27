import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type PresenceRow = {
  id: string;
  note: string | null;
  profiles: {
    full_name: string;
    username: string;
  }[];
};

type EventRow = {
  id: string;
  event_type: string;
  offer_type: string;
  title: string | null;
  profiles: {
    full_name: string;
  }[];
};

export default function CalendarPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  async function loadData(selectedDate: string) {
    const { data: presData } = await supabase
      .from("presences")
      .select("id, note, profiles!inner(full_name, username)")
      .eq("presence_date", selectedDate);

    const { data: eventData } = await supabase
      .from("special_events")
      .select("id, event_type, offer_type, title, profiles!inner(full_name)")
      .eq("event_date", selectedDate);

    setPresences((presData ?? []) as PresenceRow[]);
    setEvents((eventData ?? []) as EventRow[]);
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 text-stone-800">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
            Calendario ufficio
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Visualizza chi è presente in ufficio e gli eventuali eventi speciali
            per la data selezionata.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Seleziona data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900">Presenti</h3>

            <div className="mt-5 space-y-3">
              {presences.map((p) => {
                const profile = p.profiles[0];

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
                  >
                    <p className="font-medium text-stone-900">
                      {profile?.full_name ?? "Utente"}
                    </p>
                    <p className="text-sm text-stone-500">
                      @{profile?.username ?? "sconosciuto"}
                    </p>
                    {p.note && (
                      <p className="mt-2 text-sm text-stone-700">{p.note}</p>
                    )}
                  </div>
                );
              })}

              {presences.length === 0 && (
                <p className="text-sm text-stone-500">
                  Nessun presente registrato.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900">
              Eventi speciali
            </h3>

            <div className="mt-5 space-y-3">
              {events.map((e) => {
                const profile = e.profiles[0];

                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
                  >
                    <p className="font-medium capitalize text-stone-900">
                      {e.title || e.event_type}
                    </p>
                    <p className="text-sm text-stone-600">
                      {profile?.full_name ?? "Utente"}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {e.event_type} · {e.offer_type}
                    </p>
                  </div>
                );
              })}

              {events.length === 0 && (
                <p className="text-sm text-stone-500">
                  Nessun evento speciale.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}