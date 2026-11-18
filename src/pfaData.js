/* ═══════════════════════════════════════════════════════════════
   US AIR FORCE PFA — SCORING DATA
   ───────────────────────────────────────────────────────────────
   ⚠ VERIFY BEFORE TRUSTING SCORES.
   These tables are reconstructed approximations of the USAF
   Physical Fitness Assessment scoring charts. The official charts
   are published by the Air Force (AFMAN 36-2905) and are updated
   periodically. The MINIMUMS and general shape are close; the exact
   intermediate point values may be off by a small margin.

   EVERYTHING IS EDITABLE HERE. The scoring engine reads only this
   file — correcting a number below instantly corrects the app.
   No logic changes needed.

   Structure per component:
     max:  performance that earns full points
     min:  minimum passing performance
     pts:  max points that component is worth
   Lower-is-better components (run, shuttle time) set lowerBetter:true
   ═══════════════════════════════════════════════════════════════ */

export const PFA_COMPONENTS = {
  // ── CARDIO (choose one) ──
  run:     { id:"run",     label:"1.5-Mile Run",        unit:"time",  category:"cardio",   pts:60, lowerBetter:true },
  hamr:    { id:"hamr",    label:"20m HAMR Shuttle",    unit:"reps",  category:"cardio",   pts:60, lowerBetter:false },
  // ── UPPER BODY (choose one) ──
  pushups: { id:"pushups", label:"Push-ups (1 min)",    unit:"reps",  category:"upper",    pts:20, lowerBetter:false },
  hrpushups:{id:"hrpushups",label:"Hand-Release Push-ups (2 min)", unit:"reps", category:"upper", pts:20, lowerBetter:false },
  // ── CORE (choose one) ──
  situps:  { id:"situps",  label:"Sit-ups (1 min)",     unit:"reps",  category:"core",     pts:20, lowerBetter:false },
  plank:   { id:"plank",   label:"Forensic Plank",      unit:"time",  category:"core",     pts:20, lowerBetter:false },
  crunch:  { id:"crunch",  label:"Cross-Leg Reverse Crunch (2 min)", unit:"reps", category:"core", pts:20, lowerBetter:false },
};
// fix label typo-safe display
PFA_COMPONENTS.plank.label = "Forearm Plank";

export const CARDIO_OPTIONS = ["run","hamr"];
export const UPPER_OPTIONS  = ["pushups","hrpushups"];
export const CORE_OPTIONS   = ["situps","plank","crunch"];

/* ── AGE BRACKETS ── */
export const AGE_BRACKETS = ["<25","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60+"];
export const bracketFor = (age) => {
  const a = parseInt(age)||0;
  if (a < 25) return "<25";
  if (a < 30) return "25-29";
  if (a < 35) return "30-34";
  if (a < 40) return "35-39";
  if (a < 45) return "40-44";
  if (a < 50) return "45-49";
  if (a < 55) return "50-54";
  if (a < 60) return "55-59";
  return "60+";
};

/* ═══ SCORING TABLES ═══
   Values are [maxPerformance, minPassingPerformance].
   Times in SECONDS. Reps as counts.
   male / female keyed by age bracket. EDIT FREELY. */

