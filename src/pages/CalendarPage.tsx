import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";

export default function CalendarPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [presences, setPresences] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  async function loadData(selectedDate: string) {
    const { data: presData } = await supabase
      .from("presences")
      .select("id, note, profiles!inner(full_name, username)")
      .eq("presence_date", selectedDate);

    const { data: eventData } = await supabase
      .from("special_events")
      .select("id, event_type, offer_type, title, profiles!inner(full_name)")
      .eq("event_date", selectedDate);

    setPresences(presData || []);
    setEvents(eventData || []);
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  return (
    <div className="min-h-screen p-6 bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Calendario ufficio</h1>

        <input
          type="date"
          className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <h2 className="text-xl font-medium">Presenti</h2>
            <ul className="mt-4 space-y-3">
              {presences.map((p) => (
                <li key={p.id} className="rounded-2xl bg-stone-50 p-4">
                  <p className="font-medium">{p.profiles.full_name}</p>
                  <p className="text-sm text-stone-500">@{p.profiles.username}</p>
                  {p.note && <p className="mt-1 text-sm text-stone-600">{p.note}</p>}
                </li>
              ))}
              {presences.length === 0 && <p className="text-stone-500">Nessun presente registrato.</p>}
            </ul>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <h2 className="text-xl font-medium">Eventi speciali</h2>
            <ul className="mt-4 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="rounded-2xl bg-orange-50 p-4">
                  <p className="font-medium">{e.title || e.event_type}</p>
                  <p className="text-sm text-stone-600">{e.profiles.full_name}</p>
                  <p className="text-sm text-stone-500">{e.event_type} · {e.offer_type}</p>
                </li>
              ))}
              {events.length === 0 && <p className="text-stone-500">Nessun evento speciale.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
