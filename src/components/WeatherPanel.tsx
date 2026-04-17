import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";

type WeatherData = {
  time: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  relativeHumidity: number;
};

// Coordinate di Napoli Via Medina 61
const LATITUDE = 40.8459;
const LONGITUDE = 14.2677;

function getWeatherIcon(weatherCode: number) {
  // WMO Weather interpretation codes
  if (weatherCode === 0) return <Sun className="w-6 h-6 text-yellow-400" />;
  if (weatherCode === 1 || weatherCode === 2) return <Cloud className="w-6 h-6 text-gray-400" />;
  if (weatherCode === 3) return <Cloud className="w-6 h-6 text-gray-500" />;
  if (weatherCode >= 45 && weatherCode <= 48) return <Cloud className="w-6 h-6 text-gray-600" />;
  if (weatherCode >= 51 && weatherCode <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
  if (weatherCode >= 71 && weatherCode <= 85) return <CloudRain className="w-6 h-6 text-blue-500" />;
  if (weatherCode === 80 || weatherCode === 81 || weatherCode === 82)
    return <CloudRain className="w-6 h-6 text-blue-600" />;
  return <Cloud className="w-6 h-6 text-gray-400" />;
}

function getWeatherDescription(weatherCode: number): string {
  if (weatherCode === 0) return "Sereno";
  if (weatherCode === 1 || weatherCode === 2) return "Poco nuvoloso";
  if (weatherCode === 3) return "Coperto";
  if (weatherCode >= 45 && weatherCode <= 48) return "Nebbia";
  if (weatherCode >= 51 && weatherCode <= 67) return "Pioggia leggera";
  if (weatherCode >= 71 && weatherCode <= 85) return "Neve";
  if (weatherCode === 80 || weatherCode === 81 || weatherCode === 82) return "Pioggia";
  if (weatherCode >= 90) return "Temporale";
  return "Variabile";
}

interface WeatherPanelProps {
  date: string;
  showTitle?: boolean;
}

export default function WeatherPanel({ date, showTitle = true }: WeatherPanelProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&hourly=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Europe/Rome&date=${date}`
        );

        if (!response.ok) throw new Error("Errore nel fetch del meteo");

        const data = await response.json();
        console.log("Raw API Response:", data);
        
        const times = data.hourly.time;
        const temperatures = data.hourly.temperature_2m;
        const weatherCodes = data.hourly.weather_code;
        const windSpeeds = data.hourly.wind_speed_10m;
        const humidities = data.hourly.relative_humidity_2m;

        console.log("Times:", times);
        console.log("Number of times:", times.length);

        // Filtra solo dalle 6:30 alle 20:00 del GIORNO SPECIFICATO
        const filtered: WeatherData[] = [];
        times.forEach((time: string, index: number) => {
          // Estrai la data dal timestamp (es. "2026-04-17" da "2026-04-17T06:30")
          const timeDate = time.split("T")[0];
          
          // Verifica che il giorno corrisponda a quello richiesto
          if (timeDate !== date) return;
          
          const hour = parseInt(time.split("T")[1].split(":")[0]);
          const minute = parseInt(time.split("T")[1].split(":")[1]);

          // Dalle 6:30 alle 20:00
          const isAfterOrAtStart = hour > 6 || (hour === 6 && minute >= 30);
          const isBeforeOrAtEnd = hour < 20 || (hour === 20 && minute === 0);

          if (isAfterOrAtStart && isBeforeOrAtEnd) {
            filtered.push({
              time,
              temperature: temperatures[index],
              weatherCode: weatherCodes[index],
              windSpeed: windSpeeds[index],
              relativeHumidity: humidities[index],
            });
          }
        });

        console.log("Filtered weather data:", filtered);
        setWeatherData(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [date]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Meteo 🌡️</h2>
        <p className="text-sm text-stone-500">Caricamento previsioni...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Meteo 🌡️</h2>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_10px_28px_rgba(28,25,23,0.05)]">
      {showTitle && (
        <>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Meteo 🌡️</h2>
          <p className="text-xs text-stone-500 mb-4">Napoli, Via Medina 61</p>
        </>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {weatherData.map((weather) => {
          const time = weather.time.split("T")[1];
          const hour = parseInt(time.split(":")[0]);
          const minute = time.split(":")[1];
          const displayTime = `${String(hour).padStart(2, "0")}:${minute}`;

          return (
            <div
              key={weather.time}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100 hover:bg-stone-100 transition"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-semibold text-stone-700 min-w-[45px]">
                  {displayTime}
                </span>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(weather.weatherCode)}
                  <span className="text-xs text-stone-600">
                    {getWeatherDescription(weather.weatherCode)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-stone-900">
                  {Math.round(weather.temperature)}°C
                </p>
                <div className="flex items-center gap-1 text-xs text-stone-500 justify-end">
                  <Wind className="w-3 h-3" />
                  <span>{Math.round(weather.windSpeed)} km/h</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500 justify-end">
                  <Droplets className="w-3 h-3" />
                  <span>{weather.relativeHumidity}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {weatherData.length === 0 && (
        <p className="text-sm text-stone-500">Nessun dato disponibile per questo giorno</p>
      )}
    </div>
  );
}
