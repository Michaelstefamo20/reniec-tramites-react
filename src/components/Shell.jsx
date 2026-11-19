import {useState,useEffect} from "react";
import {NAV,ESTADOS,SEED,HINT} from "../data.js";
import Registro from "./Registro.jsx";
import LOGO from "../assets/logo.png";
import Nuevo from "./Nuevo.jsx";
import Inicio from "./Inicio.jsx";
import Mis from "./Mis.jsx";
import Familia from "./Familia.jsx";
import Ayuda from "./Ayuda.jsx";
import Assistant from "./Assistant.jsx";
import { useLanguage } from "./LanguageProvider.jsx";
import Onboarding from "./Onboarding.jsx";
import { authApi } from "../services/authApi.js";

export default function Shell(){
  const { language, setLanguage, region, suggestedLanguage, languages, t, locationStatus, locationNotice, setLocationNotice, detectLocation } = useLanguage();
  const [view,setView]=useState("registro");
  const [user,setUser]=useState(null);
  const [authChecking,setAuthChecking]=useState(true);
  const [showTour,setShowTour]=useState(false);

  const [tr,setTr]=useState(SEED);
  const [pre,setPre]=useState({t:null,f:1,k:0});
  const [big,setBig]=useState(false);
  const [load,setLoad]=useState(false);
  const [open,setOpen]=useState(false);
  const [bell,setBell]=useState(false);
  const [citas,setCitas]=useState([]);
  const [vmsg,setVmsg]=useState("");
  useEffect(()=>{document.body.classList.toggle("big",big)},[big]);
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const hasPasswordLink = Boolean(params.get("token")) && ["setup-password", "reset-password"].includes(action);
    if (hasPasswordLink) {
      setUser(null);
      setView("registro");
      setAuthChecking(false);
      return;
    }
    authApi.me()
      .then(data=>{setUser(data.user);setView("inicio")})
      .catch(()=>{})
      .finally(()=>setAuthChecking(false));
  },[]);
  const go=(v,p)=>{if(v==="nuevo")setPre(x=>({t:p?p.t:null,f:p?p.f:1,k:x.k+1}));setView(v);setBell(false);window.scrollTo(0,0)};
  const adv=id=>setTr(l=>l.map(x=>x.id===id&&x.e<3?{...x,e:x.e+1}:x));
  const addCita=c=>setCitas(l=>[c,...l]);
  const closeTour=()=>{localStorage.setItem("reniec-tour-complete","true");setShowTour(false)};
  const registerDemo=profile=>{setUser(profile);setView("inicio")};
  const logout=async()=>{try{await authApi.logout()}finally{setUser(null);setView("registro")}};
  const nots=tr.map(x=>x.n+" · "+ESTADOS[x.e]).concat(citas.map(c=>"Cita conjunta: "+c.dia+" "+c.hr));
  if(authChecking)return <main className="auth-page"><div className="auth-card">Cargando tu cuenta…</div></main>;
  if(!user)return <Registro onRegister={registerDemo}/>;
  return(<div className="app">
  <aside className="snav"><div style={{padding:"4px 8px 16px"}}><img className="logo" src={LOGO} alt="RENIEC, Registro Nacional de Identificación y Estado Civil" style={{height:56}}/><div style={{fontSize:".85rem",color:"var(--mut)",marginTop:6}}>Trámites+ · prototipo</div></div>
    {NAV.filter(n=>n[0]!=="ayuda").map(n=><button key={n[0]} className={"nv"+(view===n[0]?" on":"")} onClick={()=>go(n[0])}><span>{n[1]}</span>{t(n[2])}</button>)}<button className={"nv"+(view==="ayuda"?" on":"")} onClick={()=>go("ayuda")}>❓ Ayuda</button><button className="nv" onClick={()=>setShowTour(true)}>ⓘ Tutorial</button></aside>
  <div className="main">
    <header><img className="logo logo-m" src={LOGO} alt="RENIEC"/><h1>{t((NAV.find(n=>n[0]===view)||[])[2])}</h1>
      <div className="header-actions"><label className="sr-only" htmlFor="language-select">Idioma</label><select id="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Seleccionar idioma">{languages.map(l=><option key={l.code} value={l.code}>{l.name}{l.code===suggestedLanguage?" · sugerido":""}</option>)}</select>
      <button className="tog" onClick={()=>setBell(!bell)} aria-label="Notificaciones de trámites">🔔 {nots.length}</button>
      <button className="location-button" disabled={locationStatus==="loading"} onClick={async()=>{setLocationNotice(null);await detectLocation()}} aria-label="Detectar mi región con GPS">⌖ {locationStatus==="loading"?"Ubicando…":region}</button>
      <button className="tog" onClick={logout} aria-label="Cerrar sesión">Salir</button></div>
      {bell&&<div className="card notification-menu"><b>Notificaciones de tus trámites</b>{nots.map(t=><p key={t} style={{margin:"8px 0 0",fontSize:".9rem"}}>{t}</p>)}</div>}
      {locationNotice&&<div className="location-toast" role="status"><b>{locationNotice.error?"Ubicación no disponible":`Región detectada: ${locationNotice.region}`}</b><span>{locationNotice.error||`Idioma sugerido: ${locationNotice.language==="ay"?"Aimara":locationNotice.language==="qu"?"Quechua":"Español"}.`}</span>{locationNotice.language&&locationNotice.language!=="es"&&<button onClick={()=>{setLanguage(locationNotice.language);setLocationNotice(null)}}>Cambiar idioma</button>}<button className="notice-close" onClick={()=>setLocationNotice(null)} aria-label="Cerrar aviso">×</button></div>}</header>
    <div className="content">
      {view==="inicio"&&<Inicio go={go} tr={tr} load={load} name={user?.name}/>}
      {view==="nuevo"&&<Nuevo key={pre.k} pre={pre.t} famInit={pre.f} onDone={t=>setTr(l=>[{...t,e:0},...l])} go2={go}/>}
      {view==="mis"&&<Mis tr={tr} adv={adv}/>}
      {view==="familia"&&<Familia go={go} citas={citas} addCita={addCita}/>}
      {view==="ayuda"&&<Ayuda big={big} setBig={setBig} load={load} setLoad={setLoad} setOpen={setOpen}/>}
    </div></div>
  <nav className="tabs" aria-label="Menú principal">{NAV.filter(n=>n[0]!=="ayuda").map(n=><button key={n[0]} className={view===n[0]?"on":""} onClick={()=>go(n[0])}><span className="ico">{n[1]}</span>{n[0]==="nuevo"?"Nuevo trámite":n[0]==="mis"?"Mis trámites":t(n[2])}</button>)}<button className="tutorial-tab" onClick={()=>setShowTour(true)}><span className="ico">ⓘ</span>Tutorial</button></nav>
  <div className="assist"><button className="fab" onClick={()=>setOpen(true)}><span className="av2">💬</span><span><b>Asistente virtual</b><br/><small>Ayuda por texto o voz</small></span></button></div>
  <Assistant hint={HINT[view]} open={open} setOpen={setOpen} load={load} region={region} language={language} onHelp={()=>go("ayuda")}/>
  {showTour&&<Onboarding onClose={closeTour}/>}
  </div>);
}
