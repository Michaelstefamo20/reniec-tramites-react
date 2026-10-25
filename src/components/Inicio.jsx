import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";
import Demanda from "./Demanda.jsx";

export default function Inicio({go,tr,load}){
  const u=tr.find(x=>x.e<3)||tr[0];
  return(<>
  <div className="hero"><h2>Hola, bienvenido</h2><p style={{margin:"4px 0 14px"}}>Realiza tus trámites de identidad sin colas ni errores.</p><button className="btn" style={{background:"#F1B022",color:"#2A1A10"}} onClick={()=>go("nuevo")}>Iniciar un trámite</button></div>
  <div className="card mem"><div><b>{load?"Alta demanda en este momento":"Plataforma operativa"}</b><div style={{color:"var(--mut)"}}>Tiempo estimado de un trámite: {load?"12":"5"} min</div></div><span className={"badge "+(load?"b-w":"b-ok")}>{load?"Demora posible":"Sin incidencias"}</span></div>
  <section><h2 style={{fontSize:"1.1rem"}}>Accesos rápidos</h2><div className="grid g4">
    {[["Renovar DNIe","renov","🪪",1],["Duplicado","dup","📋",1],["Copia de acta","acta","📜",1],["Trámite familiar","renov","👨‍👩‍👧",3]].map(q=><button key={q[0]} className="opt" onClick={()=>go("nuevo",{t:q[1],f:q[3]})}><span style={{fontSize:"1.6rem"}}>{q[2]}</span><b>{q[0]}</b></button>)}
  </div></section>
  <div className="grid g2">
    <Demanda/>
    <div className="card" style={{borderLeft:"6px solid var(--gold)"}}><b>⚠️ Evita tramitadores</b><p style={{margin:"6px 0 0",color:"var(--mut)"}}>No necesitas intermediarios. Realiza y paga tu trámite solo aquí; desconfía de quien te ofrezca "agilizarlo" por un costo extra.</p></div>
    {u&&<div className="card"><b>Último trámite</b><div style={{color:"var(--mut)"}}>{u.n} · {u.id}</div><div className="bar"><i style={{width:((u.e+1)/4*100)+"%"}}/></div><span className="badge b-i">{ESTADOS[u.e]}</span> <button className="btn ghost" style={{padding:"6px 12px",marginLeft:8}} onClick={()=>go("mis")}>Ver detalle</button></div>}
    <div className="card"><b>⚠️ Aviso familiar</b><p style={{margin:"6px 0 10px",color:"var(--mut)"}}>El DNI de Camila vence en 38 días. Puedes renovarlo junto con el de tus otros hijos en un solo pago.</p><button className="btn ghost" style={{padding:"6px 12px"}} onClick={()=>go("familia")}>Ir a Mi familia</button></div>
  </div></>);
}
