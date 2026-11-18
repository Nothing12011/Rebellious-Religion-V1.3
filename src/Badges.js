import { STRENGTH_STANDARDS, TIER_NAMES, TIER_COLORS } from "./data";
import { computeTier } from "./lib";

export function BadgesPanel({ bestE1RMByLift, bodyweightLbs, prRecords, S }) {
  const bigLifts = Object.keys(STRENGTH_STANDARDS);
  const tieredLifts = bigLifts.map(name => ({ name, e1rm: bestE1RMByLift[name]||0, info: computeTier(name, bestE1RMByLift[name]||0, bodyweightLbs) })).filter(l => l.e1rm > 0);
  const otherPRs = Object.entries(prRecords||{}).filter(([name]) => !bigLifts.includes(name)).sort((a,b)=> b[1].e1rm - a[1].e1rm);

  return <>
    {!bodyweightLbs && (<div style={{ background:"#e8a84d18", border:"1px solid #e8a84d44", borderRadius:12, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#e8a84d" }}>Log your bodyweight in Stats to unlock strength tiers — tiers are computed as a ratio of your bodyweight.</div>)}
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
      <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Strength Tiers</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:14 }}>Big lifts ranked Bronze → Diamond by bodyweight-relative strength standards (best e1RM).</div>
      {tieredLifts.length===0 && <div style={{ fontSize:13, color:S.muted, padding:"8px 0" }}>Log sets on the big lifts (bench, squat, deadlift, OHP, row) to earn tiers.</div>}
      {tieredLifts.map(({name, e1rm, info})=>{
        const tierColor = info && info.tier>=0 ? TIER_COLORS[info.tier] : S.dim;
        return (
          <div key={name} style={{ padding:"12px 0", borderBottom:`1px solid ${S.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:30, height:30, borderRadius:"50%", background:tierColor+"22", border:`2px solid ${tierColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🏅</span>
                <div><div style={{ fontSize:14, fontWeight:600 }}>{name}</div><div style={{ fontSize:11, color:S.muted }}>{e1rm} lb e1RM{info?` · ${info.ratio.toFixed(2)}× bodyweight`:""}</div></div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:tierColor, border:`1px solid ${tierColor}66`, borderRadius:8, padding:"3px 10px", background:tierColor+"15" }}>{info ? info.tierName : "—"}</span>
            </div>
            {info && info.nextRatio && (<>
              <div style={{ height:5, background:S.border, borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:`${Math.round(info.progress*100)}%`, background:tierColor, borderRadius:3, transition:"width .4s" }} /></div>
              <div style={{ fontSize:10, color:S.dim, marginTop:4 }}>Next: {TIER_NAMES[info.tier+1]} at {info.nextRatio.toFixed(2)}× bodyweight ({Math.round(info.nextRatio*bodyweightLbs)} lb)</div>
            </>)}
            {info && !info.nextRatio && (<div style={{ fontSize:11, color:tierColor, marginTop:2 }}>💎 Max tier reached. Legendary.</div>)}
          </div>
        );
      })}
    </div>
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px" }}>
      <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Personal Records</div>
      <div style={{ fontSize:11, color:S.muted, marginBottom:12 }}>Best estimated 1RM per exercise. Beat it to earn a new PR.</div>
      {otherPRs.length===0 && <div style={{ fontSize:13, color:S.muted, padding:"8px 0" }}>PRs appear here as you log other exercises.</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {otherPRs.map(([name, rec])=>(<div key={name} style={{ border:"1px solid #e8a84d44", background:"#e8a84d12", borderRadius:10, padding:"7px 11px" }}><div style={{ fontSize:12, fontWeight:600, color:"#e8a84d" }}>⭐ {name}</div><div style={{ fontSize:10, color:S.muted }}>{rec.e1rm} lb e1RM · {rec.date?.slice(5)||""}</div></div>))}
      </div>
    </div>
  </>;
}
