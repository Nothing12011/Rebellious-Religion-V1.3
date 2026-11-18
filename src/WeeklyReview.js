import { useState } from "react";
import { weekLabel } from "./review";
import { CHIP_COLORS } from "./data";

const FOCUS_COLORS = {
  deload:"#e8a84d", consistency:"#e8614d", sleep:"#b48ee8", balance:"#4d8fe8",
  volume:"#e8a84d", momentum:"#48c47a", progress:"#48c47a",
};
const fmtK = (n) => n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1) + "k" : Math.round(n).toString();
const fmt1 = (n) => (n % 1 === 0 ? n : n.toFixed(1));

/* Full review body. Used by the Home card and the history list. */
export function ReviewBody({ r, S }) {
  const fc = FOCUS_COLORS[r.focus.kind] || "#e8614d";
  const change = r.tonnageChange;
  const w = r.wellnessAvg;
  const wellRows = [
    ["😴 Sleep", w.sleep, (v)=>`${v.toFixed(1)} hrs`],
    ["⭐ Sleep quality", w.sleepQuality, (v)=>`${v.toFixed(1)}/10`],
    ["⚡ Energy", w.energy, (v)=>`${v.toFixed(1)}/10`],
    ["🔥 Soreness", w.soreness, (v)=>`${v.toFixed(1)}/10`],
    ["💧 Water", w.water, (v)=>`${Math.round(v)} oz`],
    ["👟 Steps", w.steps, (v)=>Math.round(v).toLocaleString()],
  ].filter(([, d]) => d.n > 0);

  return <>
    {/* Focus */}
    <div style={{ background:`${fc}14`, border:`1px solid ${fc}44`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
      <div style={{ fontSize:10, letterSpacing:2, color:fc, textTransform:"uppercase", marginBottom:4 }}>Focus for next week</div>
      <div style={{ fontSize:15, fontWeight:700, color:S.text, marginBottom:4 }}>{r.focus.title}</div>
      <div style={{ fontSize:12, color:S.muted, lineHeight:1.5 }}>{r.focus.text}</div>
    </div>

    {/* Numbers */}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
      <Mini S={S} label="Sessions" value={r.sessions} sub={r.completed ? `${r.completed} marked done` : "lifting"} color="#e8614d" />
      <Mini S={S} label="Tonnage" value={fmtK(r.tonnage)} sub={change == null ? `${r.sets} sets` : `${change >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(change*100))}% vs prior`} subColor={change == null ? null : change >= 0 ? "#48c47a" : "#e05555"} color="#4d8fe8" />
      <Mini S={S} label="Runs" value={r.runs} sub={r.runs ? `${fmt1(+r.miles.toFixed(1))} mi` : "—"} color="#b48ee8" />
    </div>

    {/* PRs */}
    <Section S={S} title={`PRs${r.prs.length ? ` · ${r.prs.length}` : ""}`}>
      {r.prs.length === 0 ? <Empty S={S}>No new PRs this week.</Empty> : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {r.prs.map(p => (
            <span key={p.name} style={{ fontSize:11, color:"#e8a84d", border:"1px solid #e8a84d44", background:"#e8a84d12", borderRadius:20, padding:"4px 10px" }}>
              ★ {p.name} <span style={{ opacity:0.75 }}>{p.weight}×{p.reps}</span> <span style={{ opacity:0.6 }}>+{p.gain} e1RM</span>
            </span>
          ))}
        </div>
      )}
    </Section>

    {/* Muscles */}
    <Section S={S} title="Muscles">
      {r.topMuscles.length === 0 ? <Empty S={S}>No lifting logged.</Empty> : (
        <div style={{ fontSize:12, color:S.muted, marginBottom:6 }}>
          Most worked: {r.topMuscles.map((m, i) => (
            <span key={m.id} style={{ color:S.text }}>{m.name} <span style={{ color:S.dim }}>{fmt1(m.sets)}</span>{i < r.topMuscles.length - 1 ? ", " : ""}</span>
          ))}
        </div>
      )}
      {r.cold.length > 0 && (
        <div style={{ fontSize:11, color:CHIP_COLORS.grey, lineHeight:1.5 }}>
          <span style={{ color:S.muted }}>Untouched:</span> {r.cold.map(c => c.name).join(" · ")}
        </div>
      )}
    </Section>

    {/* Streaks */}
    <Section S={S} title="Streaks">
      <div style={{ display:"flex", gap:16, fontSize:12, color:S.muted, flexWrap:"wrap" }}>
        <span>Workout <b style={{ color:"#e8614d" }}>{r.streaks.workoutDays}/7</b> days</span>
        <span>Wellness <b style={{ color:"#48c47a" }}>{r.streaks.wellnessDays}/7</b> days</span>
        <span>🔥 <b style={{ color:"#e8a84d" }}>{r.streaks.overallAtEnd}</b> day streak at week's end</span>
      </div>
    </Section>

    {/* Wellness */}
    <Section S={S} title="Wellness averages" last>
      {wellRows.length === 0 ? <Empty S={S}>No wellness logged this week.</Empty> : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px" }}>
          {wellRows.map(([label, d, f]) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:S.muted }}>{label}</span>
              <span style={{ color:S.text, fontWeight:600 }}>{f(d.avg)} <span style={{ color:S.dim, fontWeight:400, fontSize:10 }}>({d.n}d)</span></span>
            </div>
          ))}
        </div>
      )}
    </Section>
  </>;
}

