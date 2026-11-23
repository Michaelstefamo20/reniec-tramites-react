import { useEffect } from "react";
import LOGO from "../assets/logo.png";

export default function AppSplash({ onFinish }) {
  useEffect(() => {
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer=window.setTimeout(onFinish,reduced?350:1900);
    return()=>window.clearTimeout(timer);
  },[onFinish]);

  return <div className="app-splash" role="status" aria-live="polite" aria-label="Cargando Mi DNI en línea">
    <div className="splash-orbit splash-orbit-one"/>
    <div className="splash-orbit splash-orbit-two"/>
    <div className="splash-brand-mark"><img src={LOGO} alt=""/><span className="splash-seal">R</span></div>
    <div className="splash-wordmark"><span>MI DNI EN LÍNEA</span><b>TRÁMITES+</b><small>Portal de orientación · prototipo independiente</small></div>
    <div className="splash-loader" aria-hidden="true"><i/></div>
  </div>;
}
