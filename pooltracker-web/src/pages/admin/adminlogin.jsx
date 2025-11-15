import { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const correctPin = import.meta.env.VITE_ADMIN_PIN;

    if (pin === correctPin) {
      localStorage.setItem("pool_admin_auth", "true");
      onLogin();
    } else {
      setError("PIN incorreto.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 p-6">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Acesso Administrativo</h1>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Introduz o PIN"
          className="w-full p-2 rounded bg-slate-800 border border-slate-700 mb-4"
        />

        {error && (
          <p className="text-rose-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={submit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
