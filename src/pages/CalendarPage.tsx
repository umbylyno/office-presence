import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { QueryData } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

const presencesQuery = (date: string) =>
  supabase
    .from("presences")
    .select(`
      id,
      note,
      profiles!inner (
        full_name,
        username
      )
    `)
    .eq("presence_date", date)
    .order("created_at", { ascending: true });

const eventsQuery = (date: string) =>
  supabase
    .from("special_events")
    .select(`
      id,
      event_type,
      offer_type,
      title,
      description,
      profiles!inner (
        full_name,
        username
      )
    `)
    .eq("event_date", date)
    .order("created_at", { ascending: true });

type PresenceRow = QueryData<ReturnType<typeof presencesQuery>>[number];
type EventRow = QueryData<ReturnType<typeof eventsQuery>>[number];

type ProfileLike = {
  full_name: string | null;
  username: string | null;
};

function extractProfile(profileData: unknown): ProfileLike | null {
  if (!profileData) return null;

  if (Array.isArray(profileData)) {
    const first = profileData[0];
    if (
      first &&
      typeof first === "object" &&
      "full_name" in first &&
      "username" in first
    ) {
      return first as ProfileLike;
    }
    return null;
  }

  if (
    typeof profileData === "object" &&
    "full_name" in profileData &&
    "username" in profileData
  ) {
    return profileData as ProfileLike;
  }

  return null;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDayData(date: string) {
    setLoading(true);
    setError("");

    const { data: presenceData, error: presenceError } = await presencesQuery(date);

    if (presenceError) {
      setError(presenceError.message);
      setPresences([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data: eventData, error: eventError } = await eventsQuery(date);

    if (eventError) {
      setError(eventError.message);
      setPresences(presenceData ?? []);
      setEvents([]);
      setLoading(false);
      return;
    }

    setPresences(presenceData ?? []);
    setEvents(eventData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDayData(selectedDate);
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 text-stone-800">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Calendario presenze</h1>
          <p className="mt-2 text-stone-500">
            Seleziona una data per vedere chi sarà in ufficio e gli eventuali eventi speciali.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
          <label className="mb-2 block text-sm font-medium text-stone-600">
            Data
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white md:max-w-xs"
          />
        </div>

        {loading && (
          <div className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-stone-700">
            Caricamento dati...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Errore: {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Presenti</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
                {presences.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {presences.length === 0 ? (
                <p className="text-stone-500">Nessun presente registrato per questa data.</p>
              ) : (
                presences.map((presence) => {
                  const profile = extractProfile(presence.profiles);

                  return (
                    <div
                      key={presence.id}
                      className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4"
                    >
                      <p className="font-medium text-stone-800">
                        {profile?.full_name || "Utente"}
                      </p>
                      <p className="text-sm text-stone-500">
                        @{profile?.username || "sconosciuto"}
                      </p>

                      {presence.note && (
                        <p className="mt-2 text-sm text-stone-600">{presence.note}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Eventi speciali</h2>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800">
                {events.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {events.length === 0 ? (
                <p className="text-stone-500">Nessun evento speciale per questa data.</p>
              ) : (
                events.map((event) => {
                  const profile = extractProfile(event.profiles);

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4"
                    >
                      <p className="font-medium text-stone-800">
                        {event.title || event.event_type}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {profile?.full_name || "Utente sconosciuto"}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        @{profile?.username || "sconosciuto"}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {event.event_type} · {event.offer_type}
                      </p>

                      {event.description && (
                        <p className="mt-2 text-sm text-stone-600">{event.description}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
