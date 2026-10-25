import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";


export default function CitaConjunta({citas,addCita}){
  const ds=dias(14).filter(x=>x.lv===0).slice(0,5);
  const [ag,setAg]=useState(AGS[1]);const [dia,setDia]=useState(ds[0]?ds[0].lbl:"");const [hr,setHr]=useState(HRS[0]);
  const [mem,setMem]=useState(FAMILIA.map(()=>true));
  const sel=FAMILIA.filter((m,i)=>mem[i]);
  return(<div className="card"><b>Cita presencial conjunta</b><p style={{margin:"4px 0 0",color:"var(--mut)",fontSize:".9rem"}}>Un solo horario para recoger los documentos de varios integrantes. Solo se ofrecen días de baja demanda.</p>
  <label htmlFor="ag">Agencia</label><select id="ag" value={ag} onChange={e=>setAg(e.target.value)}>{AGS.map(a=><option key={a}>{a}</option>)}</select>
  <label htmlFor="dia">Día</label><select id="dia" value={dia} onChange={e=>setDia(e.target.value)}>{ds.map(x=><option key={x.lbl}>{x.lbl}</option>)}</select>
  <label htmlFor="hr">Hora</label><select id="hr" value={hr} onChange={e=>setHr(e.target.value)}>{HRS.map(x=><option key={x}>{x}</option>)}</select>
  <label>Integrantes</label>{FAMILIA.map((m,i)=><label key={m.n} style={{display:"flex",gap:8,fontWeight:400,margin:"4px 0"}}><input type="checkbox" checked={mem[i]} onChange={()=>setMem(mem.map((v,j)=>j===i?!v:v))}/>{m.n}</label>)}
  <button className="btn" style={{marginTop:10}} disabled={!sel.length||!dia} onClick={()=>addCita({ag,dia,hr,n:sel.map(m=>m.n.split(" ")[0]).join(", "),c:sel.length})}>Agendar cita conjunta</button>
  {citas.map((c,i)=><p key={i} className="ok" style={{margin:"10px 0 0"}}><b>✓ {c.dia} · {c.hr} · {c.ag}</b><br/>{c.c} personas: {c.n}</p>)}</div>);}
