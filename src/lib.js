import { useState, useCallback, useEffect, useRef } from "react";
import { STRENGTH_STANDARDS, TIER_NAMES, WEEKLY_SET_TARGET, CHIP_THRESHOLDS, CHIP_COLORS } from "./data";

// ── Persistent storage hook with iOS background-flush ──
export const useStore = (key, init) => {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s != null ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const ref = useRef(val); ref.current = val;
  const set = useCallback(v => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  useEffect(() => {
    const flush = () => { try { localStorage.setItem(key, JSON.stringify(ref.current)); } catch {} };
    window.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [key]);
  return [val, set];
};

// ── Date helpers ──
export const dayKey = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
};
export const todayKey = () => dayKey(new Date());
export const parseKey = (k) => { const [y,m,d]=k.split("-").map(Number); return new Date(y,m-1,d); };
export const addDays = (d, n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };

// Start of current week (Sunday 00:00)
export const weekStart = (ref=new Date()) => {
  const d = new Date(ref); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); // getDay: 0=Sun
  return d;
};

// ── 1RM (Epley) ──
export const epley1RM = (weight, reps) => {
  const w = parseFloat(weight)||0, r = parseFloat(reps)||0;
  if (w<=0 || r<=0) return 0;
  if (r===1) return w;
  return Math.round(w * (1 + r/30));
};

// ── Streaks ──
export const streakFromDates = (dateSet) => {
  let streak=0, cursor=new Date();
  const has = (d)=> dateSet[dayKey(d)];
  if (!has(cursor)) cursor = addDays(cursor,-1);
  while (has(cursor)) { streak++; cursor=addDays(cursor,-1); }
  return streak;
};
export const longestStreakFromDates = (dateSet) => {
  const keys = Object.keys(dateSet).sort();
  let best=0, run=0, prev=null;
  keys.forEach(k => {
    const d = parseKey(k);
    if (prev && (d - prev)/86400000 === 1) run++; else run=1;
    best = Math.max(best, run); prev=d;
  });
  return best;
};
export const streakState = (dateSet) => dateSet[todayKey()] ? "lit" : "risk";

// ── Pace helpers ──
export const paceStrToMin = (str) => {
  if (!str) return 0;
  if (typeof str === "number") return str;
  const parts = String(str).split(":");
  if (parts.length === 2) return (parseInt(parts[0])||0) + (parseInt(parts[1])||0)/60;
  return parseFloat(str)||0;
};
export const minToPaceStr = (min) => {
  if (!min || min<=0) return "—";
  const mm = Math.floor(min);
  const s = Math.round((min - mm)*60);
  return `${mm}:${String(s).padStart(2,"0")}`;
};
export const timeStrToMin = (str) => {
  if (!str) return 0;
  const parts = String(str).split(":").map(Number);
  if (parts.length === 3) return parts[0]*60 + parts[1] + parts[2]/60;
  if (parts.length === 2) return parts[0] + parts[1]/60;
  return parseFloat(str)||0;
};
export const paceToMph = (paceMin) => paceMin>0 ? 60/paceMin : 0;

// ── FEATURE 4: Badge tier computation ──
export const computeTier = (liftName, e1rm, bodyweightLbs) => {
  const standards = STRENGTH_STANDARDS[liftName];
  if (!standards || !bodyweightLbs || bodyweightLbs<=0 || e1rm<=0) return null;
  const ratio = e1rm / bodyweightLbs;
  let tier = -1;
  for (let i=0;i<standards.length;i++) if (ratio >= standards[i]) tier = i;
  const nextRatio = tier < standards.length-1 ? standards[tier+1] : null;
  const prevRatio = tier >= 0 ? standards[tier] : 0;
  const progress = nextRatio ? Math.min(1, (ratio - prevRatio) / (nextRatio - prevRatio)) : 1;
  return { tier, tierName: tier>=0 ? TIER_NAMES[tier] : "Unranked", ratio, nextRatio, progress };
};

