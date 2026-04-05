import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const COMPTON_LAT = 33.8958;
const COMPTON_LON = -118.2201;
const CACHE_KEY = "city-data:weather";
const CACHE_TTL = 1800; // 30 minutes

const MOCK_DATA = {
  temp: 72,
  feels_like: 70,
  description: "Partly cloudy",
  icon: "02d",
  humidity: 55,
  wind_speed: 8.2,
  forecast: [
    { day: "Mon", temp_min: 62, temp_max: 78, icon: "01d" },
    { day: "Tue", temp_min: 60, temp_max: 75, icon: "02d" },
    { day: "Wed", temp_min: 58, temp_max: 72, icon: "10d" },
    { day: "Thu", temp_min: 61, temp_max: 76, icon: "01d" },
    { day: "Fri", temp_min: 63, temp_max: 79, icon: "02d" },
  ],
};

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(MOCK_DATA);
    }

    // Check cache
    const cached = await redis.get<typeof MOCK_DATA>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${COMPTON_LAT}&lon=${COMPTON_LON}&appid=${apiKey}&units=imperial`
    );

    if (!currentRes.ok) {
      throw new Error(`Weather API error: ${currentRes.status}`);
    }

    const current = await currentRes.json();

    // Fetch 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${COMPTON_LAT}&lon=${COMPTON_LON}&appid=${apiKey}&units=imperial`
    );

    if (!forecastRes.ok) {
      throw new Error(`Forecast API error: ${forecastRes.status}`);
    }

    const forecastData = await forecastRes.json();

    // Parse daily forecast (take noon reading for each day)
    const dailyMap = new Map<
      string,
      { day: string; temp_min: number; temp_max: number; icon: string }
    >();

    for (const entry of forecastData.list) {
      const date = new Date(entry.dt * 1000);
      const dayKey = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          day: dayName,
          temp_min: entry.main.temp_min,
          temp_max: entry.main.temp_max,
          icon: entry.weather[0].icon,
        });
      } else {
        const existing = dailyMap.get(dayKey)!;
        existing.temp_min = Math.min(existing.temp_min, entry.main.temp_min);
        existing.temp_max = Math.max(existing.temp_max, entry.main.temp_max);
      }
    }

    const forecast = Array.from(dailyMap.values()).slice(0, 5);

    const data = {
      temp: Math.round(current.main.temp),
      feels_like: Math.round(current.main.feels_like),
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      wind_speed: current.wind.speed,
      forecast,
    };

    // Cache result
    await redis.set(CACHE_KEY, JSON.stringify(data), { ex: CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json(MOCK_DATA);
  }
}
