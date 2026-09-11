import { useEffect, useRef } from "react";
import type { ThemeKind } from "../lib/weather";

/* ---------- Ambient gradient background that breathes with the weather ---------- */
export function Atmosphere({ theme, isDay }: { theme: ThemeKind; isDay: boolean }) {
  const dark = !isDay;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* base */}
      <div
        className={`absolute inset-0 transition-colors duration-[1600ms] ease-in-out ${
          dark ? "bg-[#0a0b0e]" : "bg-[#f4f2ec]"
        }`}
      />
      {/* tint wash per theme */}
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms]"
        style={{
          opacity: 1,
          background: dark
            ? theme === "clear"
              ? "radial-gradient(120% 90% at 50% -10%, #1b2745 0%, transparent 60%), radial-gradient(80% 60% at 90% 100%, #14202e 0%, transparent 60%)"
              : theme === "rain" || theme === "storm"
                ? "radial-gradient(120% 90% at 50% -10%, #1a2634 0%, transparent 60%), radial-gradient(90% 70% at 10% 100%, #151d29 0%, transparent 55%)"
                : theme === "snow"
                  ? "radial-gradient(110% 80% at 50% 0%, #1c2534 0%, transparent 60%)"
                  : "radial-gradient(110% 80% at 50% 0%, #1e222c 0%, transparent 60%)"
            : theme === "clear"
              ? "radial-gradient(90% 60% at 50% 0%, #ffe9c4 0%, transparent 60%), radial-gradient(70% 50% at 85% 20%, #dbeafe 0%, transparent 60%)"
              : theme === "rain" || theme === "storm"
                ? "radial-gradient(90% 60% at 50% 0%, #cbd5e1 0%, transparent 62%), radial-gradient(60% 50% at 90% 90%, #bfdbfe 0%, transparent 60%)"
                : theme === "snow"
                  ? "radial-gradient(90% 60% at 50% 0%, #e0e7ff 0%, transparent 62%), radial-gradient(70% 50% at 15% 90%, #f1f5f9 0%, transparent 55%)"
                  : theme === "fog"
                    ? "radial-gradient(100% 70% at 50% 20%, #e7e5e0 0%, transparent 65%)"
                    : "radial-gradient(90% 60% at 50% 0%, #e9e4d8 0%, transparent 60%), radial-gradient(60% 50% at 90% 80%, #d6d3cb 0%, transparent 60%)",
        }}
      />
      {/* floating orbs */}
      <div
        className={`absolute -left-40 top-[-15%] h-[34rem] w-[34rem] rounded-full blur-[120px] transition-colors duration-[1600ms] animate-drift-slow ${
          dark ? "opacity-30" : "opacity-60"
        }`}
        style={{ background: dark ? "#2b3b63" : theme === "clear" ? "#fed7aa" : "#c7d2fe" }}
      />
      <div
        className={`absolute -right-40 bottom-[-20%] h-[30rem] w-[30rem] rounded-full blur-[130px] transition-colors duration-[1600ms] animate-drift-slower ${
          dark ? "opacity-25" : "opacity-50"
        }`}
        style={{ background: dark ? "#13343b" : theme === "rain" ? "#93c5fd" : "#fbcfe8" }}
      />
      <div
        className={`absolute left-1/2 top-1/3 h-[22rem] w-[42rem] -translate-x-1/2 rounded-full blur-[140px] transition-colors duration-[1600ms] animate-breathe ${
          dark ? "opacity-20" : "opacity-40"
        }`}
        style={{ background: dark ? "#1e1b4b" : "#fef3c7" }}
      />
      {/* film grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* hairline vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: dark ? "inset 0 0 220px rgba(0,0,0,0.55)" : "inset 0 0 220px rgba(120,110,90,0.14)" }}
      />
    </div>
  );
}

/* ---------- Minimal particle canvas: rain / snow / stars / mist ---------- */
export function Particles({ theme, isDay }: { theme: ThemeKind; isDay: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; len?: number; r?: number; o?: number; tw?: number };
    let drops: P[] = [];
    let flakes: P[] = [];
    let stars: P[] = [];
    let mists: P[] = [];

    const seed = () => {
      drops = Array.from({ length: 130 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: -1.2 - Math.random() * 1.2,
        vy: 9 + Math.random() * 9,
        len: 12 + Math.random() * 22,
        o: 0.08 + Math.random() * 0.22,
      }));
      flakes = Array.from({ length: 110 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: -0.4 + Math.random() * 0.8,
        vy: 0.4 + Math.random() * 1.1,
        r: 0.8 + Math.random() * 2.2,
        o: 0.25 + Math.random() * 0.55,
      }));
      stars = Array.from({ length: 130 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.65,
        vx: 0,
        vy: 0,
        r: 0.4 + Math.random() * 1.3,
        o: 0.2 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,
      }));
      mists = Array.from({ length: 14 }, () => ({
        x: Math.random() * w,
        y: h * 0.25 + Math.random() * h * 0.65,
        vx: 0.15 + Math.random() * 0.35,
        vy: 0,
        r: 90 + Math.random() * 160,
        o: 0.05 + Math.random() * 0.06,
      }));
    };
    seed();

    let t = 0;
    const dark = !isDay;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      if (!dark && (theme === "fog" || theme === "cloud")) {
        for (const m of mists) {
          m.x += m.vx;
          if (m.x - (m.r ?? 120) > w) {
            m.x = -(m.r ?? 120);
            m.y = h * 0.25 + Math.random() * h * 0.6;
          }
          const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r ?? 120);
          g.addColorStop(0, `rgba(255,255,255,${m.o})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r ?? 120, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!isDay && theme === "clear") {
        for (const s of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + (s.tw ?? 0));
          ctx.globalAlpha = (s.o ?? 0.5) * tw;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r ?? 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (theme === "rain" || theme === "storm") {
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        for (const d of drops) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.y > h + 30) {
            d.y = -30;
            d.x = Math.random() * (w + 100);
          }
          if (d.x < -60) d.x = w + 40;
          ctx.strokeStyle = dark ? `rgba(148,197,255,${d.o})` : `rgba(51,85,130,${(d.o ?? 0.2) * 0.9})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - (d.vx ?? 0) * 4, d.y - (d.len ?? 16));
          ctx.stroke();
        }
        if (theme === "storm" && Math.random() < 0.006) {
          ctx.fillStyle = dark ? "rgba(190,220,255,0.14)" : "rgba(255,255,255,0.55)";
          ctx.fillRect(0, 0, w, h);
        }
      }

      if (theme === "snow") {
        for (const f of flakes) {
          f.x += (f.vx ?? 0) + Math.sin(t + f.y * 0.01) * 0.3;
          f.y += f.vy ?? 1;
          if (f.y > h + 10) {
            f.y = -10;
            f.x = Math.random() * w;
          }
          if (f.x > w + 10) f.x = -10;
          if (f.x < -10) f.x = w + 10;
          ctx.globalAlpha = f.o ?? 0.5;
          ctx.fillStyle = dark ? "#dbeafe" : "#ffffff";
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r ?? 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme, isDay]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[1]" aria-hidden />;
}