/* Home card: last week's review, shown Sun–Tue until dismissed. */
export function WeeklyReviewCard({ r, onDismiss, onOpenHistory, S }) {
  return (
    <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:"16px", marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase" }}>Weekly review</div>
          <div style={{ fontSize:16, fontWeight:700 }}>{weekLabel(r.startKey)}</div>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss review" style={{ background:"transparent", border:`1px solid ${S.border}`, borderRadius:8, color:S.muted, fontSize:12, padding:"4px 9px", cursor:"pointer" }}>Done</button>
      </div>
      <ReviewBody r={r} S={S} />
      <button onClick={onOpenHistory} style={{ width:"100%", marginTop:12, padding:"10px", background:"transparent", color:S.muted, border:`1px solid ${S.border}`, borderRadius:10, fontSize:13, cursor:"pointer" }}>Past reviews →</button>
    </div>
  );
}

/* Stats → Reviews tab: every finished week, newest first. */
export function ReviewHistory({ reviews, S }) {
  const [open, setOpen] = useState(reviews[0]?.startKey || null);
  if (!reviews.length) {
    return <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"2rem 1rem", textAlign:"center", color:S.muted, fontSize:13 }}>Your first review appears after your first full week of logging.</div>;
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {reviews.map(r => {
        const isOpen = open === r.startKey;
        return (
          <div key={r.startKey} style={{ background:S.card, border:`1px solid ${isOpen ? "#e8614d55" : S.border}`, borderRadius:14, overflow:"hidden" }}>
            <button onClick={()=>setOpen(isOpen ? null : r.startKey)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 16px", background:"transparent", border:"none", color:S.text, cursor:"pointer", textAlign:"left" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{weekLabel(r.startKey)}</div>
                <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>
                  {r.sessions} sessions · {fmtK(r.tonnage)} lb{r.runs ? ` · ${r.runs} run${r.runs===1?"":"s"}` : ""}{r.prs.length ? ` · ${r.prs.length} PR${r.prs.length===1?"":"s"}` : ""}
                </div>
              </div>
              <span style={{ color:S.dim, fontSize:14 }}>{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && <div style={{ padding:"0 16px 16px" }}><ReviewBody r={r} S={S} /></div>}
          </div>
        );
      })}
    </div>
  );
}

const Mini = ({ label, value, sub, subColor, color, S }) => (
  <div style={{ background:S.bg, border:`1px solid ${S.border}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
    <div style={{ fontSize:9, letterSpacing:1, color:S.muted, textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color, marginTop:2 }}>{value}</div>
    <div style={{ fontSize:10, color: subColor || S.dim, marginTop:1 }}>{sub}</div>
  </div>
);
const Section = ({ title, children, last, S }) => (
  <div style={{ paddingBottom: last ? 0 : 10, marginBottom: last ? 0 : 10, borderBottom: last ? "none" : `1px solid ${S.border}` }}>
    <div style={{ fontSize:10, letterSpacing:2, color:S.dim, textTransform:"uppercase", marginBottom:6 }}>{title}</div>
    {children}
  </div>
);
const Empty = ({ children, S }) => <div style={{ fontSize:12, color:S.dim }}>{children}</div>;
