import { useEffect, useState } from "react";
import { authApi } from "../services/authApi.js";
import { useLanguage } from "./LanguageProvider.jsx";
import { ESTADOS } from "../data.js";

const SERVICES = [
  { id: "first", title: "Primera inscripción", description: "Orientación general para iniciar", icon: "＋", kind: "help" },
  { id: "renew", title: "Renovación", description: "Guía para renovar tu documento", icon: "⟳", kind: "procedure", procedure: "renov" },
  { id: "duplicate", title: "Duplicado", description: "Orientación por pérdida o robo", icon: "▣", kind: "procedure", procedure: "dup" },
  { id: "address", title: "Cambio de domicilio", description: "Información para actualizar datos", icon: "⌂", kind: "help" },
  { id: "rectify", title: "Rectificación de datos", description: "Orientación para corregir información", icon: "✎", kind: "help" },
  { id: "appointment", title: "Citas", description: "Opciones de orientación y agenda demo", icon: "▦", kind: "view", view: "familia" },
  { id: "acts", title: "Copias de actas", description: "Nacimiento, matrimonio o defunción", icon: "▤", kind: "procedure", procedure: "acta" },
  { id: "family", title: "Mi familia", description: "Organiza accesos para tu hogar", icon: "♧", kind: "view", view: "familia" },
  { id: "support", title: "Contactar soporte", description: "Escribe al equipo de este sitio", icon: "✉", kind: "view", view: "soporte" },
  { id: "offices", title: "Buscar oficinas", description: "Busca en el mapa por región o distrito", icon: "⌖", kind: "view", view: "agencias" },
];
const DEFAULT_SERVICES = ["first", "renew", "duplicate", "address", "rectify", "appointment", "offices"];

function maskDni(value="") { const number=String(value||""); return /^\d{8}$/.test(number)?`${number.slice(0,2)} •••• ${number.slice(-2)}`:"•••• ••••"; }

function loadFavorites(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed.filter(id => SERVICES.some(service => service.id === id)) : DEFAULT_SERVICES;
  } catch { return DEFAULT_SERVICES; }
}

