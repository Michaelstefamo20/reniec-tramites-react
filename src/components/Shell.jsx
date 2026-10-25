import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";
import LOGO from "../assets/logo.png";
import Nuevo from "./Nuevo.jsx";
import Inicio from "./Inicio.jsx";
import Mis from "./Mis.jsx";
import Familia from "./Familia.jsx";
import Ayuda from "./Ayuda.jsx";
import Assistant from "./Assistant.jsx";

export default function Shell(){
  const [view,setView]=useState("inicio");
  const [tr,setTr]=useState(SEED);
  const [pre,setPre]=useState({t:null,f:1,k:0});
  const [big,setBig]=useState(false);
  const [load,setLoad]=useState(false);
  const [open,setOpen]=useState(false);
  const [bell,setBell]=useState(false);
  const [citas,setCitas]=useState([]);
  const [vmsg,setVmsg]=useState("");
  useEffect(()=>{document.body.classList.toggle("big",big)},[big]);
  const go=(v,p)=>{if(v==="nuevo")setPre(x=>({t:p?p.t:null,f:p?p.f:1,k:x.k+1}));setView(v);setBell(false);window.scrollTo(0,0)};
  const adv=id=>setTr(l=>l.map(x=>x.id===id&&x.e<3?{...x,e:x.e+1}:x));
  const addCita=c=>setCitas(l=>[c,...l]);
  const voz=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setVmsg("Tu navegador no admite comandos por voz.");return}
    const r=new SR();r.lang="es-PE";
    r.onresult=e=>{const t=e.results[0][0].transcript.toLowerCase();setVmsg("Escuché: “"+t+"”");
      if(/mis tr|seguimiento/.test(t))go("mis");else if(/nuevo|iniciar/.test(t))go("nuevo");else if(/famil/.test(t))go("familia");else if(/ayuda/.test(t))go("ayuda");else if(/asistente/.test(t))setOpen(true);else if(/grande|asistido/.test(t))setBig(true);else if(/inicio/.test(t))go("inicio");
      else setVmsg("No entendí “"+t+"”. Prueba: inicio, nuevo trámite, mis trámites, familia, ayuda.")};
    r.onerror=()=>setVmsg("No se pudo usar el micrófono en este navegador.");
    setVmsg("Escuchando…");try{r.start()}catch(x){setVmsg("No se pudo iniciar el micrófono.")}};
  const nots=tr.map(x=>x.n+" · "+ESTADOS[x.e]).concat(citas.map(c=>"Cita conjunta: "+c.dia+" "+c.hr));
  return(<div className="app">
  <aside className="snav"><div style={{padding:"4px 8px 16px"}}><img className="logo" src={LOGO} alt="RENIEC, Registro Nacional de Identificación y Estado Civil" style={{height:56}}/><div style={{fontSize:".85rem",color:"var(--mut)",marginTop:6}}>Trámites+ · prototipo</div></div>
    {NAV.map(n=><button key={n[0]} className={"nv"+(view===n[0]?" on":"")} onClick={()=>go(n[0])}><span>{n[1]}</span>{n[2]}</button>)}</aside>
  <div className="main">
    <header><img className="logo logo-m" src={LOGO} alt="RENIEC"/><h1>{(NAV.find(n=>n[0]===view)||[])[2]}</h1>
      <span className={"pill"+(load?" warn":"")}>● {load?"Alta demanda":"Sistema operativo"}</span>
      <button className="tog" onClick={voz} aria-label="Comandos por voz">🎤</button>
      <button className="tog" onClick={()=>setBell(!bell)} aria-label="Notificaciones">🔔 {nots.length}</button>
      {bell&&<div className="card" style={{position:"absolute",right:12,top:56,width:300,maxWidth:"calc(100vw - 24px)",zIndex:20,color:"var(--ink)"}}><b>Notificaciones</b>{nots.map(t=><p key={t} style={{margin:"8px 0 0",fontSize:".9rem"}}>{t}</p>)}</div>}</header>
    <div className="content">{vmsg&&<div className="toast" onClick={()=>setVmsg("")}>{vmsg}</div>}
      {view==="inicio"&&<Inicio go={go} tr={tr} load={load}/>}
      {view==="nuevo"&&<Nuevo key={pre.k} pre={pre.t} famInit={pre.f} onDone={t=>setTr(l=>[{...t,e:0},...l])} go2={go}/>}
      {view==="mis"&&<Mis tr={tr} adv={adv}/>}
      {view==="familia"&&<Familia go={go} citas={citas} addCita={addCita}/>}
      {view==="ayuda"&&<Ayuda big={big} setBig={setBig} load={load} setLoad={setLoad} setOpen={setOpen}/>}
    </div></div>
  <nav className="tabs" aria-label="Menú principal">{NAV.map(n=><button key={n[0]} className={view===n[0]?"on":""} onClick={()=>go(n[0])}><span className="ico">{n[1]}</span>{n[2].replace("Nuevo trámite","Nuevo").replace("Mis trámites","Trámites").replace("Mi familia","Familia")}</button>)}</nav>
  <div className="assist"><button className="fab" onClick={()=>setOpen(true)}><span className="av2">💬</span><span><b>Asistente virtual</b><br/><small>del RENIEC · 24/7</small></span></button></div>
  <Assistant hint={HINT[view]} open={open} setOpen={setOpen} load={load}/>
  </div>);
}
