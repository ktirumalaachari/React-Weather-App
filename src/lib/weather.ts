export interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
}

export interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  time: string;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  current: CurrentWeather;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    is_day: number[];
    visibility?: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

export type ThemeKind = "clear" | "cloud" | "rain" | "snow" | "storm" | "fog";

export interface WeatherInfo {
  label: string;
  poetic: string;
  theme: ThemeKind;
  description: string;
}

export function getWeatherInfo(code: number, isDay = 1): WeatherInfo {
  if (code === 0)
    return isDay
      ? {
          label: "Clear sky",
          poetic: "limitless blue",
          theme: "clear",
          description: "Cloudless and calm — perfect light.",
        }
      : {
          label: "Clear night",
          poetic: "silent stars",
          theme: "clear",
          description: "Cloudless night — crisp and still.",
        };
  if (code === 1)
    return isDay
      ? {
          label: "Mainly clear",
          poetic: "soft sunlight",
          theme: "clear",
          description: "Mostly clear with a whisper of cloud.",
        }
      : {
          label: "Mainly clear",
          poetic: "moonlit calm",
          theme: "clear",
          description: "Mostly clear night sky.",
        };
  if (code === 2)
    return {
      label: "Partly cloudy",
      poetic: "drifting light",
      theme: "cloud",
      description: "Sun and clouds in slow exchange.",
    };
  if (code === 3)
    return {
      label: "Overcast",
      poetic: "grey stillness",
      theme: "cloud",
      description: "A soft grey blanket overhead.",
    };
  if (code === 45 || code === 48)
    return {
      label: "Foggy",
      poetic: "quiet mist",
      theme: "fog",
      description: "Low visibility — the world softened.",
    };
  if ([51, 53, 55, 56, 57].includes(code))
    return {
      label: "Drizzle",
      poetic: "fine mist",
      theme: "rain",
      description: "Light drizzle — barely there.",
    };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return {
      label: code >= 80 ? "Rain showers" : "Rain",
      poetic: "rhythmic rain",
      theme: "rain",
      description: "Steady rain — listen closely.",
    };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return {
      label: "Snow",
      poetic: "falling silence",
      theme: "snow",
      description: "Snowfall — everything slows down.",
    };
  if ([95, 96, 99].includes(code))
    return {
      label: "Thunderstorm",
      poetic: "electric air",
      theme: "storm",
      description: "Charged sky — dramatic and brief.",
    };
  return {
    label: "Changing sky",
    poetic: "shifting light",
    theme: "cloud",
    description: "Conditions in gentle flux.",
  };
}

export async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
  );
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results ?? [];
}

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    hourly:
      "temperature_2m,precipitation_probability,weather_code,is_day,visibility",
    daily:
      "weather_code,sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  );
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    const data = await res.json();
    return (
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      "Current location"
    );
  } catch {
    return "Current location";
  }
}

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (kmh: number) => kmh * 0.621371;

export function formatTemp(celsius: number, unit: "C" | "F") {
  const v = unit === "C" ? celsius : cToF(celsius);
  return `${Math.round(v)}°`;
}

export function formatWind(kmh: number, unit: "C" | "F") {
  if (unit === "C") return `${Math.round(kmh)} km/h`;
  return `${Math.round(kmhToMph(kmh))} mph`;
}

export function windDirectionLabel(deg: number) {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function uvLabel(uv: number) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function dayLabel(iso: string, index: number) {
  if (index === 0) return "Today";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function hourLabelFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function sunTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const POPULAR = [
  { name: "Hyderabad", country: "India", latitude: 17.385, longitude: 78.4867 },
  { name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi", country: "India", latitude: 28.7041, longitude: 77.1025 },
  {
    name: "Bengaluru",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  { name: "Kolkata", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { name: "Chennai", country: "India", latitude: 13.0827, longitude: 80.2707 },
];
