import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { PRESETS, BODY_PARTS, BODY_PART_COLORS,
         DEFAULT_WEEKLY, DEFAULT_CYCLE, MOTIVATION, STRENGTH_STANDARDS } from "./data";
import { useStore, dayKey, todayKey, parseKey, addDays,
         epley1RM, streakFromDates, longestStreakFromDates, lastTimeFor, compareSet, weekStart } from "./lib";
import { FloatingTimer } from "./Timer";
import { CardioView } from "./Cardio";
import { WellnessView } from "./Wellness";
import { ExercisePicker } from "./ExercisePicker";
import { EmberField } from "./Embers";
import { BadgesPanel } from "./Badges";
import { StreakFlame, hitMilestone, MilestoneToast } from "./Streaks";
import { MuscleChips } from "./MuscleChips";
import { CustomPresetBuilder } from "./CustomPresetBuilder";
import { Intro } from "./Intro";
import { MilitaryView } from "./Military";
import { computeTarget, progressionCfg, deloadCheck, DELOAD_ADVICE, DEFAULT_PROGRESSION } from "./progression";
import { buildReview, lastWeekStart, reviewCardVisible, pastReviews } from "./review";
import { WeeklyReviewCard, ReviewHistory } from "./WeeklyReview";

const S = { bg:"#0a0c0e", surface:"#111316", card:"#161a1e", border:"#1e2428",
            text:"#e8e6e0", muted:"#5a6670", dim:"#3a4550" };
const fmt = n => n>=1000 ? (n/1000).toFixed(n>=10000?0:1)+"k" : Math.round(n).toString();

