import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider.jsx";

const guide = [
  { target: "brand", title: "Bienvenido a Mi DNI en línea", text: "Este espacio reúne accesos de orientación y herramientas del prototipo. No es un portal oficial de RENIEC." },
  { target: "navigation", view:"inicio", title: "Navega por las secciones", text: "Desde aquí puedes volver al inicio, revisar actividad de ejemplo, gestionar familiares, buscar oficinas y abrir Ayuda." },
  { target: "services", view:"inicio", title: "Elige tus accesos", text: "Abre una opción o personaliza qué accesos aparecen en tu tablero. Las gestiones disponibles son demostrativas." },
  { target: "tracking", view:"inicio", title: "Revisa la actividad de ejemplo", text: "Esta columna ilustra cómo podría organizarse un seguimiento. No consulta expedientes ni datos de RENIEC." },
  { target: "family", view:"familia", title: "Organiza a tus familiares", text: "Agrega o quita personas de tu cuenta. Esta lista es privada y no verifica parentescos ni identidad." },
  { target: "offices", view:"agencias", title: "Busca oficinas en el mapa", text: "Puedes buscar por región o usar tu ubicación. El mapa usa datos abiertos y puede estar incompleto; confirma la información antes de viajar." },
  { target: "preferences", view:"inicio", title: "Idioma y ubicación", text: "Cambia el idioma y la región manualmente, o permite ubicación para sugerir una configuración. Puedes detener el seguimiento cuando quieras." },
  { target: "assistant", view:"inicio", title: "Pide orientación", text: "El asistente virtual explica cómo usar el prototipo. No compartas DNI, contraseñas ni datos de pago." },
];

export default function Onboarding({ onClose, onNavigate }) {
  const [step, setStep] = useState(0);
  const [targetRect,setTargetRect]=useState(null);
  const [bubble,setBubble]=useState(null);
  const cardRef=useRef(null);
  const { t } = useLanguage();
  const current = guide[step];
  const navigateRef=useRef(onNavigate);
  useEffect(()=>{navigateRef.current=onNavigate},[onNavigate]);

  useEffect(() => {
    navigateRef.current?.(current.view);
    setTargetRect(null);setBubble(null);
    let frame;
    let update;
    const timer=setTimeout(()=>{
      const target=document.querySelector(`[data-tour="${current.target}"]`);
      if(!target)return;
      target.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
      update=()=>{const rect=target.getBoundingClientRect();setTargetRect({top:rect.top,left:rect.left,width:rect.width,height:rect.height})};
      frame=requestAnimationFrame(()=>requestAnimationFrame(update));
      window.addEventListener("resize",update);window.addEventListener("scroll",update,true);
    },120);
    return()=>{clearTimeout(timer);if(frame)cancelAnimationFrame(frame);if(update){window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true)}};
  }, [current.target,current.view]);

  useEffect(()=>{
    if(!targetRect||!cardRef.current)return;
    const card=cardRef.current.getBoundingClientRect();
    const margin=14,gap=18;
    const spaceBelow=window.innerHeight-(targetRect.top+targetRect.height);
    const placeBelow=spaceBelow>=card.height+gap+margin||spaceBelow>=targetRect.top;
    const top=placeBelow?Math.min(window.innerHeight-card.height-margin,targetRect.top+targetRect.height+gap):Math.max(margin,targetRect.top-card.height-gap);
    const targetCenter=targetRect.left+targetRect.width/2;
    const left=Math.max(margin,Math.min(window.innerWidth-card.width-margin,targetCenter-card.width/2));
    const arrowLeft=Math.max(24,Math.min(card.width-40,targetCenter-left));
    setBubble({top,left,arrow:placeBelow?"top":"bottom",arrowLeft});
  },[targetRect,step]);

  const finish = outcome => onClose(outcome);
  const move = direction => setStep(value => Math.max(0, Math.min(guide.length - 1, value + direction)));

  return <div className="guided-tour" role="presentation">
    <div className="guided-tour-shade"/>
    <section ref={cardRef} className={`guided-tour-card card${bubble?` arrow-${bubble.arrow}`:""}`} style={bubble?{top:bubble.top,left:bubble.left,"--tour-arrow-left":`${bubble.arrowLeft}px`}:{top:"50%",left:"50%",transform:"translate(-50%,-50%)"}} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
      <div className="guided-tour-top"><span className="guided-tour-brand"><i>R</i> Mi DNI en línea</span><button className="guided-tour-skip" onClick={()=>finish("skipped")}>{t("Omitir tutorial")}</button></div>
      <div className="guided-tour-progress"><span style={{width:`${((step+1)/guide.length)*100}%`}}/></div>
      <div className="guided-tour-meta"><span>GUÍA INICIAL</span><b>{String(step+1).padStart(2,"0")} <i>/</i> {String(guide.length).padStart(2,"0")}</b></div>
      <div className="guided-tour-mark" aria-hidden="true">{["✦","☷","▦","◷","♧","⌖","文","✧"][step]}</div>
      <h2 id="tour-title">{guide[step].title}</h2>
      <p id="tour-description">{guide[step].text}</p>
      <div className="guided-tour-controls"><button className="btn ghost" onClick={()=>move(-1)} disabled={step===0}>Anterior</button><div className="guided-tour-dots" aria-label={`Paso ${step+1} de ${guide.length}`}>{guide.map((item,index)=><span key={item.target} className={index===step?"active":""}/>)}</div><button className="btn" onClick={()=>step===guide.length-1?finish("completed"):move(1)}>{step===guide.length-1?"Finalizar":"Siguiente"}</button></div>
    </section>
    {targetRect&&<div className="guided-tour-focus" aria-hidden="true" style={{top:targetRect.top-6,left:targetRect.left-6,width:targetRect.width+12,height:targetRect.height+12}}/>}
  </div>;
}
