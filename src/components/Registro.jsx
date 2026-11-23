import { useState } from "react";
import { authApi } from "../services/authApi.js";
const query = new URLSearchParams(location.search);
const activationToken = query.get("token");
const activationAction = query.get("action") || (query.get("setup") === "1" ? "setup-password" : "");
const activationMode = activationAction === "setup-password" && Boolean(activationToken);
const emailChangeMode=activationAction==="change-email"&&Boolean(activationToken);
const resetMode = Boolean(activationToken) && !activationMode&&!emailChangeMode;

export default function Registro({ onRegister }) {
  const [mode, setMode] = useState(() => activationMode ? "setup" : emailChangeMode?"confirm-email":resetMode ? "reset" : "register");
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault(); setError(""); setStatus(""); setBusy(true);
    try {
      let action;
      if(mode==="confirm-email")action=()=>authApi.confirmEmailChange(activationToken);
      else if (mode === "register") {
        const cleanName = name.trim().replace(/\s+/g, " ");
        if (cleanName.split(" ").length < 2 || cleanName.length > 100) throw new Error("Ingresa tus nombres y apellidos.");
        if (!/^\d{8}$/.test(dni)) throw new Error("El DNI debe tener exactamente 8 dígitos.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) throw new Error("Ingresa una dirección de correo válida.");
        action = () => authApi.register({ name: cleanName, dni, email: email.trim().toLowerCase() });
      } else if (mode === "setup") {
        if (!validPassword(password)) throw new Error("Crea una contraseña de 12 caracteres o más, con mayúscula, minúscula, número y símbolo.");
        action = () => authApi.setupPassword({ token: activationToken, password });
      } else if (mode === "login") {
        action = () => authApi.login({ email: email.trim().toLowerCase(), password });
      } else if (mode === "forgot") {
        action = () => authApi.forgotPassword({ email: email.trim().toLowerCase() });
      } else {
        if (!validPassword(password)) throw new Error("Usa una contraseña de 12 caracteres o más, con mayúscula, minúscula, número y símbolo.");
        action = () => authApi.resetPassword({ token: activationToken, password });
      }
      const data = await action();
      if(mode==="confirm-email"){
        setMode("login");setEmail(data.email||"");setPassword("");setStatus(data.message||"Correo actualizado. Inicia sesión otra vez con tu nuevo correo.");history.replaceState({},"",location.pathname);
      }else if (mode === "register") {
        setStatus("Te enviamos un enlace a tu correo. Ábrelo para crear tu contraseña y activar la cuenta.");
        setDni(""); setPassword("");
      } else if (mode === "setup") {
        setMode("login"); setEmail(data.email || ""); setPassword(""); setStatus("Cuenta activada. Inicia sesión con el correo y la contraseña que acabas de crear.");
        history.replaceState({}, "", location.pathname);
      } else if (mode === "forgot") setStatus(data.message || "Si existe una cuenta verificada para ese correo, enviaremos un enlace para restablecer la contraseña.");
      else if (mode === "reset") { setMode("login"); setPassword(""); setStatus("Contraseña actualizada. Inicia sesión con la nueva contraseña."); history.replaceState({}, "", location.pathname); }
      else {
        const session = await authApi.currentUser().catch(() => null);
        onRegister(session?.user || data.user);
      }
    } catch (err) {
      setError(err.message || "No se pudo completar la solicitud.");
      if (err.message?.includes("Ya existe una cuenta")) setMode("login");
    } finally { setBusy(false); }
  };

  const title = mode === "confirm-email"?"Confirma tu correo nuevo":mode === "register" ? "Crea tu cuenta" : mode === "login" ? "Ingresa a tu cuenta" : mode === "forgot" ? "Recupera tu acceso" : mode === "setup" ? "Activa tu cuenta" : "Restablece tu contraseña";
  const lead = mode === "confirm-email"?"Al continuar, confirmas que tienes acceso al nuevo correo de tu cuenta.":mode === "register" ? "Ingresa tus datos y te enviaremos un enlace para terminar el registro." : mode === "login" ? "Accede para consultar y gestionar tus trámites." : mode === "forgot" ? "Te enviaremos un enlace seguro a tu correo registrado." : mode === "setup" ? "El enlace confirmó el acceso al correo. Ahora crea tu contraseña personal." : "Usa el enlace de recuperación para crear una contraseña nueva.";

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-emblem" aria-hidden="true">ID</div>
      <span className="auth-kicker">TRÁMITES+ · SERVICIOS DIGITALES</span>
      <h1>{title}</h1>
      <p className="auth-lead">{lead}</p>
      <div className="security-notice"><b>Protección de tu cuenta</b><span>La contraseña se crea dentro del sitio después de abrir el enlace. Nunca la enviaremos por correo. La validación oficial de identidad requiere una integración autorizada con RENIEC.</span></div>
      <form onSubmit={submit} noValidate>
        {mode==="confirm-email"&&<div className="security-notice"><b>Confirmación segura</b><span>El correo solo cambiará tras confirmar el enlace válido, de un solo uso y con tiempo limitado.</span></div>}
        {mode === "register" && <>
          <label htmlFor="reg-name">Nombres y apellidos</label>
          <input id="reg-name" type="text" autoComplete="name" maxLength={100} value={name} onChange={e=>setName(e.target.value.replace(/[<>]/g,""))} required placeholder="Como aparecen en tu DNI" />
          <label htmlFor="reg-dni">Número de DNI</label>
          <input id="reg-dni" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={dni} onChange={e=>setDni(e.target.value.replace(/\D/g,""))} required placeholder="8 dígitos" />
          <span className="field-hint">El DNI se cifra en el servidor y no se incluye en el correo.</span>
        </>}
        {mode !== "setup" && mode !== "reset" && <>
          <label htmlFor="reg-email">Correo electrónico</label>
          <input id="reg-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required placeholder="nombre@ejemplo.com" />
        </>}
        {(mode === "login" || mode === "setup" || mode === "reset") && <>
          <label htmlFor="reg-password">{mode === "login" ? "Contraseña" : "Crea tu contraseña"}</label>
          <input id="reg-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required />
          <span className="field-hint">Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.</span>
        </>}
        {error&&<p className="form-error" role="alert">{error}</p>}
        {status&&<p className="form-status" role="status">{status}</p>}
        <button className="btn auth-submit" type="submit" disabled={busy || ((mode === "setup" || mode === "reset"||mode==="confirm-email") && !activationToken)}>{busy?"Procesando…":mode==="confirm-email"?"Confirmar correo y volver a iniciar sesión":mode === "register"?"Enviar enlace de activación":mode === "login"?"Iniciar sesión":mode === "forgot"?"Enviar enlace":mode === "setup"?"Crear contraseña y activar":"Actualizar contraseña"}</button>
      </form>
      {mode === "login"&&<button className="auth-text-link" onClick={()=>{setMode("forgot");setError("");setStatus("")}}>Olvidé mi contraseña</button>}
      {mode === "forgot"&&<button className="auth-text-link" onClick={()=>{setMode("login");setError("");setStatus("")}}>Volver a iniciar sesión</button>}
      {mode === "login"&&<p className="auth-switch">¿Aún no tienes cuenta? <button onClick={()=>{setMode("register");setError("");setStatus("")}}>Crear cuenta</button></p>}
      {mode === "register"&&<p className="auth-switch">¿Ya tienes una cuenta? <button onClick={()=>{setMode("login");setError("");setStatus("")}}>Iniciar sesión</button></p>}
      <p className="auth-footer">El enlace de activación vence en 30 minutos y solo puede usarse una vez.</p>
    </section>
  </main>;
}

function validPassword(value) {
  return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
