import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";


export default function Demanda(){const ds=dias(10),best=ds.filter(x=>x.lv===0).slice(0,2);
  return(<div className="card"><b>Mejor momento para tu trámite</b><p style={{margin:"4px 0 10px",color:"var(--mut)",fontSize:".85rem"}}>Predicción de demanda con datos de ejemplo: anticipa feriados y días críticos.</p>
  <div className="days">{ds.map(x=><span key={x.lbl} className={"day d"+x.lv}>{x.lbl}<small>{NIV[x.lv]}</small></span>)}</div>
  {best.length>0&&<p style={{margin:"10px 0 0"}}>✅ Recomendado: <b>{best.map(x=>x.lbl).join(" o ")}</b></p>}</div>);}
