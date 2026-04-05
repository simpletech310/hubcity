"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WeatherData {
  temp: number;
  icon: string;
}

interface AQIData {
  aqi: number;
  category: string;
  color: string;
}

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

const AQI_COLORS: Record<string, string> = {
  emerald: "text-emerald-400",
  gold: "text-yellow-400",
  coral: "text-orange-400",
  "compton-red": "text-red-400",
};

interface GlanceCard {
  icon: string;
  value: string;
  label: string;
  colorClass?: string;
}

export function CityAtGlance() {
  const { data: weather } = useSWR<WeatherData>("/api/city-data/weather", fetcher, {
    refreshInterval: 1800000,
  });
  const { data: aqi } = useSWR<AQIData>("/api/city-data/air-quality", fetcher, {
    refreshInterval: 3600000,
  });

  const cards: GlanceCard[] = [
    {
      icon: weather ? (WEATHER_ICONS[weather.icon] ?? "\uD83C\uDF24\uFE0F") : "\uD83C\uDF24\uFE0F",
      value: weather ? `${weather.temp}\u00B0` : "--",
      label: "Weather",
    },
    {
      icon: "\uD83C\uDF2C\uFE0F",
      value: aqi ? aqi.category : "--",
      label: "Air Quality",
      colorClass: aqi ? AQI_COLORS[aqi.color] : undefined,
    },
    {
      icon: "\uD83C\uDF89",
      value: "--",
      label: "Next Event",
    },
    {
      icon: "\u26A0\uFE0F",
      value: "--",
      label: "Active Issues",
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex w-[100px] shrink-0 flex-col items-center rounded-xl bg-royal p-3 text-center"
        >
          <span className="mb-1 text-2xl">{card.icon}</span>
          <span className={`text-sm font-bold ${card.colorClass ?? "text-white"}`}>
            {card.value}
          </span>
          <span className="text-[10px] text-white/50">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
