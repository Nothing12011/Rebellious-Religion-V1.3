import { useEffect, useState, useRef } from "react";
import { EmberField } from "./Embers";

/* FEATURE C: cinematic intro, adapted from "Rebellious Religion".
   Three crossfading panels (reach -> fall -> wordmark), ~2.7s total,
   downward feather particles, skip button, fades out to reveal app.
   Plays on first launch (or replay); gated on mount only. */

const GOLD = "#B8924A";
const OXBLOOD = "#5E121C";

// panel dwell times (ms) — compressed hard from the original ~6.6s
const P1 = 850, P2 = 850, P3 = 1000, FADE = 450;

export function Intro({ onDone }) {
  const [panel, setPanel] = useState(0);   // 0,1,2
  const [fading, setFading] = useState(false);
  const timers = useRef([]);

  const finish = () => {
    setFading(true);
    const t = setTimeout(onDone, FADE);
    timers.current.push(t);
  };

  useEffect(() => {
    // reduced motion → skip straight through
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone(); return;
    }
    const t = [];
    t.push(setTimeout(()=>setPanel(1), P1));
    t.push(setTimeout(()=>setPanel(2), P1+P2));
    t.push(setTimeout(finish, P1+P2+P3));
    timers.current = t;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const base = "/intro/";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:"#0a0c0e",
      animation: fading ? `introFade ${FADE}ms ease forwards` : "none",
      overflow:"hidden"
    }}>
      {/* Panel 1 — the reach */}
      <Panel active={panel===0}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 80% at 50% 18%, rgba(184,146,74,0.18), rgba(10,12,14,0.94) 70%)" }} />
        <img src={`${base}reach.jpg`} alt="" onError={hideImg} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"50% 32%", opacity:0.82 }} />
        <EmberField palette="feather" direction="down" shape="feather" density={2} />
      </Panel>

      {/* Panel 2 — the fall (art is dark-on-white → invert) */}
      <Panel active={panel===1}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(100% 80% at 50% 50%, ${OXBLOOD}55, #0a0c0e 72%)` }} />
        <img src={`${base}fallen.jpg`} alt="" onError={hideImg} style={{
          position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"8% 18%",
          filter:"invert(1) contrast(1.05) brightness(1.02)", mixBlendMode:"screen"
        }} />
        <EmberField palette="feather" direction="down" shape="feather" density={1.4} />
      </Panel>

      {/* Panel 3 — the wordmark */}
      <Panel active={panel===2}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(90% 70% at 50% 45%, rgba(184,146,74,0.14), #0a0c0e 70%)" }} />
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{
            fontFamily:"'Pirata One', serif", fontSize:"clamp(44px, 16vw, 88px)", color:"#f3ede1",
            textShadow:`0 0 40px rgba(184,146,74,0.25)`, animation:"wordmarkIn 0.9s ease forwards", lineHeight:1
          }}>Lift Log</div>
          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:"italic", fontSize:16, color:GOLD, marginTop:12, letterSpacing:"0.08em", opacity:0, animation:"wordmarkIn 0.9s ease 0.25s forwards" }}>
            forge the temple
          </div>
        </div>
      </Panel>

      {/* Skip */}
      <button onClick={finish} style={{
        position:"fixed", right:"calc(16px + env(safe-area-inset-right,0px))", bottom:"calc(20px + env(safe-area-inset-bottom,0px))",
        zIndex:1001, background:"rgba(20,20,24,0.4)", color:"#c9bfa6", border:"1px solid rgba(184,146,74,0.4)",
        borderRadius:20, padding:"8px 16px", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer",
        backdropFilter:"blur(4px)"
      }}>Skip</button>
    </div>
  );
}

function Panel({ active, children }) {
  return (
    <div style={{
      position:"absolute", inset:0, opacity: active ? 1 : 0,
      transition:"opacity 0.5s ease",
      animation: active ? "panelIn 1.1s ease forwards" : "none",
      pointerEvents: active ? "auto" : "none"
    }}>{children}</div>
  );
}

function hideImg(e){ e.currentTarget.style.display = "none"; }