// ── FEATURE B: weekly muscle volume ──
// Returns { muscleId: weightedSets } for the current Sun–Sat week.
// A set counts if it has a logged weight OR reps. Primary=1.0, secondary=0.5.
// Weighted set volume per muscle between two date keys (inclusive).
export const muscleVolumeBetween = (history, startKey, endKey) => {
  const scores = {};
  Object.entries(history || {}).forEach(([k, sess]) => {
    if (k < startKey || (endKey && k > endKey)) return;
    (sess.exercises || []).forEach((ex, ei) => {
      const logs = sess.logs?.[ei] || {};
      const setCount = Object.values(logs).filter(s => (s.weight!=null && s.weight!=="") || (s.reps!=null && s.reps!=="")).length;
      if (!setCount) return;
      const mus = ex.muscles || { primary:[], secondary:[] };
      (mus.primary || []).forEach(mid => { scores[mid] = (scores[mid]||0) + setCount * 1.0; });
      (mus.secondary || []).forEach(mid => { scores[mid] = (scores[mid]||0) + setCount * 0.5; });
    });
  });
  return scores;
};
export const weeklyMuscleVolume = (history) => muscleVolumeBetween(history, dayKey(weekStart()), null);

// Chip color for a weighted-set score
export const chipColor = (score) => {
  if (!score || score <= 0) return CHIP_COLORS.grey;
  if (score < CHIP_THRESHOLDS.blue) return CHIP_COLORS.blue;
  if (score < CHIP_THRESHOLDS.purple) return CHIP_COLORS.purple;
  return CHIP_COLORS.red;
};
export const chipTier = (score) => {
  if (!score || score <= 0) return "cold";
  if (score < CHIP_THRESHOLDS.blue) return "light";
  if (score < CHIP_THRESHOLDS.purple) return "moderate";
  return "full";
};
export { WEEKLY_SET_TARGET };

// Current week range label, e.g. "Jul 13–19"
export const weekRangeLabel = () => {
  const s = weekStart();
  const e = addDays(s, 6);
  const mo = d => d.toLocaleDateString("default",{month:"short"});
  if (s.getMonth() === e.getMonth()) return `${mo(s)} ${s.getDate()}–${e.getDate()}`;
  return `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}`;
};

// ── LAST-TIME SYSTEM ──
// For a given exercise name, find the most recent completed session's per-set logs
// and the all-time best set. Returns { recent:{date, sets:{idx:{weight,reps,rpe}}}, best:{weight,reps,e1rm,date} }
export const lastTimeFor = (history, exName, beforeDateKey) => {
  if (!exName) return { recent:null, best:null };
  let recent = null, best = null;
  const entries = Object.entries(history||{})
    .filter(([k,v]) => (!beforeDateKey || k < beforeDateKey) && v && (v.completed || Object.keys(v.logs||{}).length>0))
    .sort((a,b)=> b[0].localeCompare(a[0])); // newest first

  entries.forEach(([k, sess]) => {
    const idx = (sess.exercises||[]).findIndex(e => e.name === exName);
    if (idx < 0) return;
    const logs = sess.logs?.[idx] || {};
    const hasData = Object.values(logs).some(s => (s.weight!=null && s.weight!=="") || (s.reps!=null && s.reps!==""));
    if (!hasData) return;
    // most recent session wins (entries sorted newest-first)
    if (!recent) recent = { date:k, sets:{ ...logs } };
    // all-time best by e1RM
    Object.values(logs).forEach(s => {
      const e = epley1RM(s.weight, s.reps);
      if (e > 0 && (!best || e > best.e1rm)) best = { weight:s.weight, reps:s.reps, e1rm:e, date:k };
    });
  });
  return { recent, best };
};

// Compare today's set against the same set index last time.
// Returns "up" | "down" | "same" | null  (by estimated 1RM)
export const compareSet = (today, prev) => {
  if (!today || !prev) return null;
  const tE = epley1RM(today.weight, today.reps);
  const pE = epley1RM(prev.weight, prev.reps);
  if (!tE || !pE) return null;
  if (tE > pE) return "up";
  if (tE < pE) return "down";
  return "same";
};

// Clock time "HH:MM" (24h, from <input type="time">) → minutes after midnight
export const clockToMin = (str) => {
  const m = String(str || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return (+m[1]) * 60 + (+m[2]);
};
// Hours slept between a bedtime and wake time, crossing midnight if needed
export const sleepHoursBetween = (bed, wake) => {
  const b = clockToMin(bed), w0 = clockToMin(wake);
  if (b == null || w0 == null) return null;
  const w = w0 <= b ? w0 + 24 * 60 : w0;
  const h = (w - b) / 60;
  return h > 0 && h < 24 ? h : null;
};
