import { useEffect, useState } from "react";
import AdminLogin from "./adminlogin.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY; // ← chave REAL usada no backend

export default function Admin() {
  const [poolStatus, setPoolStatus] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [customCapacity, setCustomCapacity] = useState("");

  const isAuthed = localStorage.getItem("pool_admin_auth") === "true";

  if (!isAuthed) {
    return <AdminLogin onLogin={() => window.location.reload()} />;
  }

  const logoutButton = (
    <button
      onClick={() => {
        localStorage.removeItem("pool_admin_auth");
        window.location.reload();
      }}
      className="absolute top-4 right-4 text-xs bg-slate-800 px-3 py-1 rounded border border-slate-700 hover:bg-slate-700"
    >
      Logout
    </button>
  );

  const fetchData = async () => {
    try {
      setError(null);

      const [poolRes, weatherRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pool/status`),
        fetch(`${API_BASE_URL}/api/weather/current`),
      ]);

      if (!poolRes.ok) throw new Error("Erro ao carregar estado da piscina.");
      if (!weatherRes.ok) throw new Error("Erro ao carregar meteorologia.");

      setPoolStatus(await poolRes.json());
      setWeather(await weatherRes.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // --------------------------
  //    AÇÕES ADMIN
  // --------------------------

  const enter = async () => {
    await fetch(`${API_BASE_URL}/api/pool/enter`, {
      method: "POST",
      headers: { "X-Admin-Key": ADMIN_API_KEY },
    });
    fetchData();
  };

  const exit = async () => {
    await fetch(`${API_BASE_URL}/api/pool/exit`, {
      method: "POST",
      headers: { "X-Admin-Key": ADMIN_API_KEY },
    });
    fetchData();
  };

  const toggleOpen = async () => {
    await fetch(
      `${API_BASE_URL}/api/pool/setOpenStatus?isOpen=${!poolStatus.isOpen}`,
      {
        method: "PUT",
        headers: { "X-Admin-Key": ADMIN_API_KEY },
      }
    );
    fetchData();
  };

  const updateCapacity = async () => {
    const value = Number(customCapacity);
    if (!value || value <= 0) {
      setError("A capacidade tem de ser um número positivo.");
      return;
    }

    await fetch(`${API_BASE_URL}/api/pool/setCapacity?value=${value}`, {
      method: "PUT",
      headers: { "X-Admin-Key": ADMIN_API_KEY },
    });

    setCustomCapacity("");
    fetchData();
  };

  if (!poolStatus) return <p className="text-slate-300 p-5">A carregar...</p>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 space-y-8 relative">
      {logoutButton}

      <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>

      {error && (
        <div className="border border-rose-500 text-rose-300 p-3 rounded">
          {error}
        </div>
      )}

      {/* Estado atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm uppercase text-slate-500">Estado</p>
          <h2 className="text-xl font-semibold mt-2">
            {poolStatus.isOpen ? "Aberta" : "Encerrada"}
          </h2>

          <button
            onClick={toggleOpen}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
          >
            {poolStatus.isOpen ? "Fechar Piscina" : "Abrir Piscina"}
          </button>
        </div>

        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm uppercase text-slate-500">Lotação Atual</p>
          <h2 className="text-xl font-semibold mt-2">
            {poolStatus.currentCount} / {poolStatus.maxCapacity}
          </h2>

          <div className="mt-4 flex gap-3">
            <button
              onClick={enter}
              disabled={
                !poolStatus.isOpen ||
                poolStatus.currentCount >= poolStatus.maxCapacity
              }
              className={`px-4 py-2 rounded ${
                !poolStatus.isOpen ||
                poolStatus.currentCount >= poolStatus.maxCapacity
                  ? "bg-emerald-800/40 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              + Entrou
            </button>

            <button
              onClick={exit}
              disabled={poolStatus.currentCount === 0}
              className={`px-4 py-2 rounded ${
                poolStatus.currentCount === 0
                  ? "bg-rose-800/40 text-slate-500 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              - Saiu
            </button>
          </div>
        </div>

        {/* Meteorologia */}
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm uppercase text-slate-500">Meteorologia</p>
          {weather ? (
            <>
              <h2 className="text-xl font-semibold mt-2">
                {Math.round(weather.temperatureC)}°C
              </h2>
              <p className="text-slate-400">{weather.description}</p>
              <p className="text-slate-400 text-sm mt-1">
                Vento: {weather.windSpeedKmh} km/h
              </p>
            </>
          ) : (
            <p>Sem dados</p>
          )}
        </div>
      </div>

      {/* Configurações */}
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-96">
        <p className="text-sm uppercase text-slate-500 mb-2">
          Alterar Capacidade
        </p>

        <input
          value={customCapacity}
          onChange={(e) => setCustomCapacity(e.target.value)}
          type="number"
          className="w-full p-2 rounded bg-slate-800 border border-slate-700 mb-3"
          placeholder="Nova capacidade..."
        />

        <button
          onClick={updateCapacity}
          className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
