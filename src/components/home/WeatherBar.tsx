"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
}

interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  category: string;
  color: string;
}

function weatherIconName(iconCode: string): IconName {
  // OpenWeatherMap icon codes: 01=clear, 02-04=clouds, 09-10=rain, 11=thunder, 13=snow, 50=mist
  if (iconCode.startsWith("01")) return "sun";
  if (iconCode.startsWith("02") || iconCode.startsWith("03") || iconCode.startsWith("04")) return "cloud";
  if (iconCode.startsWith("09") || iconCode.startsWith("10") || iconCode.startsWith("11")) return "rain";
  if (iconCode.startsWith("13")) return "snow";
  if (iconCode.startsWith("50")) return "wind";
  return "sun";
}

function aqiBadgeColor(aqi: number): string {
  if (aqi <= 50) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (aqi <= 100) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (aqi <= 150) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (aqi <= 200) return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-purple-500/20 text-purple-400 border-purple-500/30";
}

export default function WeatherBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch("/api/city-data/weather"),
          fetch("/api/city-data/air-quality"),
        ]);

        if (!weatherRes.ok) throw new Error("Weather fetch failed");

        const weatherData = await weatherRes.json();
        setWeather(weatherData);

        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          setAirQuality(aqiData);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) return null;

  if (loading) {
    return (
      <div className="glass-card-elevated glass-inner-light p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5" />
          <div className="flex-1 flex items-center gap-3">
            <div className="h-5 w-12 rounded bg-white/5" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
          <div className="h-5 w-16 rounded-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const iconName = weatherIconName(weather.icon);

  return (
    <Link href="/city-data" className="block press">
      <div className="glass-card-elevated glass-inner-light p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
            <Icon name={iconName} size={18} className="text-gold" />
          </div>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="font-heading text-[18px] font-bold leading-none" style={{ color: "var(--ink-strong)" }}>
              {Math.round(weather.temp)}&deg;
            </span>
            <span className="text-[12px] capitalize truncate" style={{ color: "var(--ink-soft)" }}>
              {weather.description}
            </span>
          </div>

          {airQuality && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${aqiBadgeColor(airQuality.aqi)}`}
            >
              AQI {airQuality.aqi}
            </span>
          )}

          <Icon
            name="chevron-right"
            size={14}
            className="text-white/20 shrink-0"
          />
        </div>
      </div>
    </Link>
  );
}
