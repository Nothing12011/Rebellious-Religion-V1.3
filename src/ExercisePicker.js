import { useState, useMemo } from "react";
import { EXERCISE_LIBRARY, BODY_PARTS, BODY_PART_COLORS, EQUIPMENT, MUSCLE_REGIONS, MUSCLE_NAMES } from "./data";

/* FEATURES 1+3: Full-screen searchable exercise picker.
   Custom-exercise form now also captures primary/secondary muscles (Feature B). */

const S = { bg:"#0a0c0e", surface:"#111316", card:"#161a1e", border:"#1e2428",
            text:"#e8e6e0", muted:"#5a6670", dim:"#3a4550" };
const inp = { background:S.card, border:`1px solid ${S.border}`, borderRadius:10, color:S.text, padding:"10px 12px", fontSize:15, width:"100%" };

export function ExercisePicker({ title="Choose exercise", onSelect, onClose, customExercises, setCustomExercises }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(null);
  const [equip, setEquip] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:"", part:"Chest", equipment:"Dumbbell", note:"", primary:[], secondary:[] });

  const library = useMemo(() => [...EXERCISE_LIBRARY, ...customExercises], [customExercises]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscle && !(ex.parts||[]).includes(muscle)) return false;
      if (equip && ex.equipment !== equip) return false;
      return true;
    });
  }, [library, query, muscle, equip]);

  const toggleMuscle = (which, id) => {
    setForm(f => {
      const cur = f[which];
      const next = cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id];
      // keep primary/secondary mutually exclusive
      const other = which==="primary" ? "secondary" : "primary";
      return { ...f, [which]:next, [other]: f[other].filter(x=>x!==id) };
    });
  };

  const saveCustom = () => {
    if (!form.name.trim()) return;
    const ex = {
      name:form.name.trim(), parts:[form.part], equipment:form.equipment, note:form.note.trim(),
      muscles:{ primary:form.primary, secondary:form.secondary },
      sets:3, reps:"10", main:false, custom:true
    };
    setCustomExercises(prev => [...prev, ex]);
    setCreating(false);
    setForm({ name:"", part:"Chest", equipment:"Dumbbell", note:"", primary:[], secondary:[] });
  };

  const chip = (active, color) => ({
    flexShrink:0, padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer",
    border:`1px solid ${active ? color : S.border}`, background: active ? color+"22" : "transparent",
    color: active ? color : S.muted,
  });

  return (
    <div style={{ position:"fixed", inset:0, background:S.bg, zIndex:400, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"calc(env(safe-area-inset-top, 12px) + 4px) 16px 12px", borderBottom:`1px solid ${S.border}`, background:S.surface }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:17, fontWeight:700 }}>{title}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:S.muted, fontSize:24, cursor:"pointer", padding:"0 4px" }}>✕</button>
        </div>
        <input autoFocus placeholder="Search exercises…" value={query} onChange={e=>setQuery(e.target.value)} style={inp} />
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingTop:10, paddingBottom:2 }}>
          <button onClick={()=>setMuscle(null)} style={chip(!muscle, S.text)}>All</button>
          {BODY_PARTS.map(bp=>(<button key={bp} onClick={()=>setMuscle(muscle===bp?null:bp)} style={chip(muscle===bp, BODY_PART_COLORS[bp])}>{bp}</button>))}
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingTop:8 }}>
          <button onClick={()=>setEquip(null)} style={chip(!equip, S.text)}>All</button>
          {EQUIPMENT.map(eq=>(<button key={eq} onClick={()=>setEquip(equip===eq?null:eq)} style={chip(equip===eq, "#e8a84d")}>{eq}</button>))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"8px 0 calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ padding:"8px 16px" }}>
          {creating ? (
            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>New custom exercise</div>
              <input placeholder="Exercise name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ ...inp, marginBottom:8 }} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <select value={form.part} onChange={e=>setForm(f=>({...f,part:e.target.value}))} style={inp}>
                  {BODY_PARTS.map(bp=><option key={bp} value={bp}>{bp}</option>)}
                </select>
                <select value={form.equipment} onChange={e=>setForm(f=>({...f,equipment:e.target.value}))} style={inp}>
                  {EQUIPMENT.map(eq=><option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
              <input placeholder="Note (optional)" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{ ...inp, marginBottom:12 }} />

              {/* muscle selection for heat chips */}
              <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>Primary muscles (full credit)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
                {MUSCLE_REGIONS.map(id=>(
                  <button key={id} onClick={()=>toggleMuscle("primary",id)} style={{ ...chip(form.primary.includes(id), "#e8614d"), fontSize:10, padding:"4px 8px" }}>{MUSCLE_NAMES[id]}</button>
                ))}
              </div>
              <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>Secondary muscles (half credit)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                {MUSCLE_REGIONS.map(id=>(
                  <button key={id} onClick={()=>toggleMuscle("secondary",id)} style={{ ...chip(form.secondary.includes(id), "#b48ee8"), fontSize:10, padding:"4px 8px" }}>{MUSCLE_NAMES[id]}</button>
                ))}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={saveCustom} style={{ flex:1, padding:"10px", background:"#e8614d", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>Save</button>
                <button onClick={()=>setCreating(false)} style={{ padding:"10px 16px", background:"transparent", color:S.muted, border:`1px solid ${S.border}`, borderRadius:10, fontSize:14, cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setCreating(true)} style={{ width:"100%", padding:"11px", background:"transparent", color:"#e8614d", border:"1px dashed #e8614d66", borderRadius:12, fontSize:14, cursor:"pointer" }}>+ Add custom exercise</button>
          )}
        </div>

        <div style={{ padding:"4px 16px", fontSize:11, color:S.dim }}>{results.length} exercise{results.length!==1?"s":""}</div>
        {results.map((ex,i)=>(
          <button key={ex.name+i} onClick={()=>onSelect(ex)} style={{ display:"block", width:"100%", textAlign:"left", background:"transparent", border:"none", borderBottom:`1px solid ${S.border}`, padding:"13px 16px", cursor:"pointer", color:S.text }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
              <span style={{ fontSize:15, fontWeight:600 }}>{ex.name}</span>
              {ex.custom && <span style={{ fontSize:9, color:"#e8a84d", border:"1px solid #e8a84d44", borderRadius:4, padding:"1px 5px" }}>CUSTOM</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4, flexWrap:"wrap" }}>
              {(ex.parts||[]).map(p=>(<span key={p} style={{ fontSize:10, color:BODY_PART_COLORS[p]||S.muted, border:`1px solid ${(BODY_PART_COLORS[p]||S.muted)}44`, borderRadius:4, padding:"1px 6px" }}>{p}</span>))}
              <span style={{ fontSize:10, color:S.muted, border:`1px solid ${S.border}`, borderRadius:4, padding:"1px 6px" }}>{ex.equipment||"Other"}</span>
            </div>
            {(() => {
              const mus = ex.muscles || { primary:[], secondary:[] };
              const prim = (mus.primary||[]).map(id=>MUSCLE_NAMES[id]||id);
              const sec = (mus.secondary||[]).map(id=>MUSCLE_NAMES[id]||id);
              if (prim.length===0 && sec.length===0) return null;
              return (
                <div style={{ fontSize:10, marginTop:4, lineHeight:1.4 }}>
                  {prim.length>0 && <span style={{ color:"#e8614d" }}>{prim.join(", ")}</span>}
                  {sec.length>0 && <span style={{ color:S.dim }}>{prim.length>0?" · ":""}{sec.join(", ")}</span>}
                </div>
              );
            })()}
            {ex.note && <div style={{ fontSize:10, color:S.dim, marginTop:3 }}>{ex.note}</div>}
          </button>
        ))}
        {results.length===0 && (<div style={{ padding:"2rem", textAlign:"center", color:S.muted, fontSize:13 }}>No matches. Try clearing filters, or add it as a custom exercise.</div>)}
      </div>
    </div>
  );
}
