"use client";

import useSWR from "swr";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { useActiveCity } from "@/hooks/useActiveCity";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WEATHER_ICON_MAP: Record<string, IconName> = {
  "01d": "sun", "01n": "moon",
  "02d": "cloud", "02n": "cloud",
  "03d": "cloud", "03n": "cloud",
  "04d": "cloud", "04n": "cloud",
  "09d": "rain", "09n": "rain",
  "10d": "rain", "10n": "rain",
  "11d": "bolt", "11n": "bolt",
  "13d": "snow", "13n": "snow",
  "50d": "wind", "50n": "wind",
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
  pm25: number;
  pm10: number;
  category: string;
  color: string;
}

function aqiBadgeStyle(color: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    gold: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    coral: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    "compton-red": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  };
  return map[color] || map.gold;
}

export function WeatherWidget() {
  const activeCity = useActiveCity();
  const cityLabel = activeCity
    ? `${activeCity.name}, ${activeCity.state}`
    : "Your city";
  const { data: weather, isLoading: weatherLoading } = useSWR<WeatherData>(
    "/api/city-data/weather",
    fetcher,
    { refreshInterval: 1800000 }
  );

  const { data: aqi } = useSWR<AQIData>(
    "/api/city-data/air-quality",
    fetcher,
    { refreshInterval: 3600000 }
  );

  if (weatherLoading || !weather) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="glass-card-elevated glass-inner-light rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-8 w-24 rounded bg-white/[0.04]" />
              <div className="h-4 w-36 rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const iconName = WEATHER_ICON_MAP[weather.icon] || "sun";
  const aqiStyle = aqi ? aqiBadgeStyle(aqi.color) : null;

  return (
    <div className="space-y-3">
      {/* Main Weather Card */}
      <div className="glass-card-elevated glass-inner-light rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Weather Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/10 flex items-center justify-center shrink-0">
            <Icon name={iconName} size={28} className="text-gold" />
          </div>

          {/* Temp + Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-heading text-[36px] font-bold leading-none text-white">
                {Math.round(weather.temp)}&deg;
              </span>
              <span className="text-[13px] text-white/40">
                Feels {Math.round(weather.feels_like)}&deg;
              </span>
            </div>
            <p className="text-[13px] text-white/60 capitalize mb-2">{weather.description}</p>

            {/* Detail pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 bg-white/[0.04] rounded-full px-2.5 py-1">
                <Icon name="rain" size={12} className="text-cyan" />
                {weather.humidity}% humidity
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50 bg-white/[0.04] rounded-full px-2.5 py-1">
                <Icon name="wind" size={12} className="text-white/40" />
                {weather.wind_speed} mph
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AQI + Forecast Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* AQI Card */}
        {aqi && aqiStyle && (
          <div className={`rounded-2xl border p-4 ${aqiStyle.bg} ${aqiStyle.border}`}>
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Air Quality</p>
            <p className={`font-heading text-[22px] font-bold leading-tight ${aqiStyle.text}`}>
              {aqi.category}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-white/40">PM2.5: {aqi.pm25?.toFixed(1)}</span>
              <span className="text-[11px] text-white/40">PM10: {aqi.pm10?.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Current Conditions Card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">{cityLabel}</p>
          <p className="font-heading text-[14px] font-bold text-white leading-tight mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-[12px] text-white/50">
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-[11px] text-white/30 mt-1">
            {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="glass-card-elevated rounded-2xl p-4">
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">5-Day Forecast</p>
          <div className="flex justify-between">
            {weather.forecast.map((day) => {
              const dayIcon = WEATHER_ICON_MAP[day.icon] || "sun";
              return (
                <div key={day.day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] text-white/50 font-medium">{day.day}</span>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <Icon name={dayIcon} size={16} className="text-gold/70" />
                  </div>
                  <span className="text-[12px] font-semibold text-white">{Math.round(day.temp_max)}&deg;</span>
                  <span className="text-[10px] text-white/30">{Math.round(day.temp_min)}&deg;</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
