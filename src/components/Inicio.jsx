import { useEffect, useState } from "react";
import { authApi } from "../services/authApi.js";
import { useLanguage } from "./LanguageProvider.jsx";
import Demanda from "./Demanda.jsx";
import { ESTADOS } from "../data.js";

const SERVICES = [
  { id: "renew", title: "Renovar DNI", description: "Orientación para renovar tu documento", icon: "🪪", kind: "procedure", procedure: "renov" },
  { id: "duplicate", title: "Duplicado de DNI", description: "Orientación por pérdida o deterioro", icon: "📄", kind: "procedure", procedure: "dup" },
  { id: "acts", title: "Copias de actas", description: "Nacimiento, matrimonio o defunción", icon: "📜", kind: "procedure", procedure: "acta" },
  { id: "family", title: "Mi familia", description: "Organiza gestiones para tu hogar", icon: "👨‍👩‍👧", kind: "view", view: "familia" },
  { id: "support", title: "Mis consultas", description: "Contacta al equipo de soporte del sitio", icon: "💬", kind: "view", view: "soporte" },
  { id: "appointments", title: "Citas y orientación", description: "Consulta opciones de orientación disponibles", icon: "📅", kind: "view", view: "familia" },
];
const DEFAULT_SERVICES = ["renew", "duplicate", "acts", "family"];

function loadFavorites(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed.filter(id => SERVICES.some(service => service.id === id)) : DEFAULT_SERVICES;
  } catch { return DEFAULT_SERVICES; }
}

export default function Inicio({ go, tr, load, name = "", resolvedCount = 0, userId = "guest" }) {
  const { t } = useLanguage();
  const key = `reniec-shortcuts:${encodeURIComponent(userId || "guest")}`;
  const [favorites, setFavorites] = useState(() => loadFavorites(key));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    authApi.getPreferences().then(data => {
      if (active && Array.isArray(data.shortcuts)) {
        const valid = data.shortcuts.filter(id => SERVICES.some(service => service.id === id));
        setFavorites(valid);
        localStorage.setItem(key, JSON.stringify(valid));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [key]);
  const active = tr.find(x => x.e < 3);
  const selectedServices = SERVICES.filter(service => favorites.includes(service.id));
  const toggle = id => {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(key, JSON.stringify(next));
    authApi.setPreferences(next).catch(() => {});
  };
  const openService = service => {
    if (service.kind === "procedure") go("nuevo", { t: service.procedure, f: 1 });
    else go(service.view);
  };

  return <div className="home-dashboard">
    <section className="welcome-hero"><div className="welcome-copy"><span className="eyebrow">TRÁMITES DIGITALES · ORIENTACIÓN CIUDADANA</span><h2>{name ? `Hola, ${name.split(" ")[0]}` : t("Hola, bienvenido")}</h2><p>Encuentra orientación clara, organiza tus accesos y revisa tus gestiones desde un mismo lugar.</p><button className="btn hero-action" onClick={() => go("nuevo")}>Explorar trámites <span aria-hidden="true">→</span></button></div><div className="hero-illustration" aria-hidden="true"><div className="hero-orb">🪪</div><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✦</span></div></section>
    <section className="status-strip"><span className={`status-dot ${load ? "busy" : ""}`}/><div><b>Portal de orientación</b><span>Los trámites y estados oficiales requieren validación e integración autorizada con RENIEC.</span></div><span className="status-tag">Prototipo</span></section>
    <section className="home-section"><div className="section-heading"><div><span className="eyebrow">TU TABLERO</span><h3>Accesos para ti</h3><p className="muted-line">Personaliza qué opciones aparecen primero en tu cuenta.</p></div><button className="text-action" onClick={() => setEditing(value => !value)}>{editing ? "Listo" : "Personalizar"} <span>✎</span></button></div>
      <div className="service-grid">{selectedServices.map(service => <div key={service.id} className="service-card-wrap"><button className="service-card" onClick={() => openService(service)}><span className="service-icon">{service.icon}</span><b>{t(service.title)}</b><span>{service.description}</span><i aria-hidden="true">↗</i></button>{editing && <button className="service-remove" onClick={() => toggle(service.id)} aria-label={`Quitar ${service.title}`}>Quitar acceso</button>}</div>)}
        {!editing && <button className="service-card add-service-card" onClick={() => setEditing(true)}><span className="service-icon">＋</span><b>Añadir opciones</b><span>Elige qué servicios quieres tener a mano.</span></button>}
      </div>
      {editing && <div className="card service-picker"><div><b>Catálogo de accesos</b><p className="muted-line">Puedes agregar o quitar accesos cuando quieras.</p></div><div className="service-picker-list">{SERVICES.map(service => <label key={service.id} className="service-picker-item"><span>{service.icon} {service.title}<small>{service.description}</small></span><input type="checkbox" checked={favorites.includes(service.id)} onChange={() => toggle(service.id)} aria-label={`${favorites.includes(service.id) ? "Quitar" : "Agregar"} ${service.title}`} /></label>)}</div></div>}
    </section>
    <section className="home-lower"><div className="home-main-column">{active && <div className="card current-procedure"><div className="section-heading"><div><span className="eyebrow">EJEMPLO DE SEGUIMIENTO</span><h3>Actividad de demostración</h3></div><span className="badge b-i">{ESTADOS[active.e]}</span></div><b>{active.n}</b><p className="muted-line">Código demostrativo {active.id} · {active.fecha}</p><p className="muted-line">No representa un estado consultado en los sistemas oficiales de RENIEC.</p><div className="bar"><i style={{ width: ((active.e + 1) / 4 * 100) + "%" }}/></div><button className="btn ghost compact" onClick={() => go("mis")}>Ver ejemplo</button></div>}<Demanda/></div><aside className="home-side-column"><div className="card help-card"><span className="help-icon">✦</span><span className="eyebrow">TE ACOMPAÑAMOS</span><h3>¿Tienes una consulta?</h3><p>Envía una consulta al equipo de este sitio y revisa su respuesta.</p>{resolvedCount > 0 && <div className="resolved-alert">✓ Tienes {resolvedCount} respuesta{resolvedCount === 1 ? "" : "s"} nueva{resolvedCount === 1 ? "" : "s"}</div>}<button className="btn ghost compact" onClick={() => go("soporte")}>Ir a mis consultas</button></div><div className="card safety-card"><span className="safety-icon">🛡️</span><div><b>Cuida tu información</b><p>No compartas contraseñas, códigos de activación ni datos bancarios. Usa siempre canales oficiales para trámites reales.</p></div></div></aside></section>
  </div>;
}
