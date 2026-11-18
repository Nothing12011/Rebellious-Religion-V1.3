import { useState } from "react";
import { MUSCLE_NAMES, MAJOR_MUSCLES, CHIP_COLORS } from "./data";
import { weeklyMuscleVolume, chipColor, weekRangeLabel, WEEKLY_SET_TARGET } from "./lib";

/* FEATURE B: weekly muscle activity chips (text-based, no diagram).
   blue = light, purple = moderate, red = full; grey nudge = cold this week. */

export function MuscleChips({ history, S }) {
  const [detail, setDetail] = useState(null); // muscleId currently expanded
  const scores = weeklyMuscleVolume(history);

  // worked muscles (score > 0), sorted desc
  const worked = Object.entries(scores).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  // cold majors (no volume this week)
  const cold = MAJOR_MUSCLES.filter(id => !(scores[id] > 0));

  // contributing exercises for a muscle this week (for tap detail)
  const contributorsFor = (mid) => {
    const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate()-start.getDay());
    const startKey = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}-${String(start.getDate()).padStart(2,"0")}`;
    const names = {};
    Object.entries(history||{}).forEach(([k,sess])=>{
      if (k < startKey) return;
      (sess.exercises||[]).forEach((ex,ei)=>{
        const logs = sess.logs?.[ei]||{};
        const setCount = Object.values(logs).filter(s=>(s.weight!=null&&s.weight!=="")||(s.reps!=null&&s.reps!=="")).length;
        if (!setCount) return;
        const mus = ex.muscles||{primary:[],secondary:[]};
        const isP = (mus.primary||[]).includes(mid), isS = (mus.secondary||[]).includes(mid);
        if (isP||isS) names[ex.name] = (names[ex.name]||0) + setCount*(isP?1:0.5);
      });
    });
    return Object.entries(names).sort((a,b)=>b[1]-a[1]);
  };

  return (
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
        <div style={{ fontSize:14, fontWeight:700 }}>Muscle activity</div>
        <div style={{ fontSize:11, color:S.muted }}>This week · {weekRangeLabel()}</div>
      </div>
      <div style={{ fontSize:11, color:S.dim, marginBottom:12 }}>Resets Sunday · target {WEEKLY_SET_TARGET} sets/muscle</div>

      {worked.length===0 ? (
        <div style={{ fontSize:13, color:S.muted, padding:"10px 0" }}>No sets logged yet this week. Train something and your muscles will light up here.</div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {worked.map(([mid,score])=>{
            const c = chipColor(score);
            return (
              <button key={mid} onClick={()=>setDetail(detail===mid?null:mid)} style={{
                padding:"6px 11px", fontSize:12, borderRadius:20, cursor:"pointer",
                border:`1px solid ${c}`, background:`${c}22`, color:c, fontWeight:600,
                display:"flex", alignItems:"center", gap:6
              }}>
                {MUSCLE_NAMES[mid]||mid}
                <span style={{ fontSize:11, opacity:0.85, fontWeight:400 }}>{score % 1 === 0 ? score : score.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* tap detail */}
      {detail && (
        <div style={{ marginTop:12, background:S.bg, border:`1px solid ${S.border}`, borderRadius:12, padding:"12px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{MUSCLE_NAMES[detail]}</span>
            <span style={{ fontSize:12, color:chipColor(scores[detail]) }}>
              {scores[detail] % 1 === 0 ? scores[detail] : scores[detail].toFixed(1)} / {WEEKLY_SET_TARGET} weighted sets
            </span>
          </div>
          <div style={{ height:5, background:S.border, borderRadius:3, overflow:"hidden", marginBottom:10 }}>
            <div style={{ height:"100%", width:`${Math.min(100, (scores[detail]/WEEKLY_SET_TARGET)*100)}%`, background:chipColor(scores[detail]), borderRadius:3 }} />
          </div>
          {contributorsFor(detail).length>0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {contributorsFor(detail).map(([name,v])=>(
                <div key={name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:S.muted }}>
                  <span>{name}</span><span>{v % 1 === 0 ? v : v.toFixed(1)} sets</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize:11, color:S.dim }}>No contributing exercises found.</div>}
        </div>
      )}

      {/* cold nudge */}
      {cold.length>0 && (
        <div style={{ marginTop:12, fontSize:11, color:CHIP_COLORS.grey, lineHeight:1.5 }}>
          <span style={{ color:S.muted }}>Cold this week:</span> {cold.map(id=>MUSCLE_NAMES[id]).join(" · ")}
        </div>
      )}

      {/* legend */}
      {worked.length>0 && (
        <div style={{ display:"flex", gap:12, marginTop:12, fontSize:10, color:S.dim }}>
          <LegendDot c={CHIP_COLORS.blue} label="Light" />
          <LegendDot c={CHIP_COLORS.purple} label="Moderate" />
          <LegendDot c={CHIP_COLORS.red} label="Full" />
        </div>
      )}
    </div>
  );
}

const LegendDot = ({c,label}) => (
  <span style={{ display:"flex", alignItems:"center", gap:4 }}>
    <span style={{ width:8, height:8, borderRadius:"50%", background:c }} />{label}
  </span>
);
