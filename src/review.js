/* ═══════════════════════════════════════════════════════════════
   WEEKLY REVIEW — computed on demand for any Sun–Sat week
   No stored snapshots: every past review is rebuilt from your logs,
   so it stays correct after edits or a backup import.
   ═══════════════════════════════════════════════════════════════ */
import { MAJOR_MUSCLES, MUSCLE_NAMES, EXERCISE_LIBRARY } from "./data";
import { dayKey, addDays, parseKey, weekStart, epley1RM, muscleVolumeBetween, sleepHoursBetween } from "./lib";
import { deloadCheck, DELOAD_ADVICE } from "./progression";

export const MIN_SESSIONS_TARGET = 4;   // fewer than this → consistency focus
export const SLEEP_TARGET_HRS = 7;      // avg below this (3+ nights logged) → sleep focus
export const COLD_FOCUS_MIN = 3;        // this many untouched major muscles → balance focus
export const TONNAGE_DROP_FOCUS = 0.2;  // >20% drop vs prior week → volume focus

const hasSetData = (s) => (s.weight != null && s.weight !== "") || (s.reps != null && s.reps !== "");

const weekKeys = (startDate) => {
  const startKey = dayKey(startDate);
  const endKey = dayKey(addDays(startDate, 6));
  return { startKey, endKey };
};

const tonnageBetween = (history, a, b) => {
  let t = 0, sets = 0;
  Object.entries(history || {}).forEach(([k, sess]) => {
    if (k < a || k > b) return;
    Object.values(sess.logs || {}).forEach(exLogs => Object.values(exLogs || {}).forEach(s => {
      if (hasSetData(s)) sets++;
      t += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
    }));
  });
  return { tonnage: t, sets };
};

// best e1RM per exercise in [a,b] (b inclusive); a may be "" for "since forever"
const bestByExercise = (history, a, b) => {
  const best = {};
  Object.entries(history || {}).forEach(([k, sess]) => {
    if ((a && k < a) || k > b) return;
    (sess.exercises || []).forEach((ex, ei) => {
      Object.values(sess.logs?.[ei] || {}).forEach(s => {
        const e = epley1RM(s.weight, s.reps);
        if (e > (best[ex.name]?.e1rm || 0)) best[ex.name] = { e1rm: e, weight: s.weight, reps: s.reps, date: k };
      });
    });
  });
  return best;
};

const sleepHoursFor = (fields) => {
  const v = parseFloat(fields?.sleepHours);
  if (v > 0) return v;
  return sleepHoursBetween(fields?.bedtime, fields?.waketime);
};

const avg = (arr) => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null;

const consecutiveEndingOn = (dateSet, endKey) => {
  let n = 0, d = parseKey(endKey);
  while (dateSet[dayKey(d)]) { n++; d = addDays(d, -1); }
  return n;
};

