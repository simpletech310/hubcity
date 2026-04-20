import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const COMPTON_LAT = 33.8958;
const COMPTON_LON = -118.2201;
const CACHE_KEY = "city-data:air-quality";
const CACHE_TTL = 3600; // 1 hour

interface AQIResponse {
  aqi: number;
  pm25: number;
  pm10: number;
  category: string;
  color: string;
}

const AQI_CATEGORIES: Record<
  number,
  { category: string; color: string }
> = {
  1: { category: "Good", color: "emerald" },
  2: { category: "Moderate", color: "gold" },
  3: { category: "Unhealthy for Sensitive", color: "coral" },
  4: { category: "Unhealthy", color: "danger" },
  5: { category: "Very Unhealthy", color: "danger" },
};

const MOCK_DATA: AQIResponse = {
  aqi: 2,
  pm25: 12.5,
  pm10: 22.3,
  category: "Moderate",
  color: "gold",
};

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(MOCK_DATA);
    }

    // Check cache
    const cached = await redis.get<AQIResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${COMPTON_LAT}&lon=${COMPTON_LON}&appid=${apiKey}`
    );

    if (!res.ok) {
      throw new Error(`Air quality API error: ${res.status}`);
    }

    const raw = await res.json();
    const pollution = raw.list[0];
    const aqiIndex = pollution.main.aqi as number;
    const mapping = AQI_CATEGORIES[aqiIndex] ?? {
      category: "Hazardous",
      color: "danger",
    };

    const data: AQIResponse = {
      aqi: aqiIndex,
      pm25: pollution.components.pm2_5,
      pm10: pollution.components.pm10,
      category: mapping.category,
      color: mapping.color,
    };

    await redis.set(CACHE_KEY, JSON.stringify(data), { ex: CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Air quality fetch error:", error);
    return NextResponse.json(MOCK_DATA);
  }
}
