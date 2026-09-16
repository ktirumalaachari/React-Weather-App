import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  LocateFixed,
  RefreshCw,
  Star,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  Gauge,
  Umbrella,
  Thermometer,
  ArrowUpRight,
  CloudSun,
  Sun,
  Moon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloudy,
  Navigation,
  ChevronRight,
  Sparkles,
  Clock3,
  CalendarDays,
  X,
  Plus,
} from "lucide-react";
import { Atmosphere, Particles, WeatherArt } from "./components/Atmosphere";
import {
  AnimatedNumber,
  Label,
  Hairline,
  Card,
  Ring,
  SunArc,
  fadeUp,
} from "./components/ui";
import {
  fetchWeather,
  searchCities,
  reverseGeocode,
  getWeatherInfo,
  formatTemp,
  formatWind,
  windDirectionLabel,
  uvLabel,
  timeLabel,
  dayLabel,
  hourLabelFull,
  sunTime,
  POPULAR,
  type ForecastResponse,
  type GeoResult,
} from "./lib/weather";

type Unit = "C" | "F";
interface Place {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  isCurrent?: boolean;
}

const DEFAULT_PLACE: Place = {
  name: "Berhampur",
  country: "India",
  latitude: 19.3149,
  longitude: 84.7941,
};

function iconFor(code: number, isDay: number, cls = "h-5 w-5") {
  const c = cls;
  if (code === 0)
    return isDay ? (
      <Sun className={c} strokeWidth={1.5} />
    ) : (
      <Moon className={c} strokeWidth={1.5} />
    );
  if (code === 1)
    return isDay ? (
      <Sun className={c} strokeWidth={1.5} />
    ) : (
      <Moon className={c} strokeWidth={1.5} />
    );
  if (code === 2) return <CloudSun className={c} strokeWidth={1.5} />;
  if (code === 3) return <Cloudy className={c} strokeWidth={1.5} />;
  if (code === 45 || code === 48)
    return <CloudFog className={c} strokeWidth={1.5} />;
  if ([51, 53, 55, 56, 57].includes(code))
    return <CloudDrizzle className={c} strokeWidth={1.5} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain className={c} strokeWidth={1.5} />;
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow className={c} strokeWidth={1.5} />;
  if ([95, 96, 99].includes(code))
    return <CloudLightning className={c} strokeWidth={1.5} />;
  return <Cloud className={c} strokeWidth={1.5} />;
}

