import { useEffect,useState } from "react";
import CitaConjunta from "./CitaConjunta.jsx";
import { authApi } from "../services/authApi.js";

export default function Familia({go,citas,addCita,onMembersChange=()=>{}}){
  const [members,setMembers]=useState([]);
  const [name,setName]=useState("");
  const [relationship,setRelationship]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const refresh=()=>authApi.familyMembers().then(data=>{const list=data.members||[];setMembers(list);onMembersChange(list)}).catch(e=>setError(e.message));
  useEffect(()=>{refresh()},[]);
  const add=async event=>{event.preventDefault();setBusy(true);setError("");setNotice("");try{await authApi.addFamilyMember({name,relationship});setName("");setRelationship("");setNotice("Familiar añadido a tu cuenta.");await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}};
  const remove=async id=>{setBusy(true);setError("");try{await authApi.removeFamilyMember(id);setMembers(items=>items.filter(member=>member.id!==id))}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <section className="family-page">
    <div><span className="eyebrow">ESPACIO PERSONAL</span><h2>Mi familia</h2><p className="sub">Añade personas de tu familia a esta cuenta para tenerlas a mano. Solo tú puedes ver la lista.</p></div>
    <form className="card family-add-form" onSubmit={add}><h3>Añadir familiar</h3><p className="muted-line">No ingreses su DNI aquí. Añadir a una persona no crea ni envía un trámite oficial.</p><div className="family-form-fields"><div><label htmlFor="family-name">Nombre</label><input id="family-name" type="text" value={name} maxLength={100} onChange={e=>setName(e.target.value)} required placeholder="Nombre y apellido"/></div><div><label htmlFor="family-relationship">Vínculo familiar</label><input id="family-relationship" type="text" value={relationship} maxLength={50} onChange={e=>setRelationship(e.target.value)} required placeholder="Ej.: hija, padre, cónyuge"/></div><button className="btn" disabled={busy||name.trim().length<2||relationship.trim().length<2}>{busy?"Guardando…":"Añadir familiar"}</button></div>{error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-status" role="status">{notice}</p>}</form>
    <div className="family-members-heading"><h3>Personas añadidas</h3><span>{members.length} / 20</span></div>
    {!members.length&&<div className="card family-empty"><span aria-hidden="true">♧</span><b>Aún no has añadido familiares</b><p>Cuando agregues a alguien, aparecerá solo en tu cuenta.</p></div>}
    <div className="family-members">{members.map(member=><article key={member.id} className="card family-member"><div className="family-person"><div className="av">{member.name.charAt(0).toUpperCase()}</div><div><b>{member.name}</b><span>{member.relationship}</span><small>Información de contacto o identidad no registrada</small></div></div><div className="family-actions"><button className="btn ghost compact" onClick={()=>go("nuevo",{t:"renov",f:1,familyMember:member.id})}>Ver orientación de trámite</button><button className="service-remove" disabled={busy} onClick={()=>remove(member.id)}>Quitar</button></div></article>)}</div>
    <div className="family-notice"><b>Privacidad</b><span>La lista solo sirve para organizar esta cuenta. Aún no está vinculada a RENIEC ni verifica parentescos.</span></div>
    <CitaConjunta citas={citas} addCita={addCita}/>
  </section>;
}
