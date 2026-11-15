import {useState,useRef,useEffect} from "react";
import { askClaude } from "../services/assistantApi.js";

export default function Assistant({hint,open,setOpen,load,region,language,onHelp}){
  const [msgs,setMsgs]=useState([{b:1,t:"Hola, soy tu asistente. Te ayudo con tus trámites por texto o voz."}]);
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [voiceError,setVoiceError]=useState("");
  const [thinking,setThinking]=useState(false);
  const recognition=useRef(null);
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
  const speak=text=>{
    if(!("speechSynthesis" in window))return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=language==="qu"?"qu-PE":language==="ay"?"ay-PE":"es-PE";
    utterance.onstart=()=>setSpeaking(true);
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  const send=async q=>{
    const question=q.trim();
    if(!question||thinking)return;
    const previous=msgs.slice(-8).map(item=>({role:item.b?"assistant":"user",content:item.t}));
    setMsgs(items=>[...items,{t:question}]);
    setThinking(true);setVoiceError("");
    let answer;
    try{answer=await askClaude(question,previous,region)}
    catch(error){answer=`${reply(question)}${error.message?`\n\n(Respuesta local: Claude no está disponible.)`:""}`;setVoiceError(error.message)}
    setMsgs(items=>[...items,{b:1,t:answer}]);
    speak(answer);
    setThinking(false);
  };
  const startVoice=()=>{
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setVoiceError("El reconocimiento de voz no está disponible en este navegador. Puedes escribir tu consulta.");return;}
    setVoiceError("");
    try{
      const instance=new Recognition();
      instance.lang=language==="qu"?"qu-PE":language==="ay"?"ay-PE":"es-PE";
      instance.continuous=false;instance.interimResults=false;recognition.current=instance;
      instance.onstart=()=>setListening(true);
      instance.onend=()=>setListening(false);
      instance.onerror=event=>{setListening(false);setVoiceError(event.error==="not-allowed"?"Permite el micrófono en el navegador para usar la ayuda por voz.":"No se pudo reconocer la voz. Intenta otra vez o escribe tu consulta.")};
      instance.onresult=event=>send(event.results[0][0].transcript);
      instance.start();
    }catch{setListening(false);setVoiceError("No se pudo iniciar el micrófono.");}
  };
  useEffect(()=>()=>{recognition.current?.stop();window.speechSynthesis?.cancel()},[]);
  const [v,setV]=useState("");
  return(<aside className={"card side"+(open?" open":"")} aria-label="Asistente virtual">
    <button className="close" onClick={()=>setOpen(false)} aria-label="Cerrar">✕</button>
    <h2 style={{fontSize:"1.05rem"}}>Asistente virtual</h2>
    <div className="msg bot">{hint}</div>
    <div className="voice-controls"><button className="btn voice-button" onClick={startVoice} disabled={listening} aria-pressed={listening}>{listening?"🎙 Escuchando…":"🎤 Hablar con el asistente"}</button><button className="btn ghost voice-button" onClick={()=>speaking?window.speechSynthesis.cancel():speak(msgs.filter(m=>m.b).at(-1)?.t||"Hola")} disabled={!window.speechSynthesis}>{speaking?"■ Detener audio":"🔊 Escuchar respuesta"}</button></div>
    {voiceError&&<p className="voice-error" role="status">{voiceError}</p>}
    {region&&<p className="voice-hint">Región seleccionada: {region}. El audio usa una voz disponible en tu navegador.</p>}
    <div className="chat">{msgs.map((m,i)=><div key={i} className={"msg "+(m.b?"bot":"me")}>{m.t}</div>)}<div ref={end}/></div>
    <button className="help-link" onClick={()=>{setOpen(false);onHelp?.()}}>Ver preguntas frecuentes y ayuda</button>
    <div className="chips">{["¿Cómo debe ser la foto?","¿Cómo pago?","Trámite familiar","Sin acceso digital"].map(c=><button key={c} onClick={()=>send(c)}>{c}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();if(v.trim()){send(v);setV("")}}} style={{display:"flex",gap:6,marginTop:10}}>
      <input type="text" value={v} onChange={e=>setV(e.target.value)} placeholder="Escribe tu duda" aria-label="Tu duda" disabled={thinking} maxLength={1200}/>
      <button className="btn" style={{padding:"10px 14px"}} disabled={thinking||!v.trim()}>{thinking?"Pensando…":"Enviar"}</button>
    </form>
  </aside>);
}
