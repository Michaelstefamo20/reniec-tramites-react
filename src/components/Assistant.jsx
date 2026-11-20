import {useState,useRef,useEffect} from "react";
import { askClaude } from "../services/assistantApi.js";
import { useLanguage } from "./LanguageProvider.jsx";

export default function Assistant({hint,open,setOpen,load,region,language,onHelp}){
  const {t}=useLanguage();
  const [msgs,setMsgs]=useState([{b:1,t:"Hola. Puedo orientarte sobre los servicios de este prototipo, ubicación, idiomas y cómo pedir ayuda."}]);
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [voiceError,setVoiceError]=useState("");
  const [thinking,setThinking]=useState(false);
  const recognition=useRef(null);
  const end=useRef();
  useEffect(()=>{end.current&&end.current.scrollIntoView({block:"nearest"})},[msgs]);
  const ayuda=["Explora las opciones disponibles y personaliza los accesos de tu tablero.","Ingresa datos solo cuando sean necesarios para el prototipo.","Sigue las instrucciones de cada paso y revisa los archivos antes de continuar.","Lee el resumen. Esta demostración no envía trámites a RENIEC.","No realices pagos reales desde esta demostración."];
  const reply=q=>{q=q.toLowerCase();
    if(/foto|luz|fondo/.test(q))return"Puedo compartir recomendaciones generales para una foto, pero la aceptación oficial depende de los requisitos vigentes de RENIEC. Verifica las instrucciones del trámite en los canales oficiales.";
    if(/pago|yape|plin|costo|cuánto|cuanto/.test(q))return"Este prototipo no procesa pagos reales. Para tasas y medios de pago vigentes, consulta el sitio oficial de RENIEC antes de pagar.";
    if(/famil|hijo|menor/.test(q))return"Puedes usar la opción Mi familia como ayuda de organización en este prototipo. La representación legal y los trámites de menores requieren seguir los requisitos oficiales de RENIEC.";
    if(/ubic|idioma|quechua|aimara|aymara/.test(q))return"Usa el selector de idioma del encabezado. El botón de ubicación solicita permiso del navegador y puede sugerir español, quechua o aimara según la región detectada.";
    if(/estado|seguimiento|oficial/.test(q))return"No consulto sistemas oficiales de RENIEC. El estado mostrado aquí es una demostración; consulta el portal oficial para el seguimiento real.";
    if(/correo|consulta|soporte|ayuda humana/.test(q))return"Abre Mis consultas para enviar un mensaje al equipo de este sitio y revisar su respuesta.";
    if(/cae|caída|error|demora|lento/.test(q))return load?"El prototipo indica posible alta demanda. No puedo comprobar la disponibilidad de los sistemas oficiales.":"No puedo verificar servicios oficiales desde este chat. Si falla una función del sitio, abre Mis consultas.";
    if(/agencia|internet|sin acceso/.test(q))return"Este sitio no está integrado con una red oficial de agencias. Para atención presencial y direcciones vigentes, revisa el directorio oficial de RENIEC.";
    return"Puedo orientar sobre navegación, idiomas, consultas de soporte y el funcionamiento del prototipo. No represento oficialmente a RENIEC ni puedo comprobar pagos o trámites reales.";};
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
    <button className="close" onClick={()=>setOpen(false)} aria-label={t("Cerrar")}>✕</button>
    <h2 style={{fontSize:"1.05rem"}}>{t("Asistente virtual de orientación")}</h2>
    <p className="voice-hint">{t("No es un canal oficial de RENIEC. No escribas tu DNI, contraseña ni datos de pago.")}</p>
    <div className="msg bot">{t(hint)}</div>
    <div className="voice-controls"><button className="btn voice-button" onClick={startVoice} disabled={listening} aria-pressed={listening}>{listening?`🎙 ${t("Escuchando…")}`:`🎤 ${t("Hablar con el asistente")}`}</button><button className="btn ghost voice-button" onClick={()=>speaking?window.speechSynthesis.cancel():speak(msgs.filter(m=>m.b).at(-1)?.t||"Hola")} disabled={!window.speechSynthesis}>{speaking?`■ ${t("Detener audio")}`:`🔊 ${t("Escuchar respuesta")}`}</button></div>
    {voiceError&&<p className="voice-error" role="status">{t(voiceError)}</p>}
    {region&&<p className="voice-hint">{t("Región seleccionada")}: {t(region)}. {t("El audio usa una voz disponible en tu navegador.")}</p>}
    <div className="chat">{msgs.map((m,i)=><div key={i} className={"msg "+(m.b?"bot":"me")}>{m.t}</div>)}<div ref={end}/></div>
    <button className="help-link" onClick={()=>{setOpen(false);onHelp?.()}}>{t("Ver preguntas frecuentes y ayuda")}</button>
    <div className="chips">{["¿Cómo debe ser la foto?","¿Cómo pago?","Trámite familiar","Sin acceso digital"].map(c=><button key={c} onClick={()=>send(c)}>{t(c)}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();if(v.trim()){send(v);setV("")}}} style={{display:"flex",gap:6,marginTop:10}}>
      <input type="text" value={v} onChange={e=>setV(e.target.value)} placeholder={t("Escribe tu duda")} aria-label={t("Tu duda")} disabled={thinking} maxLength={1200}/>
      <button className="btn" style={{padding:"10px 14px"}} disabled={thinking||!v.trim()}>{thinking?t("Pensando…"):t("Enviar")}</button>
    </form>
  </aside>);
}