export default function App() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [weather, setWeather] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>(
    () => (localStorage.getItem("Atmo-unit") as Unit) || "C",
  );
  const [favorites, setFavorites] = useState<Place[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("Atmo-favs") || "[]");
    } catch {
      return [];
    }
  });
  const [recents, setRecents] = useState<Place[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("Atmo-recents") || "[]");
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didAutoLocate = useRef(false);

  const load = useCallback(async (p: Place, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchWeather(p.latitude, p.longitude);
      setWeather(data);
      setSelectedHour(0);
    } catch {
      setError("Couldn't reach the sky. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(place); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.latitude, place.longitude]);

  useEffect(() => {
    localStorage.setItem("Atmo-unit", unit);
    localStorage.setItem("Atmo-favs", JSON.stringify(favorites));
    localStorage.setItem("Atmo-recents", JSON.stringify(recents));
  }, [unit, favorites, recents]);

  // live clock
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // search debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        setResults(await searchCities(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(id);
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // keyboard shortcut
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const current = weather?.current ?? null;
  const info = useMemo(
    () =>
      current ? getWeatherInfo(current.weather_code, current.is_day) : null,
    [current],
  );
  const isDay = current ? current.is_day === 1 : true;
  const dark = !isDay;
  const theme = info?.theme ?? "clear";

  const localTime = useMemo(() => {
    if (!weather) return "--:--";
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: weather.timezone,
      }).format(new Date());
    } catch {
      return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }, [weather, nowTick]);

  const localDate = useMemo(() => {
    if (!weather) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: weather.timezone,
      }).format(new Date());
    } catch {
      return "";
    }
  }, [weather, nowTick]);

  const hourlySlice = useMemo(() => {
    if (!weather || !current) return [];
    let start = weather.hourly.time.findIndex((t) => t >= current.time);
    if (start < 0) start = 0;
    return Array.from({ length: 24 }, (_, i) => {
      const idx = Math.min(start + i, weather.hourly.time.length - 1);
      return {
        time: weather.hourly.time[idx],
        temp: weather.hourly.temperature_2m[idx],
        prob: weather.hourly.precipitation_probability?.[idx] ?? 0,
        code: weather.hourly.weather_code[idx],
        isDay: weather.hourly.is_day[idx],
        vis: weather.hourly.visibility?.[idx] ?? 0,
      };
    });
  }, [weather, current]);

  const visibilityKm = useMemo(() => {
    if (!weather || !current) return null;
    const idx = weather.hourly.time.findIndex(
      (t) => t.slice(0, 13) === current.time.slice(0, 13),
    );
    const v = idx >= 0 ? weather.hourly.visibility?.[idx] : undefined;
    return v == null ? null : v / 1000;
  }, [weather, current]);

  const tempRange = useMemo(() => {
    if (!hourlySlice.length) return { min: 0, max: 1 };
    const ts = hourlySlice.map((h) => h.temp);
    return { min: Math.min(...ts), max: Math.max(...ts) };
  }, [hourlySlice]);

  const isFav = favorites.some(
    (f) =>
      Math.abs(f.latitude - place.latitude) < 0.01 &&
      Math.abs(f.longitude - place.longitude) < 0.01,
  );

  const pickPlace = (p: Place) => {
    setPlace(p);
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setRecents((prev) => {
      const next = [
        { ...p },
        ...prev.filter((r) => Math.abs(r.latitude - p.latitude) > 0.01),
      ];
      return next.slice(0, 5);
    });
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by this browser.");
      return;
    }
    setRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        pickPlace({
          name,
          country: "Current",
          latitude,
          longitude,
          isCurrent: true,
        });
        setRefreshing(false);
      },
      (err) => {
        setRefreshing(false);
        if (err.code === err.PERMISSION_DENIED)
          setError(
            "Location access denied. Enable it in your browser's site settings.",
          );
        else if (err.code === err.TIMEOUT)
          setError("Location request timed out. Try again.");
        else setError("Couldn't get your location.");
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 },
    );
  };

  // Try the user's real GPS location once on first load. If it's denied,
  // unsupported, or times out, we silently keep DEFAULT_PLACE — the
  // "Live" badge below only shows once a real location succeeds, so the
  // UI never claims a hardcoded fallback city is the user's location.
  useEffect(() => {
    if (didAutoLocate.current) return;
    didAutoLocate.current = true;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        pickPlace({
          name,
          country: "Current",
          latitude,
          longitude,
          isCurrent: true,
        });
      },
      () => {
        /* permission denied / timeout — keep default place, no error toast on load */
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFav = () => {
    if (isFav)
      setFavorites((f) =>
        f.filter((x) => Math.abs(x.latitude - place.latitude) > 0.01),
      );
    else setFavorites((f) => [...f, place].slice(0, 8));
  };

  const textMain = dark ? "text-white" : "text-[#141412]";
  const textMuted = dark ? "text-white/55" : "text-black/55";
  const textFaint = dark ? "text-white/35" : "text-black/35";
  const ringCls = dark ? "ring-white/10" : "ring-black/[0.07]";
  const pillBg = dark
    ? "bg-white/[0.07] ring-white/10"
    : "bg-white/70 ring-black/[0.07]";

  useEffect(() => {
    if (current && info) {
      document.title = `${Math.round(unit === "C" ? current.temperature_2m : (current.temperature_2m * 9) / 5 + 32)}° ${place.name} — Atmo.`;
    } else {
      document.title = "Atmo. — minimal weather";
    }
  }, [current, info, place.name, unit]);

  return (
    <div
      className={`relative min-h-screen font-sans transition-colors duration-1000 ${textMain}`}
    >
      <Atmosphere theme={theme} isDay={isDay} />
      <Particles theme={theme} isDay={isDay} />

      <div className="relative z-10">
        {/* ── NAV ─────────────────────────────────── */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-2xl transition-colors duration-1000 ${dark ? "bg-[#0a0b0e]/60" : "bg-[#f4f2ec]/60"} border-b ${dark ? "border-white/10" : "border-black/[0.07]"}`}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 sm:px-8">
            <a
              href="#"
              className="flex items-center gap-2.5"
              onClick={(e) => e.preventDefault()}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${dark ? "bg-white text-black" : "bg-black text-white"} transition-transform duration-500 hover:rotate-180`}
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="text-[19px] font-semibold tracking-tight">
                Atmo<span className={textFaint}>.</span>
              </span>
              <span
                className={`hidden rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ring-1 sm:inline ${ringCls} ${textFaint}`}
              >
                minimal weather
              </span>
            </a>

            {/* search desktop */}
            <div
              ref={searchRef}
              className="relative mx-auto hidden w-full max-w-md md:block"
            >
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 ring-1 transition-all focus-within:ring-2 ${pillBg} ${dark ? "focus-within:ring-white/30" : "focus-within:ring-black/20"}`}
              >
                <Search className={`h-4 w-4 shrink-0 ${textFaint}`} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search any city on Earth…"
                  className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
                />
                {query ? (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                    }}
                    className={`${textFaint} hover:opacity-100`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ring-1 ${ringCls} ${textFaint}`}
                  >
                    /
                  </kbd>
                )}
              </div>
              <SearchDropdown
                open={searchOpen}
                searching={searching}
                results={results}
                dark={dark}
                onPick={(r) =>
                  pickPlace({
                    name: r.name,
                    country: r.country,
                    latitude: r.latitude,
                    longitude: r.longitude,
                  })
                }
              />
            </div>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              {/* unit toggle */}
              <div
                className={`flex items-center rounded-full p-1 ring-1 ${pillBg}`}
              >
                {(["C", "F"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`relative rounded-full px-3 py-1 font-mono text-xs transition-all ${unit === u ? (dark ? "bg-white text-black" : "bg-black text-white") : `${textMuted} hover:opacity-80`}`}
                  >
                    °{u}
                  </button>
                ))}
              </div>
              <button
                onClick={locate}
                title="Use my location"
                className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-all hover:scale-105 active:scale-95 ${pillBg}`}
              >
                <LocateFixed
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => load(place, true)}
                title="Refresh"
                className={`hidden h-9 w-9 items-center justify-center rounded-full ring-1 transition-all hover:scale-105 active:scale-95 sm:flex ${pillBg}`}
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
          {/* mobile search */}
          <div className="px-5 pb-3 md:hidden">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 ring-1 ${pillBg}`}
            >
              <Search className={`h-4 w-4 ${textFaint}`} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search city…"
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
              />
              {searching && (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent opacity-60" />
              )}
            </div>
            <div className="relative">
              <SearchDropdown
                open={searchOpen}
                searching={searching}
                results={results}
                dark={dark}
                onPick={(r) =>
                  pickPlace({
                    name: r.name,
                    country: r.country,
                    latitude: r.latitude,
                    longitude: r.longitude,
                  })
                }
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          {loading && !weather ? (
            <LoadingState dark={dark} />
          ) : error && !weather ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
              <CloudFog
                className={`h-10 w-10 ${textFaint}`}
                strokeWidth={1.2}
              />
              <p className="max-w-xs text-lg">{error}</p>
              <button
                onClick={() => load(place)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium ${dark ? "bg-white text-black" : "bg-black text-white"}`}
              >
                Try again
              </button>
            </div>
          ) : current && weather && info ? (
            <>
              {/* ── META ROW ── */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-8"
              >
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ring-1 ${ringCls}`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {place.isCurrent && (
                      <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    )}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${place.isCurrent ? "bg-emerald-400" : "bg-current opacity-40"}`}
                    />
                  </span>
                  {place.isCurrent ? "Live" : "Preset"} ·{" "}
                  {weather.timezone.replace(/_/g, " ")}
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.18em] ${textFaint}`}
                >
                  {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}° —{" "}
                  {localTime}
                </span>
                <span
                  className={`ml-auto hidden items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] sm:flex ${textFaint}`}
                >
                  <Clock3 className="h-3.5 w-3.5" /> updated just now
                </span>
              </motion.div>

              {/* ── HERO ── */}
              <AnimatePresence mode="wait">
                <motion.section
                  key={`${place.latitude}-${place.longitude}`}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="grid items-center gap-8 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-10"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Label dark={dark}>Currently in</Label>
                        <h1 className="mt-2 flex flex-wrap items-center gap-3 text-4xl font-semibold tracking-tight sm:text-6xl">
                          {place.name}
                          <button
                            onClick={toggleFav}
                            title="Save to favorites"
                            className="group/fav mt-1 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`h-6 w-6 transition-all ${isFav ? "fill-amber-400 text-amber-400" : `${textFaint} group-hover/fav:text-amber-400`}`}
                              strokeWidth={1.5}
                            />
                          </button>
                        </h1>
                        <p className={`mt-1 text-sm sm:text-base ${textMuted}`}>
                          {place.country ?? weather.timezone} · {localDate}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end gap-4">
                      <span className="text-[7rem] font-semibold leading-[0.85] tracking-tighter sm:text-[11rem]">
                        <AnimatedNumber
                          value={
                            unit === "C"
                              ? current.temperature_2m
                              : (current.temperature_2m * 9) / 5 + 32
                          }
                        />
                      </span>
                      <span
                        className={`pb-3 text-5xl font-light sm:pb-6 sm:text-7xl ${textFaint}`}
                      >
                        °{unit}
                      </span>
                    </div>

                    <p className="mt-2 font-serif text-2xl italic tracking-tight sm:text-3xl">
                      {info.label.toLowerCase()}{" "}
                      <span className={textFaint}>— {info.poetic}.</span>
                    </p>
                    <p
                      className={`mt-2 max-w-md text-sm leading-relaxed ${textMuted}`}
                    >
                      {info.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <Chip dark={dark}>
                        <Thermometer className="h-3.5 w-3.5" /> Feels{" "}
                        {formatTemp(current.apparent_temperature, unit)}
                      </Chip>
                      <Chip dark={dark}>
                        <ArrowUpRight className="h-3.5 w-3.5" /> H{" "}
                        {formatTemp(weather.daily.temperature_2m_max[0], unit)}
                      </Chip>
                      <Chip dark={dark}>
                        <span className="rotate-180">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>{" "}
                        L{" "}
                        {formatTemp(weather.daily.temperature_2m_min[0], unit)}
                      </Chip>
                      <Chip dark={dark}>
                        <Umbrella className="h-3.5 w-3.5" />{" "}
                        {weather.daily.precipitation_probability_max[0] ?? 0}%
                      </Chip>
                      <span
                        className={`ml-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${textFaint}`}
                      >
                        {isDay ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                        {isDay ? "daytime" : "nighttime"}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <WeatherArt theme={theme} isDay={isDay} />
                    <div
                      className={`mx-auto mt-2 flex max-w-xs items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] ${textFaint}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sunrise className="h-3.5 w-3.5" />
                        {sunTime(weather.daily.sunrise[0])}
                      </span>
                      <span className="h-px flex-1 mx-3 bg-current opacity-20" />
                      <span className="flex items-center gap-1.5">
                        <Sunset className="h-3.5 w-3.5" />
                        {sunTime(weather.daily.sunset[0])}
                      </span>
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>

              <div className="py-8">
                <Hairline dark={dark} />
              </div>

              {/* ── MARQUEE ── */}
              <div
                className={`relative overflow-hidden whitespace-nowrap py-1 font-mono text-[11px] uppercase tracking-[0.3em] ${textFaint}`}
              >
                <div className="flex w-max animate-marquee gap-8">
                  {[0, 1].map((k) => (
                    <span key={k} className="flex gap-8">
                      <span>
                        {info.label} ·{" "}
                        {formatTemp(current.temperature_2m, unit)} · wind{" "}
                        {formatWind(current.wind_speed_10m, unit)} · humidity{" "}
                        {current.relative_humidity_2m}% · uv{" "}
                        {weather.daily.uv_index_max[0]} ·
                      </span>
                      <span>
                        {place.name} · {localTime} · {localDate} · breathe
                        slowly ·
                      </span>
                      <span>{info.poetic} · minimal sky · Atmo ·</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── HOURLY ── */}
              <section className="pt-10">
                <div className="flex items-end justify-between">
                  <div>
                    <Label dark={dark}>Rhythm of the day</Label>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                      Next 24 hours
                    </h2>
                  </div>
                  <span
                    className={`hidden font-mono text-[11px] uppercase tracking-[0.18em] sm:block ${textFaint}`}
                  >
                    tap an hour to inspect
                  </span>
                </div>

                {/* strip */}
                <div className="scrollbar-none -mx-5 mt-5 flex gap-2.5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
                  {hourlySlice.map((h, i) => {
                    const active = i === selectedHour;
                    return (
                      <button
                        key={h.time + i}
                        onClick={() => setSelectedHour(i)}
                        className={`flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl py-3.5 ring-1 transition-all duration-300 ${
                          active
                            ? dark
                              ? "bg-white text-black ring-white scale-[1.03]"
                              : "bg-black text-white ring-black scale-[1.03]"
                            : dark
                              ? "bg-white/[0.05] ring-white/10 hover:bg-white/10"
                              : "bg-white/60 ring-black/[0.06] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] uppercase tracking-widest ${active ? "opacity-70" : textFaint}`}
                        >
                          {i === 0 ? "now" : timeLabel(h.time)}
                        </span>
                        <span className={active ? "" : textMuted}>
                          {iconFor(h.code, h.isDay, "h-[18px] w-[18px]")}
                        </span>
                        <span className="text-[15px] font-semibold tracking-tight">
                          {formatTemp(h.temp, unit)}
                        </span>
                        <span
                          className={`flex items-center gap-0.5 text-[10px] ${h.prob > 20 ? "text-sky-500" : "opacity-30"}`}
                        >
                          <Droplets className="h-2.5 w-2.5" />
                          {h.prob}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* curve */}
                <div
                  className={`mt-3 overflow-hidden rounded-3xl p-5 ring-1 backdrop-blur-xl sm:p-7 ${dark ? "bg-white/[0.04] ring-white/10" : "bg-white/60 ring-black/[0.06]"}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={selectedHour}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-lg font-medium tracking-tight"
                      >
                        {selectedHour === 0
                          ? "Right now"
                          : hourLabelFull(hourlySlice[selectedHour].time)}
                        <span
                          className={`ml-2 font-mono text-xs uppercase tracking-[0.18em] ${textFaint}`}
                        >
                          {formatTemp(hourlySlice[selectedHour].temp, unit)} ·{" "}
                          {hourlySlice[selectedHour].prob}% rain
                        </span>
                      </motion.p>
                    </AnimatePresence>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.2em] ${textFaint}`}
                    >
                      temperature curve
                    </span>
                  </div>
                  <TempCurve
                    data={hourlySlice}
                    selected={selectedHour}
                    onSelect={setSelectedHour}
                    dark={dark}
                    min={tempRange.min}
                    max={tempRange.max}
                    unit={unit}
                  />
                </div>
              </section>

              {/* ── DAILY ── */}
              <section className="pt-12">
                <div className="flex items-end justify-between">
                  <div>
                    <Label dark={dark}>Slow forecast</Label>
                    <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                      <CalendarDays
                        className="h-6 w-6 opacity-40"
                        strokeWidth={1.5}
                      />{" "}
                      7 days
                    </h2>
                  </div>
                </div>
                <div
                  className={`mt-5 overflow-hidden rounded-3xl ring-1 backdrop-blur-xl ${dark ? "bg-white/[0.04] ring-white/10" : "bg-white/60 ring-black/[0.06]"}`}
                >
                  {weather.daily.time.map((d, i) => {
                    const lo = weather.daily.temperature_2m_min[i];
                    const hi = weather.daily.temperature_2m_max[i];
                    const weekMin = Math.min(
                      ...weather.daily.temperature_2m_min,
                    );
                    const weekMax = Math.max(
                      ...weather.daily.temperature_2m_max,
                    );
                    const left =
                      ((lo - weekMin) / Math.max(1, weekMax - weekMin)) * 100;
                    const width = Math.max(
                      8,
                      ((hi - lo) / Math.max(1, weekMax - weekMin)) * 100,
                    );
                    return (
                      <div key={d}>
                        <motion.div
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className="group flex cursor-default items-center gap-3 px-5 py-4 transition-colors sm:gap-5 sm:px-7"
                        >
                          <span
                            className={`w-16 shrink-0 text-[15px] ${i === 0 ? "font-semibold" : ""}`}
                          >
                            {dayLabel(d, i)}
                          </span>
                          <span
                            className={`hidden w-10 items-center gap-1 text-xs sm:flex ${weather.daily.precipitation_probability_max[i] > 20 ? "text-sky-500" : textFaint}`}
                          >
                            <Droplets className="h-3 w-3" />
                            {weather.daily.precipitation_probability_max[i]}%
                          </span>
                          <span className={textMuted}>
                            {iconFor(
                              weather.daily.weather_code[i],
                              1,
                              "h-5 w-5",
                            )}
                          </span>
                          <span
                            className={`w-10 text-right font-mono text-sm ${textMuted}`}
                          >
                            {Math.round(unit === "C" ? lo : (lo * 9) / 5 + 32)}°
                          </span>
                          <span
                            className={`relative h-1.5 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}
                          >
                            <motion.span
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 1,
                                delay: 0.2 + i * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="absolute top-0 h-full origin-left rounded-full bg-gradient-to-r from-sky-300 via-amber-300 to-orange-400"
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                          </span>
                          <span className="w-10 font-mono text-sm font-medium">
                            {Math.round(unit === "C" ? hi : (hi * 9) / 5 + 32)}°
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-40 ${textFaint}`}
                          />
                        </motion.div>
                        {i < 6 && (
                          <div
                            className={`mx-5 sm:mx-7 h-px ${dark ? "bg-white/[0.07]" : "bg-black/[0.06]"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── DETAILS GRID ── */}
              <section className="pt-12">
                <Label dark={dark}>Quiet details</Label>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Atmosphere, decoded
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Card dark={dark} index={0}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Wind className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        Wind
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-2xl font-semibold tracking-tight">
                          {formatWind(current.wind_speed_10m, unit)}
                        </p>
                        <p className={`mt-1 text-xs ${textMuted}`}>
                          {windDirectionLabel(current.wind_direction_10m)} ·
                          gust {formatWind(current.wind_gusts_10m, unit)}
                        </p>
                      </div>
                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-full ring-1 ${ringCls}`}
                      >
                        <span
                          className={`absolute top-1 font-mono text-[9px] ${textFaint}`}
                        >
                          N
                        </span>
                        <motion.span
                          animate={{ rotate: current.wind_direction_10m + 180 }}
                          transition={{
                            type: "spring",
                            stiffness: 60,
                            damping: 14,
                          }}
                          className="block"
                        >
                          <Navigation className="h-5 w-5 fill-current" />
                        </motion.span>
                      </div>
                    </div>
                  </Card>

                  <Card dark={dark} index={1}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Droplets className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        Humidity
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-2xl font-semibold tracking-tight">
                          {current.relative_humidity_2m}%
                        </p>
                        <p className={`mt-1 text-xs ${textMuted}`}>
                          {current.relative_humidity_2m > 70
                            ? "Heavy air"
                            : current.relative_humidity_2m > 40
                              ? "Balanced"
                              : "Crisp & dry"}
                        </p>
                      </div>
                      <Ring
                        value={current.relative_humidity_2m}
                        max={100}
                        dark={dark}
                        size={72}
                      />
                    </div>
                  </Card>

                  <Card dark={dark} index={2}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Sun className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        UV index
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {weather.daily.uv_index_max[0]?.toFixed(1) ?? "—"}
                    </p>
                    <p className={`mt-1 text-xs ${textMuted}`}>
                      {uvLabel(weather.daily.uv_index_max[0] ?? 0)}
                    </p>
                    <div
                      className={`mt-3 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.min(100, ((weather.daily.uv_index_max[0] ?? 0) / 11) * 100)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400"
                      />
                    </div>
                  </Card>

                  <Card dark={dark} index={3}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Gauge className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        Pressure
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {Math.round(current.pressure_msl)}{" "}
                      <span className="text-sm font-normal opacity-50">
                        hPa
                      </span>
                    </p>
                    <p className={`mt-1 text-xs ${textMuted}`}>
                      {current.pressure_msl > 1020
                        ? "High — settled"
                        : current.pressure_msl > 1000
                          ? "Steady"
                          : "Low — shifting"}
                    </p>
                    <MiniBars
                      value={(current.pressure_msl - 980) / 60}
                      dark={dark}
                    />
                  </Card>

                  <Card dark={dark} index={4} className="col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-60">
                        <Sunrise className="h-4 w-4" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                          Sun path
                        </span>
                      </div>
                      <span className={`font-mono text-[11px] ${textFaint}`}>
                        {Math.round(
                          ((new Date(weather.daily.sunset[0]).getTime() -
                            new Date(weather.daily.sunrise[0]).getTime()) /
                            3600000) *
                            10,
                        ) / 10}
                        h of light
                      </span>
                    </div>
                    <SunArc
                      sunrise={weather.daily.sunrise[0]}
                      sunset={weather.daily.sunset[0]}
                      nowIso={current.time}
                      dark={dark}
                    />
                    <div
                      className={`flex items-center justify-between font-mono text-xs ${textMuted}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sunrise className="h-3.5 w-3.5" />
                        {sunTime(weather.daily.sunrise[0])}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {sunTime(weather.daily.sunset[0])}
                        <Sunset className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>

                  <Card dark={dark} index={5}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Eye className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        Visibility
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {visibilityKm == null
                        ? "—"
                        : `${visibilityKm.toFixed(1)} km`}
                    </p>
                    <p className={`mt-1 text-xs ${textMuted}`}>
                      {visibilityKm == null
                        ? "Unknown"
                        : visibilityKm > 15
                          ? "Crystal clear"
                          : visibilityKm > 8
                            ? "Clear"
                            : "Hazy"}
                    </p>
                    <div className="mt-3 flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${((visibilityKm ?? 0) / 24) * 5 > i ? (dark ? "bg-white" : "bg-black") : dark ? "bg-white/15" : "bg-black/10"}`}
                        />
                      ))}
                    </div>
                  </Card>

                  <Card dark={dark} index={6}>
                    <div className="flex items-center gap-2 opacity-60">
                      <Cloud className="h-4 w-4" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        Clouds
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {current.cloud_cover}%
                    </p>
                    <p className={`mt-1 text-xs ${textMuted}`}>
                      {current.cloud_cover < 15
                        ? "Open sky"
                        : current.cloud_cover < 50
                          ? "Scattered"
                          : "Blanketed"}
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      {[10, 22, 16, 30, 20, 26, 14].map((h, i) => (
                        <motion.span
                          key={i}
                          initial={{ height: 4 }}
                          whileInView={{ height: h }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06, duration: 0.6 }}
                          className={`w-full rounded-full ${i === 3 ? (dark ? "bg-white" : "bg-black") : dark ? "bg-white/20" : "bg-black/15"}`}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              </section>

              {/* ── EXPLORE ── */}
              <section className="pt-12">
                <div className="flex items-center justify-between">
                  <div>
                    <Label dark={dark}>Wander</Label>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      Elsewhere right now
                    </h2>
                  </div>
                  {(favorites.length > 0 || recents.length > 0) && (
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${textFaint}`}
                    >
                      {favorites.length} saved
                    </span>
                  )}
                </div>

                {favorites.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {favorites.map((f) => (
                      <button
                        key={`fav-${f.latitude}-${f.longitude}`}
                        onClick={() => pickPlace(f)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ring-1 transition-all hover:scale-[1.03] ${dark ? "bg-amber-300/10 ring-amber-200/20 text-amber-100" : "bg-amber-100/70 ring-amber-900/10"}`}
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {POPULAR.filter(
                    (p) =>
                      Math.abs(p.latitude - place.latitude) > 0.5 ||
                      Math.abs(p.longitude - place.longitude) > 0.5,
                  )
                    .slice(0, 6)
                    .map((p, i) => (
                      <motion.button
                        key={p.name}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => pickPlace(p)}
                        className={`group relative overflow-hidden rounded-3xl p-4 text-left ring-1 backdrop-blur-xl ${dark ? "bg-white/[0.05] ring-white/10 hover:bg-white/10" : "bg-white/60 ring-black/[0.06] hover:bg-white"}`}
                      >
                        <MapPin
                          className={`h-4 w-4 ${textFaint}`}
                          strokeWidth={1.5}
                        />
                        <p className="mt-6 text-[17px] font-semibold tracking-tight">
                          {p.name}
                        </p>
                        <p className={`text-xs ${textMuted}`}>{p.country}</p>
                        <span
                          className={`mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] ${textFaint} transition-all group-hover:gap-2 group-hover:opacity-100`}
                        >
                          visit <Plus className="h-3 w-3" />
                        </span>
                      </motion.button>
                    ))}
                </div>

                {recents.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${textFaint}`}
                    >
                      Recent —
                    </span>
                    {recents.slice(0, 5).map((r) => (
                      <button
                        key={`rec-${r.latitude}`}
                        onClick={() => pickPlace(r)}
                        className={`rounded-full px-3.5 py-1.5 text-[13px] ring-1 transition-all hover:scale-[1.04] ${dark ? "ring-white/10 hover:bg-white/10" : "ring-black/10 hover:bg-white"}`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* ── FOOTER ── */}
              <footer className="pt-16">
                <Hairline dark={dark} />
                <div
                  className={`flex flex-col items-center justify-between gap-3 pt-6 font-mono text-[11px] uppercase tracking-[0.2em] sm:flex-row ${textFaint}`}
                >
                  <span>Atmo. — weather, whispered</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> data · open-meteo
                  </span>
                  <span>
                    {localTime} · {place.name}
                  </span>
                </div>
              </footer>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function Chip({
  children,
  dark,
}: {
  children: React.ReactNode;
  dark: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] ring-1 backdrop-blur ${dark ? "bg-white/[0.06] ring-white/10" : "bg-white/70 ring-black/[0.07]"}`}
    >
      {children}
    </span>
  );
}

function SearchDropdown({
  open,
  searching,
  results,
  dark,
  onPick,
}: {
  open: boolean;
  searching: boolean;
  results: GeoResult[];
  dark: boolean;
  onPick: (r: GeoResult) => void;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl p-1.5 shadow-2xl ring-1 backdrop-blur-2xl ${dark ? "bg-[#14161c]/95 ring-white/10 shadow-black/50" : "bg-white/95 ring-black/10 shadow-black/10"}`}
      >
        {searching ? (
          <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm opacity-60">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />{" "}
            searching the planet…
          </div>
        ) : results.length === 0 ? (
          <div className="px-4 py-3.5 text-sm opacity-50">
            Type at least 2 letters — try “Lisbon”, “Osaka”, “Lagos”…
          </div>
        ) : (
          results.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/[0.05]"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-black/[0.06]"}`}
              >
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {r.name}
                </span>
                <span className="block truncate text-xs opacity-50">
                  {[r.admin1, r.country].filter(Boolean).join(" · ")}
                </span>
              </span>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 opacity-30" />
            </button>
          ))
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function TempCurve({
  data,
  selected,
  onSelect,
  dark,
  min,
  max,
  unit,
}: {
  data: { time: string; temp: number; prob: number }[];
  selected: number;
  onSelect: (i: number) => void;
  dark: boolean;
  min: number;
  max: number;
  unit: "C" | "F";
}) {
  const W = 900;
  const H = 190;
  const PAD = 28;
  const span = Math.max(1, max - min);
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const y = (t: number) => 24 + (1 - (t - min) / span) * (H - 70);

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.temp) }));
  // smooth path (catmull-rom → bezier)
  let dAttr = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6,
      c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6,
      c2y = p2.y - (p3.y - p1.y) / 6;
    dAttr += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  const area = `${dAttr} L ${pts[pts.length - 1].x} ${H - 8} L ${pts[0].x} ${H - 8} Z`;
  const gid = dark ? "curveDark" : "curveLight";

  const disp = (c: number) => Math.round(unit === "C" ? c : (c * 9) / 5 + 32);

  return (
    <div className="mt-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 min-w-[640px] w-full sm:h-52"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={dark ? "#ffffff" : "#111111"}
              stopOpacity={dark ? 0.35 : 0.18}
            />
            <stop
              offset="100%"
              stopColor={dark ? "#ffffff" : "#111111"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H * f}
            y2={H * f}
            stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}
            strokeDasharray="3 6"
          />
        ))}
        <motion.path
          d={area}
          fill={`url(#${gid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.path
          d={dAttr}
          fill="none"
          stroke={dark ? "#fff" : "#111"}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {pts.map((p, i) => (
          <g key={i} onClick={() => onSelect(i)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={i === selected ? 6 : 3.2}
              fill={
                i === selected
                  ? dark
                    ? "#fff"
                    : "#111"
                  : dark
                    ? "rgba(255,255,255,0.45)"
                    : "rgba(0,0,0,0.3)"
              }
              stroke={dark ? "#0a0b0e" : "#fff"}
              strokeWidth={i === selected ? 2.5 : 0}
              style={{ transition: "all .3s" }}
            />
            {i % 3 === 0 && (
              <text
                x={p.x}
                y={H - 22}
                textAnchor="middle"
                fontSize={11}
                fontFamily="monospace"
                fill={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
              >
                {i === 0 ? "now" : new Date(data[i].time).getHours() + ":00"}
              </text>
            )}
            {(i === selected || i % 6 === 0) && (
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill={dark ? "#fff" : "#111"}
              >
                {disp(data[i].temp)}°
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniBars({ value, dark }: { value: number; dark: boolean }) {
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className="mt-3 flex h-8 items-end gap-1">
      {Array.from({ length: 24 }).map((_, i) => {
        const on = i / 24 < pct;
        return (
          <span
            key={i}
            className={`w-full rounded-full ${on ? (dark ? "bg-white" : "bg-black") : dark ? "bg-white/12" : "bg-black/10"}`}
            style={{
              height: `${30 + Math.sin(i * 0.7) * 20 + (i / 24) * 40}%`,
              opacity: on ? 1 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

function LoadingState({ dark }: { dark: boolean }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full ring-1 ${dark ? "ring-white/10" : "ring-black/10"}`}
      >
        <span className="absolute inset-3 animate-ping rounded-full bg-current opacity-10" />
        <span className="h-4 w-4 animate-breathe rounded-full bg-current" />
      </div>
      <div>
        <p className="font-serif text-3xl italic">reading the sky…</p>
        <p
          className={`mt-2 font-mono text-[11px] uppercase tracking-[0.25em] ${dark ? "text-white/40" : "text-black/40"}`}
        >
          contacting satellites
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-40"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