export default function App() {
  const [section, setSection]   = useStore("section", null);
  const [tab, setTab]           = useStore("tab", "home");
  const [history, setHistory]   = useStore("history", {});
  const [bodyweight, setBodyweight] = useStore("bodyweight", []);
  const [runs, setRuns]         = useStore("runs", []);
  const [wellness, setWellness] = useStore("wellness", {});
  const [wellnessCfg, setWellnessCfg] = useStore("wellnessCfg", []);
  const [habits, setHabits]     = useStore("habits", []);
  const [customExercises, setCustomExercises] = useStore("customExercises", []);
  const [customPresets, setCustomPresets] = useStore("customPresets", {});
  const [prRecords, setPrRecords] = useStore("prRecords", {});
  const [introSeen, setIntroSeen] = useStore("introSeen", false);
  const [pfa, setPfa] = useStore("pfa", []);
  const [pfaCfg, setPfaCfg] = useStore("pfaCfg", {});
  const [deloadDismissed, setDeloadDismissed] = useStore("deloadDismissed", "");
  const [reviewDismissed, setReviewDismissed] = useStore("reviewDismissed", "");
  const [settings, setSettings] = useStore("settings", {
    rotationMode:"weekly", weekly:DEFAULT_WEEKLY, cycle:DEFAULT_CYCLE,
    showGym:false, gym:"home", bigThree:{squat:"Back Squat", bench:"Bench Press", deadlift:"Deadlift"},
    rememberSection:false
  });
  const [activeDate, setActiveDate] = useState(todayKey());
  const [showSettings, setShowSettings] = useState(false);
  const [burst, setBurst] = useState(0);
  const [milestone, setMilestone] = useState(null);
  // intro plays only on first-ever launch; gated on mount only (never on iOS resume)
  const [introPlaying, setIntroPlaying] = useState(!introSeen);
  const [replayIntro, setReplayIntro] = useState(false);
  const [statsOpen, setStatsOpen] = useState("charts");

  const accent = "#e8614d";
  const triggerBurst = () => setBurst(b=>b+1);

  // ── Custom presets merge everywhere via resolvePreset ──
  const allPresets = { ...PRESETS, ...customPresets };
  const resolvePreset = (id) => allPresets[id] || null;

  // Intro overlay (first launch or replay)
  if (introPlaying || replayIntro) {
    return <Intro onDone={()=>{ setIntroPlaying(false); setReplayIntro(false); if(!introSeen) setIntroSeen(true); }} />;
  }

  if (section === null) {
    return <SectionPicker onPick={(s)=>setSection(s)} S={S} />;
  }
  const isWellness = section === "wellness";

  // ── Rotation ──
  const cycleIndexFor = (dk) => {
    const done = Object.keys(history).filter(k => k < dk && history[k]?.completed).length;
    return done % settings.cycle.length;
  };
  const recommendFor = (dk) => {
    if (history[dk]?.presetId) return history[dk].presetId;
    if (settings.rotationMode === "weekly") return settings.weekly[parseKey(dk).getDay()];
    return settings.cycle[cycleIndexFor(dk)];
  };

  // ── FEATURE 6: streaks ──
  const workoutDates = {};
  Object.entries(history).forEach(([k,v])=>{ if(v?.completed || Object.keys(v?.logs||{}).length>0) workoutDates[k]=true; });
  runs.forEach(r=>{ if(r.date) workoutDates[r.date]=true; });
  const wellnessDates = {};
  Object.entries(wellness).forEach(([k,v])=>{ const hasField=v.fields&&Object.values(v.fields).some(x=>x!==""&&x!=null&&x!==false); const hasHabit=v.habits&&Object.values(v.habits).some(Boolean); if(hasField||hasHabit) wellnessDates[k]=true; });
  const overallDates = { ...workoutDates, ...wellnessDates };
  const workoutStreak = streakFromDates(workoutDates);
  const wellnessStreak = streakFromDates(wellnessDates);
  const overallStreak = streakFromDates(overallDates);
  const longest = longestStreakFromDates(overallDates);

  // ── Stats ──
  const allSessions = Object.entries(history).filter(([,v])=>v?.completed);
  const lifetimeTonnage = allSessions.reduce((sum,[,sess]) => { let t=0; Object.values(sess.logs||{}).forEach(exLogs => Object.values(exLogs).forEach(set => { t += (parseFloat(set.weight)||0)*(parseFloat(set.reps)||0); })); return sum + t; }, 0);
  const weekTonnage = (() => { const weekAgo=addDays(new Date(),-7); let t=0; allSessions.forEach(([k,sess]) => { if (parseKey(k) >= weekAgo) Object.values(sess.logs||{}).forEach(exLogs => Object.values(exLogs).forEach(set => { t += (parseFloat(set.weight)||0)*(parseFloat(set.reps)||0); })); }); return t; })();
  const bestE1RMByLift = (() => { const best={}; allSessions.forEach(([,sess]) => { (sess.exercises||[]).forEach((ex,ei) => { Object.values(sess.logs?.[ei]||{}).forEach(set => { const e=epley1RM(set.weight,set.reps); if (e > (best[ex.name]||0)) best[ex.name]=e; }); }); }); return best; })();
  const bt = settings.bigThree;
  const strengthScore = (bestE1RMByLift[bt.squat]||0) + (bestE1RMByLift[bt.bench]||0) + (bestE1RMByLift[bt.deadlift]||0);
  const latestBW = bodyweight.length ? [...bodyweight].sort((a,b)=>b.date.localeCompare(a.date))[0].lbs : 0;

  const radarData = (() => {
    const counts={}; BODY_PARTS.forEach(b=>counts[b]=0);
    const cutoff=addDays(new Date(),-14);
    allSessions.forEach(([k,sess]) => { if (parseKey(k) < cutoff) return; (sess.exercises||[]).forEach((ex,ei) => { const numSets=Object.keys(sess.logs?.[ei]||{}).length; (ex.parts||[]).forEach(p => { if(counts[p]!==undefined) counts[p]+=numSets; }); }); });
    // Combine Arms + Shoulders into a single "Arms & Shoulders" spoke
    const spokes = [
      { part:"Chest", sets:counts["Chest"] },
      { part:"Back", sets:counts["Back"] },
      { part:"Arms & Shoulders", sets:(counts["Arms"]||0)+(counts["Shoulders"]||0) },
      { part:"Legs", sets:counts["Legs"] },
      { part:"Core", sets:counts["Core"] },
      { part:"Cardio", sets:counts["Cardio"] },
    ];
    return spokes;
  })();

  // ── Session mutations ──
  const ensureSession = (dk, presetId) => {
    setHistory(prev => {
      const p = resolvePreset(presetId);
      const ex = p?.exercises || prev[dk]?.exercises || [];
      return { ...prev, [dk]: { presetId, exercises: ex.map(e=>({...e})), logs: prev[dk]?.logs||{}, completed: prev[dk]?.completed||false } };
    });
  };
  const updateSetLog = (dk, exIdx, setIdx, field, value) => {
    setHistory(prev => {
      const sess = prev[dk] || { exercises:[], logs:{}, completed:false };
      const logs = { ...sess.logs };
      logs[exIdx] = { ...(logs[exIdx]||{}) };
      logs[exIdx][setIdx] = { ...(logs[exIdx][setIdx]||{}), [field]: value };
      const entry = logs[exIdx][setIdx];
      const exName = sess.exercises?.[exIdx]?.name;
      if (exName && entry.weight && entry.reps) {
        const e = epley1RM(entry.weight, entry.reps);
        const prevBest = prRecords[exName]?.e1rm || 0;
        if (e > prevBest) { setPrRecords(pr => ({ ...pr, [exName]: { e1rm:e, date:dk } })); if (prevBest > 0) triggerBurst(); }
      }
      return { ...prev, [dk]: { ...sess, logs } };
    });
  };
  const markComplete = (dk, val=true) => {
    setHistory(prev => ({ ...prev, [dk]: { ...(prev[dk]||{}), completed: val } }));
    if (val) { triggerBurst(); const withToday={...overallDates,[todayKey()]:true}; const st=streakFromDates(withToday); if (hitMilestone(st)) setMilestone(st); }
  };
  const addExerciseToSession = (dk, ex) => { setHistory(prev => { const sess=prev[dk]||{exercises:[],logs:{},completed:false}; return { ...prev, [dk]: { ...sess, exercises:[...(sess.exercises||[]), {...ex}] } }; }); };
  const stackPreset = (dk, presetId) => {
    setHistory(prev => {
      const sess = prev[dk] || { exercises:[], logs:{}, completed:false };
      const incoming = (resolvePreset(presetId)?.exercises||[]).map(e=>({...e, main:false}));
      const existingNames = new Set((sess.exercises||[]).map(e=>e.name));
      const merged = [...(sess.exercises||[]), ...incoming.filter(e=>!existingNames.has(e.name))];
      return { ...prev, [dk]: { ...sess, exercises: merged, stackedFrom: [...(sess.stackedFrom||[]), presetId] } };
    });
  };
  const removeExercise = (dk, exIdx) => {
    setHistory(prev => { const sess=prev[dk]; if(!sess) return prev; const exercises=sess.exercises.filter((_,i)=>i!==exIdx); const logs={}; Object.entries(sess.logs||{}).forEach(([k,v])=>{ const ki=parseInt(k); if(ki<exIdx) logs[ki]=v; else if(ki>exIdx) logs[ki-1]=v; }); return { ...prev, [dk]: { ...sess, exercises, logs } }; });
  };
  const swapExercise = (dk, exIdx, newEx) => {
    setHistory(prev => { const sess=prev[dk]; if(!sess) return prev; const exercises=sess.exercises.map((e,i)=> i===exIdx ? {...newEx, sets:e.sets, reps:e.reps} : e); const logs={...sess.logs}; delete logs[exIdx]; return { ...prev, [dk]: { ...sess, exercises, logs } }; });
  };
  const changeSetCount = (dk, exIdx, delta) => {
    setHistory(prev => {
      const sess = prev[dk]; if (!sess) return prev;
      const exercises = sess.exercises.map((e,i)=>{ if(i!==exIdx) return e; const cur=parseInt(e.sets)||1; return {...e, sets: Math.max(1, Math.min(10, cur+delta))}; });
      const logs = { ...sess.logs };
      if (delta < 0 && logs[exIdx]) { const newCount=Math.max(1,(parseInt(sess.exercises[exIdx].sets)||1)+delta); const exLogs={...logs[exIdx]}; Object.keys(exLogs).forEach(si=>{ if(parseInt(si)>=newCount) delete exLogs[si]; }); logs[exIdx]=exLogs; }
      return { ...prev, [dk]: { ...sess, exercises, logs } };
    });
  };
  // FEATURE A: custom preset CRUD
  const saveCustomPreset = (preset, id) => { const pid = id || `custom_${Date.now()}`; setCustomPresets(prev => ({ ...prev, [pid]: preset })); };
  const deleteCustomPreset = (id) => { setCustomPresets(prev => { const next={...prev}; delete next[id]; return next; }); };

  const importData = (parsed) => {
    if (parsed.history) setHistory(parsed.history);
    if (parsed.bodyweight) setBodyweight(parsed.bodyweight);
    if (parsed.runs) setRuns(parsed.runs);
    if (parsed.wellness) setWellness(parsed.wellness);
    if (parsed.wellnessCfg) setWellnessCfg(parsed.wellnessCfg);
    if (parsed.habits) setHabits(parsed.habits);
    if (parsed.customExercises) setCustomExercises(parsed.customExercises);
    if (parsed.customPresets) setCustomPresets(parsed.customPresets);
    if (parsed.prRecords) setPrRecords(parsed.prRecords);
    if (parsed.pfa) setPfa(parsed.pfa);
    if (parsed.pfaCfg) setPfaCfg(parsed.pfaCfg);
    if (parsed.settings) setSettings(parsed.settings);
  };

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:S.text, paddingBottom:90 }}>
      <div style={{ background:S.surface, borderBottom:`1px solid ${S.border}`, padding:"env(safe-area-inset-top, 14px) 16px 12px", position:"sticky", top:0, zIndex:100, overflow:"hidden" }}>
        <EmberField palette={isWellness?"cool":"fire"} burstSignal={burst} />
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <button onClick={()=>setSection(null)} style={{ background:"transparent", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:10, letterSpacing:3, color: isWellness?"#48c47a":accent, textTransform:"uppercase", display:"flex", alignItems:"center", gap:4 }}>{isWellness?"Wellness":"Workout"} <span style={{ fontSize:9, color:S.dim }}>⇄ switch</span></div>
            </button>
            <div style={{ fontSize:18, fontWeight:700 }}>{ isWellness ? "Wellness" : {home:"Dashboard",calendar:"Calendar",workout:"Workout",cardio:"Cardio",military:"Military",stats:"Stats"}[tab] }</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <StreakFlame count={isWellness?wellnessStreak:workoutStreak} dateSet={isWellness?wellnessDates:workoutDates} color={isWellness?"#48c47a":accent} S={S} />
            <button onClick={()=>setShowSettings(true)} aria-label="Settings" style={{ background:"transparent", border:"none", color:S.muted, fontSize:22, cursor:"pointer" }}>⚙</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:540, margin:"0 auto", padding:"14px" }}>
        {isWellness && <WellnessView
          wellness={wellness} setWellness={setWellness} wellnessCfg={wellnessCfg} setWellnessCfg={setWellnessCfg}
          habits={habits} setHabits={setHabits}
          onLog={()=>{ const withToday={...wellnessDates,[todayKey()]:true}; const st=streakFromDates(withToday); if (hitMilestone(st) && !wellnessDates[todayKey()]) { setMilestone(st); triggerBurst(); } }}
          S={S} />}

        {!isWellness && tab==="home" && (() => {
          const rec = recommendFor(todayKey());
          const recPreset = resolvePreset(rec);
          const quote = MOTIVATION[new Date().getDate() % MOTIVATION.length];
          const todayDone = history[todayKey()]?.completed;
          const thisWeekKey = dayKey(weekStart());
          const deload = deloadCheck(history);
          const showDeload = deload.flagged && deloadDismissed !== thisWeekKey;
          const reviewStart = lastWeekStart();
          const reviewKey = dayKey(reviewStart);
          const review = (reviewCardVisible() && reviewDismissed !== reviewKey) ? buildReview(reviewStart, { history, runs, wellness }) : null;
          return <>
            <div style={{ position:"relative", background:`linear-gradient(135deg, ${recPreset?.color||accent}22, ${S.card})`, border:`1px solid ${recPreset?.color||accent}44`, borderRadius:16, padding:"18px", marginBottom:14, overflow:"hidden" }}>
              <EmberField palette="fire" burstSignal={burst} />
              <div style={{ position:"relative" }}>
                <div style={{ fontSize:10, letterSpacing:2, color:S.muted, textTransform:"uppercase", marginBottom:6 }}>{todayDone ? "Today — Completed ✓" : "Today's Recommendation"}</div>
                <div style={{ fontSize:24, fontWeight:700, color:recPreset?.color||accent }}>{recPreset?.label||"Rest Day"}</div>
                <div style={{ fontSize:12, color:S.muted, marginTop:2 }}>{recPreset?.subtitle||"Recovery and mobility."}</div>
                {recPreset && (<button onClick={()=>{ ensureSession(todayKey(),rec); setActiveDate(todayKey()); setTab("workout"); }} style={{ marginTop:14, width:"100%", padding:"12px", background:recPreset.color, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>{todayDone ? "Review Session" : "Start Workout"}</button>)}
              </div>
            </div>

            {showDeload && (
              <div style={{ background:"#e8a84d14", border:"1px solid #e8a84d55", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div>
                    <div style={{ fontSize:10, letterSpacing:2, color:"#e8a84d", textTransform:"uppercase", marginBottom:4 }}>Suggestion · deload week</div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{deload.stalled.length} lifts have stalled</div>
                  </div>
                  <button onClick={()=>setDeloadDismissed(thisWeekKey)} style={{ background:"transparent", border:`1px solid ${S.border}`, borderRadius:8, color:S.muted, fontSize:12, padding:"4px 9px", cursor:"pointer", flexShrink:0 }}>Dismiss</button>
                </div>
                <div style={{ fontSize:12, color:S.muted, lineHeight:1.5 }}>No e1RM gain over the last 3 sessions on {deload.stalled.slice(0,5).join(", ")}{deload.stalled.length>5?` and ${deload.stalled.length-5} more`:""}. {DELOAD_ADVICE}</div>
              </div>
            )}

            {review && !review.empty && (
              <WeeklyReviewCard r={review} S={S}
                onDismiss={()=>setReviewDismissed(reviewKey)}
                onOpenHistory={()=>{ setStatsOpen("reviews"); setTab("stats"); }} />
            )}

            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14, display:"flex", justifyContent:"space-around" }}>
              <StreakFlame count={workoutStreak} dateSet={workoutDates} label="Workout" color="#e8614d" size="lg" S={S} />
              <StreakFlame count={wellnessStreak} dateSet={wellnessDates} label="Wellness" color="#48c47a" size="lg" S={S} />
              <StreakFlame count={overallStreak} dateSet={overallDates} label="Overall" color="#e8a84d" size="lg" S={S} />
            </div>

            {/* FEATURE B: muscle activity chips */}
            <MuscleChips history={history} S={S} />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <Stat label="Strength Score" value={strengthScore?fmt(strengthScore):"—"} unit="lb e1RM (S+B+D)" color="#e8614d" />
              <Stat label="Longest Streak" value={longest} unit="days" color="#e8a84d" />
              <Stat label="This Week" value={fmt(weekTonnage)} unit="lb lifted" color="#4d8fe8" />
              <Stat label="Lifetime" value={fmt(lifetimeTonnage)} unit="lb lifted" color="#b48ee8" />
            </div>

            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", marginBottom:6 }}>Today</div>
              <div style={{ fontSize:14, fontStyle:"italic", lineHeight:1.5 }}>"{quote.text}"</div>
              <div style={{ fontSize:11, color:accent, marginTop:8, textAlign:"right" }}>— {quote.source}</div>
            </div>
          </>;
        })()}

        {!isWellness && tab==="calendar" && <CalendarView history={history} recommendFor={recommendFor} resolvePreset={resolvePreset} onPick={(dk)=>{ setActiveDate(dk); const rec=recommendFor(dk); if(resolvePreset(rec)){ ensureSession(dk,rec);} setTab("workout"); }} S={S} />}

        {!isWellness && tab==="workout" && <WorkoutView
          dateKey={activeDate} history={history} resolvePreset={resolvePreset} allPresets={allPresets}
          ensureSession={ensureSession} updateSetLog={updateSetLog} markComplete={markComplete}
          addExerciseToSession={addExerciseToSession} stackPreset={stackPreset}
          removeExercise={removeExercise} swapExercise={swapExercise} changeSetCount={changeSetCount}
          customExercises={customExercises} setCustomExercises={setCustomExercises}
          customPresets={customPresets} saveCustomPreset={saveCustomPreset} deleteCustomPreset={deleteCustomPreset}
          progCfg={progressionCfg(settings)} triggerBurst={triggerBurst} S={S} />}

        {!isWellness && tab==="cardio" && <CardioView runs={runs} setRuns={setRuns} S={S} />}

        {!isWellness && tab==="military" && <MilitaryView pfa={pfa} setPfa={setPfa} pfaCfg={pfaCfg} setPfaCfg={setPfaCfg} S={S} />}

        {!isWellness && tab==="stats" && <StatsView history={history} bestE1RMByLift={bestE1RMByLift} radarData={radarData} strengthScore={strengthScore} lifetimeTonnage={lifetimeTonnage} bodyweight={bodyweight} setBodyweight={setBodyweight} latestBW={latestBW} prRecords={prRecords} allSessions={allSessions} initialTab={statsOpen} getReviews={()=>pastReviews({ history, runs, wellness })} S={S} />}
      </div>

      <FloatingTimer accent={isWellness?"#48c47a":accent} S={S} />
      {milestone && <MilestoneToast milestone={milestone} onDone={()=>setMilestone(null)} S={S} />}
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={()=>setShowSettings(false)} bestE1RMByLift={bestE1RMByLift} history={history} bodyweight={bodyweight} runs={runs} wellness={wellness} wellnessCfg={wellnessCfg} habits={habits} customExercises={customExercises} customPresets={customPresets} prRecords={prRecords} pfa={pfa} pfaCfg={pfaCfg} importData={importData} onReplayIntro={()=>{ setShowSettings(false); setReplayIntro(true); }} S={S} />}

      {!isWellness && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:S.surface, borderTop:`1px solid ${S.border}`, display:"flex", paddingBottom:"env(safe-area-inset-bottom, 0px)", zIndex:100 }}>
          {[["home","Home","🏠"],["calendar","Calendar","📅"],["workout","Workout","💪"],["cardio","Cardio","🏃"],["military","Military","🎖"],["stats","Stats","📊"]].map(([v,l,icon])=>(
            <button key={v} onClick={()=>{ setStatsOpen("charts"); setTab(v); }} style={{ flex:1, padding:"10px 0 12px", background:"transparent", border:"none", color: tab===v?accent:S.muted, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <span style={{ fontSize:17 }}>{icon}</span><span style={{ fontSize:9.5, fontWeight: tab===v?600:400 }}>{l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionPicker({ onPick, S }) {
  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:S.text, display:"flex", flexDirection:"column", justifyContent:"center", padding:"24px", paddingTop:"env(safe-area-inset-top, 24px)" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:11, letterSpacing:4, color:S.muted, textTransform:"uppercase", marginBottom:8 }}>Lift Log</div>
        <div style={{ fontSize:30, fontWeight:700 }}>What are we doing today?</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:420, margin:"0 auto", width:"100%" }}>
        <button onClick={()=>onPick("workout")} style={{ position:"relative", overflow:"hidden", padding:"28px 24px", borderRadius:18, border:"1px solid #e8614d44", background:"linear-gradient(135deg,#e8614d22,#161a1e)", color:S.text, cursor:"pointer", textAlign:"left" }}>
          <EmberField palette="fire" />
          <div style={{ position:"relative" }}><div style={{ fontSize:34, marginBottom:6 }}>💪</div><div style={{ fontSize:22, fontWeight:700, color:"#e8614d" }}>Workout</div><div style={{ fontSize:13, color:S.muted, marginTop:3 }}>Presets, logging, calendar, cardio & stats</div></div>
        </button>
        <button onClick={()=>onPick("wellness")} style={{ position:"relative", overflow:"hidden", padding:"28px 24px", borderRadius:18, border:"1px solid #48c47a44", background:"linear-gradient(135deg,#48c47a22,#161a1e)", color:S.text, cursor:"pointer", textAlign:"left" }}>
          <EmberField palette="cool" />
          <div style={{ position:"relative" }}><div style={{ fontSize:34, marginBottom:6 }}>🌱</div><div style={{ fontSize:22, fontWeight:700, color:"#48c47a" }}>Wellness</div><div style={{ fontSize:13, color:S.muted, marginTop:3 }}>Sleep, hydration, mood, habits & recovery</div></div>
        </button>
      </div>
    </div>
  );
}

const Stat = ({label,value,unit,color}) => (
  <div style={{ background:"#161a1e", border:"1px solid #1e2428", borderRadius:14, padding:"14px 16px" }}>
    <div style={{ fontSize:10, letterSpacing:1, color:"#5a6670", textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color, marginTop:4, lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:11, color:"#3a4550", marginTop:3 }}>{unit}</div>
  </div>
);

function CalendarView({ history, recommendFor, resolvePreset, onPick, S }) {
  const [month, setMonth] = useState(() => { const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const year = month.getFullYear(), mon = month.getMonth();
  const firstDow = new Date(year,mon,1).getDay();
  const daysInMonth = new Date(year,mon+1,0).getDate();
  const cells = []; for (let i=0;i<firstDow;i++) cells.push(null); for (let d=1;d<=daysInMonth;d++) cells.push(d);
  const monthName = month.toLocaleString("default",{month:"long",year:"numeric"});
  const todayK = todayKey();
  const navBtn = { width:40, height:36, background:S.card, border:`1px solid ${S.border}`, borderRadius:10, color:S.text, fontSize:18, cursor:"pointer" };
  return <>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
      <button onClick={()=>setMonth(new Date(year,mon-1,1))} style={navBtn}>‹</button>
      <div style={{ fontSize:16, fontWeight:600 }}>{monthName}</div>
      <button onClick={()=>setMonth(new Date(year,mon+1,1))} style={navBtn}>›</button>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5, marginBottom:8 }}>{["S","M","T","W","T","F","S"].map((d,i)=>(<div key={i} style={{ textAlign:"center", fontSize:10, color:S.dim }}>{d}</div>))}</div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 }}>
      {cells.map((d,i)=>{
        if (d===null) return <div key={i} />;
        const dk = dayKey(new Date(year,mon,d));
        const sess = history[dk]; const isPast = dk < todayK, isToday = dk===todayK;
        const rec = recommendFor(dk); const recColor = resolvePreset(rec)?.color || S.dim; const done = sess?.completed;
        return (
          <button key={i} onClick={()=>onPick(dk)} style={{ aspectRatio:"1", borderRadius:10, cursor:"pointer", padding:2, border:`1px solid ${isToday ? "#e8614d" : done ? recColor : S.border}`, background: done ? recColor+"22" : isToday ? "#e8614d11" : S.card, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
            <div style={{ fontSize:12, fontWeight: isToday?700:400, color: isToday?"#e8614d":S.text }}>{d}</div>
            {done ? <div style={{ width:5, height:5, borderRadius:"50%", background:recColor }} /> : (!isPast && resolvePreset(rec)) ? <div style={{ fontSize:7, color:S.dim }}>{resolvePreset(rec).label.split(" ")[0].slice(0,4)}</div> : <div style={{ height:5 }} />}
          </button>
        );
      })}
    </div>
    <div style={{ marginTop:16, fontSize:11, color:S.muted, lineHeight:1.7 }}>Tap any day to start or review that session. Future days show your recommended preset.</div>
  </>;
}

function WorkoutView({ dateKey, history, resolvePreset, allPresets, ensureSession, updateSetLog, markComplete, addExerciseToSession, stackPreset, removeExercise, swapExercise, changeSetCount, customExercises, setCustomExercises, customPresets, saveCustomPreset, deleteCustomPreset, progCfg, triggerBurst, S }) {
  const [picking, setPicking] = useState(!history[dateKey]?.presetId);
  const [editMode, setEditMode] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [builder, setBuilder] = useState(null); // null | {id?} for create/edit
  const sess = history[dateKey];
  const preset = sess?.presetId ? resolvePreset(sess.presetId) : null;
  const exercises = sess?.exercises || [];
  // fallback color/label if preset was deleted
  const accent = preset?.color || "#e8614d";
  const presetLabel = preset?.label || (sess?.presetId ? "Custom (deleted)" : "");
  const presetSubtitle = preset?.subtitle || "";
  const isToday = dateKey === todayKey();
  const dObj = parseKey(dateKey);
  const dateLabel = isToday ? "Today" : dObj.toLocaleDateString("default",{weekday:"long",month:"short",day:"numeric"});
  const inp = { background:S.bg, border:`1px solid ${S.border}`, borderRadius:7, color:S.text, padding:"6px 8px", fontSize:13, width:"100%" };

  if (builder !== null) {
    const editing = builder.id ? customPresets[builder.id] : null;
    return <CustomPresetBuilder
      initial={editing} customExercises={customExercises} setCustomExercises={setCustomExercises}
      onSave={(p)=>{ saveCustomPreset(p, builder.id); setBuilder(null); }}
      onCancel={()=>setBuilder(null)}
      onDelete={builder.id ? ()=>{ deleteCustomPreset(builder.id); setBuilder(null); } : null}
      S={S} />;
  }

  if (picking || !preset) {
    const splits = Object.entries(allPresets).filter(([,p])=>p.category==="split");
    const bodyparts = Object.entries(allPresets).filter(([,p])=>p.category==="bodypart");
    const mine = Object.entries(customPresets);
    return <>
      {pickerMode && (<ExercisePicker title="Add exercise" customExercises={customExercises} setCustomExercises={setCustomExercises} onClose={()=>setPickerMode(null)} onSelect={(ex)=>{ addExerciseToSession(dateKey, ex); setPickerMode(null); }} />)}
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>Pick a workout for {isToday?"today":dateLabel}.</div>
      {mine.length>0 && <PresetGroup title="My Splits" items={mine} onPick={(id)=>{ ensureSession(dateKey,id); setPicking(false); }} onEdit={(id)=>setBuilder({id})} S={S} />}
      <button onClick={()=>setBuilder({})} style={{ width:"100%", padding:"12px", background:"transparent", color:"#e8614d", border:"1px dashed #e8614d66", borderRadius:12, fontSize:14, cursor:"pointer", marginBottom:18 }}>+ Create custom split</button>
      <PresetGroup title="Full Splits" items={splits} onPick={(id)=>{ ensureSession(dateKey,id); setPicking(false); }} S={S} />
      <PresetGroup title="By Body Part" items={bodyparts} onPick={(id)=>{ ensureSession(dateKey,id); setPicking(false); }} S={S} />
    </>;
  }

  return <>
    {pickerMode && (<ExercisePicker title={pickerMode.mode==="swap" ? "Swap exercise" : "Add exercise"} customExercises={customExercises} setCustomExercises={setCustomExercises} onClose={()=>setPickerMode(null)} onSelect={(ex)=>{ if (pickerMode.mode==="swap") swapExercise(dateKey, pickerMode.exIdx, ex); else addExerciseToSession(dateKey, ex); setPickerMode(null); }} />)}

    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <div>
        <div style={{ fontSize:11, color:S.muted }}>{dateLabel}</div>
        <div style={{ fontSize:22, fontWeight:700, color:accent }}>{presetLabel}{sess.stackedFrom?.length>0 && <span style={{ fontSize:12, color:S.muted, fontWeight:400 }}> +{sess.stackedFrom.length}</span>}</div>
        <div style={{ fontSize:11, color:S.muted }}>{sess.stackedFrom?.length>0 ? `Stacked: ${[presetLabel, ...sess.stackedFrom.map(id=>resolvePreset(id)?.label||"?")].join(" + ")}` : presetSubtitle}</div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={()=>setEditMode(e=>!e)} style={{ padding:"7px 11px", fontSize:12, background: editMode?accent:S.card, border:`1px solid ${editMode?accent:S.border}`, borderRadius:10, color: editMode?"#fff":S.muted, cursor:"pointer" }}>{editMode?"Done":"Edit"}</button>
        <button onClick={()=>setPicking(true)} style={{ padding:"7px 11px", fontSize:12, background:S.card, border:`1px solid ${S.border}`, borderRadius:10, color:S.muted, cursor:"pointer" }}>Change</button>
      </div>
    </div>

    <button onClick={()=>setStackOpen(o=>!o)} style={{ width:"100%", padding:"10px", background:"transparent", color:S.muted, border:`1px dashed ${S.border}`, borderRadius:10, fontSize:13, cursor:"pointer", marginBottom: stackOpen?10:14 }}>{stackOpen ? "Close" : "⊕ Stack another preset onto this day"}</button>
    {stackOpen && (
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontSize:11, color:S.muted, marginBottom:10 }}>Merges its exercises in (duplicates skipped).</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{Object.entries(allPresets).filter(([id])=>id!==sess.presetId && !(sess.stackedFrom||[]).includes(id)).map(([id,p])=>(<button key={id} onClick={()=>{ stackPreset(dateKey,id); setStackOpen(false); }} style={{ padding:"6px 11px", fontSize:11, borderRadius:20, border:`1px solid ${p.color}44`, background:`${p.color}12`, color:p.color, cursor:"pointer" }}>+ {p.label}</button>))}</div>
      </div>
    )}

    <div style={{ background:S.card, border:`1px solid ${accent}30`, borderRadius:14, overflow:"hidden", marginBottom:12 }}>
      {exercises.map((ex,ei)=>{
        const numSets = parseInt(ex.sets)||1;
        const hist = lastTimeFor(history, ex.name, dateKey);
        const prevSets = hist.recent?.sets || {};
        const bestRec = hist.best;
        const target = computeTarget(history, ex, dateKey, { customExercises, cfg: progCfg });
        const tColor = target ? ({ increase:"#48c47a", reps:"#4d8fe8", hold:"#e8a84d", load:"#b48ee8" }[target.action] || S.muted) : null;
        const tTag = target ? ({ increase:"↑ Weight up", reps:"+ Rep", hold:"Hold", load:"Add load" }[target.action]) : null;
        return (
          <div key={ei} style={{ borderBottom: ei<exercises.length-1?`1px solid ${S.border}`:"none", padding:"14px 16px", position:"relative" }}>
            {ex.main && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:accent, borderRadius:"0 2px 2px 0" }} />}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>{ex.name}</span>
                  {ex.main && <span style={{ fontSize:9, color:accent, border:`1px solid ${accent}44`, borderRadius:4, padding:"1px 5px" }}>MAIN</span>}
                  {(ex.parts||[]).map(p=>(<span key={p} style={{ fontSize:9, color:BODY_PART_COLORS[p], border:`1px solid ${(BODY_PART_COLORS[p]||"#888")}44`, borderRadius:4, padding:"1px 5px" }}>{p}</span>))}
                </div>
                <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>{ex.note}</div>
                {(hist.recent || bestRec) && (
                  <div style={{ fontSize:10, marginTop:3, display:"flex", gap:10, flexWrap:"wrap" }}>
                    {hist.recent && (()=>{ const ss=Object.values(prevSets).filter(x=>x.weight); if(!ss.length) return null;
                      const top=ss.reduce((mx,x)=>(parseFloat(x.weight)||0)>(parseFloat(mx.weight)||0)?x:mx, ss[0]);
                      return <span style={{ color:S.dim }}>Last: <span style={{ color:S.muted }}>{top.weight}lb × {top.reps}</span> <span style={{ opacity:0.6 }}>({parseKey(hist.recent.date).toLocaleDateString("default",{month:"short",day:"numeric"})})</span></span>; })()}
                    {bestRec && <span style={{ color:S.dim }}>Best: <span style={{ color:"#e8a84d" }}>{bestRec.weight}lb × {bestRec.reps}</span></span>}
                  </div>
                )}
                {target && !editMode && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 9px", borderRadius:20, border:`1px solid ${tColor}66`, background:`${tColor}18` }}>
                      <span style={{ fontSize:11, fontWeight:700, color:tColor }}>🎯 {target.weight != null ? `${target.weight} × ${target.reps}` : `${target.reps} reps`}</span>
                      <span style={{ fontSize:9, color:tColor, opacity:0.85, textTransform:"uppercase", letterSpacing:0.5 }}>{tTag}</span>
                    </div>
                    <div style={{ fontSize:10, color:S.dim, marginTop:3, lineHeight:1.35 }}>{target.reason}</div>
                  </div>
                )}
              </div>
              {editMode ? (
                <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:8 }}>
                  <button onClick={()=>setPickerMode({mode:"swap", exIdx:ei})} style={{ padding:"4px 8px", fontSize:11, background:"transparent", color:S.muted, border:`1px solid ${S.border}`, borderRadius:6, cursor:"pointer" }}>Swap</button>
                  <button onClick={()=>removeExercise(dateKey,ei)} style={{ padding:"4px 8px", fontSize:11, background:"transparent", color:"#e05555", border:"1px solid #e0555544", borderRadius:6, cursor:"pointer" }}>✕</button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, marginLeft:8 }}>
                  <button onClick={()=>changeSetCount(dateKey,ei,-1)} aria-label="Fewer sets" style={{ width:24, height:24, borderRadius:6, background:S.bg, border:`1px solid ${S.border}`, color:S.muted, fontSize:14, cursor:"pointer", lineHeight:1, padding:0 }}>−</button>
                  <div style={{ fontSize:11, color:accent, background:`${accent}15`, padding:"2px 8px", borderRadius:6 }}>{ex.sets}×{ex.reps}</div>
                  <button onClick={()=>changeSetCount(dateKey,ei,1)} aria-label="More sets" style={{ width:24, height:24, borderRadius:6, background:S.bg, border:`1px solid ${S.border}`, color:S.muted, fontSize:14, cursor:"pointer", lineHeight:1, padding:0 }}>+</button>
                </div>
              )}
            </div>
            {!editMode && (
            <div style={{ display:"grid", gridTemplateColumns:"20px 1fr 1fr 44px 58px", gap:"4px 5px", alignItems:"center", marginTop:8 }}>
              {["#","Weight","Reps","RPE","Last"].map(h=>(<div key={h} style={{ fontSize:10, color:S.dim }}>{h}</div>))}
              {Array.from({length:numSets}).map((_,si)=>{
                const saved = sess.logs?.[ei]?.[si]||{};
                const prev = prevSets[si];
                const cmp = compareSet(saved, prev);
                const isPR = bestRec && saved.weight && saved.reps && epley1RM(saved.weight,saved.reps) > bestRec.e1rm;
                const ghostW = target && target.weight != null ? String(target.weight) : (prev?.weight != null && prev.weight !== "" ? String(prev.weight) : "lb");
                const ghostR = target ? String(target.reps) : (prev?.reps != null && prev.reps !== "" ? String(prev.reps) : "0");
                const prBorder = isPR ? { borderColor:"#e8a84d", boxShadow:"0 0 0 1px #e8a84d55" } : {};
                const sr = parseFloat(saved.reps), sw = parseFloat(saved.weight);
                const hitTarget = !!target && sr > 0 && sr >= target.reps && (target.weight == null || sw >= target.weight);
                return [
                <div key={`n${si}`} style={{ fontSize:12, color:S.muted, textAlign:"center" }}>{si+1}</div>,
                <input key={`w${si}`} type="number" inputMode="decimal" placeholder={ghostW} value={saved.weight ?? ""} onChange={e=>updateSetLog(dateKey,ei,si,"weight",e.target.value===""?"":parseFloat(e.target.value))} style={{ ...inp, ...prBorder }} />,
                <input key={`r${si}`} type="number" inputMode="decimal" placeholder={ghostR} value={saved.reps ?? ""} onChange={e=>updateSetLog(dateKey,ei,si,"reps",e.target.value===""?"":parseFloat(e.target.value))} style={{ ...inp, ...prBorder }} />,
                <input key={`p${si}`} type="number" inputMode="decimal" placeholder="–" min="1" max="10" value={saved.rpe ?? ""} onChange={e=>updateSetLog(dateKey,ei,si,"rpe",e.target.value===""?"":parseFloat(e.target.value))} style={inp} />,
                <div key={`c${si}`} style={{ fontSize:10, textAlign:"right", lineHeight:1.2 }}>
                  {isPR ? <span style={{ color:"#e8a84d", fontWeight:700 }}>★ PR</span>
                   : hitTarget ? <span style={{ color:"#48c47a", fontWeight:700 }}>✓ target</span>
                   : prev ? (
                     <span style={{ color: cmp==="up" ? "#48c47a" : cmp==="down" ? "#e05555" : S.dim }}>
                       {cmp==="up" ? "▲ " : cmp==="down" ? "▼ " : ""}
                       <span style={{ opacity:0.75 }}>{prev.weight ?? "–"}×{prev.reps ?? "–"}</span>
                     </span>
                   ) : <span style={{ color:S.dim, opacity:0.5 }}>—</span>}
                </div>,
              ]; })}
            </div>
            )}
          </div>
        );
      })}
    </div>

    <button onClick={()=>setPickerMode({mode:"add"})} style={{ width:"100%", padding:"11px", background:"transparent", color:accent, border:`1px dashed ${accent}66`, borderRadius:12, fontSize:14, cursor:"pointer", marginBottom:12 }}>+ Add exercise</button>
    <button onClick={()=>{ markComplete(dateKey, !sess.completed); if(!sess.completed) triggerBurst(); }} style={{ width:"100%", padding:"14px", background: sess.completed ? "#48c47a22" : accent, color: sess.completed ? "#48c47a" : "#fff", border: sess.completed?"1px solid #48c47a55":"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>{sess.completed ? "✓ Completed — tap to unmark" : "Mark session complete"}</button>
  </>;
}

const PresetGroup = ({title, items, onPick, onEdit, S}) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", marginBottom:8 }}>{title}</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {items.map(([id,p])=>(
        <div key={id} style={{ position:"relative" }}>
          <button onClick={()=>onPick(id)} style={{ width:"100%", textAlign:"left", padding:"12px 14px", background:`linear-gradient(135deg, ${p.color}18, ${S.card})`, border:`1px solid ${p.color}33`, borderRadius:12, cursor:"pointer", color:S.text }}>
            <div style={{ fontSize:15, fontWeight:600, color:p.color }}>{p.label}</div>
            <div style={{ fontSize:10, color:S.muted, marginTop:2 }}>{p.subtitle}</div>
          </button>
          {onEdit && (<button onClick={()=>onEdit(id)} aria-label="Edit split" style={{ position:"absolute", top:6, right:6, width:24, height:24, borderRadius:6, background:"rgba(0,0,0,0.3)", border:`1px solid ${S.border}`, color:S.muted, fontSize:11, cursor:"pointer", padding:0 }}>✎</button>)}
        </div>
      ))}
    </div>
  </div>
);

