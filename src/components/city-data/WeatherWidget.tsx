"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WEATHER_ICONS: Record<string, string> = {
  "01d": "\u2600\uFE0F",
  "01n": "\uD83C\uDF19",
  "02d": "\u26C5",
  "02n": "\uD83C\uDF19",
  "03d": "\u2601\uFE0F",
  "03n": "\u2601\uFE0F",
  "04d": "\uD83C\uDF25\uFE0F",
  "04n": "\uD83C\uDF25\uFE0F",
  "09d": "\uD83C\uDF27\uFE0F",
  "09n": "\uD83C\uDF27\uFE0F",
  "10d": "\uD83C\uDF26\uFE0F",
  "10n": "\uD83C\uDF27\uFE0F",
  "11d": "\u26C8\uFE0F",
  "11n": "\u26C8\uFE0F",
  "13d": "\u2744\uFE0F",
  "13n": "\u2744\uFE0F",
  "50d": "\uD83C\uDF2B\uFE0F",
  "50n": "\uD83C\uDF2B\uFE0F",
};

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  forecast: { day: string; temp_min: number; temp_max: number; icon: string }[];
}

interface AQIData {
  aqi: number;
  category: string;
  color: string;
}

const AQI_BADGE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-400",
  gold: "bg-yellow-500/20 text-yellow-400",
  coral: "bg-orange-500/20 text-orange-400",
  "compton-red": "bg-red-500/20 text-red-400",
};

export function WeatherWidget() {
  const { data: weather, isLoading: weatherLoading } = useSWR<WeatherData>(
    "/api/city-data/weather",
    fetcher,
    { refreshInterval: 1800000 } // 30 min
  );

  const { data: aqi } = useSWR<AQIData>(
    "/api/city-data/air-quality",
    fetcher,
    { refreshInterval: 3600000 } // 1 hr
  );

  if (weatherLoading || !weather) {
    return (
      <div className="animate-pulse rounded-2xl bg-royal p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-20 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.icon] ?? "\uD83C\uDF24\uFE0F";
  const aqiBadgeClass = aqi ? (AQI_BADGE_COLORS[aqi.color] ?? AQI_BADGE_COLORS.gold) : "";

  return (
    <div className="rounded-2xl bg-royal p-4">
      <div className="flex items-center gap-4">
        <span className="text-4xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{weather.temp}&deg;</span>
            <span className="text-sm text-white/50">
              Feels like {weather.feels_like}&deg;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm capitalize text-white/70">{weather.description}</span>
            {aqi && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${aqiBadgeClass}`}>
                AQI: {aqi.category}
              </span>
            )}
          </div>
        </div>
        <div className="hidden text-right text-xs text-white/40 sm:block">
          <p>Humidity: {weather.humidity}%</p>
          <p>Wind: {weather.wind_speed} mph</p>
        </div>
      </div>
    </div>
  );
}
