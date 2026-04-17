import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isWeekend,
  startOfDay,
} from "date-fns";
import { Trophy, ChevronLeft, ChevronRight, X } from "lucide-react";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type PresenceRow = {
  user_id: string;
  presence_date: string;
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
};

type EventRow = {
  id: string;
  event_date: string;
};

type LeaderboardEntry = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  count: number;
};

const nowForMock = new Date();
const mockYearMonth = format(nowForMock, "yyyy-MM");

// Dati di test locali per sviluppo (dinamici sul mese corrente)
const MOCK_PRESENCES: PresenceRow[] = [
  { user_id: "u1", presence_date: `${mockYearMonth}-01`, profiles: { full_name: "Marco Verdi", username: "marco_v" } },
  { user_id: "u1", presence_date: `${mockYearMonth}-02`, profiles: { full_name: "Marco Verdi", username: "marco_v" } },
  { user_id: "u2", presence_date: `${mockYearMonth}-01`, profiles: { full_name: "Sara Bianchi", username: "sara_b" } },
  { user_id: "u3", presence_date: `${mockYearMonth}-03`, profiles: { full_name: "Luca Neri", username: "luca_n88" } },
  { user_id: "u1", presence_date: `${mockYearMonth}-15`, profiles: { full_name: "Marco Verdi", username: "marco_v" } },
  { user_id: "u4", presence_date: `${mockYearMonth}-20`, profiles: { full_name: "Elena Gallo", username: "elena_g" } },
  { user_id: "u2", presence_date: `${mockYearMonth}-22`, profiles: { full_name: "Sara Bianchi", username: "sara_b" } },
  { user_id: "u2", presence_date: `${mockYearMonth}-25`, profiles: { full_name: "Sara Bianchi", username: "sara_b" } },
  { user_id: "u5", presence_date: `${mockYearMonth}-28`, profiles: { full_name: "Alessandro Rossi", username: "ale_rossi" } },
];

