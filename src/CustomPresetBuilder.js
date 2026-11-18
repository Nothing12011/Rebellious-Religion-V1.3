import { useState } from "react";
import { PRESET_SWATCHES, BODY_PART_COLORS } from "./data";
import { ExercisePicker } from "./ExercisePicker";

/* FEATURE A: build a custom preset split from scratch.
   name, color swatch, exercises via ExercisePicker, per-exercise sets/reps/main,
   reorder + remove, subtitle. Saves to customPresets. */

export function CustomPresetBuilder({ initial, onSave, onCancel, onDelete, customExercises, setCustomExercises, S }) {
  const [name, setName] = useState(initial?.label || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [color, setColor] = useState(initial?.color || PRESET_SWATCHES[0]);
  const [exercises, setExercises] = useState(initial?.exercises ? initial.exercises.map(e=>({...e})) : []);
  const [picking, setPicking] = useState(false);

  const inp = { background:S.bg, border:`1px solid ${S.border}`, borderRadius:9, color:S.text, padding:"9px 11px", fontSize:14, width:"100%" };

  const addEx = (ex) => {
    setExercises(prev => [...prev, { name:ex.name, sets:3, reps:"8-10", main:false, parts:ex.parts||[], note:ex.note||"", muscles:ex.muscles||{primary:[],secondary:[]} }]);
    setPicking(false);
  };
  const update = (i, patch) => setExercises(prev => prev.map((e,idx)=> idx===i ? {...e,...patch} : e));
  const remove = (i) => setExercises(prev => prev.filter((_,idx)=>idx!==i));
  const move = (i, dir) => setExercises(prev => {
    const j = i+dir; if (j<0||j>=prev.length) return prev;
    const next=[...prev]; [next[i],next[j]]=[next[j],next[i]]; return next;
  });

  const save = () => {
    if (!name.trim() || exercises.length===0) return;
    onSave({ label:name.trim(), subtitle:subtitle.trim()||`${exercises.length} exercises`, color, category:"custom", exercises });
  };

  if (picking) {
    return <ExercisePicker title="Add to split" customExercises={customExercises} setCustomExercises={setCustomExercises} onClose={()=>setPicking(false)} onSelect={addEx} />;
  }

  return (
    <div style={{ position:"fixed", inset:0, background:S.bg, zIndex:390, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"calc(env(safe-area-inset-top,12px) + 4px) 16px 12px", borderBottom:`1px solid ${S.border}`, background:S.surface, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:17, fontWeight:700 }}>{initial ? "Edit split" : "Create split"}</div>
        <button onClick={onCancel} style={{ background:"transparent", border:"none", color:S.muted, fontSize:24, cursor:"pointer" }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px", paddingBottom:"calc(100px + env(safe-area-inset-bottom,0px))" }}>
        <label style={{ fontSize:11, color:S.muted, display:"block", marginBottom:4 }}>Name</label>
        <input placeholder="e.g. Arnold Chest Day" value={name} onChange={e=>setName(e.target.value)} style={{ ...inp, marginBottom:14 }} />

        <label style={{ fontSize:11, color:S.muted, display:"block", marginBottom:4 }}>Subtitle (optional)</label>
        <input placeholder="Short description" value={subtitle} onChange={e=>setSubtitle(e.target.value)} style={{ ...inp, marginBottom:14 }} />

        <label style={{ fontSize:11, color:S.muted, display:"block", marginBottom:8 }}>Accent color</label>
        <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
          {PRESET_SWATCHES.map(c=>(
            <button key={c} onClick={()=>setColor(c)} aria-label={`color ${c}`} style={{ width:32, height:32, borderRadius:"50%", background:c, border: color===c?`3px solid ${S.text}`:`2px solid ${S.border}`, cursor:"pointer" }} />
          ))}
        </div>

        <div style={{ fontSize:11, color:S.muted, marginBottom:8 }}>Exercises</div>
        {exercises.length===0 && <div style={{ fontSize:13, color:S.dim, padding:"10px 0" }}>No exercises yet. Add some below.</div>}

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {exercises.map((ex,i)=>(
            <div key={i} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:12, padding:"12px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>{ex.name}</span>
                  {(ex.parts||[]).map(p=>(<span key={p} style={{ fontSize:9, color:BODY_PART_COLORS[p]||S.muted, border:`1px solid ${(BODY_PART_COLORS[p]||S.muted)}44`, borderRadius:4, padding:"1px 5px" }}>{p}</span>))}
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={()=>move(i,-1)} disabled={i===0} style={arrowBtn(S, i===0)}>↑</button>
                  <button onClick={()=>move(i,1)} disabled={i===exercises.length-1} style={arrowBtn(S, i===exercises.length-1)}>↓</button>
                  <button onClick={()=>remove(i)} style={{ ...arrowBtn(S), color:"#e05555", borderColor:"#e0555544" }}>✕</button>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:11, color:S.dim }}>Sets</span>
                  <input type="number" inputMode="numeric" value={ex.sets} onChange={e=>update(i,{sets:parseInt(e.target.value)||1})} style={{ ...inp, width:52, padding:"6px 8px" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4, flex:1 }}>
                  <span style={{ fontSize:11, color:S.dim }}>Reps</span>
                  <input value={ex.reps} onChange={e=>update(i,{reps:e.target.value})} style={{ ...inp, padding:"6px 8px" }} />
                </div>
                <button onClick={()=>update(i,{main:!ex.main})} style={{ padding:"6px 10px", fontSize:11, borderRadius:8, cursor:"pointer", border:`1px solid ${ex.main?color:S.border}`, background: ex.main?color+"22":"transparent", color: ex.main?color:S.muted }}>
                  {ex.main ? "★ Main" : "Main"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={()=>setPicking(true)} style={{ width:"100%", padding:"11px", background:"transparent", color:color, border:`1px dashed ${color}66`, borderRadius:12, fontSize:14, cursor:"pointer" }}>+ Add exercise</button>

        {initial && onDelete && (
          <button onClick={onDelete} style={{ width:"100%", marginTop:20, padding:"11px", background:"transparent", color:"#e05555", border:"1px solid #e0555544", borderRadius:12, fontSize:14, cursor:"pointer" }}>Delete this split</button>
        )}
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 16px calc(16px + env(safe-area-inset-bottom,0px))", background:S.surface, borderTop:`1px solid ${S.border}`, display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ padding:"13px 20px", background:"transparent", color:S.muted, border:`1px solid ${S.border}`, borderRadius:12, fontSize:15, cursor:"pointer" }}>Cancel</button>
        <button onClick={save} disabled={!name.trim()||exercises.length===0} style={{ flex:1, padding:"13px", background: (!name.trim()||exercises.length===0)?S.card:color, color: (!name.trim()||exercises.length===0)?S.dim:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>
          {initial ? "Save changes" : "Create split"}
        </button>
      </div>
    </div>
  );
}

const arrowBtn = (S, disabled) => ({ width:28, height:28, borderRadius:7, background:"transparent", border:`1px solid ${S.border}`, color: disabled?S.dim:S.muted, fontSize:13, cursor: disabled?"default":"pointer", padding:0, opacity: disabled?0.4:1 });
