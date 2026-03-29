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
} from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

type PresenceRow = {
  user_id: string;
  presence_date: string;
};

type EventRow = {
  id: string;
  event_date: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  const [specialEventDays, setSpecialEventDays] = useState<Record<string, boolean>>(
    {}
  );
  const [myPresenceDays, setMyPresenceDays] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const [presenceResult, eventResult] = await Promise.all([
        supabase
          .from("presences")
          .select("user_id, presence_date")
          .gte("presence_date", monthStart)
          .lte("presence_date", monthEnd),
        supabase
          .from("special_events")
          .select("id, event_date")
          .gte("event_date", monthStart)
          .lte("event_date", monthEnd),
      ]);

      const counts: Record<string, number> = {};
      const mine: Record<string, boolean> = {};
      const eventsMap: Record<string, boolean> = {};

      (presenceResult.data as PresenceRow[] | null)?.forEach((presence) => {
        counts[presence.presence_date] = (counts[presence.presence_date] ?? 0) + 1;

        if (userId && presence.user_id === userId) {
          mine[presence.presence_date] = true;
        }
      });

      (eventResult.data as EventRow[] | null)?.forEach((event) => {
        eventsMap[event.event_date] = true;
      });

      setPresenceCounts(counts);
      setMyPresenceDays(mine);
      setSpecialEventDays(eventsMap);
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
    </>
  );
}