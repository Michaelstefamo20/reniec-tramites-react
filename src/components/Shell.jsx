import {useState,useEffect} from "react";
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
import Cuenta from "./Cuenta.jsx";
import AppSplash from "./AppSplash.jsx";
import { useLanguage } from "./LanguageProvider.jsx";
import Onboarding from "./Onboarding.jsx";
import { authApi } from "../services/authApi.js";

export default function Shell(){
  const { language, setLanguage, region, setRegion, regions, suggestedLanguage, languages, locationStatus, locationNotice, setLocationNotice, detectLocation, stopLocationTracking, t } = useLanguage();
  const [view,setView]=useState("registro");
  const [user,setUser]=useState(null);
  const [authChecking,setAuthChecking]=useState(true);
  const [showSplash,setShowSplash]=useState(()=>!sessionStorage.getItem("reniec-splash-seen"));
  const [showTour,setShowTour]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [notificationsLoading,setNotificationsLoading]=useState(false);
  const [connectionLost,setConnectionLost]=useState(false);
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
    let active=true;
    authApi.getTutorial().then(data=>{if(active&&!data.tutorial)setShowTour(true)}).catch(()=>{});
    return()=>{active=false};
  },[user?.email]);
  useEffect(()=>{
    if(!user?.email)return;
    authApi.familyMembers().then(data=>setFamilyMembers(data.members||[])).catch(()=>setFamilyMembers([]));
  },[user?.email]);
  useEffect(()=>{
    if(!user?.email)return;
    let alive=true;
    const offlineKey=`reniec-offline-since:${encodeURIComponent(user.email)}`;
    const checkConnection=async()=>{
      try{
        const response=await fetch("/api/health",{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw new Error("health check failed");
        const since=sessionStorage.getItem(offlineKey);
        if(since&&Date.now()-Number(since)>=180000){await authApi.logout().catch(()=>{});if(alive){sessionStorage.removeItem(offlineKey);setConnectionLost(false);setUser(null);setFamilyMembers([]);setNotifications([]);setTr([]);setBell(false);setView("registro")};return}
        sessionStorage.removeItem(offlineKey);
        if(alive)setConnectionLost(false);
      }catch{
        let since=Number(sessionStorage.getItem(offlineKey));
        if(!since||!Number.isFinite(since)){since=Date.now();sessionStorage.setItem(offlineKey,String(since))}
        if(alive)setConnectionLost(true);
        if(Date.now()-since>=180000&&alive){await authApi.logout().catch(()=>{});sessionStorage.removeItem(offlineKey);setConnectionLost(false);setUser(null);setFamilyMembers([]);setNotifications([]);setTr([]);setBell(false);setView("registro")}
      }
    };
    checkConnection();
    const timer=setInterval(checkConnection,15000);
    return()=>{alive=false;clearInterval(timer)};
  },[user?.email]);
  useEffect(()=>{
    if(!user?.email)return;
    let alive=true;
    const poll=async()=>{try{const result=await authApi.notifications();if(alive)setNotifications(result.notifications||[])}catch{}};
    poll();
    const timer=setInterval(poll,30000);
    return()=>{alive=false;clearInterval(timer)};
  },[user?.email]);
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const hasEmailChangeLink=Boolean(params.get("token"))&&action==="change-email";
    const hasPasswordLink = Boolean(params.get("token")) && ["setup-password", "reset-password"].includes(action);
    if (hasEmailChangeLink){setUser(null);setView("registro");setAuthChecking(false);return}
    if (hasPasswordLink) {
      setUser(null);
      setView("registro");
      setAuthChecking(false);
      return;
    }
    authApi.currentUser()
      .then(async data=>{
        const offlineKey=`reniec-offline-since:${encodeURIComponent(data.user.email)}`;
        const since=Number(sessionStorage.getItem(offlineKey));
        if(since&&Number.isFinite(since)&&Date.now()-since>=180000){
          sessionStorage.removeItem(offlineKey);
          await authApi.logout().catch(()=>{});
          setView("registro");
          return;
        }
        setUser(data.user);setView("inicio");
      })
      .catch(()=>{})
      .finally(()=>setAuthChecking(false));
  },[]);
  const go=(v,p)=>{if(!v)return;if(v==="nuevo")setPre(x=>({t:p?p.t:null,f:p?p.f:1,familyMember:p?.familyMember||null,k:x.k+1}));setView(v);setBell(false);window.scrollTo(0,0)};
  const adv=id=>setTr(l=>l.map(x=>x.id===id&&x.e<3?{...x,e:x.e+1}:x));
  const addCita=c=>setCitas(l=>[c,...l]);
  const closeTour=async outcome=>{try{await authApi.completeTutorial(outcome)}catch{}setShowTour(false)};
  const registerDemo=profile=>{setUser(profile);setView("inicio")};
  const logout=async()=>{try{await authApi.logout()}finally{setUser(null);setFamilyMembers([]);setNotifications([]);setTr([]);setBell(false);setView("registro")}};
  const chooseRegion=value=>{setRegion(value);const suggested=["Puno","Tacna","Moquegua"].includes(value)?"ay":["Apurímac","Ayacucho","Cusco","Huancavelica","Huánuco","Junín","Áncash","Arequipa","Lima","Pasco"].includes(value)?"qu":"es";setLanguage(suggested)};
  const unreadCount=notifications.filter(item=>!item.read_at).length;
  const refreshNotifications=async()=>{setNotificationsLoading(true);try{const result=await authApi.notifications();setNotifications(result.notifications||[])}catch{}finally{setNotificationsLoading(false)}};
  const openNotification=async item=>{if(!item.read_at){await authApi.markNotificationRead(item.id).catch(()=>{});setNotifications(current=>current.map(notification=>notification.id===item.id?{...notification,read_at:new Date().toISOString()}:notification))}setBell(false);go(item.destination||"inicio")};
  const markAllNotificationsRead=async()=>{await authApi.markAllNotificationsRead().catch(()=>{});setNotifications(current=>current.map(item=>item.read_at?item:{...item,read_at:new Date().toISOString()}))};
  if(showSplash)return <AppSplash onFinish={()=>{sessionStorage.setItem("reniec-splash-seen","true");setShowSplash(false)}}/>;
  if(authChecking)return <main className="auth-page"><div className="auth-card">Cargando tu cuenta…</div></main>;
  if(!user)return <Registro onRegister={registerDemo}/>;
  return(<div className="app">
  <div className="main">
    <header className="citizen-header"><button className="citizen-brand" data-tour="brand" onClick={()=>go("inicio")} aria-label="Ir al inicio"><img className="logo logo-m" src={LOGO} alt="RENIEC"/><span><b>{t("Mi DNI en línea")}</b><small>{t("Portal de orientación")}</small></span></button><nav className="citizen-top-nav" data-tour="navigation" aria-label={t("Navegación principal")}>{[["inicio","Inicio"],["nuevo","Trámites"],["mis","Mis trámites"],["familia","Mi familia"],["agencias","Oficinas"],["ayuda","Ayuda"]].map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>go(id)}>{t(label)}</button>)}</nav><button className="citizen-profile" data-tour="account" onClick={()=>go("cuenta")} aria-label={t("Configuración de la cuenta")} title={t("Configuración de la cuenta")}><span className="citizen-avatar">{(user?.name||user?.email||"U").trim().charAt(0).toUpperCase()}</span><span className="citizen-user-name">{user?.name?.split(" ")[0]||t("Mi cuenta")}</span><span className="citizen-profile-chevron" aria-hidden="true">⌄</span></button>
      <div className="header-actions" data-tour="preferences"><label className="sr-only" htmlFor="language-select">Idioma</label><select id="language-select" value={language} onChange={e=>setLanguage(e.target.value)} aria-label={t("Seleccionar idioma")}>{languages.map(l=><option key={l.code} value={l.code}>{t(l.name)}{l.code===suggestedLanguage?` · ${t("sugerido")}`:""}</option>)}</select>
      <button className="tog notification-bell" onClick={()=>{const next=!bell;setBell(next);if(next)refreshNotifications()}} aria-label={`${t("Notificaciones")}, ${unreadCount} ${t("sin leer")}`} aria-expanded={bell}>🔔 {unreadCount>0&&<span className="notification-count">{unreadCount>99?"99+":unreadCount}</span>}</button>
      <label className="sr-only" htmlFor="region-select">{t("Región del Perú")}</label><select id="region-select" className="region-select" value={region} onChange={event=>chooseRegion(event.target.value)} aria-label={t("Elegir región del Perú")}>{regions.map(item=><option key={item} value={item}>{item}</option>)}</select>
      <button className="location-button location-icon-only" disabled={locationStatus==="loading"} onClick={async()=>{if(locationStatus==="tracking"){stopLocationTracking();return}setLocationNotice(null);await detectLocation()}} aria-label={t(locationStatus==="loading"?"Ubicando…":locationStatus==="tracking"?"Detener seguimiento de ubicación":"Usar ubicación")} title={t(locationStatus==="loading"?"Ubicando…":locationStatus==="tracking"?"Detener seguimiento de ubicación":"Usar ubicación")}><span aria-hidden="true">⌖</span></button>
      <button className="tog citizen-logout" onClick={logout} aria-label={t("Cerrar sesión")}>{t("Cerrar sesión")}</button></div>
      {bell&&<div className="card notification-menu" role="region" aria-label={t("Bandeja de notificaciones")}><div className="notification-menu-head"><div><b>{t("Notificaciones")}</b><span>{unreadCount?`${unreadCount} ${t("sin leer")}`:t("Todo al día")}</span></div><div><button onClick={refreshNotifications} disabled={notificationsLoading} aria-label={t("Actualizar notificaciones")}>{notificationsLoading?"…":"↻"}</button>{unreadCount>0&&<button onClick={markAllNotificationsRead}>{t("Marcar todas leídas")}</button>}</div></div>{notifications.length?notifications.map(item=><button key={item.id} className={`notification-item${item.read_at?"":" unread"}`} onClick={()=>openNotification(item)}><i aria-hidden="true"/><span><b>{item.title}</b><small>{item.message}</small><time>{new Date(item.created_at).toLocaleString("es-PE",{dateStyle:"short",timeStyle:"short"})}</time></span></button>):<div className="notification-empty"><span aria-hidden="true">♧</span><b>{t("Tu bandeja está vacía")}</b><small>{t("Aquí aparecerán avisos sobre tu cuenta, familiares y consultas de soporte.")}</small></div>}<p className="notification-disclaimer">{t("Avisos de este sitio; no son notificaciones oficiales de RENIEC.")}</p></div>}
      {locationNotice&&<div className="location-toast" role="status"><b>{locationNotice.error?t("Ubicación no disponible"):`${t("Región detectada:")} ${t(locationNotice.region)}`}</b><span>{locationNotice.error?t(locationNotice.error):`${t(locationNotice.suggestLanguage?"Idioma cambiado a":"Idioma sugerido:")} ${t(locationNotice.language==="ay"?"Aimara":locationNotice.language==="qu"?"Quechua":"Español")}. ${t("Puedes modificarlo en cualquier momento.")}`}</span>{locationNotice.error&&<button className="text-action" onClick={()=>go("ayuda")}>Ayuda con ubicación</button>}<button className="notice-close" onClick={()=>setLocationNotice(null)} aria-label={t("Cerrar aviso")}>×</button></div>}</header>
    {connectionLost&&<div className="offline-security-notice" role="alert"><span aria-hidden="true">◉</span><span><b>{t("Sin conexión")}</b><small>{t("La sesión se cerrará automáticamente tras tres minutos sin conexión.")}</small></span></div>}
    <div className="content">
      {view==="inicio"&&<Inicio go={go} tr={tr} load={load} name={user?.name} userId={user?.email} dni={user?.dni}/>}
      {view==="nuevo"&&<Nuevo key={pre.k} pre={pre.t} famInit={pre.f} familyMember={pre.familyMember} familyMembers={familyMembers} onDone={t=>setTr(l=>[{...t,e:0},...l])} go2={go}/>}
      {view==="mis"&&<Mis tr={tr} adv={adv}/>}
      {view==="familia"&&<div data-tour="family"><Familia go={go} citas={citas} addCita={addCita} onMembersChange={setFamilyMembers}/></div>}
      {view==="cuenta"&&<Cuenta user={user} onLogout={logout} onUserUpdate={setUser}/>}
      {view==="agencias"&&<div data-tour="offices"><Agencias region={region}/></div>}
      {view==="ayuda"&&<Ayuda big={big} setBig={setBig} load={load} setLoad={setLoad} setOpen={setOpen}/>}
      {view==="soporte"&&<Soporte/>}
      {view==="admin"&&<PanelAdmin user={user} onBack={()=>go("inicio")}/>}
    </div></div>
  {user?.isAdmin&&<button className="admin-shortcut" onClick={()=>go("admin")}>Panel de atención</button>}
  <nav className="tabs" aria-label="Menú móvil">{[["inicio","⌂","Inicio"],["mis","▤","Mis trámites"],["nuevo","＋","Trámites"],["familia","♧","Familia"],["agencias","⌖","Oficinas"],["cuenta","◉","Cuenta"],["ayuda","?","Ayuda"]].map(([id,icon,label])=><button key={id} className={view===id?"on":""} onClick={()=>go(id)}><span className="ico">{icon}</span>{label}</button>)}</nav>
  <div className="assist" data-tour="assistant"><button className="fab" onClick={()=>setOpen(true)}><span className="av2">💬</span><span><b>Asistente virtual</b><br/><small>Ayuda por texto o voz</small></span></button></div>
  <Assistant hint={HINT[view]||"Puedo orientarte sobre navegación, idiomas y trámites incluidos en este prototipo."} open={open} setOpen={setOpen} load={load} region={region} language={language} onHelp={()=>go("ayuda")}/>
  {showTour&&<Onboarding onClose={closeTour} onNavigate={view=>view&&setView(view)}/>}
  </div>);
}
