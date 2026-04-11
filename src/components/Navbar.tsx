import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ProfileData = {
  full_name: string | null;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggingOut, setLoggingOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullName, setFullName] = useState("");

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 16) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current + 8) {
        setVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFullName("");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle<ProfileData>();

      setFullName(data?.full_name ?? "");
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      return;
    }

    navigate("/login");
  }

  function isActive(path: string) {
    if (path === "/dashboard") {
      return (
        location.pathname === "/" ||
        location.pathname === "/dashboard" ||
        location.pathname.startsWith("/calendar/")
      );
    }

    return location.pathname === path;
  }

  const navBase =
    "flex min-h-[44px] items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition whitespace-nowrap";
  const navActive =
    "border-amber-200 bg-amber-100 text-amber-900 shadow-sm";
  const navIdle =
    "border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900";

  return (
    <header
      className={`sticky top-0 z-40 px-4 py-3 transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[24px] border border-stone-200/80 bg-white/85 px-3 py-3 shadow-[0_12px_40px_rgba(28,25,23,0.08)] backdrop-blur md:px-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1 text-left transition hover:bg-stone-100"
          aria-label="Vai alla dashboard"
        >
          <img
            src="favicon.png"
            alt="Logo Office Presence"
            className="h-10 w-10 "
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight text-stone-900">
              Office Presence
            </div>
            <div className="truncate text-xs text-stone-500">
              {fullName || "Calendario ufficio"}
            </div>
          </div>
        </button>

        <nav className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={`${navBase} ${isActive("/dashboard") ? navActive : navIdle}`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className={`${navBase} ${isActive("/admin") ? navActive : navIdle}`}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-[44px] items-center justify-center rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Uscita..." : "Esci"}
          </button>
        </nav>
      </div>
    </header>
  );
}