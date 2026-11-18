import { streakState } from "./lib";
import { STREAK_MILESTONES } from "./data";

export function StreakFlame({ count, dateSet, label, color="#e8614d", size="md", S }) {
  const lit = streakState(dateSet) === "lit";
  const big = size === "lg";
  return (
    <div style={{ display:"flex", alignItems:"center", gap: big?8:5 }}>
      <span style={{ fontSize: big?26:17, filter: lit ? "none" : "grayscale(1) opacity(0.45)", animation: lit ? "flamePulse 2.4s ease-in-out infinite" : "none", display:"inline-block" }}>🔥</span>
      <div>
        <span style={{ fontSize: big?24:15, fontWeight:700, color: lit?color:S.dim, fontVariantNumeric:"tabular-nums" }}>{count}</span>
        {label && <div style={{ fontSize:9, color:S.dim, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>}
      </div>
    </div>
  );
}
export function hitMilestone(count) { return STREAK_MILESTONES.includes(count); }
export function MilestoneToast({ milestone, onDone }) {
  return (
    <div onClick={onDone} style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.72)", cursor:"pointer" }}>
      <div style={{ textAlign:"center", animation:"popIn .5s ease-out" }}>
        <div style={{ fontSize:72, animation:"flamePulse 1.2s ease-in-out infinite" }}>🔥</div>
        <div style={{ fontSize:30, fontWeight:800, color:"#e8a84d", marginTop:8 }}>{milestone}-DAY STREAK</div>
        <div style={{ fontSize:14, color:"#e8e6e0", marginTop:6 }}>You're on fire. Keep stacking days.</div>
        <div style={{ fontSize:11, color:"#5a6670", marginTop:16 }}>Tap to continue</div>
      </div>
    </div>
  );
}