export const buildReview = (startDate, { history = {}, runs = [], wellness = {} } = {}) => {
  const { startKey, endKey } = weekKeys(startDate);
  const prev = weekKeys(addDays(startDate, -7));

  // ── Sessions ──
  const sessionDays = [], completedDays = [];
  Object.entries(history).forEach(([k, sess]) => {
    if (k < startKey || k > endKey) return;
    const logged = Object.values(sess.logs || {}).some(ex => Object.values(ex || {}).some(hasSetData));
    if (logged) sessionDays.push(k);
    if (sess.completed) completedDays.push(k);
  });
  const weekRuns = (runs || []).filter(r => r.date >= startKey && r.date <= endKey);
  const miles = weekRuns.reduce((s, r) => s + (parseFloat(r.distance) || 0), 0);

  // ── Volume ──
  const cur = tonnageBetween(history, startKey, endKey);
  const before = tonnageBetween(history, prev.startKey, prev.endKey);
  const tonnageChange = before.tonnage > 0 ? (cur.tonnage - before.tonnage) / before.tonnage : null;

  // ── PRs: beat the best from before this week (first-ever logs don't count) ──
  const priorBest = bestByExercise(history, "", dayKey(addDays(startDate, -1)));
  const weekBest = bestByExercise(history, startKey, endKey);
  const prs = Object.entries(weekBest)
    .filter(([n, b]) => priorBest[n] && b.e1rm > priorBest[n].e1rm)
    .map(([n, b]) => ({ name: n, weight: b.weight, reps: b.reps, e1rm: b.e1rm, gain: b.e1rm - priorBest[n].e1rm }))
    .sort((a, b) => b.gain - a.gain);

  // ── Muscles ──
  const vol = muscleVolumeBetween(history, startKey, endKey);
  const topMuscles = Object.entries(vol).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, v]) => ({ id, name: MUSCLE_NAMES[id] || id, sets: v }));
  const cold = MAJOR_MUSCLES.filter(id => !(vol[id] > 0)).map(id => ({ id, name: MUSCLE_NAMES[id] || id }));

  // ── Streak days ──
  const workoutDates = {};
  Object.entries(history).forEach(([k, v]) => {
    const logged = Object.values(v?.logs || {}).some(ex => Object.values(ex || {}).some(hasSetData));
    if (v?.completed || logged) workoutDates[k] = true;
  });
  (runs || []).forEach(r => { if (r.date) workoutDates[r.date] = true; });
  const wellnessDates = {};
  Object.entries(wellness || {}).forEach(([k, v]) => {
    const f = v?.fields && Object.values(v.fields).some(x => x !== "" && x != null && x !== false);
    const h = v?.habits && Object.values(v.habits).some(Boolean);
    if (f || h) wellnessDates[k] = true;
  });
  const overall = { ...workoutDates, ...wellnessDates };
  const inWeek = (set) => Object.keys(set).filter(k => k >= startKey && k <= endKey).length;
  const streaks = {
    workoutDays: inWeek(workoutDates),
    wellnessDays: inWeek(wellnessDates),
    overallAtEnd: consecutiveEndingOn(overall, endKey),
  };

  // ── Wellness averages ──
  const days = Object.entries(wellness || {}).filter(([k]) => k >= startKey && k <= endKey).map(([, v]) => v?.fields || {});
  const series = (fn) => days.map(fn).filter(v => v != null && !isNaN(v) && v > 0);
  const num = (id) => (f) => { const v = parseFloat(f[id]); return isNaN(v) ? null : v; };
  const w = {
    sleep: series(sleepHoursFor), sleepQuality: series(num("sleepQuality")), water: series(num("water")),
    energy: series(num("energy")), soreness: series(num("soreness")), steps: series(num("steps")),
  };
  const wellnessAvg = Object.fromEntries(Object.entries(w).map(([k, arr]) => [k, { avg: avg(arr), n: arr.length }]));

  // ── Deload state as of week end ──
  const endDate = addDays(startDate, 6);
  const deload = deloadCheck(history, endDate);

  // ── One focus (first rule that fires) ──
  const sessions = sessionDays.length;
  let focus;
  if (deload.flagged) {
    focus = { kind: "deload", title: "Take a deload week",
      text: `${deload.stalled.slice(0, 4).join(", ")} ${deload.stalled.length > 1 ? "have" : "has"} stalled for 3 sessions. ${DELOAD_ADVICE}` };
  } else if (sessions + weekRuns.length < MIN_SESSIONS_TARGET) {
    focus = { kind: "consistency", title: "Consistency first",
      text: `${sessions} lifting session${sessions === 1 ? "" : "s"}${weekRuns.length ? ` and ${weekRuns.length} run${weekRuns.length === 1 ? "" : "s"}` : ""} this week. Lock in at least ${MIN_SESSIONS_TARGET} training days before chasing numbers.` };
  } else if (wellnessAvg.sleep.n >= 3 && wellnessAvg.sleep.avg < SLEEP_TARGET_HRS) {
    focus = { kind: "sleep", title: "Protect your sleep",
      text: `You averaged ${wellnessAvg.sleep.avg.toFixed(1)} hrs over ${wellnessAvg.sleep.n} nights. Getting to ${SLEEP_TARGET_HRS}+ will do more for recovery than extra sets.` };
  } else if (cold.length >= COLD_FOCUS_MIN) {
    const pick = cold[0];
    const ideas = EXERCISE_LIBRARY.filter(e => (e.muscles?.primary || []).includes(pick.id)).slice(0, 2).map(e => e.name);
    focus = { kind: "balance", title: `Bring up your ${cold.slice(0, 3).map(c => c.name.toLowerCase()).join(", ")}`,
      text: `${cold.length} major muscle groups got zero sets.${ideas.length ? ` Try adding ${ideas.join(" or ")} for ${pick.name.toLowerCase()}.` : ""}` };
  } else if (tonnageChange != null && tonnageChange < -TONNAGE_DROP_FOCUS) {
    focus = { kind: "volume", title: "Volume dipped",
      text: `Tonnage fell ${Math.round(-tonnageChange * 100)}% from the week before. If that wasn't a planned easy week, get back to your full set counts.` };
  } else if (prs.length) {
    focus = { kind: "momentum", title: "Keep the momentum",
      text: `${prs.length} PR${prs.length === 1 ? "" : "s"} this week. Follow the targets on your main lifts and don't skip the ones that are holding.` };
  } else {
    focus = { kind: "progress", title: "Push your targets",
      text: "Solid, balanced week. Aim to hit the progression target on every main lift next week." };
  }

  return {
    startKey, endKey, sessions, completed: completedDays.length,
    runs: weekRuns.length, miles,
    tonnage: cur.tonnage, sets: cur.sets, tonnageChange,
    prs, topMuscles, cold, streaks, wellnessAvg, deload, focus,
    empty: sessions === 0 && weekRuns.length === 0 && Object.keys(wellnessDates).filter(k => k >= startKey && k <= endKey).length === 0,
  };
};

// Most recently finished week (the Sun–Sat before the current one)
export const lastWeekStart = (ref = new Date()) => addDays(weekStart(ref), -7);

// Show the Home card Sunday through Tuesday
export const reviewCardVisible = (ref = new Date()) => ref.getDay() <= 2;

// All finished weeks with any activity, newest first
export const pastReviews = (data, maxWeeks = 26, ref = new Date()) => {
  const allKeys = [
    ...Object.keys(data.history || {}),
    ...(data.runs || []).map(r => r.date).filter(Boolean),
    ...Object.keys(data.wellness || {}),
  ].sort();
  if (!allKeys.length) return [];
  const firstWeek = weekStart(parseKey(allKeys[0]));
  const out = [];
  let w = lastWeekStart(ref);
  while (w >= firstWeek && out.length < maxWeeks) {
    const r = buildReview(w, data);
    if (!r.empty) out.push(r);
    w = addDays(w, -7);
  }
  return out;
};

export const weekLabel = (startKey) => {
  const s = parseKey(startKey), e = addDays(s, 6);
  const mo = (d) => d.toLocaleDateString("default", { month: "short" });
  return s.getMonth() === e.getMonth() ? `${mo(s)} ${s.getDate()}–${e.getDate()}` : `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}`;
};
