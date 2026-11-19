import {useState,useRef,useEffect} from "react";
import {TRAMITES,STEPS,PAGOS,FER,NIV,AGS,HRS,NAV,ESTADOS,SEED,FAMILIA,HINT} from "../data.js";
import {analyze,sharp,dias} from "../utils.js";
import { useLanguage } from "./LanguageProvider.jsx";


export default function Nuevo({pre,famInit,familyMembers=[],onDone,go2}){
  const { t: translate } = useLanguage();
  const [step,setStep]=useState(0);
  const [tr,setTr]=useState(pre||null);
  const [fam,setFam]=useState(famInit||1);
  const [selectedFamily,setSelectedFamily]=useState([]);
  const [dni,setDni]=useState("");
  const [nom,setNom]=useState("");
  const [foto,setFoto]=useState(null);
  const [pago,setPago]=useState("");
  const [done,setDone]=useState(false);
  const [busy,setBusy]=useState(false);
  const [doc,setDoc]=useState(null);const [nomDoc,setNomDoc]=useState("");
  const [cameraOpen,setCameraOpen]=useState(false);const [cameraError,setCameraError]=useState("");
  const videoRef=useRef(null);const streamRef=useRef(null);
  const norm=q=>q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
  const nomDif=!!(nomDoc.trim()&&nom.trim()&&norm(nomDoc)!==norm(nom));
  const upDoc=e=>{const f=e.target.files[0];if(!f)return;const fo=/^image\/|^application\/pdf$/.test(f.type);
    const base=[{k:"Formato",ok:fo,t:fo?"Formato válido":"Usa imagen o PDF"},{k:"Tamaño",ok:f.size<5e6,t:f.size<5e6?"Tamaño adecuado":"Supera los 5 MB"}];
    if(f.type.startsWith("image/"))sharp(f,v=>{const ok=v!==null&&v>40;setDoc({res:[...base,{k:"Nitidez",ok,t:ok?"Texto legible":"Imagen borrosa: vuelve a tomarla"}]})});else setDoc({res:base});};
  const t=TRAMITES.find(x=>x.id===tr);
  const dniOk=/^\d{8}$/.test(dni),nomOk=nom.trim().split(/\s+/).length>=2;
  const fotoOk=foto&&foto.res.every(r=>r.ok);
  const total=t?t.p*fam:0;
  const can=[!!tr,dniOk&&nomOk,!!fotoOk||!!(foto&&tr==="acta"),true,!!pago][step];
  const upload=e=>{const f=e.target.files?.[0];if(!f)return;setBusy(true);analyze(f,r=>{setFoto(r);setBusy(false)});e.target.value=""};
  const stopCamera=()=>{streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;setCameraOpen(false)};
  const openCamera=async()=>{setCameraError("");if(!navigator.mediaDevices?.getUserMedia){setCameraError("Este navegador no permite abrir la cámara. Usa la opción para subir una foto.");return}try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});streamRef.current=stream;setCameraOpen(true)}catch(error){setCameraError(error.name==="NotAllowedError"?"Autoriza el uso de la cámara en el navegador o sube una foto.":"No se pudo abrir la cámara. Comprueba los permisos o sube una foto.")}};
  const capturePhoto=()=>{const video=videoRef.current;if(!video?.videoWidth)return setCameraError("La cámara aún no está lista. Espera un momento.");const canvas=document.createElement("canvas");canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d").drawImage(video,0,0);canvas.toBlob(blob=>{if(!blob)return setCameraError("No se pudo capturar la imagen.");const file=new File([blob],"foto-documento.jpg",{type:"image/jpeg"});setBusy(true);analyze(file,result=>{setFoto(result);setBusy(false)});stopCamera()},"image/jpeg",.92)};
  useEffect(()=>{if(cameraOpen&&videoRef.current&&streamRef.current){videoRef.current.srcObject=streamRef.current;videoRef.current.play().catch(()=>{})}},[cameraOpen]);
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(track=>track.stop()),[]);
  const needPhoto=tr!=="acta";
  const go=d=>{let n=step+d;if(!needPhoto&&n===2)n+=d;setStep(Math.max(0,Math.min(4,n)));if(step===2)stopCamera()};
  const reset=()=>{stopCamera();setStep(0);setTr(null);setFam(1);setSelectedFamily([]);setDni("");setNom("");setFoto(null);setPago("");setDone(false)};
  const issues=[];
  if(needPhoto&&foto)foto.res.filter(r=>!r.ok).forEach(r=>issues.push(r.t));
  if(!dniOk)issues.push("DNI incompleto");
  if(doc)doc.res.filter(r=>!r.ok).forEach(r=>issues.push("Documento: "+r.t));
  if(nomDif)issues.push("El nombre del documento no coincide con el titular");

  return(<>
  <div style={{display:"grid",gap:16}}>
    <nav className="card steps" aria-label="Pasos">
      {STEPS.map((s,i)=><div key={s} className={"step"+(i===step&&!done?" on":"")+(i<step||done?" done":"")}><i>{i<step||done?"✓":i+1}</i>{s}</div>)}
    </nav>
    <main className="card">
    {done?<>
      <h2>Demostración completada</h2>
      <p className="sub">No se creó un expediente oficial ni se envió información a RENIEC.</p>
      <div className="ticket">Código de seguimiento<br/><b>RN-{(dni.slice(-4)||"0000")}-{String(total*7+1000)}</b></div>
      <p>{t.n} · {fam} {fam>1?"personas":"persona"} · Pago con {pago}</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="btn" onClick={()=>go2("mis")}>Ver seguimiento</button><button className="btn ghost" onClick={reset}>Iniciar otro trámite</button></div>
    </>:<>
    {step===0&&<>
      <h2>{translate("¿Qué trámite necesitas?")}</h2><p className="sub">Explora una guía de demostración para ti o para organizar información familiar.</p>
      <div className="opts">{TRAMITES.map(x=><button key={x.id} className={"opt"+(tr===x.id?" sel":"")} onClick={()=>setTr(x.id)}><b>{x.n}</b><span>{x.d}</span></button>)}</div>
      {t&&<div className="card" style={{marginTop:12}}><b>Orientación de ejemplo</b><ul style={{margin:"8px 0",paddingLeft:20}}>{t.r.map(x=><li key={x}>{x}</li>)}</ul><p className="muted-line">Confirma requisitos y tasas vigentes en los canales oficiales. Este prototipo no procesa pagos ni presenta solicitudes.</p></div>}
      {familyMembers.length>0&&<fieldset className="family-select"><legend>Familiares de tu cuenta (opcional)</legend><p className="muted-line">Solo selecciona personas para organizar el formulario. Esto no verifica identidad ni presenta un trámite.</p>{familyMembers.map(member=><label key={member.id} className="family-select-item"><input type="checkbox" checked={selectedFamily.includes(member.id)} onChange={event=>setSelectedFamily(current=>event.target.checked?[...current,member.id]:current.filter(id=>id!==member.id))}/>{member.name} · {member.relationship}</label>)}</fieldset>}
      <label htmlFor="fam">Personas en esta gestión de demostración</label>
      <select id="fam" value={fam} onChange={e=>setFam(+e.target.value)}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n===1?"Solo para mí":n+" personas"}</option>)}</select>
    </>}
    {step===1&&<>
      <h2>{translate("Tus datos")}</h2><p className="sub">Validamos mientras escribes, así evitas rechazos al final.</p>
      <label htmlFor="dni">N.º de DNI {fam>1&&"(titular)"}</label>
      <input id="dni" type="tel" inputMode="numeric" maxLength={8} value={dni} onChange={e=>setDni(e.target.value.replace(/\D/g,""))} placeholder="8 dígitos"/>
      {dni&&!dniOk&&<div className="err">Faltan {8-dni.length} dígitos</div>}
      <label htmlFor="nom">Nombres y apellidos</label>
      <input id="nom" type="text" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Como figura en tu DNI"/>
      {nom&&!nomOk&&<div className="err">Escribe al menos un nombre y un apellido</div>}
      <label htmlFor="d">Documento de sustento (opcional: acta o constancia)</label>
      <input id="d" type="file" accept="image/*,application/pdf" onChange={upDoc}/>
      {doc&&<ul className="chk" aria-live="polite">{doc.res.map(r=><li key={r.k}><b className={r.ok?"ok":"warn"}>{r.ok?"✓":"!"}</b><span><b>{r.k}:</b> {r.t}</span></li>)}</ul>}
      {doc&&<><label htmlFor="nd">Nombre que figura en el documento</label><input id="nd" type="text" value={nomDoc} onChange={e=>setNomDoc(e.target.value)}/>{nomDif&&<div className="err">No coincide con el titular ({nom}). Revísalo antes de continuar.</div>}</>}
    </>}
    {step===2&&<>
      <h2>{translate("Foto de orientación")}</h2><p className="sub">Sube una imagen o usa la cámara para recibir comprobaciones visuales locales. No es una validación oficial de RENIEC.</p>
      <div className="photo">
        {foto?<img src={foto.url} alt="Vista previa de tu fotografía"/>:<div className="ph">Sin foto</div>}
        <div>
          <input id="f" type="file" accept="image/*" capture="user" onChange={upload} style={{display:"none"}}/>
          <div className="camera-actions"><label htmlFor="f" className="btn" style={{display:"inline-block",margin:0,cursor:"pointer"}}>{foto?"Subir otra foto":"Subir una foto"}</label><button type="button" className="btn ghost" onClick={cameraOpen?stopCamera:openCamera}>{cameraOpen?"Cerrar cámara":"Abrir cámara"}</button></div>
          {cameraError&&<p className="form-error" role="alert">{cameraError}</p>}
          {cameraOpen&&<div className="camera-preview"><video ref={videoRef} autoPlay muted playsInline aria-label="Vista de la cámara"/><button type="button" className="btn" onClick={capturePhoto}>Tomar foto</button></div>}
          {busy&&<p>Analizando…</p>}
          {foto&&<ul className="chk" aria-live="polite">{foto.res.map(r=><li key={r.k}><b className={r.ok?"ok":"warn"}>{r.ok?"✓":"!"}</b><span><b>{r.k}:</b> {r.t}</span></li>)}</ul>}
        </div>
      </div>
    </>}
    {step===3&&<>
      <h2>{translate("Revisión previa")}</h2><p className="sub">Antes de enviar, comprobamos que todo esté en orden.</p>
      <table><tbody>
        <tr><td>Trámite</td><td>{t.n}</td></tr><tr><td>Personas</td><td>{fam}</td></tr>
        <tr><td>DNI</td><td>{dni}</td></tr><tr><td>Titular</td><td>{nom}</td></tr>
        {doc&&<tr><td>Documento</td><td className={doc.res.every(r=>r.ok)&&!nomDif?"ok":"warn"}>{doc.res.every(r=>r.ok)&&!nomDif?"Consistente":"Con observaciones"}</td></tr>}
        {needPhoto&&<tr><td>Foto</td><td className={fotoOk?"ok":"warn"}>{fotoOk?"Validada":"Con observaciones"}</td></tr>}
      </tbody></table>
      {issues.length?<ul className="chk">{issues.map(i=><li key={i}><b className="warn">!</b>{i}</li>)}</ul>:<p className="ok"><b>✓ Sin errores detectados. Listo para pagar.</b></p>}
    </>}
    {step===4&&<>
      <h2>Resumen de demostración</h2><p className="sub">No ingreses datos de pago: este prototipo no cobra ni envía solicitudes a RENIEC.</p>
      <div className="opts c3">{PAGOS.map(p=><button key={p} className={"opt"+(pago===p?" sel":"")} onClick={()=>setPago(p)}><b>{p}</b></button>)}</div>
      <p className="sub" style={{borderLeft:"4px solid var(--gold)",paddingLeft:10}}>No introduzcas datos bancarios. Consulta los canales oficiales para realizar pagos reales.</p>
      <p style={{fontSize:"1rem",fontWeight:700}}>Importe de referencia no oficial: S/ {total.toFixed(2)} <span style={{fontSize:".85rem",fontWeight:400,color:"var(--mut)"}}>(verifica el monto oficial antes de pagar)</span></p>
    </>}
    <div className="nav">
      <button className="btn ghost" onClick={()=>go(-1)} disabled={step===0}>{translate("Atrás")}</button>
      {step<4?<button className="btn" disabled={!can} onClick={()=>go(1)}>{translate("Continuar")}</button>
             :<button className="btn" disabled={!can} onClick={()=>{setDone(true);onDone({id:"DEMO-"+Math.random().toString(36).slice(2,8).toUpperCase(),n:t.n,fam,pago:"No procesado",total,fecha:new Date().toLocaleDateString("es-PE"),demo:true})}}>Finalizar demostración</button>}
    </div></>}
    </main>
  </div>
  </>);
}
