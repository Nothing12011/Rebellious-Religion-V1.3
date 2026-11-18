import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { todayKey, parseKey, paceStrToMin, minToPaceStr, timeStrToMin, paceToMph } from "./lib";

const inp = (S) => ({ background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, color:S.text, padding:"9px 10px", fontSize:14, width:"100%" });
const lbl = (S) => ({ fontSize:11, color:S.muted, marginBottom:4, display:"block" });

export function CardioView({ runs, setRuns, S }) {
  const [adding, setAdding] = useState(false);
  const blank = { date:todayKey(), distance:"", time:"", paceDisplay:"", incline:"", rpe:"", notes:"" };
  const [form, setForm] = useState(blank);
  const calcPace = (f) => { if (f.paceDisplay) return paceStrToMin(f.paceDisplay); const dist=parseFloat(f.distance)||0, mins=timeStrToMin(f.time); return (dist>0&&mins>0)?mins/dist:0; };
  const formPace = calcPace(form), formMph = paceToMph(formPace);
  const sorted = [...runs].sort((a,b)=> b.date.localeCompare(a.date));
  const totalMiles = runs.reduce((s,r)=> s+(parseFloat(r.distance)||0), 0);
  const totalMin = runs.reduce((s,r)=> s+timeStrToMin(r.time), 0);
  const avgPace = totalMiles>0 ? totalMin/totalMiles : 0;
  const series = [...runs].sort((a,b)=>a.date.localeCompare(b.date)).map(r=>{ const pace=r.paceDisplay?paceStrToMin(r.paceDisplay):(parseFloat(r.distance)>0?timeStrToMin(r.time)/parseFloat(r.distance):0); return { date:r.date.slice(5), pace:+pace.toFixed(2), miles:+(parseFloat(r.distance)||0).toFixed(2) }; });
  const save = () => { if (!form.distance && !form.time) return; setRuns(prev => [...prev, { ...form, id: Date.now(), pace: calcPace(form) }]); setForm(blank); setAdding(false); };

  return <>
    {!adding && (<button onClick={()=>{ setForm({...blank, date:todayKey()}); setAdding(true); }} style={{ width:"100%", padding:"13px", background:"#b48ee8", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer", marginBottom:14 }}>+ Log a run</button>)}
    {adding && (
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px", marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:15, marginBottom:14 }}>Log treadmill run</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div><label style={lbl(S)}>Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp(S)} /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label style={lbl(S)}>Distance (miles)</label><input type="number" inputMode="decimal" placeholder="3.1" value={form.distance} onChange={e=>setForm(f=>({...f,distance:e.target.value}))} style={inp(S)} /></div>
            <div><label style={lbl(S)}>Time (MM:SS)</label><input placeholder="28:30" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={inp(S)} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label style={lbl(S)}>Pace from display (min/mi)</label><input placeholder="9:10" value={form.paceDisplay} onChange={e=>setForm(f=>({...f,paceDisplay:e.target.value}))} style={inp(S)} /></div>
            <div><label style={lbl(S)}>Incline (%)</label><input type="number" inputMode="decimal" placeholder="2.0" value={form.incline} onChange={e=>setForm(f=>({...f,incline:e.target.value}))} style={inp(S)} /></div>
          </div>
          <div style={{ background:S.bg, border:`1px solid ${S.border}`, borderRadius:10, padding:"10px 12px", fontSize:12, color:S.muted, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
            <span>Pace: <b style={{ color:"#b48ee8" }}>{minToPaceStr(formPace)} /mi</b></span>
            <span>Speed: <b style={{ color:"#b48ee8" }}>{formMph>0?formMph.toFixed(1):"—"} mph</b></span>
            {form.paceDisplay && form.distance && form.time && (() => { const calc=(parseFloat(form.distance)>0)?timeStrToMin(form.time)/parseFloat(form.distance):0; const typed=paceStrToMin(form.paceDisplay); return Math.abs(calc-typed)>0.15 ? <span style={{ color:"#e8a84d", width:"100%" }}>⚠ Typed pace differs from distance÷time ({minToPaceStr(calc)}). Using your typed value.</span> : <span style={{ color:"#48c47a", width:"100%" }}>✓ Pace matches distance ÷ time.</span>; })()}
          </div>
          <div><label style={lbl(S)}>Effort (RPE 1–10)</label><input type="number" inputMode="decimal" min="1" max="10" placeholder="6" value={form.rpe} onChange={e=>setForm(f=>({...f,rpe:e.target.value}))} style={inp(S)} /></div>
          <div><label style={lbl(S)}>Notes</label><input placeholder="Felt good, steady breathing" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={inp(S)} /></div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={save} style={{ flex:1, padding:"11px", background:"#b48ee8", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>Save run</button>
            <button onClick={()=>setAdding(false)} style={{ padding:"11px 18px", background:"transparent", color:S.muted, border:`1px solid ${S.border}`, borderRadius:10, fontSize:14, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    {runs.length>0 && (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        <MiniStat label="Total miles" value={totalMiles.toFixed(1)} color="#b48ee8" S={S} />
        <MiniStat label="Avg pace" value={minToPaceStr(avgPace)} sub="/mi" color="#4d8fe8" S={S} />
        <MiniStat label="Runs" value={runs.length} color="#48c47a" S={S} />
      </div>
    )}
    {series.length>=2 && <>
      <Chart title="Pace trend (min/mi · lower is faster)" data={series} dataKey="pace" color="#4d8fe8" reversed S={S} fmt={minToPaceStr} />
      <Chart title="Distance per run (miles)" data={series} dataKey="miles" color="#b48ee8" S={S} />
    </>}
    {sorted.length>0 && (
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"6px 0", marginTop:14 }}>
        <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", padding:"10px 16px 6px" }}>Run history</div>
        {sorted.map((r,i)=>{ const pace=r.paceDisplay?paceStrToMin(r.paceDisplay):(parseFloat(r.distance)>0?timeStrToMin(r.time)/parseFloat(r.distance):0); return (
          <div key={r.id||i} style={{ padding:"11px 16px", borderTop:`1px solid ${S.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{parseFloat(r.distance||0).toFixed(2)} mi · {r.time||"—"}</div>
              <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>{parseKey(r.date).toLocaleDateString("default",{month:"short",day:"numeric"})}{" · "}{minToPaceStr(pace)}/mi · {paceToMph(pace).toFixed(1)}mph{r.incline?` · ${r.incline}%`:""}{r.rpe?` · RPE ${r.rpe}`:""}</div>
              {r.notes && <div style={{ fontSize:11, color:S.dim, marginTop:2 }}>{r.notes}</div>}
            </div>
            <button onClick={()=>setRuns(prev=>prev.filter(x=>(x.id||0)!==(r.id||0)))} style={{ padding:"4px 9px", fontSize:11, background:"transparent", color:"#e05555", border:"1px solid #e0555544", borderRadius:6, cursor:"pointer" }}>✕</button>
          </div>
        ); })}
      </div>
    )}
    {runs.length===0 && !adding && (<div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"2rem", textAlign:"center", color:S.muted, fontSize:13 }}>No runs logged yet. Tap "Log a run" after your treadmill session.</div>)}
  </>;
}

const MiniStat = ({label,value,sub,color,S}) => (
  <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
    <div style={{ fontSize:9, letterSpacing:1, color:S.muted, textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color, marginTop:4 }}>{value}<span style={{ fontSize:11, color:S.dim }}>{sub||""}</span></div>
  </div>
);
const Chart = ({title,data,dataKey,color,reversed,S,fmt}) => (
  <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 10px", marginBottom:12 }}>
    <div style={{ fontSize:13, fontWeight:600, paddingLeft:6, marginBottom:8 }}>{title}</div>
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{top:4,right:10,bottom:0,left:-14}}>
        <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
        <XAxis dataKey="date" tick={{fontSize:10,fill:S.muted}} />
        <YAxis reversed={reversed} tick={{fontSize:10,fill:S.muted}} tickFormatter={fmt||undefined} width={fmt?44:30} />
        <Tooltip contentStyle={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}} formatter={fmt?(v)=>fmt(v):undefined} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{r:3,fill:color}} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