function StatsView({ history, bestE1RMByLift, radarData, strengthScore, lifetimeTonnage, bodyweight, setBodyweight, latestBW, prRecords, allSessions, initialTab, getReviews, S }) {
  const [bwInput, setBwInput] = useState("");
  const [statsTab, setStatsTab] = useState(initialTab || "charts");
  const lifts = Object.entries(bestE1RMByLift).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const [selLift, setSelLift] = useState(lifts[0]?.[0] || null);
  const inp = { background:S.bg, border:`1px solid ${S.border}`, borderRadius:7, color:S.text, padding:"6px 8px", fontSize:13, width:"100%" };
  const liftSeries = (() => { if (!selLift) return []; const pts=[]; Object.entries(history).filter(([,v])=>v?.completed).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([k,sess])=>{ const idx=(sess.exercises||[]).findIndex(e=>e.name===selLift); if(idx<0) return; let best=0; Object.values(sess.logs?.[idx]||{}).forEach(s=>{ best=Math.max(best, epley1RM(s.weight,s.reps)); }); if(best>0) pts.push({ date:k.slice(5), e1rm:best }); }); return pts; })();
  const bwSeries = [...bodyweight].sort((a,b)=>a.date.localeCompare(b.date)).map(b=>({ date:b.date.slice(5), lbs:b.lbs }));
  return <>
    <div style={{ display:"flex", gap:6, marginBottom:14 }}>
      {[["charts","Charts"],["badges","Badges"],["reviews","Reviews"]].map(([v,l])=>(<button key={v} onClick={()=>setStatsTab(v)} style={{ flex:1, padding:"8px 0", fontSize:13, borderRadius:10, border:`1px solid ${statsTab===v?"#e8614d":S.border}`, background:statsTab===v?"#e8614d":S.card, color:statsTab===v?"#fff":S.muted, cursor:"pointer", fontWeight:statsTab===v?600:400 }}>{l}</button>))}
    </div>
    {statsTab==="reviews" && <ReviewHistory reviews={getReviews()} S={S} />}
    {statsTab==="badges" && <BadgesPanel bestE1RMByLift={bestE1RMByLift} bodyweightLbs={latestBW} prRecords={prRecords} S={S} />}
    {statsTab==="charts" && <>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px 12px", marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:4, paddingLeft:4 }}>Estimated 1RM over time</div>
        {lifts.length===0 ? <div style={{ color:S.muted, fontSize:13, padding:"1rem" }}>Log some sets to see your strength curves.</div> : <>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, margin:"8px 4px 12px" }}>{lifts.map(([name])=>(<button key={name} onClick={()=>setSelLift(name)} style={{ padding:"5px 11px", fontSize:11, borderRadius:20, border:`1px solid ${selLift===name?"#e8614d":S.border}`, background:selLift===name?"#e8614d22":"transparent", color:selLift===name?"#e8614d":S.muted, cursor:"pointer" }}>{name}</button>))}</div>
          {liftSeries.length<2 ? <div style={{ color:S.muted, fontSize:12, padding:"0 4px 8px" }}>Need 2+ logged days for {selLift} to chart.</div> :
          <ResponsiveContainer width="100%" height={170}><LineChart data={liftSeries} margin={{top:4,right:10,bottom:0,left:-18}}><CartesianGrid strokeDasharray="3 3" stroke={S.border} /><XAxis dataKey="date" tick={{fontSize:10,fill:S.muted}} /><YAxis tick={{fontSize:10,fill:S.muted}} /><Tooltip contentStyle={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}} /><Line type="monotone" dataKey="e1rm" stroke="#e8614d" strokeWidth={2} dot={{r:3,fill:"#e8614d"}} name="Est. 1RM (lb)" /></LineChart></ResponsiveContainer>}
        </>}
      </div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px 12px", marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:2, paddingLeft:4 }}>Muscle group balance</div>
        <div style={{ fontSize:11, color:S.muted, paddingLeft:4, marginBottom:6 }}>Sets per group, last 14 days</div>
        <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData} outerRadius="72%"><PolarGrid stroke={S.border} /><PolarAngleAxis dataKey="part" tick={{fontSize:11,fill:S.muted}} /><Radar dataKey="sets" stroke="#4d8fe8" fill="#4d8fe8" fillOpacity={0.4} /></RadarChart></ResponsiveContainer>
      </div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px", marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>Total tonnage</div>
        <Row label="Lifetime" value={`${fmt(lifetimeTonnage)} lb`} S={S} />
        <Row label="Sessions logged" value={allSessions.length} S={S} />
        <Row label="Avg / session" value={allSessions.length?`${fmt(lifetimeTonnage/allSessions.length)} lb`:"—"} S={S} last />
      </div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px 12px" }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:8, paddingLeft:4 }}>Bodyweight</div>
        <div style={{ display:"flex", gap:8, padding:"0 4px 12px" }}>
          <input type="number" inputMode="decimal" placeholder="Today's weight (lb)" value={bwInput} onChange={e=>setBwInput(e.target.value)} style={{ ...inp, flex:1, padding:"9px 10px", fontSize:14 }} />
          <button onClick={()=>{ const v=parseFloat(bwInput); if(!v)return; setBodyweight(prev=>{ const today=todayKey(); return [...prev.filter(b=>b.date!==today),{date:today,lbs:v}]; }); setBwInput(""); }} style={{ padding:"9px 16px", background:"#b48ee8", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>Log</button>
        </div>
        {bwSeries.length<2 ? <div style={{ color:S.muted, fontSize:12, padding:"0 4px 4px" }}>Log your weight on 2+ days to see the trend. (Also unlocks strength tiers.)</div> :
        <ResponsiveContainer width="100%" height={170}><LineChart data={bwSeries} margin={{top:4,right:10,bottom:0,left:-18}}><CartesianGrid strokeDasharray="3 3" stroke={S.border} /><XAxis dataKey="date" tick={{fontSize:10,fill:S.muted}} /><YAxis domain={['auto','auto']} tick={{fontSize:10,fill:S.muted}} /><Tooltip contentStyle={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}} /><Line type="monotone" dataKey="lbs" stroke="#b48ee8" strokeWidth={2} dot={{r:3,fill:"#b48ee8"}} name="Bodyweight (lb)" /></LineChart></ResponsiveContainer>}
      </div>
    </>}
  </>;
}
const Row = ({label,value,S,last}) => (
  <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: last?"none":`1px solid ${S.border}` }}>
    <span style={{ fontSize:13, color:S.muted }}>{label}</span><span style={{ fontSize:14, fontWeight:600 }}>{value}</span>
  </div>
);

