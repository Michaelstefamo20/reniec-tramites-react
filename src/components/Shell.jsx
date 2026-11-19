import {useState,useEffect,useRef} from "react";
import {ESTADOS,SEED,HINT} from "../data.js";
import Registro from "./Registro.jsx";
import LOGO from "../assets/logo.png";
import Nuevo from "./Nuevo.jsx";
import Inicio from "./Inicio.jsx";
import Mis from "./Mis.jsx";
import Familia from "./Familia.jsx";
import Ayuda from "./Ayuda.jsx";
import Assistant from "./Assistant.jsx";
import Soporte from "./Soporte.jsx";
import PanelAdmin from "./PanelAdmin.jsx";
import Agencias from "./Agencias.jsx";
import { useLanguage } from "./LanguageProvider.jsx";
import Onboarding from "./Onboarding.jsx";
import { authApi, supportApi } from "../services/authApi.js";

export default function Shell(){
  const { language, setLanguage, region, setRegion, regions, suggestedLanguage, languages, locationStatus, locationNotice, setLocationNotice, detectLocation, stopLocationTracking } = useLanguage();
  const [view,setView]=useState("registro");
  const [user,setUser]=useState(null);
  const [authChecking,setAuthChecking]=useState(true);
  const [showTour,setShowTour]=useState(false);
  const [supportNotifications,setSupportNotifications]=useState([]);
  const previousSupport=useRef(null);
  const [tr,setTr]=useState(SEED);
  const [pre,setPre]=useState({t:null,f:1,k:0,familyMember:null});
  const [big,setBig]=useState(false);
  const [load,setLoad]=useState(false);
  const [open,setOpen]=useState(false);
  const [bell,setBell]=useState(false);
  const [citas,setCitas]=useState([]);
  const [familyMembers,setFamilyMembers]=useState([]);
  useEffect(()=>{document.body.classList.toggle("big",big)},[big]);
  useEffect(()=>{
    if(!user?.email)return;
    const tourKey=`reniec-tour-complete:${encodeURIComponent(user.email)}`;
    if(localStorage.getItem(tourKey)!=="true")setShowTour(true);
  },[user?.email]);
  useEffect(()=>{
    if(!user?.email)return;
    authApi.familyMembers().then(data=>setFamilyMembers(data.members||[])).catch(()=>setFamilyMembers([]));
  },[user?.email]);
  useEffect(()=>{
    if(!user?.email)return;
    let alive=true;
    const poll=async()=>{
      try{
        const result=await supportApi.mine();
        if(!alive)return;
        const current=Object.fromEntries((result.inquiries||[]).map(item=>[item.public_id,`${item.status}:${item.updated_at}`]));
        if(previousSupport.current){
          const changed=(result.inquiries||[]).filter(item=>previousSupport.current[item.public_id]&&previousSupport.current[item.public_id]!==current[item.public_id]);
          if(changed.length)setSupportNotifications(items=>[...changed.map(item=>({id:item.public_id,text:`Tu consulta «${item.subject}» se actualizó: ${item.status_label||item.status}.`})),...items].slice(0,8));
        }
        previousSupport.current=current;
      }catch{}
    };
    poll();
    const timer=setInterval(poll,30000);
    return()=>{alive=false;clearInterval(timer);previousSupport.current=null;};
  },[user?.email]);
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
    authApi.currentUser()
      .then(data=>{setUser(data.user);setView("inicio")})
      .catch(()=>{})
      .finally(()=>setAuthChecking(false));
  },[]);
  const go=(v,p)=>{if(v==="nuevo")setPre(x=>({t:p?p.t:null,f:p?p.f:1,familyMember:p?.familyMember||null,k:x.k+1}));setView(v);setBell(false);window.scrollTo(0,0)};
  const adv=id=>setTr(l=>l.map(x=>x.id===id&&x.e<3?{...x,e:x.e+1}:x));
  const addCita=c=>setCitas(l=>[c,...l]);
  const closeTour=()=>{if(user?.email)localStorage.setItem(`reniec-tour-complete:${encodeURIComponent(user.email)}`,"true");setShowTour(false)};
  const registerDemo=profile=>{setUser(profile);setView("inicio")};
  const logout=async()=>{try{await authApi.logout()}finally{setUser(null);setView("registro")}};
  const chooseRegion=value=>{setRegion(value);const suggested=["Puno","Tacna","Moquegua"].includes(value)?"ay":["Apurímac","Ayacucho","Cusco","Huancavelica","Huánuco","Junín","Áncash","Arequipa","Lima","Pasco"].includes(value)?"qu":"es";setLanguage(suggested)};
  const nots=supportNotifications;
  if(authChecking)return <main className="auth-page"><div className="auth-card">Cargando tu cuenta…</div></main>;
  if(!user)return <Registro onRegister={registerDemo}/>;
  return(<div className="app">
  <div className="main">
    <header className="citizen-header"><button className="citizen-brand" onClick={()=>go("inicio")} aria-label="Ir al inicio"><img className="logo logo-m" src={LOGO} alt="RENIEC"/><span><b>Mi DNI en línea</b><small>Portal de orientación</small></span></button><nav className="citizen-top-nav" aria-label="Navegación principal">{[["inicio","Inicio"],["nuevo","Trámites"],["mis","Mis trámites"],["familia","Mi familia"],["agencias","Oficinas"],["ayuda","Ayuda"]].map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>go(id)}>{label}</button>)}</nav><div className="citizen-profile"><span className="citizen-avatar">{(user?.name||user?.email||"U").trim().charAt(0).toUpperCase()}</span><span className="citizen-user-name">{user?.name?.split(" ")[0]||"Mi cuenta"}</span></div>
      <div className="header-actions"><label className="sr-only" htmlFor="language-select">Idioma</label><select id="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Seleccionar idioma">{languages.map(l=><option key={l.code} value={l.code}>{l.name}{l.code===suggestedLanguage?" · sugerido":""}</option>)}</select>
      <button className="tog" onClick={()=>setBell(!bell)} aria-label={`Notificaciones del sitio, ${nots.length} nuevas`} aria-expanded={bell}>🔔 {nots.length>0&&<span className="notification-count">{nots.length}</span>}</button>
      <label className="sr-only" htmlFor="region-select">Región del Perú</label><select id="region-select" className="region-select" value={region} onChange={event=>chooseRegion(event.target.value)} aria-label="Elegir región del Perú">{regions.map(item=><option key={item} value={item}>{item}</option>)}</select>
      <button className="location-button" disabled={locationStatus==="loading"} onClick={async()=>{if(locationStatus==="tracking"){stopLocationTracking();return}setLocationNotice(null);await detectLocation()}} aria-label={locationStatus==="tracking"?"Detener seguimiento de ubicación":"Detectar ubicación y sugerir idioma"}>⌖ {locationStatus==="loading"?"Ubicando…":locationStatus==="tracking"?"Detener ubicación":"Usar ubicación"}</button>
      <button className="tog citizen-logout" onClick={logout} aria-label="Cerrar sesión">Cerrar sesión</button></div>
      {bell&&<div className="card notification-menu" role="status"><b>Notificaciones de soporte</b><p className="muted-line">Revisamos cambios de tus consultas cada 30 segundos. Los trámites oficiales requieren integración RENIEC.</p>{nots.map(item=><p key={item.id} style={{margin:"8px 0 0",fontSize:".9rem"}}>{item.text}</p>)}{!nots.length&&<p className="muted-line">No hay actualizaciones recientes de tus consultas.</p>}</div>}
      {locationNotice&&<div className="location-toast" role="status"><b>{locationNotice.error?"Ubicación no disponible":`Región detectada: ${locationNotice.region}`}</b><span>{locationNotice.error||`Idioma ${locationNotice.suggestLanguage?"cambiado a ":"sugerido: "}${locationNotice.language==="ay"?"Aimara":locationNotice.language==="qu"?"Quechua":"Español"}. Puedes modificarlo en cualquier momento.`}</span>{locationNotice.error&&<button className="text-action" onClick={()=>go("ayuda")}>Ayuda con ubicación</button>}<button className="notice-close" onClick={()=>setLocationNotice(null)} aria-label="Cerrar aviso">×</button></div>}</header>
    <div className="content">
      {view==="inicio"&&<Inicio go={go} tr={tr} load={load} name={user?.name} userId={user?.email}/>}
      {view==="nuevo"&&<Nuevo key={pre.k} pre={pre.t} famInit={pre.f} familyMember={pre.familyMember} familyMembers={familyMembers} onDone={t=>setTr(l=>[{...t,e:0},...l])} go2={go}/>}
      {view==="mis"&&<Mis tr={tr} adv={adv}/>}
      {view==="familia"&&<Familia go={go} citas={citas} addCita={addCita} onMembersChange={setFamilyMembers}/>}
      {view==="agencias"&&<Agencias region={region}/>}
      {view==="ayuda"&&<Ayuda big={big} setBig={setBig} load={load} setLoad={setLoad} setOpen={setOpen}/>}
      {view==="soporte"&&<Soporte/>}
      {view==="admin"&&<PanelAdmin user={user} onBack={()=>go("inicio")}/>}
    </div></div>
  {user?.isAdmin&&<button className="admin-shortcut" onClick={()=>go("admin")}>Panel de atención</button>}
  <nav className="tabs" aria-label="Menú móvil">{[["inicio","⌂","Inicio"],["mis","▤","Mis trámites"],["nuevo","＋","Trámites"],["familia","♧","Familia"],["agencias","⌖","Oficinas"],["ayuda","?","Ayuda"]].map(([id,icon,label])=><button key={id} className={view===id?"on":""} onClick={()=>go(id)}><span className="ico">{icon}</span>{label}</button>)}</nav>
  <div className="assist"><button className="fab" onClick={()=>setOpen(true)}><span className="av2">💬</span><span><b>Asistente virtual</b><br/><small>Ayuda por texto o voz</small></span></button></div>
  <Assistant hint={HINT[view]||"Puedo orientarte sobre navegación, idiomas y trámites incluidos en este prototipo."} open={open} setOpen={setOpen} load={load} region={region} language={language} onHelp={()=>go("ayuda")}/>
  {showTour&&<Onboarding onClose={closeTour}/>}
  </div>);
}
