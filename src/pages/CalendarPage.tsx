import { useEffect, useMemo, useRef, useState } from "react";
import {
  format,
  parseISO,
  isBefore,
  startOfDay,
  isWeekend,
  isToday,
} from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type PresenceRow = {
  id: string;
  user_id: string;
  note: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
};

type EventRow = {
  id: string;
  user_id: string;
  event_type: string;
  offer_type: string;
  title: string | null;
  description: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  const selectedDate = date ?? format(new Date(), "yyyy-MM-dd");
  const parsedSelectedDate = parseISO(selectedDate);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);
  const [myEventForDay, setMyEventForDay] = useState<EventRow | null>(null);

  const [eventType, setEventType] = useState<"compleanno" | "onomastico" | "cause_varie">("cause_varie");

  const [swipingEventId, setSwipingEventId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartX = useRef(0);
  const swipeActive = useRef(false);

  const dateLabel = useMemo(() => {
    try {
      return format(parsedSelectedDate, "EEEE d MMMM yyyy", { locale: it });
    } catch {
      return selectedDate;
    }
  }, [parsedSelectedDate, selectedDate]);

  const amIPresent = useMemo(
    () => presences.some((presence) => presence.user_id === userId),
    [presences, userId]
  );

  const hasSpecialEvents = events.length > 0;

  const canManagePresence = useMemo(() => {
    const weekend = isWeekend(parsedSelectedDate);
    const pastDay = isBefore(startOfDay(parsedSelectedDate), startOfDay(new Date()));
    return !weekend && !pastDay;
  }, [parsedSelectedDate]);

  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA///////////////////////////////8AAAA8TEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQABmgAABnG0K7tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    );
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadDayData() {
      setLoading(true);

      const [presenceResult, eventResult] = await Promise.all([
        supabase
          .from("presences")
          .select("id, user_id, note, profiles(full_name, username)")
          .eq("presence_date", selectedDate)
          .order("id", { ascending: true }),
        supabase
          .from("special_events")
          .select(
            "id, user_id, event_type, offer_type, title, description, profiles(full_name, username)"
          )
          .eq("event_date", selectedDate)
          .order("id", { ascending: true }),
      ]);

      setPresences((presenceResult.data as PresenceRow[] | null) ?? []);
      setEvents((eventResult.data as EventRow[] | null) ?? []);
      const loaded = (eventResult.data as EventRow[] | null) ?? [];
      setEvents(loaded);
      setMyEventForDay(loaded.find((ev) => ev.user_id === userId) ?? null);
      const myEv = ((eventResult.data as EventRow[] | null) ?? []).find(
      (ev) => (ev.profiles as any)?.user_id === userId
      ) ?? null;
      // fallback: cerca per user_id direttamente se il join non lo espone
      setMyEventForDay(null); // reset; verrà rilevato dalla lista events
      setLoading(false);
    }

    loadDayData();
  }, [selectedDate]);

  function showFeedback(text: string) {
    setFeedbackText(text);
    setFeedbackVisible(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => undefined);
    }

    window.setTimeout(() => {
      setFeedbackVisible(false);
    }, 3000);
  }

  async function handlePresenceToggle() {
    if (!userId || saving || !canManagePresence) return;

    setSaving(true);

    if (amIPresent) {
      const { error } = await supabase
        .from("presences")
        .delete()
        .eq("user_id", userId)
        .eq("presence_date", selectedDate);

      if (!error) {
        setPresences((current) =>
          current.filter((presence) => presence.user_id !== userId)
        );
        showFeedback("Presenza rimossa");
      }
    } else {
      const { error } = await supabase.from("presences").upsert(
        {
          user_id: userId,
          presence_date: selectedDate,
          note: null,
        },
        { onConflict: "user_id,presence_date" }
      );

      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", user?.id ?? "")
          .maybeSingle();

        setPresences((current) => {
          const filtered = current.filter((presence) => presence.user_id !== userId);

          return [
            ...filtered,
            {
              id: `${userId}-${selectedDate}`,
              user_id: userId,
              note: null,
              profiles: {
                full_name: profile?.full_name ?? null,
                username: profile?.username ?? null,
              },
            },
          ];
        });

        showFeedback("Presenza confermata");
      }
    }

    setSaving(false);
  }

  async function handleEventSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!userId || savingEvent || !eventTitle.trim()) return;

  setSavingEvent(true);

  const { data, error } = await supabase
    .from("special_events")
    .insert({
      user_id: userId,
      event_date: selectedDate,
      title: eventTitle.trim(),
      event_type: eventType,
      offer_type: "in_loco",
    })
    .select("id, event_type, offer_type, title, description, profiles(full_name, username)")
    .single();

    console.log("INSERT result:", { data, error }); // <-- temporaneo

  if (!error && data) {
  const newEvent: EventRow = {
    id: data.id,
    user_id: userId,
    event_type: data.event_type,
    offer_type: data.offer_type,
    title: data.title,
    description: data.description,
    profiles: Array.isArray(data.profiles) ? data.profiles[0] ?? null : data.profiles,
  };
  setEvents((current) => [...current, newEvent]);
  setMyEventForDay(newEvent);
  showFeedback("Evento salvato");
}

  setEventTitle("");
  setShowEventModal(false);
  setSavingEvent(false);
}

