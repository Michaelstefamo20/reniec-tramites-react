import {useState} from "react";
import {ESTADOS} from "../data.js";
import { useLanguage } from "./LanguageProvider.jsx";


export default function Mis({tr,adv}){
  const {t}=useLanguage();
  const [f,setF]=useState("todos");const [o,setO]=useState(null);
  const l=tr.filter(x=>f==="todos"||(f==="curso")===(x.e<3));
  return(<>
  <div><h2>{t("Mis trámites")}</h2><p className="sub">{t("La actividad aquí es de demostración; no consulta el sistema de RENIEC.")}</p>
  <div className="chips">{[["todos","Todos"],["curso","En curso"],["fin","Finalizados"]].map(c=><button key={c[0]} onClick={()=>setF(c[0])} style={f===c[0]?{background:"var(--navy)",color:"#fff"}:{}}>{t(c[1])}</button>)}</div></div>
  {!l.length&&<div className="card">{t("No hay trámites en esta categoría.")}</div>}
  {l.map(x=><div key={x.id} className="card">
    <div className="mem"><div><b>{t(x.n)}</b><div style={{color:"var(--mut)",fontSize:".85rem"}}>{x.id} · {x.fecha} · {x.fam} {t(x.fam>1?"personas":"persona")} · S/ {x.total.toFixed(2)}</div></div><span className={"badge "+(x.e===3?"b-ok":"b-i")}>{t(ESTADOS[x.e])}</span></div>
    <div className="bar"><i style={{width:((x.e+1)/4*100)+"%"}}/></div>
    <button className="btn ghost" style={{padding:"6px 12px"}} onClick={()=>setO(o===x.id?null:x.id)}>{o===x.id?t("Ocultar seguimiento"):t("Ver seguimiento")}</button>
    {o===x.id&&<><ul className="tl">{ESTADOS.map((s,i)=><li key={s} className={i<=x.e?"d":""}>{t(s)}</li>)}</ul>{x.e<3&&<button className="btn" style={{padding:"8px 14px"}} onClick={()=>adv(x.id)}>{t("Simular avance (demo)")}</button>}</>}
  </div>)}</>);
}
