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

function loadFavorites(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed.filter(id => SERVICES.some(service => service.id === id)) : DEFAULT_SERVICES;
  } catch { return DEFAULT_SERVICES; }
}

export default function Inicio({ go, tr = [], name = "", userId = "guest" }) {
  const { t } = useLanguage();
  const key = `reniec-shortcuts:${encodeURIComponent(userId || "guest")}`;
  const [favorites, setFavorites] = useState(() => loadFavorites(key));
  const [editing, setEditing] = useState(false);
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

  return <div className="citizen-dashboard">
    <section className="dashboard-intro">
      <div><span className="eyebrow">SESIÓN INICIADA</span><h2>Hola, {name ? name.split(" ")[0] : "bienvenido"}. ¿Qué trámite necesitas hoy?</h2><p>Elige una opción y revisa la orientación disponible antes de continuar.</p></div>
      <span className="demo-pill"><i/> Portal de orientación · demostración</span>
    </section>
    <div className="citizen-layout">
      <section className="citizen-services" aria-labelledby="services-title">
        <div className="section-heading"><div><span className="eyebrow">SERVICIOS Y ORIENTACIÓN</span><h3 id="services-title">Trámites disponibles</h3></div><button className="text-action" onClick={() => setEditing(value => !value)}>{editing ? "Terminar" : "Personalizar accesos"} <span>{editing ? "✓" : "✎"}</span></button></div>
        {editing && <div className="card service-picker"><b>Elige qué accesos aparecen en tu tablero</b><div className="service-picker-list">{SERVICES.map(service => <label key={service.id} className="service-picker-item"><span>{service.icon} {service.title}<small>{service.description}</small></span><input type="checkbox" checked={favorites.includes(service.id)} onChange={() => toggle(service.id)} aria-label={`${favorites.includes(service.id) ? "Quitar" : "Agregar"} ${service.title}`} /></label>)}</div></div>}
        <div className="citizen-service-grid">{visible.map(service => <article className="citizen-service-card" key={service.id}><button className="citizen-service-open" onClick={() => openService(service)}><span className="citizen-service-icon" aria-hidden="true">{service.icon}</span><b>{t(service.title)}</b><span>{service.description}</span><i aria-hidden="true">↗</i></button>{editing && <button className="service-remove" onClick={() => toggle(service.id)}>Quitar del tablero</button>}</article>)}
          {!editing && <button className="citizen-service-card citizen-add-card" onClick={() => setEditing(true)}><span className="citizen-service-icon">＋</span><b>Añadir acceso</b><span>Personaliza las opciones a tu medida.</span></button>}
        </div>
        <div className="citizen-help-strip"><div><b>¿Necesitas orientación?</b><span>Revisa las preguntas frecuentes o envía una consulta al equipo del sitio.</span></div><button className="btn ghost compact" onClick={() => go("ayuda")}>Preguntas frecuentes</button><button className="btn compact" onClick={() => go("soporte")}>Contactar soporte</button></div>
      </section>
      <aside className="citizen-rail" aria-label="Resumen y seguimiento">
        <section className="card citizen-id-card"><div className="citizen-card-title"><b>Mi DNI</b><span className="badge b-w">No vinculado</span></div><strong className="citizen-masked-dni">•••• •••• ••</strong><div className="citizen-id-meta"><span>Este prototipo no consulta datos oficiales.</span><span>Datos no disponibles</span></div></section>
        <section className="card citizen-progress-card"><div className="citizen-card-title"><div><b>Trámite en curso</b><span className="citizen-caption">{active ? "Actividad de ejemplo" : "Aún no hay actividad"}</span></div><span className="badge b-w">Demostración</span></div>
          {active ? <><div className="citizen-steps"><div className="citizen-step is-done"><i>✓</i><span><b>Solicitud de ejemplo</b><small>{active.n}</small></span></div><div className="citizen-step is-current"><i>2</i><span><b>{ESTADOS[active.e]}</b><small>No consultado con RENIEC</small></span></div><div className="citizen-step"><i>3</i><span><b>Próximo paso</b><small>Depende del trámite real</small></span></div><div className="citizen-step"><i>4</i><span><b>Finalización</b><small>Estado oficial no disponible</small></span></div></div><button className="btn citizen-wide-button" onClick={() => go("mis")}>Ver actividad de ejemplo</button></> : <p className="muted-line">Cuando uses las funciones del prototipo, la actividad local aparecerá aquí.</p>}
        </section>
        <section className="card citizen-checklist"><b>Antes de realizar un trámite</b><ul><li><i>✓</i> Confirma los requisitos vigentes</li><li><i>○</i> Usa los canales oficiales de RENIEC</li><li><i>○</i> Verifica tasas y medios de pago</li><li><i>○</i> No compartas códigos ni contraseñas</li></ul></section>
      </aside>
    </div>
  </div>;
}
