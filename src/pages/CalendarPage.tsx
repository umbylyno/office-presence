import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type Profile = {
  full_name: string | null;
  username: string | null;
};

type PresenceRow = {
  id: string;
  note: string | null;
  profiles: Profile | Profile[] | null;
};

type EventRow = {
  id: string;
  title: string | null;
  description: string | null;
  event_type: string;
  offer_type: string;
  profiles: Profile | Profile[] | null;
};

function extractProfile(profile: Profile | Profile[] | null): Profile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

export default function CalendarPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState(today);
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const { data: presenceData, error: presenceError } = await supabase
        .from("presences")
        .select(
          `
            id,
            note,
            profiles!inner (
              full_name,
              username
            )
          `
        )
        .eq("presence_date", selectedDate);

      const { data: eventData, error: eventError } = await supabase
        .from("special_events")
        .select(
          `
            id,
            title,
            description,
            event_type,
            offer_type,
            profiles!inner (
              full_name,
              username
            )
          `
        )
        .eq("event_date", selectedDate);

      if (presenceError || eventError) {
        setError(presenceError?.message || eventError?.message || "Errore");
        setPresences([]);
        setEvents([]);
        setLoading(false);
        return;
      }

      setPresences((presenceData as PresenceRow[]) ?? []);
      setEvents((eventData as EventRow[]) ?? []);
      setLoading(false);
    }

    loadData();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 text-stone-800">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Calendario presenze
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Seleziona una data per vedere chi sarà in ufficio e gli eventuali
            eventi speciali.
          </p>
        </div>

        <section className="min-w-0 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full min-w-0 box-border appearance-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white"
            />
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white/90 p-6 text-sm text-stone-600 shadow-sm backdrop-blur">
            Caricamento...
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="min-w-0 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900">
                  Presenti
                </h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  {presences.length}
                </span>
              </div>

              {presences.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Nessun presente registrato per questa data.
                </p>
              ) : (
                <div className="space-y-3">
                  {presences.map((presence) => {
                    const profile = extractProfile(presence.profiles);

                    return (
                      <div
                        key={presence.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                      >
                        <p className="font-medium text-stone-900">
                          {profile?.full_name || "Utente"}
                        </p>
                        <p className="text-sm text-stone-500">
                          @{profile?.username || "sconosciuto"}
                        </p>

                        {presence.note && (
                          <p className="mt-2 text-sm text-stone-700">
                            {presence.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="min-w-0 rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900">
                  Eventi speciali
                </h2>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                  {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Nessun evento speciale per questa data.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const profile = extractProfile(event.profiles);

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                      >
                        <p className="font-medium text-stone-900">
                          {event.title || event.event_type}
                        </p>
                        <p className="mt-1 text-sm text-stone-700">
                          {profile?.full_name || "Utente sconosciuto"}
                        </p>
                        <p className="text-sm text-stone-500">
                          @{profile?.username || "sconosciuto"}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-stone-500">
                          {event.event_type} · {event.offer_type}
                        </p>

                        {event.description && (
                          <p className="mt-2 text-sm text-stone-700">
                            {event.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
