import {useEffect,useState} from "react";
import {supportApi} from "../services/authApi.js";
import Soporte from "./Soporte.jsx";

export default function PanelAdmin({user,onBack}){
  const [stats,setStats]=useState(null);const [error,setError]=useState("");
  useEffect(()=>{supportApi.adminList().then(data=>{const list=data.inquiries||[];setStats({open:list.filter(x=>x.status==="open").length,working:list.filter(x=>x.status==="in_progress").length,resolved:list.filter(x=>x.status==="resolved").length,total:list.length})}).catch(e=>setError(e.message))},[]);
  if(!user?.isAdmin)return <main className="auth-page"><section className="auth-card"><h1>Acceso restringido</h1><p>Este panel está disponible solo para el personal de atención autorizado.</p><button className="btn" onClick={onBack}>Volver a trámites</button></section></main>;
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><span className="admin-seal">R</span><div><b>RENIEC · Atención</b><small>Panel interno de soporte</small></div></div><div className="admin-account">{user.email}<button className="btn ghost" onClick={onBack}>Salir del panel</button></div></header><section className="admin-content"><div className="admin-title"><div><span className="eyebrow">GESTIÓN DE SERVICIO</span><h1>Consultas ciudadanas</h1><p>Revisa, responde y marca como resueltas las solicitudes recibidas.</p></div><span className="admin-live"><i/> Servicio de consultas</span></div>{error&&<p className="form-error" role="alert">{error}</p>}<div className="admin-metrics"><div className="card metric"><span>Abiertas</span><b>{stats?.open??"—"}</b></div><div className="card metric"><span>En atención</span><b>{stats?.working??"—"}</b></div><div className="card metric"><span>Resueltas</span><b>{stats?.resolved??"—"}</b></div><div className="card metric"><span>Total recibido</span><b>{stats?.total??"—"}</b></div></div><Soporte admin/></section></main>;
}
