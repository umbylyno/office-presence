import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";


export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [eventType, setEventType] = useState("compleanno");
  const [offerType, setOfferType] = useState("in_loco");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();


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
    <div className="min-h-screen p-6 bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Dashboard presenze</h1>
        <p className="mt-2 text-stone-500">Scegli la data in cui sarai in ufficio e condividi eventuali eventi speciali.</p>
        
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <h2 className="text-xl font-medium">Presenza</h2>
            <input
              type="date"
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <textarea
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              placeholder="Nota facoltativa"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={savePresence}
              className="mt-4 rounded-2xl bg-amber-500 px-5 py-3 text-white hover:bg-amber-600"
            >
              Salva presenza
            </button>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_8px_30px_rgba(120,53,15,0.08)]">
            <h2 className="text-xl font-medium">Evento speciale</h2>
            <input
              type="date"
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <select
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="compleanno">Compleanno</option>
              <option value="onomastico">Onomastico</option>
              <option value="cause_varie">Cause varie</option>
            </select>
            <select
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
            >
              <option value="in_loco">Offerta in loco</option>
              <option value="da_casa">Offerta da casa</option>
            </select>
            <input
              className="mt-4 w-full rounded-2xl border border-stone-200 px-4 py-3"
              placeholder="Titolo evento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              onClick={saveEvent}
              className="mt-4 rounded-2xl bg-orange-500 px-5 py-3 text-white hover:bg-orange-600"
            >
              Salva evento
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => navigate("/calendar")} className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50">
              Vai al calendario presenze
        </button>
        </div>

        </div>

        {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      </div>
    </div>
  );
}
