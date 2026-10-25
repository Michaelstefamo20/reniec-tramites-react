import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";


export default function Assistant({hint,open,setOpen,load}){
  const [msgs,setMsgs]=useState([{b:1,t:"Hola, soy tu asistente 24/7. Te guío en cada paso."}]);
  const end=useRef();
  useEffect(()=>{end.current&&end.current.scrollIntoView({block:"nearest"})},[msgs]);
  const ayuda=["Debes elegir el trámite y cuántas personas incluye.","Ingresa tu DNI de 8 dígitos y tus nombres como figuran en el documento.","Usa foto de frente, con luz pareja y fondo claro. Te avisamos al instante si algo falla.","Revisa el resumen. Si hay observaciones, vuelve atrás y corrígelas.","Elige Yape, Plin o tarjeta. El pago se confirma aquí mismo."];
  const reply=q=>{q=q.toLowerCase();
    if(/foto|luz|fondo/.test(q))return"La foto debe ser vertical, con fondo claro y uniforme, buena luz y sin lentes oscuros.";
    if(/pago|yape|plin|costo|cuánto|cuanto/.test(q))return"Puedes pagar con Yape, Plin o tarjeta sin salir de la plataforma. En trámites familiares se paga todo en un solo abono.";
    if(/famil|hijo|menor/.test(q))return"En el paso 1 elige cuántas personas incluir: un solo pago y un solo seguimiento.";
    if(/cae|caída|error|demora|lento/.test(q))return load?"Hay alta demanda ahora. Tus datos se conservan mientras avanzas.":"El sistema está operativo. Si ves una demora, te avisamos arriba antes de que pierdas tiempo.";
    if(/agencia|internet|sin acceso/.test(q))return"Si no tienes acceso digital, activa el Modo asistido: un familiar o agente completa el mismo flujo contigo.";
    return"Puedo ayudarte con fotos, pagos, trámites familiares o el estado del sistema.";};
  const send=q=>setMsgs(m=>[...m,{t:q},{b:1,t:reply(q)}]);
  const [v,setV]=useState("");
  return(<aside className={"card side"+(open?" open":"")} aria-label="Asistente virtual">
    <button className="close" onClick={()=>setOpen(false)} aria-label="Cerrar">✕</button>
    <h2 style={{fontSize:"1.05rem"}}>Asistente virtual</h2>
    <div className="msg bot">{hint}</div>
    <div className="chat">{msgs.map((m,i)=><div key={i} className={"msg "+(m.b?"bot":"me")}>{m.t}</div>)}<div ref={end}/></div>
    <div className="chips">{["¿Cómo debe ser la foto?","¿Cómo pago?","Trámite familiar","Sin acceso digital"].map(c=><button key={c} onClick={()=>send(c)}>{c}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();if(v.trim()){send(v);setV("")}}} style={{display:"flex",gap:6,marginTop:10}}>
      <input type="text" value={v} onChange={e=>setV(e.target.value)} placeholder="Escribe tu duda" aria-label="Tu duda"/>
      <button className="btn" style={{padding:"10px 14px"}}>Enviar</button>
    </form>
  </aside>);
}
