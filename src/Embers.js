import { useEffect, useState, useCallback, useRef, useMemo } from "react";

/* FEATURE 5 + C: particle field.
   direction "up"   = fire embers rising (app default)
   direction "down" = feathers falling (intro)
   shape "dot" | "feather"
   Respects prefers-reduced-motion via CSS (.ember / .feather hidden). */

let seq = 0;

export function EmberField({ palette="fire", burstSignal=0, direction="up", shape="dot", density=1 }) {
  const [parts, setParts] = useState([]);
  const burstRef = useRef(burstSignal);

  const colors = useMemo(() => {
    if (palette === "fire") return ["#e8614d","#e8a84d","#ff8c66","#d94f3b"];
    if (palette === "cool") return ["#48c47a","#4dc9e8","#6de8b8","#3aa8c4"];
    if (palette === "feather") return ["#efe9dd","#d8cfbc","#c9bfa6","#f5f1e8"];
    return ["#e8614d"];
  }, [palette]);

  const gradient = palette === "fire"
    ? "linear-gradient(to top, rgba(232,97,77,0.16), rgba(26,26,30,0.0))"
    : palette === "cool"
    ? "linear-gradient(to top, rgba(72,196,122,0.13), rgba(26,26,30,0.0))"
    : "none";

  const anim = direction === "down" ? "featherFall" : "emberRise";

  const spawn = useCallback((count) => {
    const batch = Array.from({length:count}).map(()=>({
      id: ++seq,
      left: 2 + Math.random()*94,
      size: shape==="feather" ? 5 + Math.random()*7 : 2 + Math.random()*3,
      dur: shape==="feather" ? 3.0 + Math.random()*2.5 : 2.4 + Math.random()*2.2,
      delay: Math.random()*0.5,
      color: colors[Math.floor(Math.random()*colors.length)],
      rot: Math.random()*360,
    }));
    setParts(prev => [...prev.slice(-40), ...batch]);
    setTimeout(()=> setParts(prev => prev.filter(e => !batch.some(b=>b.id===e.id))), 6000);
  }, [colors, shape]);

  useEffect(() => {
    const interval = shape==="feather" ? 220 : 1600;
    const per = shape==="feather" ? 1 : 1;
    const iv = setInterval(()=> spawn(per), interval / density);
    return ()=> clearInterval(iv);
  }, [spawn, shape, density]);

  useEffect(() => {
    if (burstSignal !== burstRef.current) { burstRef.current = burstSignal; spawn(14); }
  }, [burstSignal, spawn]);

  const cls = shape==="feather" ? "feather" : "ember";
  const topStyle = direction === "down" ? { top:-8 } : { bottom:-4 };

  return (
    <div aria-hidden="true" style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", background:gradient, borderRadius:"inherit" }}>
      {parts.map(e=> shape==="feather" ? (
        <div key={e.id} className={cls} style={{
          position:"absolute", ...topStyle, left:`${e.left}%`,
          width:e.size, height:e.size*2.2,
          background:`linear-gradient(180deg, ${e.color}, transparent)`,
          borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%",
          transform:`rotate(${e.rot}deg)`,
          animation:`${anim} ${e.dur}s ease-in ${e.delay}s forwards`,
          opacity:0,
        }} />
      ) : (
        <div key={e.id} className={cls} style={{
          position:"absolute", ...topStyle, left:`${e.left}%`,
          width:e.size, height:e.size, borderRadius:"50%",
          background:e.color, boxShadow:`0 0 ${e.size*2}px ${e.color}`,
          animation:`${anim} ${e.dur}s ease-out ${e.delay}s forwards`,
          opacity:0,
        }} />
      ))}
    </div>
  );
}