const MOCK_EVENTS: EventRow[] = [
  { id: "e1", event_date: format(nowForMock, "yyyy-MM-dd") }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  const [specialEventDays, setSpecialEventDays] = useState<Record<string, boolean>>(
    {}
  );
  const [myPresenceDays, setMyPresenceDays] = useState<Record<string, boolean>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const monthLabel = useMemo(
    () => format(currentMonth, "MMMM yyyy", { locale: it }),
    [currentMonth]
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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
    async function loadMonthData() {
      setLoading(true);
      const now = new Date();

      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const todayStr = format(startOfDay(now), "yyyy-MM-dd");

      let [presenceResult, eventResult] = await Promise.all([
        supabase
          .from("presences")
          .select("user_id, presence_date, profiles(full_name, username)")
          .gte("presence_date", monthStart)
          .lte("presence_date", monthEnd),
        supabase
          .from("special_events")
          .select("id, event_date")
          .gte("event_date", monthStart)
          .lte("event_date", monthEnd),
      ]);

      console.log("DashboardPage - presenceResult.data (from DB):", presenceResult.data);
      // INIEZIONE DATI MOCK IN SVILUPPO
      const isCurrentMonthActive = isSameMonth(currentMonth, now);
      const isDev = import.meta.env.DEV;
      
      let presences = (presenceResult.data as PresenceRow[] | null) ?? [];
      let events = (eventResult.data as EventRow[] | null) ?? [];

      // Se siamo in dev e il database è vuoto per il mese corrente, usiamo i mock
      if (isDev && isCurrentMonthActive && presences.length === 0) {
        console.log("🛠️ Mock Mode: Caricamento dati di test locali...");
        presences = MOCK_PRESENCES;
        events = MOCK_EVENTS;
      }

      const counts: Record<string, number> = {};
      const mine: Record<string, boolean> = {};
      const eventsMap: Record<string, boolean> = {};
      const leaderboardMap: Record<string, LeaderboardEntry> = {};

      presences.forEach((presence) => {
        counts[presence.presence_date] = (counts[presence.presence_date] ?? 0) + 1;

        if (userId && presence.user_id === userId) {
          mine[presence.presence_date] = true;
        }

        // In DEV mostriamo tutta la classifica del mese per testare, in PROD solo fino a oggi
        const shouldIncludeInLeaderboard = isDev || (presence.presence_date <= todayStr);

        if (shouldIncludeInLeaderboard) {
          if (!leaderboardMap[presence.user_id]) {
            leaderboardMap[presence.user_id] = {
              user_id: presence.user_id,
              full_name: presence.profiles?.full_name ?? null,
              username: presence.profiles?.username ?? null,
              count: 0,
            };
          }
          leaderboardMap[presence.user_id].count += 1;
        }
      });

      events.forEach((event) => {
        eventsMap[event.event_date] = true;
      });

      // Ordina la classifica in ordine decrescente
      const leaderboardSorted = Object.values(leaderboardMap)
        .sort((a, b) => b.count - a.count);

      setPresenceCounts(counts);
      setMyPresenceDays(mine);
      setSpecialEventDays(eventsMap);
      setLeaderboard(leaderboardSorted);
      setLoading(false);
    }

    loadMonthData();
  }, [currentMonth, userId]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.10),_transparent_32%),linear-gradient(to_bottom,_#faf7f2,_#f5f1ea)] px-4 pb-24 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <section className="rounded-[28px] border border-stone-200/80 bg-white/92 p-5 shadow-[0_12px_32px_rgba(28,25,23,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-stone-900">
                  Chi ci sarà in ufficio
                </h1>
                <p className="mt-2 max-w-md text-sm text-stone-600">
                  Tocca un giorno per vedere i dettagli e confermare subito la tua
                  presenza.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
                >
                  <Trophy className="h-4 w-4" />
                  Vedi Classifica
                </button>
              </div>

              <div className="hidden rounded-2xl bg-amber-50 px-3 py-2 text-right text-xs text-amber-900 sm:block">
                <div className="font-medium">Oggi</div>
                <div>{format(today, "d MMM", { locale: it })}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-200/80 bg-white/96 p-4 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-3 text-lg font-medium text-stone-700 transition hover:bg-stone-100"
                aria-label="Mese precedente"
              >
                ←
              </button>

              <div className="text-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Calendario
                </div>
                <div className="text-base font-semibold capitalize text-stone-900">
                  {monthLabel}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-3 text-lg font-medium text-stone-700 transition hover:bg-stone-100"
                aria-label="Mese successivo"
              >
                →
              </button>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2">
              {["L", "M", "M", "G", "V", "S", "D"].map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className={`text-center text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    index >= 5 ? "text-red-500" : "text-stone-400"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const isoDate = format(day, "yyyy-MM-dd");
                const count = presenceCounts[isoDate] ?? 0;
                const hasEvent = !!specialEventDays[isoDate];
                const isMine = !!myPresenceDays[isoDate];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);
                const weekend = isWeekend(day);

                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => navigate(`/calendar/${isoDate}`)}
                    className={[
                      "calendar-day",
                      !isCurrentMonth ? "calendar-day--outside" : "",
                      hasEvent ? "calendar-day--event" : "",
                      isMine ? "calendar-day--mine" : "",
                      isCurrentDay ? "calendar-day--today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={`Apri il giorno ${format(day, "d MMMM yyyy", {
                      locale: it,
                    })}`}
                  >
                    <span
                      className={[
                        "calendar-day__number",
                        !isCurrentMonth ? "calendar-day__number--outside" : "",
                        weekend ? "calendar-day__number--weekend" : "",
                        isCurrentDay ? "calendar-day__number--today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {format(day, "d")}
                    </span>

                    {count > 0 && (
                      <span className="calendar-day__count">{count}</span>
                    )}

                    {hasEvent && <span className="calendar-day__event-dot" />}
                  </button>
                );
              })}
            </div>

            {loading && (
              <p className="mt-4 text-sm text-stone-500">Caricamento calendario...</p>
            )}
          </section>
        </div>
      </main>

      {/* Modal Classifica */}
      {showLeaderboard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setShowLeaderboard(false)}
        >
          <div 
            className="flex h-full max-h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modale */}
            <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">Classifica Presenze</h2>
                    <p className="text-xs text-stone-500">Chi vive di più l'ufficio</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="rounded-full p-2 text-stone-400 transition hover:bg-stone-200 hover:text-stone-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigazione Mese nel Modale */}
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200/60">
                <button
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                  className="p-2 text-stone-500 hover:text-stone-900 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold capitalize text-stone-700">
                  {format(currentMonth, "MMMM yyyy", { locale: it })}
                </span>
                <button
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  className="p-2 text-stone-500 hover:text-stone-900 transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenuto scrollabile */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-500" />
                  <p className="text-sm font-medium">Aggiorno i dati...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-sm text-stone-500">Nessuna presenza registrata per questo mese.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-stone-100 bg-stone-50/50 p-4 transition hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                          index === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : 
                          index === 1 ? "bg-slate-400 text-white" :
                          index === 2 ? "bg-orange-400 text-white" : "bg-stone-200 text-stone-600"
                        }`}>
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-stone-900 truncate">
                            {entry.full_name || "Utente"}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            @{entry.username || "sconosciuto"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-600">{entry.count}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Giorni</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}