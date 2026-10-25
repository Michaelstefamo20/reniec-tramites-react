import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";


export default function Ayuda({big,setBig,load,setLoad,setOpen}){
  const Q=[["¿Qué hago si rechazan mi foto?","Debe ser vertical, con fondo claro y uniforme, buena luz y de frente. El paso de foto te dice qué corregir antes de enviar."],["¿Cómo pago?","Con Yape, Plin o tarjeta, dentro de la misma plataforma. En trámites familiares pagas todo en un solo abono."],["¿Qué pasa si el sistema se cae?","Verás un aviso de estado antes de iniciar y tus datos se conservan mientras avanzas."],["¿Necesito un tramitador?","No. Puedes completar y pagar todo en la plataforma; si dudas, el asistente te guía en cada paso."],["¿Puedo usar comandos por voz?","Sí. Toca el micrófono de la cabecera y di: inicio, nuevo trámite, mis trámites, familia, ayuda o asistente."],["No tengo acceso a internet, ¿qué hago?","Un familiar o un agente puede completar el mismo flujo contigo usando el modo asistido."]];
  return(<>
  <div><h2>Ayuda</h2><p className="sub">Preguntas frecuentes y herramientas de apoyo.</p></div>
  <div className="card"><b>Asistente virtual 24/7</b><p style={{margin:"6px 0 10px",color:"var(--mut)"}}>Te guía paso a paso y responde dudas al instante.</p><button className="btn" onClick={()=>setOpen(true)}>Abrir asistente</button></div>
  <div className="card"><b>Accesibilidad y demostración</b>
    <label style={{display:"flex",gap:10,alignItems:"center",fontWeight:400}}><input type="checkbox" checked={big} onChange={()=>setBig(!big)}/> Modo asistido (texto grande)</label>
    <label style={{display:"flex",gap:10,alignItems:"center",fontWeight:400}}><input type="checkbox" checked={load} onChange={()=>setLoad(!load)}/> Simular alta demanda del sistema</label></div>
  <div className="card"><b>Preguntas frecuentes</b>{Q.map(q=><details key={q[0]}><summary>{q[0]}</summary><p style={{color:"var(--mut)"}}>{q[1]}</p></details>)}</div></>);
}
