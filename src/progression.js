/* ═══════════════════════════════════════════════════════════════
   PROGRESSION ENGINE — double progression + stall / deload check
   ───────────────────────────────────────────────────────────────
   Rule: work inside the rep range at one weight. When every planned
   set hits the TOP of the range (at RPE <= cap, if RPE was logged),
   add weight and drop back to the bottom of the range. Otherwise
   hold the weight and add reps.

   Only numeric rep ranges are progressed ("5", "8-10").
   "AMRAP", "45-60s", "10/leg", "25-30 min" etc. are skipped.
   Suggestions only — nothing here changes logged data.
   ═══════════════════════════════════════════════════════════════ */
import { EXERCISE_LIBRARY } from "./data";
import { epley1RM, dayKey, addDays, parseKey } from "./lib";

export const DEFAULT_PROGRESSION = {
  barbellJump: 5,     // barbell, Smith, machine, cable
  dumbbellJump: 2.5,  // dumbbell / kettlebell
  rpeCap: 8,          // sets above this RPE don't earn a jump
  snapBowflex: true,  // round dumbbell targets to real SelectTech weights
};
// Bowflex SelectTech 552 settings (lb per hand)
export const BOWFLEX_WEIGHTS = [5,7.5,10,12.5,15,17.5,20,22.5,25,30,35,40,45,50,52.5];

// Deload flag: at least this many stalled lifts AND this share of tracked lifts
export const DELOAD_MIN_STALLED = 3;
export const DELOAD_MIN_SHARE = 0.3;
export const STALL_LOOKBACK_DAYS = 10; // only lifts trained recently count
export const STALL_MIN_SPAN_DAYS = 7;  // the 3 flat sessions must cover at least a week

export const progressionCfg = (settings) => ({ ...DEFAULT_PROGRESSION, ...((settings && settings.progression) || {}) });

export const parseRepRange = (reps) => {
  const s = String(reps ?? "").trim();
  let m = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; return { lo: Math.min(a,b), hi: Math.max(a,b) }; }
  m = s.match(/^(\d+)$/);
  if (m) return { lo: +m[1], hi: +m[1] };
  return null;
};

export const equipmentFor = (exName, customExercises = [], fallback = null) => {
  const hit = [...(customExercises || []), ...EXERCISE_LIBRARY].find(e => e.name === exName);
  return (hit && hit.equipment) || fallback || null;
};

const fmtLb = (n) => (Math.round(n * 10) / 10).toString();

// Next weight up for a given piece of equipment. Returns { weight, maxed }.
export const nextWeight = (current, equipment, cfg) => {
  const c = parseFloat(current) || 0;
  if (equipment === "Dumbbell" || equipment === "Kettlebell") {
    const candidate = c + (parseFloat(cfg.dumbbellJump) || 2.5);
    if (equipment === "Dumbbell" && cfg.snapBowflex) {
      const snapped = BOWFLEX_WEIGHTS.find(w => w >= candidate - 1e-9);
      if (snapped == null) return { weight: c, maxed: true };
      return { weight: snapped, maxed: false };
    }
    return { weight: candidate, maxed: false };
  }
  return { weight: c + (parseFloat(cfg.barbellJump) || 5), maxed: false };
};

const loggedSets = (logs) => Object.entries(logs || {})
  .map(([i, s]) => ({
    i: +i,
    w: parseFloat(s.weight) || 0,
    r: parseFloat(s.reps) || 0,
    rpe: (s.rpe === "" || s.rpe == null || isNaN(parseFloat(s.rpe))) ? null : parseFloat(s.rpe),
  }))
  .filter(s => s.r > 0);

// Most recent prior session (before beforeKey) where this exercise has logged reps.
const lastExposure = (history, exName, beforeKey) => {
  const keys = Object.keys(history || {}).filter(k => !beforeKey || k < beforeKey).sort().reverse();
  for (const k of keys) {
    const sess = history[k];
    const idx = (sess?.exercises || []).findIndex(e => e.name === exName);
    if (idx < 0) continue;
    const sets = loggedSets(sess.logs?.[idx]);
    if (sets.length) return { date: k, sets, planned: parseInt(sess.exercises[idx].sets) || sets.length };
  }
  return null;
};

/* Target for today's exercise.
   Returns null, or { action, weight, reps, reason }
   action: "increase" | "reps" | "hold" | "load" */
