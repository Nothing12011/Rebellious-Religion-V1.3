import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PFA_COMPONENTS, CARDIO_OPTIONS, UPPER_OPTIONS, CORE_OPTIONS,
         bracketFor, scoreComponent, compositeRating, TRAINING_PLANS, PFA_TIPS } from "./pfaData";
import { todayKey, parseKey } from "./lib";

const AF = "#4d8fe8"; // air force blue

const inp = (S) => ({ background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, color:S.text, padding:"9px 10px", fontSize:14, width:"100%" });
const lbl = (S) => ({ fontSize:11, color:S.muted, marginBottom:4, display:"block" });

// time helpers for mm:ss entry
const toSec = (str) => { if(!str) return 0; const p=String(str).split(":").map(Number); if(p.length===2) return (p[0]||0)*60+(p[1]||0); return parseFloat(str)||0; };
const toMMSS = (sec) => { if(!sec||sec<=0) return "—"; const m=Math.floor(sec/60), s=Math.round(sec%60); return `${m}:${String(s).padStart(2,"0")}`; };

export function MilitaryView({ pfa, setPfa, pfaCfg, setPfaCfg, S }) {
  const [sub, setSub] = useState("dash"); // dash | test | progress | setup
  const cfg = pfaCfg || {};
  const configured = cfg.age && cfg.gender;
  const picks = { cardio: cfg.cardio||"run", upper: cfg.upper||"pushups", core: cfg.core||"situps" };

  const tests = [...(pfa||[])].sort((a,b)=> b.date.localeCompare(a.date));
  const latest = tests[0] || null;

  const scoreTest = (t) => {
    if (!configured || !t) return null;
    const parts = ["cardio","upper","core"].map(slot => {
      const compId = t.picks?.[slot] || picks[slot];
      const val = t.values?.[compId];
      const r = scoreComponent(compId, val, cfg.gender, bracketFor(t.age||cfg.age));
      return { slot, compId, value:val, ...(r||{}) };
    });
    const total = parts.reduce((s,p)=> s + (p.points||0), 0);
    const allPassed = parts.every(p=>p.passed);
    return { parts, total:+total.toFixed(1), allPassed, rating:compositeRating(total) };
  };
  const latestScore = scoreTest(latest);

  // days until goal date
  const daysTo = (() => {
    if (!cfg.goalDate) return null;
    const d = parseKey(cfg.goalDate); const now=new Date(); now.setHours(0,0,0,0);
    return Math.ceil((d - now)/86400000);
  })();

  return <>
    <div style={{ display:"flex", gap:6, marginBottom:14 }}>
      {[["dash","Overview"],["test","Log Test"],["progress","Progress"],["setup","Setup"]].map(([v,l])=>(
        <button key={v} onClick={()=>setSub(v)} style={{ flex:1, padding:"8px 0", fontSize:12, borderRadius:10, border:`1px solid ${sub===v?AF:S.border}`, background:sub===v?AF:S.card, color:sub===v?"#fff":S.muted, cursor:"pointer", fontWeight:sub===v?600:400 }}>{l}</button>
      ))}
    </div>

    {!configured && sub!=="setup" && (
      <div style={{ background:`${AF}18`, border:`1px solid ${AF}44`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:13, color:AF, fontWeight:600, marginBottom:4 }}>Set up your profile first</div>
        <div style={{ fontSize:12, color:S.muted, marginBottom:10 }}>PFA scoring depends on your age and gender bracket.</div>
        <button onClick={()=>setSub("setup")} style={{ padding:"9px 16px", background:AF, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" }}>Go to Setup</button>
      </div>
    )}

    {/* ── OVERVIEW ── */}
    {sub==="dash" && configured && <>
      {daysTo != null && (
        <div style={{ background:`linear-gradient(135deg, ${AF}22, ${S.card})`, border:`1px solid ${AF}44`, borderRadius:16, padding:"16px", marginBottom:14, textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:2, color:S.muted, textTransform:"uppercase" }}>{cfg.goalLabel || "Goal date"}</div>
          <div style={{ fontSize:38, fontWeight:800, color:AF, lineHeight:1.1, marginTop:4 }}>{daysTo >= 0 ? daysTo : 0}</div>
          <div style={{ fontSize:12, color:S.muted }}>{daysTo === 1 ? "day out" : "days out"} · {parseKey(cfg.goalDate).toLocaleDateString("default",{month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      )}

      {latestScore ? <>
        <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Latest score</div>
            <div style={{ fontSize:11, color:S.muted }}>{parseKey(latest.date).toLocaleDateString("default",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{ textAlign:"center", marginBottom:14 }}>
            <div style={{ fontSize:52, fontWeight:800, color:latestScore.rating.color, lineHeight:1 }}>{latestScore.total}</div>
            <div style={{ fontSize:13, color:latestScore.rating.color, fontWeight:600, marginTop:4 }}>{latestScore.rating.label}</div>
            {!latestScore.allPassed && <div style={{ fontSize:11, color:"#e05555", marginTop:4 }}>⚠ One or more components below minimum</div>}
          </div>
          {latestScore.parts.map(p=>{
            const comp = PFA_COMPONENTS[p.compId];
            return (
              <div key={p.slot} style={{ padding:"10px 0", borderTop:`1px solid ${S.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{comp?.label}</div>
                    <div style={{ fontSize:11, color:S.muted }}>
                      {comp?.unit==="time" ? toMMSS(p.value) : `${p.value||0} reps`}
                      {p.maxV!=null && <span style={{ color:S.dim }}> · max at {comp?.unit==="time"?toMMSS(p.maxV):p.maxV}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:15, fontWeight:700, color: p.passed?AF:"#e05555" }}>{p.points ?? 0}</span>
                    <span style={{ fontSize:11, color:S.dim }}>/{p.maxPts}</span>
                  </div>
                </div>
                <div style={{ height:5, background:S.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round((p.pct||0)*100)}%`, background: p.passed?AF:"#e05555", borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* weakest-component training plan */}
        {(() => {
          const weakest = [...latestScore.parts].sort((a,b)=> (a.pct||0)-(b.pct||0))[0];
          const plan = weakest && TRAINING_PLANS[weakest.compId];
          if (!plan) return null;
          return (
            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", marginBottom:6 }}>Focus area</div>
              <div style={{ fontSize:15, fontWeight:700, color:AF, marginBottom:4 }}>{plan.title}</div>
              <div style={{ fontSize:11, color:S.muted, marginBottom:10 }}>Your weakest component right now — biggest score gain available here.</div>
              {plan.items.map((it,i)=>(
                <div key={i} style={{ display:"flex", gap:8, marginBottom:7, fontSize:12, color:S.text, lineHeight:1.45 }}>
                  <span style={{ color:AF, flexShrink:0 }}>▸</span><span>{it}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </> : (
        <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"2rem 1rem", textAlign:"center", color:S.muted, fontSize:13, marginBottom:14 }}>
          No test logged yet. Run a mock PFA and log it to see your score.
          <div><button onClick={()=>setSub("test")} style={{ marginTop:12, padding:"10px 18px", background:AF, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>Log a test</button></div>
        </div>
      )}

      <div style={{ background:`${AF}12`, border:`1px solid ${AF}33`, borderRadius:12, padding:"12px 14px", fontSize:12, color:S.text, fontStyle:"italic" }}>
        {PFA_TIPS[new Date().getDate() % PFA_TIPS.length]}
      </div>
    </>}

    {/* ── LOG TEST ── */}
    {sub==="test" && configured && <TestForm cfg={cfg} picks={picks} onSave={(t)=>{ setPfa(prev=>[...(prev||[]), t]); setSub("dash"); }} S={S} />}

    {/* ── PROGRESS ── */}
    {sub==="progress" && configured && <Progress tests={tests} scoreTest={scoreTest} cfg={cfg} S={S} />}

    {/* ── SETUP ── */}
    {sub==="setup" && <Setup cfg={cfg} setPfaCfg={setPfaCfg} S={S} />}
  </>;
}

function TestForm({ cfg, picks, onSave, S }) {
  const [date, setDate] = useState(todayKey());
  const [vals, setVals] = useState({});
  const [sel, setSel] = useState(picks);
  const set = (id,v) => setVals(p=>({...p,[id]:v}));

  const renderInput = (compId) => {
    const comp = PFA_COMPONENTS[compId];
    const isTime = comp.unit === "time";
    return (
      <div key={compId}>
        <label style={lbl(S)}>{comp.label} {isTime ? "(mm:ss)" : "(reps)"}</label>
        <input
          placeholder={isTime ? "9:45" : "50"}
          inputMode={isTime ? "text" : "numeric"}
          value={vals[`raw_${compId}`] ?? ""}
          onChange={e=>{ const raw=e.target.value; setVals(p=>({...p, [`raw_${compId}`]:raw, [compId]: isTime ? toSec(raw) : (parseFloat(raw)||"") })); }}
          style={inp(S)} />
      </div>
    );
  };

  return (
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px" }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Log a PFA test</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>Enter your results for each component.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={lbl(S)}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp(S)} /></div>

        <div>
          <label style={lbl(S)}>Cardio component</label>
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            {CARDIO_OPTIONS.map(id=>(<button key={id} onClick={()=>setSel(s=>({...s,cardio:id}))} style={pillBtn(S, sel.cardio===id)}>{PFA_COMPONENTS[id].label}</button>))}
          </div>
          {renderInput(sel.cardio)}
        </div>

        <div>
          <label style={lbl(S)}>Upper body component</label>
          <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
            {UPPER_OPTIONS.map(id=>(<button key={id} onClick={()=>setSel(s=>({...s,upper:id}))} style={pillBtn(S, sel.upper===id)}>{PFA_COMPONENTS[id].label}</button>))}
          </div>
          {renderInput(sel.upper)}
        </div>

        <div>
          <label style={lbl(S)}>Core component</label>
          <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
            {CORE_OPTIONS.map(id=>(<button key={id} onClick={()=>setSel(s=>({...s,core:id}))} style={pillBtn(S, sel.core===id)}>{PFA_COMPONENTS[id].label}</button>))}
          </div>
          {renderInput(sel.core)}
        </div>

        <div><label style={lbl(S)}>Notes</label><input placeholder="Conditions, how it felt…" value={vals.notes||""} onChange={e=>set("notes",e.target.value)} style={inp(S)} /></div>

        <button onClick={()=>{
          const values = {}; [sel.cardio, sel.upper, sel.core].forEach(id=>{ if(vals[id]) values[id]=vals[id]; });
          if (Object.keys(values).length===0) return;
          onSave({ id:Date.now(), date, picks:sel, values, age:cfg.age, notes:vals.notes||"" });
        }} style={{ width:"100%", padding:"13px", background:AF, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>Save & score</button>
      </div>
    </div>
  );
}

function Progress({ tests, scoreTest, cfg, S }) {
  if (tests.length===0) return <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"2rem 1rem", textAlign:"center", color:S.muted, fontSize:13 }}>No tests logged yet.</div>;
  const series = [...tests].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{ const s=scoreTest(t); return { date:t.date.slice(5), score:s?s.total:0 }; });
  return <>
    {series.length>=2 && (
      <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"14px 10px", marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:600, paddingLeft:6, marginBottom:8 }}>Composite score over time</div>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={series} margin={{top:4,right:10,bottom:0,left:-18}}>
            <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
            <XAxis dataKey="date" tick={{fontSize:10,fill:S.muted}} />
            <YAxis domain={[0,100]} tick={{fontSize:10,fill:S.muted}} />
            <Tooltip contentStyle={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}} />
            <Line type="monotone" dataKey="score" stroke={AF} strokeWidth={2} dot={{r:3,fill:AF}} name="Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"6px 0" }}>
      <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", padding:"10px 16px 6px" }}>Test history</div>
      {tests.map(t=>{
        const s = scoreTest(t);
        return (
          <div key={t.id} style={{ padding:"12px 16px", borderTop:`1px solid ${S.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{parseKey(t.date).toLocaleDateString("default",{month:"short",day:"numeric",year:"numeric"})}</div>
                <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>
                  {s?.parts.map(p=>{ const c=PFA_COMPONENTS[p.compId]; return `${c?.unit==="time"?toMMSS(p.value):p.value}`; }).join(" · ")}
                </div>
                {t.notes && <div style={{ fontSize:11, color:S.dim, marginTop:2 }}>{t.notes}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:20, fontWeight:700, color:s?s.rating.color:S.dim }}>{s?s.total:"—"}</div>
                <div style={{ fontSize:10, color:s?s.rating.color:S.dim }}>{s?s.rating.label:""}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </>;
}

function Setup({ cfg, setPfaCfg, S }) {
  const upd = (patch) => setPfaCfg(prev => ({ ...(prev||{}), ...patch }));
  return <>
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Your profile</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>PFA standards are scored by age and gender bracket.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={lbl(S)}>Age</label><input type="number" inputMode="numeric" placeholder="19" value={cfg.age||""} onChange={e=>upd({age:e.target.value})} style={inp(S)} /></div>
        <div>
          <label style={lbl(S)}>Gender (for scoring bracket)</label>
          <div style={{ display:"flex", gap:8 }}>
            {[["male","Male"],["female","Female"]].map(([v,l])=>(<button key={v} onClick={()=>upd({gender:v})} style={{ flex:1, padding:"10px 0", fontSize:13, borderRadius:9, border:`1px solid ${cfg.gender===v?AF:S.border}`, background:cfg.gender===v?`${AF}22`:"transparent", color:cfg.gender===v?AF:S.muted, cursor:"pointer" }}>{l}</button>))}
          </div>
        </div>
        {cfg.age && <div style={{ fontSize:11, color:AF }}>Scoring bracket: {bracketFor(cfg.age)}</div>}
      </div>
    </div>

    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Goal date</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>BMT ship date, a test date, or any target. Shows a countdown.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={lbl(S)}>Label</label><input placeholder="BMT ship date" value={cfg.goalLabel||""} onChange={e=>upd({goalLabel:e.target.value})} style={inp(S)} /></div>
        <div><label style={lbl(S)}>Date</label><input type="date" value={cfg.goalDate||""} onChange={e=>upd({goalDate:e.target.value})} style={inp(S)} /></div>
      </div>
    </div>

    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Default components</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>Which variant you train for. You can change these per test.</div>
      {[["cardio","Cardio",CARDIO_OPTIONS],["upper","Upper body",UPPER_OPTIONS],["core","Core",CORE_OPTIONS]].map(([slot,label,opts])=>(
        <div key={slot} style={{ marginBottom:12 }}>
          <label style={lbl(S)}>{label}</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {opts.map(id=>(<button key={id} onClick={()=>upd({[slot]:id})} style={pillBtn(S, (cfg[slot]|| (slot==="cardio"?"run":slot==="upper"?"pushups":"situps"))===id)}>{PFA_COMPONENTS[id].label}</button>))}
          </div>
        </div>
      ))}
    </div>

    <div style={{ background:"#e8a84d12", border:"1px solid #e8a84d44", borderRadius:12, padding:"12px 14px", fontSize:11, color:"#e8a84d", lineHeight:1.6 }}>
      <b>Verify your standards.</b> The scoring tables in this app are close approximations of the official USAF PFA charts (AFMAN 36-2905) and may not match the current published values exactly. Confirm against official Air Force sources or your recruiter before relying on a score. The tables live in <code>src/pfaData.js</code> and are easy to correct.
    </div>
  </>;
}

const pillBtn = (S, active) => ({ padding:"7px 12px", fontSize:11, borderRadius:20, cursor:"pointer", border:`1px solid ${active?AF:S.border}`, background: active?`${AF}22`:"transparent", color: active?AF:S.muted });
