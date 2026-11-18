import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WELLNESS_DEFAULTS, HABIT_DEFAULTS, WELLNESS_TIPS } from "./data";
import { todayKey, streakFromDates, sleepHoursBetween } from "./lib";

const inp = (S) => ({ background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, color:S.text, padding:"8px 10px", fontSize:14, width:"100%" });

export function WellnessView({ wellness, setWellness, wellnessCfg, setWellnessCfg, habits, setHabits, onLog, S }) {
  const [date, setDate] = useState(todayKey());
  const [sub, setSub] = useState("today");
  const today = wellness[date] || { fields:{}, habits:{}, notes:"" };
  const setField = (id, val) => { setWellness(prev => ({ ...prev, [date]: { ...(prev[date]||{fields:{},habits:{},notes:""}), fields: { ...(prev[date]?.fields||{}), [id]: val } } })); if (onLog) onLog(); };
  const toggleHabit = (id) => { setWellness(prev => { const day=prev[date]||{fields:{},habits:{},notes:""}; return { ...prev, [date]: { ...day, habits: { ...day.habits, [id]: !day.habits?.[id] } } }; }); if (onLog) onLog(); };
  const setNotes = (val) => { setWellness(prev => ({ ...prev, [date]: { ...(prev[date]||{fields:{},habits:{}}), notes: val } })); };
  const autoSleep = (() => { const h=sleepHoursBetween(today.fields?.bedtime, today.fields?.waketime); return h==null ? null : h.toFixed(1); })();
  const loggedDates = {}; Object.entries(wellness).forEach(([k,v])=>{ const hasField=v.fields&&Object.values(v.fields).some(x=>x!==""&&x!=null&&x!==false); const hasHabit=v.habits&&Object.values(v.habits).some(Boolean); if(hasField||hasHabit) loggedDates[k]=true; });
  const overallStreak = streakFromDates(loggedDates);
  const allHabits = [...HABIT_DEFAULTS, ...habits];
  const trackedFields = [...WELLNESS_DEFAULTS, ...wellnessCfg].filter(f=>f.track && (f.type==="number"||f.type==="rating"));

  return <>
    <div style={{ display:"flex", gap:6, marginBottom:14 }}>
      {[["today","Daily Log"],["trends","Trends"],["manage","Habits"]].map(([v,l])=>(<button key={v} onClick={()=>setSub(v)} style={{ flex:1, padding:"8px 0", fontSize:13, borderRadius:10, border:`1px solid ${sub===v?"#48c47a":S.border}`, background:sub===v?"#48c47a":S.card, color:sub===v?"#fff":S.muted, cursor:"pointer", fontWeight:sub===v?600:400 }}>{l}</button>))}
    </div>
    {sub==="today" && <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp(S), width:"auto", fontSize:13 }} />
        <div style={{ fontSize:12, color:"#48c47a", fontWeight:600 }}>🔥 {overallStreak} day streak</div>
      </div>
      <div style={{ background:`linear-gradient(135deg,#48c47a18,${S.card})`, border:`1px solid #48c47a33`, borderRadius:12, padding:"12px 14px", marginBottom:14, fontSize:13, color:S.text, fontStyle:"italic" }}>{WELLNESS_TIPS[new Date(date).getDate() % WELLNESS_TIPS.length]}</div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"6px 0", marginBottom:14 }}>
        {[...WELLNESS_DEFAULTS, ...wellnessCfg].map(f=>{ const val=today.fields?.[f.id]??""; return (
          <div key={f.id} style={{ padding:"11px 16px", borderBottom:`1px solid ${S.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, flex:"0 0 auto" }}><span style={{ fontSize:17 }}>{f.icon}</span><span style={{ fontSize:13 }}>{f.label}</span></div>
            <div style={{ flex:"1 1 auto", maxWidth:170 }}>
              {f.type==="number" && (<div style={{ position:"relative" }}><input type="number" inputMode="decimal" placeholder={f.id==="sleepHours"&&autoSleep?autoSleep:"0"} value={val} onChange={e=>setField(f.id,e.target.value)} style={{ ...inp(S), textAlign:"right", paddingRight: f.unit?42:10 }} />{f.unit && <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:S.dim }}>{f.unit}</span>}</div>)}
              {f.type==="rating" && (<div style={{ display:"flex", gap:3, justifyContent:"flex-end" }}>{[2,4,6,8,10].map(n=>(<button key={n} onClick={()=>setField(f.id, val===n?"":n)} style={{ width:26, height:26, borderRadius:7, border:`1px solid ${val>=n?"#48c47a":S.border}`, background:val>=n?"#48c47a":"transparent", color:val>=n?"#fff":S.dim, fontSize:11, cursor:"pointer", padding:0 }}>{n}</button>))}</div>)}
              {f.type==="bool" && (<div style={{ display:"flex", justifyContent:"flex-end" }}><button onClick={()=>setField(f.id, !val)} style={{ width:50, height:28, borderRadius:14, border:"none", background: val?"#48c47a":S.border, position:"relative", cursor:"pointer" }}><span style={{ position:"absolute", top:3, left: val?25:3, width:22, height:22, borderRadius:"50%", background:"#fff", transition:"left .15s" }} /></button></div>)}
              {f.type==="text" && (<input placeholder="…" value={val} onChange={e=>setField(f.id,e.target.value)} style={{ ...inp(S), textAlign:"right" }} />)}
              {f.type==="time" && (<input type="time" value={val} onChange={e=>setField(f.id,e.target.value)} style={{ ...inp(S), textAlign:"right" }} />)}
            </div>
          </div>
        ); })}
        {autoSleep && (<div style={{ padding:"8px 16px", fontSize:11, color:"#48c47a" }}>Auto from bed/wake: {autoSleep} hrs sleep</div>)}
      </div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Daily habits</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{allHabits.map(h=>{ const done=today.habits?.[h.id]; return (<button key={h.id} onClick={()=>toggleHabit(h.id)} style={{ padding:"8px 13px", fontSize:13, borderRadius:20, border:`1px solid ${done?"#48c47a":S.border}`, background:done?"#48c47a22":"transparent", color:done?"#48c47a":S.muted, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><span>{h.icon}</span>{h.label}{done?" ✓":""}</button>); })}</div>
      </div>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px" }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Daily notes</div>
        <textarea rows={3} placeholder="How did today feel?" value={today.notes||""} onChange={e=>setNotes(e.target.value)} style={{ ...inp(S), resize:"vertical", lineHeight:1.5 }} />
      </div>
    </>}
    {sub==="trends" && <>
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Streaks</div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${S.border}` }}><span style={{ fontSize:13, color:S.muted }}>Overall (any log)</span><span style={{ fontSize:14, fontWeight:700, color:"#48c47a" }}>🔥 {overallStreak}</span></div>
        {allHabits.map(h=>{ const dates={}; Object.entries(wellness).forEach(([k,v])=>{ if(v.habits?.[h.id]) dates[k]=true; }); const st=streakFromDates(dates); return (<div key={h.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${S.border}` }}><span style={{ fontSize:13, color:S.muted }}>{h.icon} {h.label}</span><span style={{ fontSize:14, fontWeight:600, color: st>0?"#48c47a":S.dim }}>{st} day{st!==1?"s":""}</span></div>); })}
      </div>
      {trackedFields.map(f=>{ const data=Object.entries(wellness).filter(([,v])=>v.fields?.[f.id]!==""&&v.fields?.[f.id]!=null).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({ date:k.slice(5), val:parseFloat(v.fields[f.id])||0 })); if(data.length<2) return null; return (
        <div key={f.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 10px", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, paddingLeft:6, marginBottom:8 }}>{f.icon} {f.label}{f.unit?` (${f.unit})`:""}</div>
          <ResponsiveContainer width="100%" height={150}><LineChart data={data} margin={{top:4,right:10,bottom:0,left:-18}}><CartesianGrid strokeDasharray="3 3" stroke={S.border} /><XAxis dataKey="date" tick={{fontSize:10,fill:S.muted}} /><YAxis tick={{fontSize:10,fill:S.muted}} /><Tooltip contentStyle={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}} /><Line type="monotone" dataKey="val" stroke="#48c47a" strokeWidth={2} dot={{r:3,fill:"#48c47a"}} name={f.label} /></LineChart></ResponsiveContainer>
        </div>
      ); })}
    </>}
    {sub==="manage" && <ManageHabits wellnessCfg={wellnessCfg} setWellnessCfg={setWellnessCfg} habits={habits} setHabits={setHabits} S={S} />}
  </>;
}

function ManageHabits({ wellnessCfg, setWellnessCfg, habits, setHabits, S }) {
  const [habitLabel, setHabitLabel] = useState(""); const [habitIcon, setHabitIcon] = useState("✅");
  const [fieldLabel, setFieldLabel] = useState(""); const [fieldType, setFieldType] = useState("rating");
  return <>
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
      <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Add a custom habit</div>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <input placeholder="Icon" value={habitIcon} onChange={e=>setHabitIcon(e.target.value.slice(0,2))} style={{ ...inp(S), width:56, textAlign:"center" }} />
        <input placeholder="Habit name (e.g. Cold shower)" value={habitLabel} onChange={e=>setHabitLabel(e.target.value)} style={inp(S)} />
      </div>
      <button onClick={()=>{ if(!habitLabel.trim())return; setHabits(prev=>[...prev,{id:"h_"+Date.now(),label:habitLabel.trim(),icon:habitIcon||"✅"}]); setHabitLabel(""); setHabitIcon("✅"); }} style={{ width:"100%", padding:"10px", background:"#48c47a", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>+ Add habit</button>
    </div>
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
      <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Add a custom tracking field</div>
      <input placeholder="Field name (e.g. Caffeine mg)" value={fieldLabel} onChange={e=>setFieldLabel(e.target.value)} style={{ ...inp(S), marginBottom:8 }} />
      <select value={fieldType} onChange={e=>setFieldType(e.target.value)} style={{ ...inp(S), marginBottom:8 }}>
        <option value="rating">Rating (1–10)</option><option value="number">Number</option><option value="bool">Yes / No</option><option value="text">Text note</option>
      </select>
      <button onClick={()=>{ if(!fieldLabel.trim())return; setWellnessCfg(prev=>[...prev,{id:"f_"+Date.now(),label:fieldLabel.trim(),type:fieldType,icon:"📊",track:fieldType==="number"||fieldType==="rating"}]); setFieldLabel(""); }} style={{ width:"100%", padding:"10px", background:"#48c47a", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>+ Add field</button>
    </div>
    {(habits.length>0 || wellnessCfg.length>0) && (
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px" }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>Your custom items</div>
        {habits.map(h=>(<div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${S.border}` }}><span style={{ fontSize:13 }}>{h.icon} {h.label} <span style={{ color:S.dim, fontSize:11 }}>(habit)</span></span><button onClick={()=>setHabits(prev=>prev.filter(x=>x.id!==h.id))} style={{ padding:"3px 9px", fontSize:11, background:"transparent", color:"#e05555", border:"1px solid #e0555544", borderRadius:6, cursor:"pointer" }}>Remove</button></div>))}
        {wellnessCfg.map(f=>(<div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${S.border}` }}><span style={{ fontSize:13 }}>{f.icon} {f.label} <span style={{ color:S.dim, fontSize:11 }}>({f.type})</span></span><button onClick={()=>setWellnessCfg(prev=>prev.filter(x=>x.id!==f.id))} style={{ padding:"3px 9px", fontSize:11, background:"transparent", color:"#e05555", border:"1px solid #e0555544", borderRadius:6, cursor:"pointer" }}>Remove</button></div>))}
      </div>
    )}
  </>;
}
