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
            "id, event_type, offer_type, title, description, profiles(full_name, username)"
          )
          .eq("event_date", selectedDate)
          .order("id", { ascending: true }),
      ]);

      setPresences((presenceResult.data as PresenceRow[] | null) ?? []);
      setEvents((eventResult.data as EventRow[] | null) ?? []);
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

                  return (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
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

                      <p className="mt-2 text-sm text-stone-600">
                        {event.event_type}
                      </p>

                      {event.description && (
                        <p className="mt-2 text-sm text-stone-600">
                          {event.description}
                        </p>
                      )}
                    </article>
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
      </main>
    </>
  );
}