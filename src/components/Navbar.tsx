import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      return;
    }

    navigate("/login");
  }

  const navBase =
    "rounded-xl px-4 py-2 text-sm font-medium transition border whitespace-nowrap";
  const navActive = "border-amber-200 bg-amber-100 text-amber-900";
  const navIdle =
    "border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900";

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-stone-900">
            Office Presence
          </h1>
          <p className="text-sm text-stone-500">
            Gestione presenze ed eventi speciali
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={`${navBase} ${
              location.pathname === "/dashboard" ? navActive : navIdle
            }`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className={`${navBase} ${
              location.pathname === "/calendar" ? navActive : navIdle
            }`}
          >
            Calendario
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className={`${navBase} ${
              location.pathname === "/admin" ? navActive : navIdle
            }`}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Uscita..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}