async function handleEventDelete() {
  if (!userId || !myEventForDay) return;

  const { error } = await supabase
    .from("special_events")
    .delete()
    .eq("id", myEventForDay.id);

  if (!error) {
    setEvents((current) => current.filter((ev) => ev.id !== myEventForDay.id));
    setMyEventForDay(null);
    showFeedback("Evento rimosso");
  }
}

function onTouchStart(e: React.TouchEvent, id: string) {
  swipeStartX.current = e.touches[0].clientX;
  swipeActive.current = true;
  setSwipingEventId(id);
  setSwipeOffset(0);
}

function onTouchMove(e: React.TouchEvent) {
  if (!swipeActive.current) return;
  const delta = e.touches[0].clientX - swipeStartX.current;
  if (delta < 0) setSwipeOffset(Math.max(delta, -80));
}

function onTouchEnd() {
  swipeActive.current = false;
  if (swipeOffset <= -60) {
    // soglia raggiunta: mantieni aperto
  } else {
    setSwipeOffset(0);
    setSwipingEventId(null);
  }
}

async function handleEventDeleteById(id: string) {
  const { error } = await supabase.from("special_events").delete().eq("id", id);
  if (!error) {
    setEvents((current) => current.filter((ev) => ev.id !== id));
    if (myEventForDay?.id === id) setMyEventForDay(null);
    setSwipingEventId(null);
    setSwipeOffset(0);
    showFeedback("Evento rimosso");
  }
}


  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.10),_transparent_32%),linear-gradient(to_bottom,_#faf7f2,_#f5f1ea)] px-4 pb-24 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <section className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_12px_32px_rgba(28,25,23,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="mb-3 inline-flex min-h-[44px] items-center rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  ← Torna al mese
                </button>

                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Giorno selezionato
                </p>
                <h1 className="mt-1 text-2xl font-semibold capitalize text-stone-900">
                  {dateLabel}
                </h1>
                <p className="mt-2 text-sm text-stone-600">
                  Puoi sempre vedere chi era presente. La modifica della tua presenza è
                  disponibile solo nei giorni feriali da oggi in avanti.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {isToday(parsedSelectedDate) && (
                  <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-900">
                    Oggi
                  </div>
                )}

                {hasSpecialEvents && (
                  <div className="rounded-2xl bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
                    Evento speciale
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handlePresenceToggle}
                disabled={saving || !userId || !canManagePresence}
                className={`w-full min-h-[52px] rounded-[20px] px-4 py-3 text-sm font-semibold shadow-sm transition ${
                  amIPresent
                    ? "bg-stone-900 text-white hover:bg-stone-800"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {!canManagePresence
                  ? "Presenza non modificabile per questa data"
                  : saving
                  ? "Aggiornamento..."
                  : amIPresent
                  ? "Non ci sarò"
                  : "Ci sarò"}
              </button>

              {canManagePresence && userId && (
              <button
                type="button"
                onClick={() => myEventForDay ? handleEventDelete() : setShowEventModal(true)}
                title={myEventForDay ? "Rimuovi evento speciale" : "Aggiungi evento speciale"}
                className={`flex min-h-[52px] min-w-[52px] items-center justify-center rounded-[20px] border text-lg transition ${
                  myEventForDay
                    ? "border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "border-stone-200 bg-stone-50 text-stone-900 hover:bg-amber-50 hover:border-amber-300"
                }`}
                >
                  ★
    </button>
  )}
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-900">Presenti</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {presences.length}
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-stone-500">Caricamento presenti...</p>
            ) : presences.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nessun presente registrato per questa data.
              </p>
            ) : (
              <div className="space-y-3">
                {presences.map((presence) => {
                  const profile = presence.profiles;

                  return (
                    <article
                      key={presence.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-stone-900">
                            {profile?.full_name || "Utente"}
                          </h3>
                          <p className="text-sm text-stone-500">
                            @{profile?.username || "sconosciuto"}
                          </p>
                        </div>

                        {presence.user_id === userId && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                            Tu
                          </span>
                        )}
                      </div>

                      {presence.note && (
                        <p className="mt-2 text-sm text-stone-600">{presence.note}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-900">
                Eventi speciali
              </h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                {events.length}
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-stone-500">Caricamento eventi...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nessun evento speciale per questa data.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const profile = event.profiles;
                  const isSwiping = swipingEventId === event.id;
                  const offset = isSwiping ? swipeOffset : 0;
                  const showDelete = isSwiping && offset <= -60;

                return (
                  <div key={event.id} className="relative overflow-hidden rounded-2xl">
                    {/* Delete background */}
                    <div className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500 rounded-2xl">
                      <span className="text-white text-xs font-semibold">Elimina</span>
                    </div>

                    {/* Card */}
                    <article
                      onTouchStart={(e) => onTouchStart(e, event.id)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      style={{
                        transform: `translateX(${offset}px)`,
                        transition: swipeActive.current ? "none" : "transform 220ms ease",
                      }}
                      className="relative border border-amber-200 bg-amber-50 px-4 py-3 rounded-2xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-stone-900">
                            {event.title || event.event_type}
                          </h3>
                          <p className="text-sm text-stone-600">
                            {profile?.full_name || "Utente sconosciuto"}
                          </p>
                          <p className="text-sm text-stone-500">
                            @{profile?.username || "sconosciuto"}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                          {event.offer_type === "in_loco" ? "In loco" : "Da casa"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-stone-600">{event.event_type}</p>
                      {event.description && (
                        <p className="mt-2 text-sm text-stone-600">{event.description}</p>
                      )}
                    </article>

                    {/* Tap su "Elimina" quando swipe aperto */}
                    {showDelete && (
                      <button
                        className="absolute inset-y-0 right-0 w-20 z-10"
                        onClick={() => handleEventDeleteById(event.id)}
                        aria-label="Elimina evento"
                      />
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </section>
        </div>

        {feedbackVisible && (
          <div className="presence-feedback" role="status" aria-live="polite">
            <div className="presence-feedback__icon">✓</div>
            <div className="presence-feedback__text">{feedbackText}</div>
          </div>
        )}

        {showEventModal && (
  <div
    className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
    onClick={() => setShowEventModal(false)}
  >
    <div
      className="w-full max-w-md rounded-t-[28px] border border-stone-200 bg-white p-6 shadow-xl sm:rounded-[28px]"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-base font-semibold text-stone-900">Nuovo evento speciale</h2>
      <p className="mt-1 text-sm text-stone-500">
        {format(parsedSelectedDate, "EEEE d MMMM", { locale: it })}
      </p>

      <form onSubmit={handleEventSubmit} className="mt-4 flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          placeholder="Titolo evento (es. Compleanno di Claudio Amato)"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
          maxLength={80}
        />

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as "compleanno" | "onomastico" | "cause_varie")}
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 focus:border-amber-400 focus:outline-none"
        >
          <option value="cause_varie">Cause varie</option>
          <option value="compleanno">Compleanno</option>
          <option value="onomastico">Onomastico</option>
        </select>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEventModal(false)}
            className="flex-1 min-h-[44px] rounded-2xl border border-stone-200 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={savingEvent || !eventTitle.trim()}
            className="flex-1 min-h-[44px] rounded-2xl bg-amber-500 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {savingEvent ? "Salvo..." : "Salva"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
        
      </main>
    </>
  );
}