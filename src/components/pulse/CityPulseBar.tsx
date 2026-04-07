"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

// ─── Types ──────────────────────────────────────────
interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    description: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
}

interface AqiData {
  aqi: number;
  pm25: number;
  pm10: number;
  category: string;
  color: string;
}

// ─── Weather icon mapping ───────────────────────────
function weatherIconName(code: string): IconName {
  if (code.startsWith("01")) return "sun";
  if (code.startsWith("02") || code.startsWith("03") || code.startsWith("04")) return "cloud";
  if (code.startsWith("09") || code.startsWith("10")) return "rain";
  if (code.startsWith("13")) return "snow";
  if (code.startsWith("11")) return "bolt";
  if (code.startsWith("50")) return "wind";
  return "thermometer";
}

// ─── AQI badge color ────────────────────────────────
function aqiBadgeStyle(aqi: number): { bg: string; text: string } {
  if (aqi <= 50) return { bg: "rgba(34,197,94,0.15)", text: "#22C55E" };
  if (aqi <= 100) return { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" };
  if (aqi <= 150) return { bg: "rgba(249,115,22,0.15)", text: "#F97316" };
  return { bg: "rgba(239,68,68,0.15)", text: "#EF4444" };
}

// ─── Component ──────────────────────────────────────
interface CityPulseBarProps {
  trafficAlertCount?: number;
}

export default function CityPulseBar({ trafficAlertCount = 0 }: CityPulseBarProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AqiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [weatherRes, aqiRes] = await Promise.allSettled([
          fetch("/api/city-data/weather").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/city-data/air-quality").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (cancelled) return;

        const weatherData = weatherRes.status === "fulfilled" ? weatherRes.value : null;
        const aqiData = aqiRes.status === "fulfilled" ? aqiRes.value : null;

        if (!weatherData && !aqiData) {
          setFailed(true);
        } else {
          if (weatherData) setWeather(weatherData);
          if (aqiData) setAqi(aqiData);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Return null if everything failed
  if (failed && !loading) return null;

  // Skeleton loader
  if (loading) {
    return (
      <div className="mx-5 mb-3">
        <div className="glass-card-elevated rounded-2xl px-4 py-3 flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-10 rounded bg-white/[0.06]" />
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="h-3 w-12 rounded bg-white/[0.06]" />
          <div className="ml-auto h-3 w-14 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  const aqiStyle = aqi ? aqiBadgeStyle(aqi.aqi) : null;

  return (
    <div className="mx-5 mb-3">
      <div className="glass-card-elevated rounded-2xl px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {/* Weather */}
        {weather && (
          <Link
            href="/city-data"
            className="flex items-center gap-2 shrink-0 press"
          >
            <Icon
              name={weatherIconName(weather.current.icon)}
              size={16}
              className="text-gold"
            />
            <span className="text-[13px] font-semibold">
              {Math.round(weather.current.temp)}°
            </span>
            <div className="w-px h-4 bg-white/[0.08]" />
            <span className="text-[11px] text-white/50 capitalize">
              {weather.current.description}
            </span>
          </Link>
        )}

        {/* Separator */}
        {weather && (aqi || trafficAlertCount > 0) && (
          <div className="w-px h-4 bg-white/[0.08] shrink-0" />
        )}

        {/* AQI Badge */}
        {aqi && aqiStyle && (
          <Link
            href="/city-data"
            className="flex items-center gap-1.5 shrink-0 press"
          >
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: aqiStyle.bg, color: aqiStyle.text }}
            >
              AQI {aqi.aqi}
            </span>
          </Link>
        )}

        {/* Separator */}
        {aqi && trafficAlertCount > 0 && (
          <div className="w-px h-4 bg-white/[0.08] shrink-0" />
        )}

        {/* Traffic */}
        <Link
          href="/city-data/transit"
          className="flex items-center gap-1.5 shrink-0 ml-auto press"
        >
          <Icon
            name="transit"
            size={14}
            className={trafficAlertCount > 0 ? "text-amber-400" : "text-white/30"}
          />
          <span
            className={`text-[11px] font-semibold ${
              trafficAlertCount > 0 ? "text-amber-400" : "text-white/30"
            }`}
          >
            {trafficAlertCount > 0
              ? `${trafficAlertCount} alert${trafficAlertCount > 1 ? "s" : ""}`
              : "Clear"}
          </span>
        </Link>
      </div>
    </div>
  );
}