/* ---------- Minimal animated weather emblem (pure SVG + CSS) ---------- */
export function WeatherArt({ theme, isDay }: { theme: ThemeKind; isDay: boolean }) {
  const dark = !isDay;
  const stroke = dark ? "rgba(255,255,255,0.9)" : "rgba(20,20,18,0.9)";
  const soft = dark ? "rgba(255,255,255,0.35)" : "rgba(20,20,18,0.22)";

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72" aria-hidden>
      {/* halo */}
      <div
        className="absolute inset-6 rounded-full blur-2xl transition-colors duration-1000 animate-breathe"
        style={{
          background: dark
            ? theme === "clear"
              ? "radial-gradient(circle, rgba(147,183,255,0.35), transparent 70%)"
              : "radial-gradient(circle, rgba(148,163,184,0.28), transparent 70%)"
            : theme === "clear"
              ? "radial-gradient(circle, rgba(251,191,36,0.4), transparent 70%)"
              : theme === "rain"
                ? "radial-gradient(circle, rgba(147,197,253,0.5), transparent 70%)"
                : "radial-gradient(circle, rgba(0,0,0,0.08), transparent 70%)",
        }}
      />

      {(theme === "clear" || theme === "fog") && (
        <div className="relative">
          {isDay ? (
            <div className="relative flex items-center justify-center">
              <div className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-orange-300 shadow-[0_0_80px_rgba(251,191,36,0.45)] animate-breathe sm:h-36 sm:w-36" />
              <div className="absolute h-28 w-28 animate-spin-slower rounded-full sm:h-36 sm:w-36">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-[3px] w-7 origin-center rounded-full"
                    style={{
                      background: soft,
                      transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateX(78px)`,
                    }}
                  />
                ))}
              </div>
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-yellow-100 to-amber-400 sm:h-24 sm:w-24" />
            </div>
          ) : (
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 shadow-[0_0_80px_rgba(226,232,240,0.35)] animate-breathe sm:h-36 sm:w-36" />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: dark ? "#0a0b0e" : "#f4f2ec", transform: "translate(28px,-14px)", opacity: 0.92 }}
              />
              {/* crater hints */}
              <div className="absolute left-8 top-10 h-3 w-3 rounded-full bg-slate-300/60" />
              <div className="absolute left-12 top-16 h-2 w-2 rounded-full bg-slate-300/50" />
            </div>
          )}
        </div>
      )}

      {theme === "cloud" && (
        <div className="relative h-40 w-56 sm:h-48 sm:w-64">
          {isDay ? (
            <div className="absolute left-1/2 top-2 h-14 w-14 -translate-x-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.4)] animate-breathe" />
          ) : (
            <div className="absolute left-1/2 top-2 h-12 w-12 -translate-x-6 rounded-full bg-slate-200 shadow-[0_0_50px_rgba(226,232,240,0.3)]" />
          )}
          <div className="absolute bottom-4 left-0 animate-drift-slow">
            <CloudShape fill={dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.95)"} stroke={soft} />
          </div>
          <div className="absolute bottom-0 right-0 animate-drift-slower">
            <CloudShape small fill={dark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,1)"} stroke={stroke} />
          </div>
        </div>
      )}

      {(theme === "rain" || theme === "storm") && (
        <div className="relative flex flex-col items-center">
          <div className="relative animate-drift-slow">
            <CloudShape fill={dark ? "rgba(30,41,59,0.9)" : "rgba(30,41,59,0.92)"} stroke={dark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)"} dark />
          </div>
          <div className="mt-1 flex gap-3">
            {[0, 1, 2].map((c) => (
              <div key={c} className="flex flex-col gap-2">
                {[0, 1, 2].map((r) => (
                  <span
                    key={r}
                    className="block w-[2px] rounded-full animate-rain-drop"
                    style={{
                      height: 14 + ((r + c) % 3) * 6,
                      background: theme === "storm" ? "#fde68a" : dark ? "#93c5fd" : "#334155",
                      opacity: theme === "storm" && r === 1 ? 0.9 : 0.55,
                      animationDelay: `${(c * 0.35 + r * 0.22).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          {theme === "storm" && (
            <svg width="34" height="44" viewBox="0 0 34 44" className="absolute left-1/2 top-16 -translate-x-1/2 animate-flicker">
              <path d="M19 2 L6 24 H16 L12 42 L28 18 H17 L19 2 Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {theme === "snow" && (
        <div className="relative flex flex-col items-center">
          <div className="animate-drift-slow">
            <CloudShape fill={dark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.98)"} stroke={soft} />
          </div>
          <div className="relative mt-2 h-20 w-44">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white shadow animate-snow-fall"
                style={{
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  left: `${8 + i * 10}%`,
                  top: 0,
                  animationDelay: `${(i * 0.42).toFixed(2)}s`,
                  boxShadow: "0 0 12px rgba(255,255,255,0.9)",
                  background: dark ? "#e0e7ff" : "#ffffff",
                  outline: dark ? "none" : "1px solid rgba(15,23,42,0.08)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* orbit ring */}
      <div className="absolute inset-0 animate-spin-slower rounded-full border border-dashed" style={{ borderColor: soft, opacity: 0.5 }} />
      <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: stroke }} />
    </div>
  );
}

function CloudShape({ fill, stroke, small, dark }: { fill: string; stroke: string; small?: boolean; dark?: boolean }) {
  const w = small ? 150 : 200;
  const h = small ? 72 : 92;
  return (
    <svg width={w} height={h} viewBox="0 0 200 92" fill="none">
      <path
        d="M45 78 C20 78 10 60 18 45 C24 33 38 30 46 36 C52 18 74 8 96 16 C108 4 134 4 146 18 C166 16 188 28 186 48 C184 68 164 78 145 78 H45 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {dark && <path d="M45 78 H145" stroke="rgba(147,197,253,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 6" />}
      {!small && <ellipse cx="100" cy="70" rx="62" ry="6" fill={dark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.06)"} />}
    </svg>
  );
}
