"use client";

import useSWR from "swr";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

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
  icon: string;
}

interface AQIData {
  aqi: number;
  category: string;
  color: string;
}

const AQI_COLORS: Record<string, string> = {
  emerald: "text-emerald-400",
  gold: "text-yellow-400",
  coral: "text-orange-400",
  "compton-red": "text-red-400",
};

interface GlanceCard {
  icon: IconName;
  value: string;
  label: string;
  colorClass?: string;
  bg: string;
}

export function CityAtGlance() {
  const { data: weather } = useSWR<WeatherData>("/api/city-data/weather", fetcher, {
    refreshInterval: 1800000,
  });
  const { data: aqi } = useSWR<AQIData>("/api/city-data/air-quality", fetcher, {
    refreshInterval: 3600000,
  });

  const weatherIcon = weather ? (WEATHER_ICON_MAP[weather.icon] ?? "sun") : "sun";

  const cards: GlanceCard[] = [
    {
      icon: weatherIcon,
      value: weather ? `${weather.temp}\u00B0` : "--",
      label: "Weather",
      bg: "bg-gold/10",
      colorClass: "text-gold",
    },
    {
      icon: "wind",
      value: aqi ? aqi.category : "--",
      label: "Air Quality",
      colorClass: aqi ? AQI_COLORS[aqi.color] : "text-white",
      bg: aqi?.color === "emerald" ? "bg-emerald/10" : "bg-yellow-500/10",
    },
    {
      icon: "calendar",
      value: "--",
      label: "Next Event",
      bg: "bg-cyan/10",
      colorClass: "text-cyan",
    },
    {
      icon: "alert",
      value: "--",
      label: "Active Issues",
      bg: "bg-red-500/10",
      colorClass: "text-red-400",
    },
  ];

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex w-[90px] shrink-0 flex-col items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center"
        >
          <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-1.5`}>
            <Icon name={card.icon} size={16} className={card.colorClass || "text-white"} />
          </div>
          <span className={`text-[13px] font-bold ${card.colorClass ?? "text-white"}`}>
            {card.value}
          </span>
          <span className="text-[9px] text-white/40 font-medium">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