function SettingsModal({ settings, setSettings, onClose, bestE1RMByLift, history, bodyweight, runs, wellness, wellnessCfg, habits, customExercises, customPresets, prRecords, pfa, pfaCfg, importData, onReplayIntro, S }) {
  const liftNames = Object.keys(STRENGTH_STANDARDS);
  const allLiftNames = [...new Set([...liftNames, ...Object.keys(bestE1RMByLift)])];
  const [importMsg, setImportMsg] = useState(null);
  const exportData = () => {
    const payload = { version:5, exportedAt:new Date().toISOString(), history, bodyweight, runs, wellness, wellnessCfg, habits, customExercises, customPresets, prRecords, pfa, pfaCfg, settings };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`liftlog-backup-${todayKey()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = (file) => { const reader=new FileReader(); reader.onload=()=>{ try { importData(JSON.parse(reader.result)); setImportMsg({ ok:true, text:"Imported successfully. Your data has been replaced." }); } catch { setImportMsg({ ok:false, text:"Couldn't read that file. Make sure it's a Lift Log backup .json." }); } }; reader.readAsText(file); };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, display:"flex", alignItems:"flex-end" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:S.surface, borderRadius:"18px 18px 0 0", width:"100%", maxWidth:540, margin:"0 auto", padding:"20px 18px calc(28px + env(safe-area-inset-bottom,0px))", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:18, fontWeight:700 }}>Settings</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:S.muted, fontSize:22, cursor:"pointer" }}>✕</button>
        </div>
        <Section title="Recommendation rotation" S={S}>
          <div style={{ display:"flex", gap:8, marginBottom:6 }}>{[["weekly","Weekly pattern"],["cycle","Simple cycle"]].map(([mm,l])=>(<button key={mm} onClick={()=>setSettings(p=>({...p,rotationMode:mm}))} style={{ flex:1, padding:"9px 0", fontSize:12, borderRadius:9, border:`1px solid ${settings.rotationMode===mm?"#e8614d":S.border}`, background:settings.rotationMode===mm?"#e8614d22":"transparent", color:settings.rotationMode===mm?"#e8614d":S.muted, cursor:"pointer" }}>{l}</button>))}</div>
        </Section>
        <Section title="Strength Score lifts" S={S}>
          {["squat","bench","deadlift"].map(slot=>(<div key={slot} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}><span style={{ fontSize:13, color:S.muted, textTransform:"capitalize" }}>{slot}</span><select value={settings.bigThree[slot]} onChange={e=>setSettings(p=>({...p,bigThree:{...p.bigThree,[slot]:e.target.value}}))} style={{ background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, color:S.text, padding:"7px 10px", fontSize:13, maxWidth:200 }}>{[...new Set([settings.bigThree[slot], ...allLiftNames])].map(n=>(<option key={n} value={n}>{n}</option>))}</select></div>))}
        </Section>
        <Section title="Progression targets" S={S}>
          {(() => { const pc = { ...DEFAULT_PROGRESSION, ...(settings.progression||{}) };
            const setPc = (patch) => setSettings(p=>({ ...p, progression:{ ...DEFAULT_PROGRESSION, ...(p.progression||{}), ...patch } }));
            const num = (v) => v===""?"":(parseFloat(v)||"");
            const row = { display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13, color:S.muted, marginBottom:10 };
            const box = { background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, color:S.text, padding:"7px 10px", fontSize:13, width:80, textAlign:"right" };
            return <>
              <label style={row}>Barbell / Smith / machine jump (lb)<input type="number" inputMode="decimal" value={pc.barbellJump} onChange={e=>setPc({barbellJump:num(e.target.value)})} style={box} /></label>
              <label style={row}>Dumbbell jump (lb)<input type="number" inputMode="decimal" value={pc.dumbbellJump} onChange={e=>setPc({dumbbellJump:num(e.target.value)})} style={box} /></label>
              <label style={row}>Max RPE to earn a jump
                <select value={pc.rpeCap} onChange={e=>setPc({rpeCap:parseFloat(e.target.value)})} style={box}>{[7,7.5,8,8.5,9].map(v=>(<option key={v} value={v}>{v}</option>))}</select>
              </label>
              <label style={row}>Snap dumbbells to Bowflex weights<input type="checkbox" checked={!!pc.snapBowflex} onChange={e=>setPc({snapBowflex:e.target.checked})} style={{ width:18, height:18 }} /></label>
              <div style={{ fontSize:11, color:S.dim, lineHeight:1.5 }}>Double progression: hit the top of the rep range on every set (at or under the RPE cap) and the next target adds weight. Otherwise it holds the weight and adds reps.</div>
            </>; })()}
        </Section>
        <Section title="Startup" S={S}>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13, color:S.muted, marginBottom:12 }}>Remember last section (skip picker)<input type="checkbox" checked={settings.rememberSection} onChange={e=>setSettings(p=>({...p,rememberSection:e.target.checked}))} style={{ width:18, height:18 }} /></label>
          <button onClick={onReplayIntro} style={{ width:"100%", padding:"11px", background:S.card, border:`1px solid ${S.border}`, borderRadius:10, color:S.text, fontSize:14, cursor:"pointer" }}>▶ Replay intro</button>
        </Section>
        <Section title="Backup & Transfer" S={S}>
          <button onClick={exportData} style={{ width:"100%", padding:"11px", background:S.card, border:`1px solid ${S.border}`, borderRadius:10, color:S.text, fontSize:14, cursor:"pointer", marginBottom:8 }}>⬇ Export all data (.json)</button>
          <label style={{ display:"block", width:"100%", padding:"11px", background:S.card, border:`1px dashed ${S.border}`, borderRadius:10, color:S.text, fontSize:14, cursor:"pointer", textAlign:"center" }}>⬆ Import from backup file<input type="file" accept="application/json,.json" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImport(f); }} style={{ display:"none" }} /></label>
          {importMsg && (<div style={{ fontSize:12, marginTop:8, padding:"8px 10px", borderRadius:8, background: importMsg.ok?"#48c47a18":"#e0555518", color: importMsg.ok?"#48c47a":"#e05555" }}>{importMsg.text}</div>)}
          <div style={{ fontSize:11, color:S.muted, marginTop:8, lineHeight:1.5 }}>Export saves everything — workouts, runs, wellness, custom exercises, custom splits, PRs, settings. <b>Importing replaces all current data.</b></div>
        </Section>
      </div>
    </div>
  );
}
const Section = ({title,children,S}) => (<div style={{ marginBottom:22 }}><div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", marginBottom:10 }}>{title}</div>{children}</div>);
