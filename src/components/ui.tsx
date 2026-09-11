import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* Animated counting number for the hero temperature */
export function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  useEffect(() => {
    fromRef.current = display;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{Math.round(display)}</>;
}

export function Label({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.22em] ${
        dark ? "text-white/50" : "text-black/50"
      }`}
    >
      {children}
    </p>
  );
}

export function Hairline({ dark }: { dark: boolean }) {
  return <div className={`h-px w-full ${dark ? "bg-white/10" : "bg-black/10"}`} />;
}

export const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
  exit: { opacity: 0, y: -12, filter: "blur(6px)", transition: { duration: 0.3 } },
};

export function Card({
  dark,
  children,
  className = "",
  index = 0,
}: {
  dark: boolean;
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      custom={index}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl transition-colors duration-700 ${
        dark
          ? "bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.09]"
          : "bg-white/70 ring-1 ring-black/[0.06] hover:bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* Circular progress ring */
export function Ring({ value, max, dark, size = 92 }: { value: number; max: number; dark: boolean; size?: number }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"} strokeWidth={6} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? "#fff" : "#111"}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${dark ? "text-white" : "text-black"}`}>
        <span className="text-xl font-semibold tracking-tight">{Math.round(value)}<span className="text-xs font-normal opacity-60">%</span></span>
      </div>
    </div>
  );
}

/* Sun path arc */
export function SunArc({ sunrise, sunset, nowIso, dark }: { sunrise: string; sunset: string; nowIso: string; dark: boolean }) {
  const toMin = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };
  const sr = toMin(sunrise);
  const ss = toMin(sunset);
  const now = toMin(nowIso);
  const pct = Math.min(1, Math.max(0, (now - sr) / Math.max(1, ss - sr)));
  const W = 220;
  const H = 110;
  const cx = W / 2;
  const cy = H - 8;
  const R = 88;
  const point = (p: number) => {
    const a = Math.PI * (1 - p);
    return { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
  };
  const cur = point(pct);
  const path = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={path} fill="none" stroke={dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"} strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" />
        <motion.path
          d={path}
          fill="none"
          stroke={dark ? "#fde68a" : "#d97706"}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: pct }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <circle cx={cx - R} cy={cy} r={3.5} fill={dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"} />
        <circle cx={cx + R} cy={cy} r={3.5} fill={dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"} />
        <g>
          <circle cx={cur.x} cy={cur.y} r={14} fill={dark ? "rgba(253,230,138,0.25)" : "rgba(217,119,6,0.15)"} />
          <circle cx={cur.x} cy={cur.y} r={6} fill={dark ? "#fde68a" : "#f59e0b"} />
        </g>
      </svg>
    </div>
  );
}