export const PFA_STANDARDS = {
  run: { // seconds; LOWER is better. [max pts at or below, min pass at or below]
    male: {
      "<25":[ 9*60+12, 13*60+36 ], "25-29":[ 9*60+34, 13*60+56 ], "30-34":[ 9*60+45, 14*60+18 ],
      "35-39":[10*60+7,  14*60+45 ], "40-44":[10*60+30, 15*60+0 ], "45-49":[10*60+45, 15*60+30 ],
      "50-54":[11*60+0, 16*60+0 ], "55-59":[11*60+30, 16*60+45 ], "60+":[12*60+0, 17*60+30 ],
    },
    female: {
      "<25":[10*60+23, 16*60+22 ], "25-29":[10*60+33, 16*60+42 ], "30-34":[10*60+54, 17*60+0 ],
      "35-39":[11*60+11, 17*60+24 ], "40-44":[11*60+35, 17*60+54 ], "45-49":[12*60+0, 18*60+30 ],
      "50-54":[12*60+30, 19*60+0 ], "55-59":[13*60+0, 19*60+30 ], "60+":[13*60+30, 20*60+0 ],
    },
  },
  hamr: { // shuttle laps; HIGHER better
    male: {
      "<25":[81,38], "25-29":[76,35], "30-34":[70,32], "35-39":[64,29], "40-44":[58,26],
      "45-49":[52,23], "50-54":[46,20], "55-59":[40,18], "60+":[34,15],
    },
    female: {
      "<25":[59,24], "25-29":[55,22], "30-34":[51,20], "35-39":[47,18], "40-44":[43,16],
      "45-49":[39,14], "50-54":[35,12], "55-59":[31,11], "60+":[27,10],
    },
  },
  pushups: { // reps in 1 min; HIGHER better
    male: {
      "<25":[67,33], "25-29":[64,31], "30-34":[61,28], "35-39":[58,26], "40-44":[54,24],
      "45-49":[50,21], "50-54":[46,19], "55-59":[42,16], "60+":[38,14],
    },
    female: {
      "<25":[47,18], "25-29":[45,17], "30-34":[42,15], "35-39":[39,14], "40-44":[36,12],
      "45-49":[33,11], "50-54":[30,10], "55-59":[27,9],  "60+":[24,8],
    },
  },
  hrpushups: { // hand-release, 2 min; HIGHER better
    male: {
      "<25":[51,18], "25-29":[48,17], "30-34":[45,15], "35-39":[42,14], "40-44":[39,12],
      "45-49":[36,11], "50-54":[33,10], "55-59":[30,9], "60+":[27,8],
    },
    female: {
      "<25":[38,12], "25-29":[36,11], "30-34":[34,10], "35-39":[32,9], "40-44":[30,8],
      "45-49":[28,7], "50-54":[26,6], "55-59":[24,5], "60+":[22,5],
    },
  },
  situps: { // reps in 1 min; HIGHER better
    male: {
      "<25":[58,42], "25-29":[54,39], "30-34":[51,36], "35-39":[48,33], "40-44":[44,30],
      "45-49":[40,27], "50-54":[36,24], "55-59":[32,21], "60+":[28,19],
    },
    female: {
      "<25":[54,38], "25-29":[50,35], "30-34":[46,32], "35-39":[43,29], "40-44":[39,26],
      "45-49":[35,23], "50-54":[31,20], "55-59":[27,18], "60+":[24,16],
    },
  },
  plank: { // seconds held; HIGHER better
    male: {
      "<25":[3*60+30, 1*60+5], "25-29":[3*60+20, 1*60+0], "30-34":[3*60+10, 55],
      "35-39":[3*60+0, 50], "40-44":[2*60+50, 45], "45-49":[2*60+40, 40],
      "50-54":[2*60+30, 35], "55-59":[2*60+20, 30], "60+":[2*60+10, 25],
    },
    female: {
      "<25":[3*60+0, 55], "25-29":[2*60+50, 50], "30-34":[2*60+40, 45],
      "35-39":[2*60+30, 40], "40-44":[2*60+20, 35], "45-49":[2*60+10, 32],
      "50-54":[2*60+0, 28], "55-59":[1*60+50, 25], "60+":[1*60+40, 22],
    },
  },
  crunch: { // cross-leg reverse crunch, 2 min; HIGHER better
    male: {
      "<25":[45,22], "25-29":[43,20], "30-34":[41,19], "35-39":[39,17], "40-44":[37,16],
      "45-49":[35,14], "50-54":[33,13], "55-59":[31,11], "60+":[29,10],
    },
    female: {
      "<25":[43,20], "25-29":[41,19], "30-34":[39,17], "35-39":[37,16], "40-44":[35,14],
      "45-49":[33,13], "50-54":[31,11], "55-59":[29,10], "60+":[27,9],
    },
  },
};

/* ── SCORING ──
   Linear interpolation between min (passing floor) and max (full points).
   Below min → scaled partial credit down to 0, and flagged as failing. */
