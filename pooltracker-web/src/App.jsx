import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;


function App() {
  const [poolStatus, setPoolStatus] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);

      const [poolRes, weatherRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pool/status`),
        fetch(`${API_BASE_URL}/api/weather/current`),
      ]);

      if (!poolRes.ok) throw new Error("Erro a obter estado da piscina.");
      if (!weatherRes.ok) throw new Error("Erro a obter meteorologia.");

      const poolJson = await poolRes.json();
      const weatherJson = await weatherRes.json();

      setPoolStatus(poolJson);
      setWeather(weatherJson);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // primeira carga
    fetchData();

    // auto-refresh a cada 15 segundos
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    if (!date) return "-";
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const occupancyPercentage = poolStatus
    ? Math.round((poolStatus.currentCount / poolStatus.maxCapacity) * 100)
    : 0;

  const statusColor = poolStatus?.isOpen ? "bg-emerald-500" : "bg-rose-600";
  const statusText = poolStatus?.isOpen ? "ABERTA" : "ENCERRADA";

  const occupancyColor =
    occupancyPercentage < 60
      ? "bg-emerald-500"
      : occupancyPercentage < 90
      ? "bg-amber-500"
      : "bg-rose-600";

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl space-y-6">
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 tracking-tight">
              Piscina Municipal da Sobreposta
            </h1>
            <p className="text-sm text-slate-400">
              R. da Piscina 22, 4715-553 Sobreposta · Tel. 253 636 948
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Ocupação em tempo real
            </span>
            <span className="text-xs text-slate-500">
              Última atualização:{" "}
              <span className="text-slate-300 font-medium">
                {formatTime(lastUpdate)}
              </span>
            </span>
          </div>
        </header>

        {/* Mensagem de erro */}
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <span className="text-slate-300 text-sm">
              A carregar dados em tempo real...
            </span>
          </div>
        )}

        {/* Conteúdo principal */}
        {!loading && poolStatus && (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cartão principal – Estado e Ocupação */}
            <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-7 shadow-[0_0_60px_-30px_rgba(15,23,42,1)]">
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Estado da piscina
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-slate-900 border border-slate-700">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${poolStatus.isOpen ? "bg-emerald-400" : "bg-rose-500"
                        }`}
                    />
                    <span className="text-slate-100">{statusText}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Horário de hoje</p>
                  <p className="text-sm text-slate-100 font-medium">
                    {poolStatus.todayOpeningHours || "Encerrado"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-6 items-center sm:items-end sm:justify-between">
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Pessoas no interior
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-5xl sm:text-6xl font-semibold tabular-nums text-slate-50">
                      {poolStatus.currentCount}
                    </span>
                    <span className="text-sm text-slate-500 mb-2">
                      / {poolStatus.maxCapacity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {occupancyPercentage}% da capacidade
                  </p>
                </div>

                <div className="w-full sm:max-w-xs">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Lotação</span>
                    <span>{occupancyPercentage}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${occupancyColor} transition-[width] duration-700 ease-out`}
                      style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Valores aproximados. A informação é atualizada automaticamente.
                  </p>
                </div>
              </div>
            </section>

            {/* Cartão de Meteorologia */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Meteorologia
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Sobreposta · Braga
                </p>

                {weather ? (
                  <>
                    <div className="mt-5 flex items-baseline gap-3">
                      <span className="text-5xl font-semibold text-slate-50 tabular-nums">
                        {Math.round(weather.temperatureC)}°
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">
                          Sensação aproximada
                        </span>
                        <span className="text-sm text-slate-200">
                          {weather.description}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <p className="text-[11px] text-slate-500">Vento</p>
                        <p className="mt-1 text-sm">
                          {weather.windSpeedKmh.toFixed(1)} km/h
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <p className="text-[11px] text-slate-500">Condição</p>
                        <p className="mt-1 text-sm capitalize">
                            {weather.icon === "sunny" && "☀️"}
                            {weather.icon === "cloudy" && "⛅"}
                            {weather.icon === "overcast" && "☁️"}
                            {weather.icon === "rain" && "🌧️"}
                            {weather.icon === "showers" && "🌦️"}
                            {weather.icon === "unknown" && "❓"}

                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">
                    Não foi possível obter dados de meteorologia neste momento.
                  </p>
                )}
              </div>

              <p className="mt-6 text-[11px] text-slate-500">
                Dados meteorológicos fornecidos por Open-Meteo. A informação
                é meramente indicativa e pode não refletir condições exatas
                no local.
              </p>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
