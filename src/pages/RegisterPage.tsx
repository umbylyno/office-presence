import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    inviteKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(import.meta.env.VITE_REGISTER_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore registrazione");
      }

      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Errore");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white/80 p-8 shadow-[0_8px_30px_rgba(120,53,15,0.08)] backdrop-blur">
        <h1 className="text-2xl font-semibold text-stone-800">Registrazione</h1>
        <p className="mt-2 text-sm text-stone-500">Crea il tuo accesso al calendario ufficio</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Username"
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Nome"
            value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Cognome"
            value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input type="password" className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Chiave invito"
            value={form.inviteKey} onChange={(e) => setForm({ ...form, inviteKey: e.target.value })} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600"
          >
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-500">
          Hai già un account? <Link to="/login" className="text-amber-700">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
