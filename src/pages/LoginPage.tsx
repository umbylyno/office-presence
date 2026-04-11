import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";



export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      navigate("/dashboard");
    }
  });
}, [navigate]);


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const email = `${username}@office.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Errore login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white/80 p-8 shadow-[0_8px_30px_rgba(120,53,15,0.08)] backdrop-blur">
      <img
              src="favicon.png"
              alt="Logo Office Presence"
              className="h-40 w-40 center mx-auto"
          
               />
        <h1 className="text-2xl font-semibold text-stone-800">Accesso</h1>
        <p className="mt-2 text-sm text-stone-500">Entra nel calendario condiviso</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            className="w-full rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-2xl border border-stone-200 px-4 py-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-500">
          Non hai un account? <Link to="/register" className="text-amber-700">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
