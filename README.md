<div align="center">

# 🚀 Atmo — Weather, Whispered

</div>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13.x-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-Weather_API-00A896?style=for-the-badge&logo=cloudflare&logoColor=white)](https://open-meteo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Build a weather application using React, with a minimalist aesthetic and restrained, purposeful animations.**

**atmo.** (pronounced _"atmo"_) is a calm, editorial-style weather app. It shows live,
accurate forecasts for any city on Earth with no API key and no backend. Motion is used
sparingly — everything breathes, drifts, and fades rather than bouncing or shouting.

The interface re-themes itself between a warm **paper-light daytime** look and a deep
**night** look based on the actual sunrise/sunset state at the selected location, and the
ambient background reacts to the current conditions (clear, clouds, rain, snow, storm, fog).

---

## Table of contents

1. [Feature overview](#feature-overview)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Project structure](#project-structure)
5. [How the data works](#how-the-data-works)
6. [The minimal-animation system](#the-minimal-animation-system)
7. [Design system](#design-system)
8. [Component reference](#component-reference)
9. [Customization](#customization)
10. [Scripts](#scripts)
11. [Accessibility & performance notes](#accessibility--performance-notes)
12. [Credits](#credits)

---

## Feature overview

### Core weather

- 🌍 **Global city search** — debounced geocoding dropdown for any city on Earth.
- 📍 **Geolocation** — one-click "use my location" with reverse-geocoded city name.
- 🕐 **Live local time & date** rendered in the selected city's own timezone.
- 🌡️ **Current conditions** — temperature, apparent ("feels-like") temp, high/low.
- 🕐 **Next-24-hour forecast** as a scrollable strip **and** an interactive smooth curve
  (click/tap any hour to inspect it).
- 🗓️ **7-day forecast** with animated temperature-range bars and precipitation odds.
- 💨 **Detail cards** — wind (with animated compass), humidity ring, UV index, pressure,
  an animated **sun-path arc**, visibility, and cloud cover.
- 🌦️ **Precipitation probability** per hour and per day.

### Interaction & persistence

- Toggle between **°C / °F** (and km/h ↔ mph).
- **Save favorites** (star) and browse **recently visited** cities — persisted in
  `localStorage`.
- Hand-picked **"Elsewhere right now"** wander grid.
- Keyboard shortcut **`/`** to focus search, **`Esc`** to close the dropdown.
- A **live document title** (`23° Kyoto — atmo.`).
- Responsive layout for mobile, tablet, and desktop.

### Ambient / presentation

- Animated weather emblem drawn in pure SVG + CSS (sun, crescent moon, drifting clouds,
  rain, snow, lightning).
- Canvas particle layer: rain streaks, drifting snow, twinkling stars, or rolling mist.
- Soft blurred gradient orbs, subtle film grain, and a hairline vignette.
- Slow, eased transitions everywhere — no harsh cuts.

---

## Tech stack

| Concern           | Choice                                                       |
| ----------------- | ------------------------------------------------------------ |
| Framework         | **React 19** (function components, hooks)                    |
| Build tool        | **Vite 7**                                                   |
| Language          | **TypeScript**                                               |
| Styling           | **Tailwind CSS v4**                                          |
| Animation         | **Framer Motion** + hand-written CSS keyframes               |
| Icons             | **lucide-react**                                             |
| Weather data      | **Open-Meteo** Forecast & Geocoding APIs (key-free)          |
| Reverse geocoding | **BigDataCloud** free client endpoint (key-free)             |
| Fonts             | Inter Tight, Instrument Serif, JetBrains Mono (Google Fonts) |

---

## Getting started

### Prerequisites

- **Node.js 18+** and npm.

### Install & run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (defaults to http://localhost:5173)
npm run dev

# 3. Type-check / build for production
npm run build

# 4. Preview the production build
npm run preview
```

The build output is a fully static site (Vite emits a single inlined
`dist/index.html` via `vite-plugin-singlefile`), so it can be hosted anywhere:
Netlify, Vercel, GitHub Pages, S3, etc.

> No environment variables or API keys are required.

---

## Project structure

```
.
├── index.html               # HTML shell, fonts, page <title>
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── src
    ├── main.tsx             # React entry point
    ├── App.tsx              # Main application: state, layout, all sections
    ├── index.css            # Tailwind import, fonts, keyframes, utilities
    ├── utils
    │   └── cn.ts            # className merge helper
    ├── lib
    │   └── weather.ts       # API clients, types, weather-code mapping, formatters
    └── components
        ├── Atmosphere.tsx   # Background gradient, particle canvas, SVG weather art
        └── ui.tsx           # Reusable primitives: Card, Ring, SunArc, AnimatedNumber…
```

---

## How the data works

All weather data comes from **[Open-Meteo](https://open-meteo.com/)**, a free,
key-less, open-source weather API.

### 1. Search a city — Geocoding API

`searchCities(query)` in `src/lib/weather.ts` calls:

```
https://geocoding-api.open-meteo.com/v1/search?name=<query>&count=6&language=en&format=json
```

It returns up to six matching places (name, region, country, latitude, longitude).
The request is **debounced (~280 ms)** to stay gentle on the API.

### 2. Fetch the forecast — Forecast API

`fetchWeather(lat, lon)` requests the exact fields the UI needs in a single call:

```
https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,
           precipitation,weather_code,cloud_cover,pressure_msl,
           wind_speed_10m,wind_direction_10m,wind_gusts_10m
  &hourly=temperature_2m,precipitation_probability,weather_code,is_day,visibility
  &daily=weather_code,sunrise,sunset,temperature_2m_max,temperature_2m_min,
          precipitation_probability_max,uv_index_max,wind_speed_10m_max
  &timezone=auto&forecast_days=7
```

### 3. Optional reverse geocoding

When the user clicks the **locate** button, the browser's `navigator.geolocation`
coordinates are sent to BigDataCloud's free
`reverse-geocode-client` endpoint to derive a friendly city name.

### 4. WMO weather codes

Open-Meteo returns numeric **WMO weather interpretation codes**. `getWeatherInfo(code, isDay)`
maps each code to:

- a human **label** (e.g. `"Partly cloudy"`),
- a short **poetic phrase** (e.g. `"drifting light"`),
- a descriptive sentence,
- a **theme** used to drive visuals: `clear | cloud | rain | snow | storm | fog`.

### Helpers in `weather.ts`

`cToF`, `kmhToMph`, `formatTemp`, `formatWind`, `windDirectionLabel` (16-point compass),
`uvLabel`, `timeLabel`, `dayLabel`, `hourLabelFull`, and `sunTime` keep all formatting
in one place.

---

## The minimal-animation system

The brief calls for _minimalism in animation_, so motion follows three rules:

1. **Slow easing.** Everything uses long durations and an ease-out curve
   (`cubic-bezier(0.22, 1, 0.36, 1)`) so elements settle rather than snap.
2. **Small travel distance.** UI elements move only ~12–24 px and fade/blur in.
3. **Ambient, not distracting.** Background motion is large, soft, and very slow.

### Where each animation lives

| Element                    | Technique                                                                         | File                                      |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| Hero temperature counting  | `requestAnimationFrame` cubic tween → `AnimatedNumber`                            | `components/ui.tsx`                       |
| City/condition transitions | Framer Motion `AnimatePresence` (fade + blur + y)                                 | `App.tsx`                                 |
| Staggered detail cards     | Framer Motion `variants` + `whileInView`                                          | `components/ui.tsx`                       |
| Hourly temperature curve   | SVG `pathLength` draw-on; Catmull-Rom → Bézier smoothing                          | `App.tsx` (`TempCurve`)                   |
| Humidity / progress rings  | Animated SVG `strokeDashoffset`                                                   | `components/ui.tsx` (`Ring`)              |
| Sun-path arc               | Animated `pathLength` + moving sun dot                                            | `components/ui.tsx` (`SunArc`)            |
| Wind compass               | Spring-rotated needle (`Navigation` icon)                                         | `App.tsx`                                 |
| 7-day range bars           | `scaleX` grow-in on scroll                                                        | `App.tsx`                                 |
| Weather emblem             | Pure SVG + CSS (`breathe`, `drift`, `spin-slower`, rain/snow/lightning keyframes) | `components/Atmosphere.tsx`               |
| Rain / snow / stars / mist | A single responsive `<canvas>` particle system                                    | `components/Atmosphere.tsx` (`Particles`) |
| Gradient orbs & theme wash | Radial gradients + `drift-slow`, `drift-slower`, `breathe`                        | `components/Atmosphere.tsx`               |
| Loading state              | Soft ping + breathing dot + bouncing points                                       | `App.tsx` (`LoadingState`)                |
| Marquee ticker             | Seamless CSS `translateX` loop                                                    | `index.css` / `App.tsx`                   |

### Custom CSS keyframes (`src/index.css`)

`drift-slow`, `drift-slower`, `breathe`, `spin-slower`, `rain-drop`, `snow-fall`,
`flicker` (lightning), and `marquee`. Durations are deliberately long (5–40 s) for a
calm feel.

---

## Design system

### Typography

- **Inter Tight** — primary UI / headings (tight tracking, semibold display numbers).
- **Instrument Serif** (italic) — poetic phrases like _"clear sky — limitless blue."_
- **JetBrains Mono** — labels, coordinates, times, and metadata (uppercase, wide tracking).

### Color & theming

The app has no fixed brand color — it themes from the **weather + day/night state**:

- Day base: warm paper `#f4f2ec`; night base: near-black `#0a0b0e`.
- Each condition (`clear`, `cloud`, `rain`, `snow`, `storm`, `fog`) layers its own
  radial-gradient tint wash, and all transitions cross-fade over ~1.6 s.
- Surfaces use translucent glass panels (`bg-white/…`, `ring-1`, `backdrop-blur-xl`).

### Layout language

- Generous whitespace; a single `max-w-6xl` column.
- Hairline `div`s separate major sections.
- Monospace micro-labels (`RHYTHM OF THE DAY`, `SLOW FORECAST`, `QUIET DETAILS`).
- Rounded 2xl/3xl panels, pill chips, and circular icon buttons.

### Light / dark logic

`current.is_day` (from Open-Meteo) determines `dark`. The emblem, particles,
backgrounds, text colors, and chart strokes all respond to it.

---

## Component reference

### `src/components/Atmosphere.tsx`

- **`Atmosphere`** — fixed, full-viewport layered background: base color,
  condition-based gradient wash, three drifting blurred orbs, SVG film grain, vignette.
- **`Particles`** — DPR-aware canvas renderer. Seeding and physics change per theme:
  slanted rain lines (with occasional lightning flash), swaying snowflakes,
  twinkling stars (clear nights), or soft drifting fog blobs. Cleans up its
  `requestAnimationFrame` loop and resize listener on unmount.
- **`WeatherArt`** — the large animated emblem with a dashed orbit ring, sun/moon,
  clouds, rain, snow, and lightning variants.

### `src/components/ui.tsx`

- **`AnimatedNumber`** — smoothly tweens between numeric values (used for the big temp).
- **`Label`**, **`Hairline`**, \*\*`Chip`-style primitives — consistent micro-typography.
- **`Card`** — glass surface with staggered scroll-in and hover lift.
- **`Ring`** — circular percentage indicator.
- **`SunArc`** — sunrise-to-sunset arc with the current sun position.
- `fadeUp` — shared Framer Motion variant for blur-fade entrances.

### `src/App.tsx`

Holds all application state (place, weather, unit, favorites, recents, search, selected
hour) and composes the sections: header/search, hero, ticker, hourly strip + `TempCurve`,
7-day list, detail grid, wander grid, and footer. Also contains `SearchDropdown`,
`TempCurve`, `MiniBars`, and `LoadingState`.

### `src/lib/weather.ts`

All networking and data-shaping. Types: `GeoResult`, `ForecastResponse`, `CurrentWeather`,
`WeatherInfo`, `ThemeKind`. Includes the `POPULAR` city list shown in the wander grid.

---

## Customization

### Change the default city

Edit `DEFAULT_PLACE` near the top of `src/App.tsx`:

```ts
const DEFAULT_PLACE: Place = {
  name: "Berhampur",
  country: "India",
  latitude: 19.3149,
  longitude: 84.7941,
};
```

### Tune motion speed

Adjust keyframe durations in `src/index.css` (e.g. make `breathe` faster), or the
transition/easing constants in `src/components/ui.tsx`.

### Adjust particle density

Change the array lengths in the `seed()` function inside `Particles` in
`src/components/Atmosphere.tsx`.

### Add a weather condition

1. Extend the `ThemeKind` union in `src/lib/weather.ts`.
2. Map a WMO code to it in `getWeatherInfo()`.
3. Add colors in `Atmosphere`, a particle branch in `Particles`, and an emblem in
   `WeatherArt`.

### Change fonts

Swap the Google Fonts `<link>` in `index.html` and the `--font-*` tokens in
`src/index.css`.

---

## Scripts

| Command           | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the Vite development server with HMR.     |
| `npm run build`   | TypeScript-aware production build into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally.                |

---

## Accessibility & performance notes

- The canvas is `aria-hidden` and `pointer-events-none`; it never blocks interaction.
- Decorative SVGs are marked `aria-hidden`; semantic headings (`h1`/`h2`) describe content.
- Color contrast adapts per light/dark theme; text uses layered opacity tokens.
- Animations are GPU-friendly (`transform`/`opacity`) and pause naturally when the tab is
  hidden because the rAF loop stops.
- Canvas is capped at 2× device pixel ratio to limit cost on high-DPI screens.
- Network calls are minimal: **one** forecast request per city and one geocode request
  per debounced search.
- Everything is client-side; there is no server, tracker, or key to manage.

> Tip for users sensitive to motion: the app respects OS-level focus/scroll behavior;
> to fully disable ambient motion, reduce particle counts in `Atmosphere.tsx`.

---

## Credits

- Weather & geocoding data — [Open-Meteo](https://open-meteo.com/) (CC BY 4.0 style open data).
- Reverse geocoding — [BigDataCloud](https://www.bigdatacloud.com/).
- Icons — [Lucide](https://lucide.dev/).
- Fonts — [Google Fonts](https://fonts.google.com/): Inter Tight, Instrument Serif,
  JetBrains Mono (OFL).

---

### Built with the brief in mind

> _Minimalism is not the absence of things — it's the presence of calm._

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for personal or commercial projects.

<div align="center">

## 👨‍💻 Author

**K Tirumala Achari**  
Full Stack Developer | Aspiring Software Engineer

<a href="mailto:ktirumalachari@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail"/>
</a>
<a href="https://www.linkedin.com/in/k-tirumala-achari-921106307/">
  <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>
<a href="https://github.com/ktirumalaachari">
  <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>
<a href="https://www.ktirumalaachari.me">
  <img src="https://img.shields.io/badge/Portfolio-FF6B35?style=for-the-badge&logo=firefox&logoColor=white" alt="Portfolio"/>
</a>
<br/><br/>

> _"Passionate about building impactful, user-centric solutions through technology,_
> _committed to continuous learning and innovation."_

<div align="center">
**⭐ If you found this project helpful or inspiring, please give it a star! ⭐**

<br/>
Made with ❤️ by **K Tirumala Achari**

[![GitHub](https://img.shields.io/badge/GitHub-ktirumalaachari-blue?style=flat&logo=github)](https://github.com/ktirumalaachari)

</div>