export const scoreComponent = (compId, value, gender, bracket) => {
  const comp = PFA_COMPONENTS[compId];
  const table = PFA_STANDARDS[compId]?.[gender]?.[bracket];
  if (!comp || !table || value == null || value === "") return null;
  const [maxV, minV] = table;
  const v = parseFloat(value);
  if (isNaN(v) || v <= 0) return null;
  const maxPts = comp.pts;
  let pct, passed;
  if (comp.lowerBetter) {
    passed = v <= minV;
    if (v <= maxV) pct = 1;
    else if (v >= minV) pct = passed ? 0.6 : Math.max(0, 0.6 * (1 - (v - minV) / (minV * 0.25)));
    else pct = 1;
    if (v > maxV && v <= minV) pct = 0.6 + 0.4 * ((minV - v) / (minV - maxV));
  } else {
    passed = v >= minV;
    if (v >= maxV) pct = 1;
    else if (v <= minV) pct = passed ? 0.6 : Math.max(0, 0.6 * (v / Math.max(minV,1)));
    else pct = 1;
    if (v < maxV && v >= minV) pct = 0.6 + 0.4 * ((v - minV) / (maxV - minV));
  }
  pct = Math.max(0, Math.min(1, pct));
  return { points: +(maxPts * pct).toFixed(1), maxPts, pct, passed, maxV, minV };
};

export const compositeRating = (total) => {
  if (total >= 90) return { label:"Excellent", color:"#48c47a" };
  if (total >= 75) return { label:"Satisfactory", color:"#e8a84d" };
  return { label:"Unsatisfactory", color:"#e05555" };
};

/* ── TRAINING SUGGESTIONS by weakest component ── */
export const TRAINING_PLANS = {
  run: {
    title:"Build your 1.5-mile",
    items:[
      "2× per week: interval run — 6×400m at goal pace, 90s rest.",
      "1× per week: easy zone-2 run, 25–35 min, conversational pace.",
      "1× every 2 weeks: time-trial 1.5 mi to track progress.",
      "Add incline treadmill walks on lift days for aerobic base.",
    ],
  },
  hamr: {
    title:"Build your shuttle capacity",
    items:[
      "2× per week: 20m shuttle intervals — 10 reps, 30s rest.",
      "Practice sharp deceleration and turns; most laps are lost on turns.",
      "1× per week: longer zone-2 cardio for aerobic base.",
    ],
  },
  pushups: {
    title:"Build push-up capacity",
    items:[
      "Greasing the groove: 4–5 sub-max sets daily (stop 2–3 shy of failure).",
      "2× per week: weighted push-ups or close-grip bench for raw strength.",
      "1× per week: 1-minute max-rep test to train the specific pace.",
      "Train triceps and front delts directly — they fail before chest does.",
    ],
  },
  hrpushups: {
    title:"Build hand-release push-ups",
    items:[
      "Practice the full hand-release at the bottom — it kills momentum.",
      "3× per week: 5 sets of 60–70% of max, short rests.",
      "Strengthen the dead-stop press: pause push-ups, 3-count at bottom.",
    ],
  },
  situps: {
    title:"Build sit-up endurance",
    items:[
      "Train for pace: 3 sets of 40s continuous, matching test cadence.",
      "Add weighted cable crunches 2× per week for core strength.",
      "Strengthen hip flexors — they're usually the limiter.",
    ],
  },
  plank: {
    title:"Build plank hold time",
    items:[
      "3× per week: 3 holds at 70–80% of your max time, 60s rest.",
      "Add ab wheel rollouts and hollow holds for anti-extension strength.",
      "Practice bracing technique — squeeze glutes, ribs down.",
    ],
  },
  crunch: {
    title:"Build reverse crunch capacity",
    items:[
      "Train the exact movement 3× per week, 4 sets of 15–20.",
      "Add hanging knee raises for lower-ab strength.",
      "Focus on controlled tempo — sloppy reps don't count on test day.",
    ],
  },
};

export const PFA_TIPS = [
  "Test-day pacing beats raw fitness. Practice at test cadence.",
  "The run is 60 of 100 points. Protect it above everything else.",
  "Sleep and hydration move your run time more than one extra workout.",
  "Train the exact test movements — specificity wins.",
  "Show up to BMT already exceeding standards, not just passing.",
];
