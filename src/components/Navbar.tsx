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
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }

    return location.pathname === path;
  }

  const navBase =
    "rounded-xl border px-4 py-2 text-sm font-medium transition whitespace-nowrap";
  const navActive =
    "border-amber-200 bg-amber-100 text-amber-900 ring-2 ring-amber-100";
  const navIdle =
    "border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900";

  return (
    <header
      className={`sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-left"
            >
              <div className="text-sm font-semibold tracking-wide text-stone-900">
                Office Presence
              </div>
              <div className="text-xs text-stone-500">
                {fullName ? `Ciao, ${fullName}` : "Calendario condiviso ufficio"}
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <nav className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className={`${navBase} ${isActive("/") ? navActive : navIdle}`}
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className={`${navBase} ${
                  isActive("/calendar") ? navActive : navIdle
                }`}
              >
                Calendario
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className={`${navBase} ${
                  isActive("/admin") ? navActive : navIdle
                }`}
              >
                Admin
              </button>
            </nav>

            <div className="h-px bg-stone-200 md:hidden" />

            <div className="flex md:shrink-0 md:justify-end">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-[110px]"
              >
                {loggingOut ? "Logout..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
