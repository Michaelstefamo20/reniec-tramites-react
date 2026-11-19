import {useEffect,useState} from "react";
import {supportApi} from "../services/authApi.js";

export default function Soporte({admin=false}){
  const [items,setItems]=useState([]);const [subject,setSubject]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");
  const refresh=async()=>{setError("");try{const result=admin?await supportApi.adminList():await supportApi.mine();setItems(result.inquiries||[])}catch(e){setError(e.message)}};
  useEffect(()=>{refresh()},[admin]);
  const submit=async e=>{e.preventDefault();setBusy(true);setError("");setNotice("");try{await supportApi.create({subject,message});setSubject("");setMessage("");setNotice("Consulta enviada. Te avisaremos cuando el equipo responda.");await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}};
  const update=async(item,status)=>{const reply=window.prompt(status==="resolved"?"Escribe la respuesta que recibirá la persona:":"Respuesta opcional para la consulta:",item.staff_reply||"");if(reply===null)return;setBusy(true);setError("");try{await supportApi.update(item.public_id,{status,reply:reply.trim()||undefined});await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <section className="support-page">
    <div className="support-heading"><div><span className="eyebrow">CENTRO DE AYUDA</span><h2>{admin?"Bandeja de atención":"Mis consultas"}</h2><p>{admin?"Gestiona solicitudes de usuarios y avisa cuando estén resueltas.":"Envía una consulta y consulta su estado desde tu cuenta."}</p></div><button className="btn ghost" onClick={refresh}>Actualizar</button></div>
    {!admin&&<form className="card support-form" onSubmit={submit}><h3>¿Necesitas ayuda?</h3><label htmlFor="support-subject">Asunto</label><input id="support-subject" value={subject} maxLength={120} onChange={e=>setSubject(e.target.value)} required placeholder="Ej.: No puedo completar mi trámite"/><label htmlFor="support-message">Cuéntanos qué ocurrió</label><textarea id="support-message" rows="4" maxLength={3000} value={message} onChange={e=>setMessage(e.target.value)} required placeholder="Describe tu consulta. No incluyas contraseñas ni números completos de tarjeta."/><button className="btn" disabled={busy||subject.trim().length<4||message.trim().length<10}>{busy?"Enviando…":"Enviar consulta"}</button></form>}
    {notice&&<p className="form-status" role="status">{notice}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
    <div className="support-list"><div className="support-list-title"><h3>{admin?"Solicitudes":"Historial"}</h3><span>{items.length} en pantalla</span></div>
      {!items.length&&<div className="card empty-support">Aún no hay consultas para mostrar.</div>}
      {items.map(item=><article className="card support-item" key={item.public_id}><div className="support-item-top"><div><span className={`support-status status-${item.status}`}>{item.status_label||statusText(item.status)}</span><h4>{item.subject}</h4></div><time>{new Date(item.updated_at||item.created_at).toLocaleString("es-PE")}</time></div>{admin&&<p className="support-owner">Solicitante: {item.email}</p>}<p className="support-body">{item.message}</p>{item.staff_reply&&<div className="support-reply"><b>Respuesta del equipo</b><p>{item.staff_reply}</p></div>}{!admin&&item.status==="resolved"&&<p className="resolved-note">✓ Tu consulta fue atendida. Revisa la respuesta del equipo.</p>}{admin&&<div className="support-actions"><button className="btn ghost" disabled={busy||item.status==="in_progress"} onClick={()=>update(item,"in_progress")}>Tomar consulta</button><button className="btn" disabled={busy||item.status==="resolved"} onClick={()=>update(item,"resolved")}>Responder y resolver</button></div>}</article>)}
    </div>
  </section>;
}
function statusText(status){return status==="resolved"?"Resuelta":status==="in_progress"?"En atención":"Abierta"}
