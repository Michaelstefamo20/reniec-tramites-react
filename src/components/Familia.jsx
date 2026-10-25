import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";
import CitaConjunta from "./CitaConjunta.jsx";

export default function Familia({go,citas,addCita}){
  return(<>
  <div><h2>Mi familia</h2><p className="sub">Gestiona el DNI de todo tu hogar desde una sola cuenta y un solo pago.</p></div>
  {FAMILIA.map(m=><div key={m.n} className="card mem"><div style={{display:"flex",gap:12,alignItems:"center"}}><div className="av">{m.n[0]}</div><div><b>{m.n}</b><div style={{color:"var(--mut)",fontSize:".85rem"}}>{m.rel}</div></div></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span className={"badge "+(m.ok?"b-ok":"b-w")}>{m.txt}</span><button className="btn ghost" style={{padding:"6px 12px"}} onClick={()=>go("nuevo",{t:"renov",f:1})}>Renovar</button></div></div>)}
  <button className="btn" onClick={()=>go("nuevo",{t:"renov",f:3})}>Trámite grupal para los 3 · un solo pago</button><CitaConjunta citas={citas} addCita={addCita}/></>);
}