export const computeTarget = (history, ex, beforeKey, { customExercises = [], cfg = DEFAULT_PROGRESSION } = {}) => {
  if (!ex) return null;
  const range = parseRepRange(ex.reps);
  if (!range) return null;
  const { lo, hi } = range;
  const last = lastExposure(history, ex.name, beforeKey);
  if (!last) return null;
  const cap = parseFloat(cfg.rpeCap) || 8;
  const { sets, planned } = last;
  const rangeLabel = lo === hi ? `${hi}` : `${lo}-${hi}`;

  // Bodyweight work (no load logged): progress reps, then suggest load
  if (!sets.some(s => s.w > 0)) {
    const minR = Math.min(...sets.map(s => s.r));
    if (sets.length >= planned && sets.every(s => s.r >= hi)) {
      return { action: "load", weight: null, reps: hi, reason: `Hit ${hi} on every set — add load (vest) or a harder variation` };
    }
    return { action: "reps", weight: null, reps: Math.min(hi, minR + 1), reason: `Add a rep per set (lowest last time: ${minR})` };
  }

  const work = Math.max(...sets.map(s => s.w));
  const workSets = sets.filter(s => s.w === work);
  const minR = Math.min(...workSets.map(s => s.r));
  const allTop = workSets.every(s => s.r >= hi);
  const fullCount = workSets.length >= planned;
  const rpes = workSets.map(s => s.rpe).filter(v => v != null);
  const rpeOk = rpes.every(v => v <= cap);
  const usedRpe = rpes.length > 0;

  if (allTop && fullCount && rpeOk) {
    const equipment = equipmentFor(ex.name, customExercises, ex.equipment);
    const nw = nextWeight(work, equipment, cfg);
    if (nw.maxed) return { action: "hold", weight: work, reps: hi, reason: "Top of range at the heaviest dumbbell — try a harder variation or slower tempo" };
    return {
      action: "increase", weight: nw.weight, reps: lo,
      reason: `Hit ${hi} on all ${workSets.length} sets${usedRpe ? ` at RPE ≤${cap}` : ""} → +${fmtLb(nw.weight - work)} lb`,
    };
  }
  if (allTop && fullCount && !rpeOk) {
    return { action: "hold", weight: work, reps: hi, reason: `Hit ${hi} reps, but RPE went above ${cap} — own ${fmtLb(work)} first` };
  }
  if (allTop && !fullCount) {
    return { action: "hold", weight: work, reps: hi, reason: `Get all ${planned} sets at ${hi} to earn the jump` };
  }
  if (minR < lo) {
    return { action: "hold", weight: work, reps: lo, reason: `Fell below ${lo} last time — hold ${fmtLb(work)} and rebuild` };
  }
  return {
    action: "reps", weight: work, reps: Math.min(hi, minR + 1),
    reason: `Same weight, add a rep (range ${rangeLabel}, lowest last time: ${minR})`,
  };
};

/* ── Stall detection ──
   An exercise is stalled when its best e1RM hasn't improved
   over its last 3 sessions. */
const exposures = (history, exName, upToKey) => {
  const out = [];
  Object.keys(history || {}).sort().forEach(k => {
    if (upToKey && k > upToKey) return;
    const sess = history[k];
    const idx = (sess?.exercises || []).findIndex(e => e.name === exName);
    if (idx < 0) return;
    const best = Math.max(0, ...loggedSets(sess.logs?.[idx]).map(s => epley1RM(s.w, s.r)));
    if (best > 0) out.push({ date: k, e1rm: best });
  });
  return out;
};

export const isStalled = (list) => {
  if (!list || list.length < 3) return false;
  const [a, b, c] = list.slice(-3);
  const span = (parseKey(c.date) - parseKey(a.date)) / 86400000;
  if (span < STALL_MIN_SPAN_DAYS) return false;
  return Math.max(b.e1rm, c.e1rm) <= a.e1rm;
};

// Deload check as of a given day (defaults to today).
export const deloadCheck = (history, asOf = new Date()) => {
  const upToKey = dayKey(asOf);
  const sinceKey = dayKey(addDays(asOf, -STALL_LOOKBACK_DAYS));
  const names = new Set();
  Object.entries(history || {}).forEach(([k, sess]) => {
    if (k < sinceKey || k > upToKey) return;
    (sess.exercises || []).forEach(e => names.add(e.name));
  });
  const tracked = [], stalled = [];
  names.forEach(n => {
    const list = exposures(history, n, upToKey);
    if (list.length < 3) return;
    if (list[list.length - 1].date < sinceKey) return;
    tracked.push(n);
    if (isStalled(list)) stalled.push(n);
  });
  const flagged = stalled.length >= DELOAD_MIN_STALLED && stalled.length / Math.max(1, tracked.length) >= DELOAD_MIN_SHARE;
  return { flagged, stalled, tracked: tracked.length };
};

export const DELOAD_ADVICE = "Keep the same exercises, use about 60% of your working weights, cut sets roughly in half, then resume progression the week after.";
