import { useState, useEffect, useRef } from "react";

export function FloatingTimer({ accent, S }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("rest");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(90);
  const [restTarget, setRestTarget] = useState(90);
  const tick = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(tick.current); return; }
    const started = Date.now();
    const base = mode === "stopwatch" ? elapsed : remaining;
    tick.current = setInterval(() => {
      const delta = (Date.now() - started) / 1000;
      if (mode === "stopwatch") setElapsed(base + delta * 1000);
      else {
        const left = base - delta;
        if (left <= 0) { setRemaining(0); setRunning(false); try { navigator.vibrate && navigator.vibrate([200,100,200]); } catch {} clearInterval(tick.current); }
        else setRemaining(left);
      }
    }, 100);
    return () => clearInterval(tick.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  const fmtStop = ms => { const t=Math.floor(ms/1000); return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
  const fmtRest = s => { const t=Math.ceil(s); return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`; };
  const presets = [60,90,120,180];

  return (
    <>
      <button onClick={()=>setOpen(o=>!o)} aria-label="Timer" style={{ position:"fixed", right:16, bottom:"calc(78px + env(safe-area-inset-bottom, 0px))", width:54, height:54, borderRadius:"50%", zIndex:200, background:accent, color:"#fff", border:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.4)", cursor:"pointer", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center" }}>{open?"✕":"⏱"}</button>
      {open && (
        <div style={{ position:"fixed", right:16, bottom:"calc(142px + env(safe-area-inset-bottom, 0px))", width:260, zIndex:200, background:S.card, border:`1px solid ${S.border}`, borderRadius:16, padding:16, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {[["rest","Rest Timer"],["stopwatch","Stopwatch"]].map(([mm,l])=>(
              <button key={mm} onClick={()=>{ setMode(mm); setRunning(false); }} style={{ flex:1, padding:"6px 0", fontSize:12, borderRadius:8, border:`1px solid ${mode===mm?accent:S.border}`, background:mode===mm?accent:"transparent", color:mode===mm?"#fff":S.muted, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
          <div style={{ textAlign:"center", fontSize:44, fontWeight:700, fontVariantNumeric:"tabular-nums", color:(mode==="rest"&&remaining<=0)?accent:S.text, marginBottom:12 }}>
            {mode==="stopwatch"?fmtStop(elapsed):fmtRest(remaining)}
          </div>
          {mode==="rest" && (
            <div style={{ display:"flex", gap:5, marginBottom:12 }}>
              {presets.map(p=>(<button key={p} onClick={()=>{ setRestTarget(p); setRemaining(p); setRunning(false); }} style={{ flex:1, padding:"5px 0", fontSize:11, borderRadius:7, border:`1px solid ${restTarget===p?accent:S.border}`, background:restTarget===p?accent+"22":"transparent", color:restTarget===p?accent:S.muted, cursor:"pointer" }}>{p}s</button>))}
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setRunning(r=>!r)} style={{ flex:1, padding:"10px", fontSize:14, fontWeight:600, borderRadius:10, border:"none", background:running?"#e0555522":accent, color:running?"#e05555":"#fff", cursor:"pointer" }}>{running?"Pause":"Start"}</button>
            <button onClick={()=>{ setRunning(false); if(mode==="stopwatch")setElapsed(0); else setRemaining(restTarget); }} style={{ padding:"10px 16px", fontSize:14, borderRadius:10, border:`1px solid ${S.border}`, background:"transparent", color:S.muted, cursor:"pointer" }}>Reset</button>
          </div>
        </div>
      )}
    </>
  );
}
