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
      className={`sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="shrink-0 rounded-2xl text-left transition hover:opacity-90"
          aria-label="Vai alla dashboard"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            Office
          </div>
          <div className="text-sm font-semibold text-stone-900">
            {fullName ? `Ciao, ${fullName.split(" ")[0]}` : "Presenze"}
          </div>
        </button>

        <nav className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className={`${navBase} ${isActive("/dashboard") ? navActive : navIdle}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/admin")}
            className={`${navBase} ${isActive("/admin") ? navActive : navIdle}`}
          >
            Admin
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-[44px] items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Esco..." : "Esci"}
          </button>
        </nav>
      </div>
    </header>
  );
}