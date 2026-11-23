import {useEffect,useState} from "react";
import {authApi} from "../services/authApi.js";
import {useLanguage} from "./LanguageProvider.jsx";

export default function Cuenta({user,onLogout,onUserUpdate=()=>{}}){
  const {t}=useLanguage();
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [newEmail,setNewEmail]=useState("");
  const [pendingEmail,setPendingEmail]=useState(user?.pendingEmail||null);
  const [pendingEmailAuthorized,setPendingEmailAuthorized]=useState(false);
  const [showDni,setShowDni]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{let active=true;authApi.accountSecurity().then(data=>{if(active){setPendingEmail(data.pendingEmail||null);setPendingEmailAuthorized(Boolean(data.pendingEmailAuthorized));onUserUpdate(current=>current?{...current,pendingEmail:data.pendingEmail||null}:current)}}).catch(()=>{});return()=>{active=false}},[]);
  const changePassword=async event=>{
    event.preventDefault();setError("");setNotice("");
    if(newPassword!==confirmPassword){setError("Las contraseñas nuevas no coinciden.");return}
    setBusy(true);try{const result=await authApi.changePassword({currentPassword,newPassword});setNotice(result.message);setCurrentPassword("");setNewPassword("");setConfirmPassword("");setTimeout(()=>onLogout(),1200)}catch(e){setError(e.message)}finally{setBusy(false)}
  };
  const requestEmail=async event=>{
    event.preventDefault();setError("");setNotice("");setBusy(true);
    try{const result=await authApi.requestEmailChange({currentPassword,newEmail});setNotice(result.message);setCurrentPassword("");setNewEmail("");setPendingEmail(result.pendingEmail||newEmail);setPendingEmailAuthorized(false);onUserUpdate(current=>current?{...current,pendingEmail:result.pendingEmail||newEmail}:current)}catch(e){setError(e.message)}finally{setBusy(false)}
  };
  const cancelEmail=async()=>{setBusy(true);setError("");setNotice("");try{const result=await authApi.cancelEmailChange();setNotice(result.message);setPendingEmail(null);setPendingEmailAuthorized(false);onUserUpdate(current=>current?{...current,pendingEmail:null}:current)}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <main className="account-settings">
    <div className="account-settings-heading"><span className="eyebrow">{t("SEGURIDAD Y PRIVACIDAD")}</span><h2>{t("Configuración de la cuenta")}</h2><p>{t("Administra tus datos de acceso y las opciones de seguridad de esta cuenta.")}</p></div>
    <section className="card account-summary"><span className="account-summary-avatar">{(user?.name||user?.email||"U").charAt(0).toUpperCase()}</span><div><small>{t("Sesión activa")}</small><b>{user?.name}</b><span>{user?.email}</span>{pendingEmail&&<small className="account-pending-email">{t(pendingEmailAuthorized?"Correo actual confirmado. Falta confirmar en el correo nuevo.":"Pendiente de confirmación en el correo actual.")}: {pendingEmail}</small>}</div><button className="btn ghost compact" onClick={onLogout}>{t("Cerrar sesión")}</button></section>
    {error&&<p className="form-error" role="alert">{t(error)}</p>}{notice&&<p className="form-status" role="status">{t(notice)}</p>}
    <section className="card account-security-card"><div className="account-card-heading"><span className="account-security-icon">▣</span><div><h3>{t("Cambiar contraseña")}</h3><p>{t("Confirma tu contraseña actual. Al cambiarla, se cerrarán las otras sesiones.")}</p></div></div><form onSubmit={changePassword}><label htmlFor="account-current-password">{t("Contraseña actual")}</label><input id="account-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><label htmlFor="account-new-password">{t("Contraseña nueva")}</label><input id="account-new-password" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><label htmlFor="account-confirm-password">{t("Repite la contraseña nueva")}</label><input id="account-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/><small className="field-hint">{t("Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.")}</small><button className="btn" disabled={busy}>{busy?t("Guardando…"):t("Actualizar contraseña")}</button></form></section>
    <section className="card account-security-card"><div className="account-card-heading"><span className="account-security-icon">✉</span><div><h3>{t("Cambiar correo electrónico")}</h3><p>{t("Primero confirma la solicitud en tu correo actual; después confirmas el cambio desde el correo nuevo.")}</p></div></div><form onSubmit={requestEmail}><label htmlFor="account-current-password-email">{t("Confirma tu contraseña")}</label><input id="account-current-password-email" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><label htmlFor="account-new-email">{t("Correo nuevo")}</label><input id="account-new-email" type="email" autoComplete="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required placeholder="nombre@ejemplo.com"/><button className="btn" disabled={busy}>{busy?t("Enviando…"):t("Enviar confirmación al correo nuevo")}</button></form><div className="account-security-note"><b>{t("Dos confirmaciones obligatorias")}</b><span>{t("Primero se autoriza desde el correo actual y luego se confirma desde el correo nuevo. Cada enlace es de un solo uso y vence en 30 minutos.")}</span></div>{pendingEmail&&<button className="btn ghost compact" disabled={busy} onClick={cancelEmail}>{t("Cancelar cambio de correo pendiente")}</button>}</section>
    <section className="card account-security-card"><div className="account-card-heading"><span className="account-security-icon">◉</span><div><h3>{t("Privacidad del DNI")}</h3><p>{t("El DNI se cifra en el servidor y solo se muestra en esta sesión. Ocúltalo al compartir la pantalla.")}</p></div></div><div className="account-dni-row"><b>{showDni&&/^\d{8}$/.test(String(user?.dni||""))?`${user.dni.slice(0,4)} ${user.dni.slice(4)}`:"•••• ••••"}</b><button className="btn ghost compact" onClick={()=>setShowDni(value=>!value)}>{t(showDni?"Ocultar DNI":"Mostrar DNI")}</button></div><p className="account-security-note">{t("Las sesiones vencen automáticamente y la aplicación cierra la sesión tras tres minutos sin conexión.")}</p></section>
  </main>;
}