export default function Inicio({ go, tr = [], name = "", userId = "guest", dni = "" }) {
  const { t } = useLanguage();
  const key = `reniec-shortcuts:${encodeURIComponent(userId || "guest")}`;
  const [favorites, setFavorites] = useState(() => loadFavorites(key));
  const [editing, setEditing] = useState(false);
  const [showDni,setShowDni]=useState(false);
  const active = tr.find(item => item.e < 3);

  useEffect(() => {
    let activeRequest = true;
    authApi.getPreferences().then(data => {
      if (activeRequest && Array.isArray(data.shortcuts)) {
        const valid = data.shortcuts.filter(id => SERVICES.some(service => service.id === id));
        setFavorites(valid);
        localStorage.setItem(key, JSON.stringify(valid));
      }
    }).catch(() => {});
    return () => { activeRequest = false; };
  }, [key]);

  const toggle = id => {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(key, JSON.stringify(next));
    authApi.setPreferences(next).catch(() => {});
  };
  const openService = service => {
    if (service.kind === "procedure") go("nuevo", { t: service.procedure, f: 1 });
    else if (service.kind === "view") go(service.view);
    else go("ayuda");
  };
  const visible = SERVICES.filter(service => favorites.includes(service.id));

  return <div className="citizen-dashboard" data-tour="dashboard">
    <section className="dashboard-intro">
      <div><span className="eyebrow">{t("Sesión iniciada")}</span><h2>{t("Hola")}, <span data-no-translate="true">{name ? name.split(" ")[0] : t("bienvenido")}</span>. {t("¿Qué trámite necesitas hoy?")}</h2><p>{t("Elige una opción y revisa la orientación disponible antes de continuar.")}</p></div>
      <span className="demo-pill"><i/> {t("Portal de orientación · demostración")}</span>
    </section>
    <div className="citizen-layout">
      <section className="citizen-services" data-tour="services" aria-labelledby="services-title">
        <div className="section-heading"><div><span className="eyebrow">{t("SERVICIOS Y ORIENTACIÓN")}</span><h3 id="services-title">{t("Trámites disponibles")}</h3></div><button className={`access-settings-button${editing?" is-editing":""}`} onClick={() => setEditing(value => !value)}><span className="access-settings-icon" aria-hidden="true">{editing?"✓":"☷"}</span><span><b>{editing?t("Terminar edición"):t("Personalizar accesos")}</b><small>{editing?t("Guarda tu selección"):t("Elige tus accesos rápidos")}</small></span><span className="access-settings-arrow" aria-hidden="true">{editing?"":"›"}</span></button></div>
        {editing && <div className="card service-picker"><div className="service-picker-heading"><span className="service-picker-heading-icon">✦</span><div><b>{t("Elige qué accesos aparecen en tu tablero")}</b><small>{t("Tus cambios se guardan en tu cuenta")}</small></div></div><div className="service-picker-list">{SERVICES.map(service => <label key={service.id} className={`service-picker-item${favorites.includes(service.id)?" selected":""}`}><span className="service-picker-item-icon">{service.icon}</span><span className="service-picker-item-copy"><b>{t(service.title)}</b><small>{t(service.description)}</small></span><input type="checkbox" checked={favorites.includes(service.id)} onChange={() => toggle(service.id)} aria-label={`${t(favorites.includes(service.id) ? "Quitar" : "Agregar")} ${t(service.title)}`}  /></label>)}</div><p className="service-picker-hint">{t("Selecciona las opciones que quieres mostrar en tu inicio.")}</p></div>}
        <div className="citizen-service-grid">{visible.map(service => <article className="citizen-service-card" key={service.id}><button className="citizen-service-open" onClick={() => openService(service)}><span className="citizen-service-icon" aria-hidden="true">{service.icon}</span><b>{t(service.title)}</b><span>{t(service.description)}</span><i aria-hidden="true">↗</i></button>{editing && <button className="service-remove" onClick={() => toggle(service.id)}>{t("Quitar del tablero")}</button>}</article>)}
          {!editing && <button className="citizen-service-card citizen-add-card" onClick={() => setEditing(true)}><span className="citizen-service-icon">＋</span><b>{t("Añadir acceso")}</b><span>{t("Personaliza las opciones a tu medida.")}</span></button>}
        </div>
        <div className="citizen-help-strip"><div><b>{t("¿Necesitas orientación?")}</b><span>{t("Revisa las preguntas frecuentes o envía una consulta al equipo del sitio.")}</span></div><button className="btn ghost compact" onClick={() => go("ayuda")}>{t("Preguntas frecuentes")}</button><button className="btn compact" onClick={() => go("soporte")}>{t("Contactar soporte")}</button></div>
      </section>
      <aside className="citizen-rail" data-tour="tracking" aria-label={t("Resumen y seguimiento")}>
        <section className="card citizen-id-card"><div className="citizen-card-title"><div><b>{t("Mi DNI")}</b><span className="citizen-id-caption">{t("Número registrado en tu cuenta")}</span></div><span className="badge b-w">{t("Dato personal")}</span></div><div className="citizen-dni-row"><strong className="citizen-masked-dni" aria-label={t(showDni?"DNI visible":"DNI oculto")}>{showDni&&/^\d{8}$/.test(String(dni))?`${dni.slice(0,4)} ${dni.slice(4)}`:maskDni(dni)}</strong><button type="button" className="dni-reveal-button" onClick={()=>setShowDni(value=>!value)} aria-pressed={showDni} aria-label={t(showDni?"Ocultar DNI":"Mostrar DNI")}>{showDni?"◉":"◎"}<span>{t(showDni?"Ocultar":"Mostrar")}</span></button></div><div className="citizen-id-meta"><span>{t("Cifrado en el servidor; visible solo tras iniciar sesión")}</span><span>{t("No consultado con RENIEC")}</span></div></section>
        <section className="card citizen-progress-card"><div className="citizen-card-title"><div><b>{t("Trámite en curso")}</b><span className="citizen-caption">{active ? t("Actividad de ejemplo") : t("Aún no hay actividad")}</span></div><span className="badge b-w">{t("Demostración")}</span></div>
          {active ? <><div className="citizen-steps"><div className="citizen-step is-current"><i>1</i><span><b>{t(active.n)}</b><small>{t(ESTADOS[active.e])} · {t("Actividad local; no es estado oficial")}</small></span></div><div className="citizen-step"><i>2</i><span><b>{t("Siguiente acción")}</b><small>{t("Consulta los requisitos en RENIEC")}</small></span></div><div className="citizen-step"><i>3</i><span><b>{t("Finalización")}</b><small>{t("El portal no consulta expedientes oficiales")}</small></span></div></div><button className="btn citizen-wide-button" onClick={() => go("mis")}>{t("Ver actividad de ejemplo")}</button></> : <p className="muted-line">{t("Cuando uses las funciones del prototipo, la actividad local aparecerá aquí.")}</p>}
        </section>
        <section className="card citizen-checklist"><b>{t("Antes de realizar un trámite")}</b><ul><li><i>✓</i> {t("Confirma los requisitos vigentes")}</li><li><i>○</i> {t("Usa los canales oficiales de RENIEC")}</li><li><i>○</i> {t("Verifica tasas y medios de pago")}</li><li><i>○</i> {t("No compartas códigos ni contraseñas")}</li></ul></section>
      </aside>
    </div>
  </div>;
}
