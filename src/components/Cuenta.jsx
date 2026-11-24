import { useEffect, useState } from "react";
import { authApi } from "../services/authApi.js";
import { useLanguage } from "./LanguageProvider.jsx";

export default function Cuenta({ user, onLogout, onUserUpdate = () => {} }) {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(user?.pendingEmail || null);
  const [pendingEmailAuthorized, setPendingEmailAuthorized] = useState(false);
  const [showDni, setShowDni] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    authApi.accountSecurity().then(data => {
      if (!active) return;
      setPendingEmail(data.pendingEmail || null);
      setPendingEmailAuthorized(Boolean(data.pendingEmailAuthorized));
      onUserUpdate(current => current ? { ...current, pendingEmail: data.pendingEmail || null } : current);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const changePassword = async event => {
    event.preventDefault();
    setError(""); setNotice("");
    if (newPassword !== confirmPassword) { setError("Las contraseñas nuevas no coinciden."); return; }
    setBusy(true);
    try {
      const result = await authApi.changePassword({ currentPassword, newPassword });
      setNotice(result.message);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => onLogout(), 1200);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const requestEmail = async event => {
    event.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    try {
      const result = await authApi.requestEmailChange({ currentPassword, newEmail });
      const pending = result.pendingEmail || newEmail;
      setNotice(result.message); setCurrentPassword(""); setNewEmail("");
      setPendingEmail(pending); setPendingEmailAuthorized(false);
      onUserUpdate(current => current ? { ...current, pendingEmail: pending } : current);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const cancelEmail = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await authApi.cancelEmailChange();
      setNotice(result.message); setPendingEmail(null); setPendingEmailAuthorized(false);
      onUserUpdate(current => current ? { ...current, pendingEmail: null } : current);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || t("Mi cuenta");
  const dni = String(user?.dni || "");

  return <main className="account-settings">
    <header className="account-settings-heading">
      <div className="account-settings-heading-icon" aria-hidden="true">⚙</div>
      <div><span className="eyebrow">{t("SEGURIDAD Y PRIVACIDAD")}</span><h2>{t("Configuración de la cuenta")}</h2><p>{t("Administra tus datos de acceso y las opciones de seguridad de esta cuenta.")}</p></div>
    </header>

    <section className="account-summary card" aria-label={t("Resumen de la cuenta")}>
      <span className="account-summary-avatar" aria-hidden="true">{(user?.name || user?.email || "U").trim().charAt(0).toUpperCase()}</span>
      <div className="account-summary-details"><small>{t("Sesión activa")}</small><b>{firstName}</b><span>{user?.email}</span>
        <span className="account-verified"><i aria-hidden="true">✓</i>{t("Correo verificado")}</span>
        {pendingEmail && <span className="account-pending-email"><i aria-hidden="true">!</i>{t(pendingEmailAuthorized ? "Correo actual confirmado. Falta confirmar en el correo nuevo." : "Pendiente de confirmación en el correo actual.")} <b>{pendingEmail}</b></span>}
      </div>
      <button className="btn ghost compact account-summary-logout" onClick={onLogout}>{t("Cerrar sesión")}</button>
    </section>

    {error && <p className="form-error account-feedback" role="alert">{t(error)}</p>}
    {notice && <p className="form-status account-feedback" role="status">{t(notice)}</p>}

    <div className="account-settings-grid">
      <section className="card account-security-card">
        <div className="account-card-heading"><span className="account-security-icon account-icon-password" aria-hidden="true">▣</span><div><span className="account-section-kicker">{t("ACCESO")}</span><h3>{t("Cambiar contraseña")}</h3><p>{t("Confirma tu contraseña actual. Al cambiarla, se cerrarán las otras sesiones.")}</p></div></div>
        <form onSubmit={changePassword}>
          <label htmlFor="account-current-password">{t("Contraseña actual")}</label><input id="account-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required/>
          <label htmlFor="account-new-password">{t("Contraseña nueva")}</label><input id="account-new-password" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={event => setNewPassword(event.target.value)} required/>
          <label htmlFor="account-confirm-password">{t("Repite la contraseña nueva")}</label><input id="account-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required/>
          <small className="field-hint">{t("Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.")}</small>
          <button className="btn account-submit" disabled={busy}>{busy ? t("Guardando…") : t("Actualizar contraseña")}</button>
        </form>
      </section>

      <section className="card account-security-card">
        <div className="account-card-heading"><span className="account-security-icon account-icon-email" aria-hidden="true">✉</span><div><span className="account-section-kicker">{t("CORREO Y VERIFICACIÓN")}</span><h3>{t("Cambiar correo electrónico")}</h3><p>{t("Verifica primero tu correo actual y luego el nuevo para cambiar la dirección de la cuenta.")}</p></div></div>
        <form onSubmit={requestEmail}>
          <label htmlFor="account-current-password-email">{t("Confirma tu contraseña")}</label><input id="account-current-password-email" type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required/>
          <label htmlFor="account-new-email">{t("Correo nuevo")}</label><input id="account-new-email" type="email" autoComplete="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} required placeholder="nombre@ejemplo.com"/>
          <button className="btn account-submit" disabled={busy}>{busy ? t("Enviando…") : t("Iniciar verificación de correo")}</button>
        </form>
        <div className="account-security-note"><b><i aria-hidden="true">✓</i>{t("Dos confirmaciones obligatorias")}</b><span>{t("Primero se autoriza desde el correo actual y luego se confirma desde el correo nuevo. Cada enlace es de un solo uso y vence en 30 minutos.")}</span></div>
        {pendingEmail && <button className="btn ghost compact account-cancel-email" disabled={busy} onClick={cancelEmail}>{t("Cancelar cambio de correo pendiente")}</button>}
      </section>

      <section className="card account-security-card account-privacy-card">
        <div className="account-card-heading"><span className="account-security-icon account-icon-privacy" aria-hidden="true">◉</span><div><span className="account-section-kicker">{t("PRIVACIDAD")}</span><h3>{t("Privacidad del DNI")}</h3><p>{t("El DNI se cifra en el servidor y solo se muestra en esta sesión. Ocúltalo al compartir la pantalla.")}</p></div></div>
        <div className="account-dni-row"><b aria-label={t(showDni ? "DNI visible" : "DNI oculto")}>{showDni && /^\d{8}$/.test(dni) ? `${dni.slice(0, 4)} ${dni.slice(4)}` : "•••• ••••"}</b><button className="btn ghost compact" aria-pressed={showDni} onClick={() => setShowDni(value => !value)}>{t(showDni ? "Ocultar DNI" : "Mostrar DNI")}</button></div>
        <p className="account-security-note">{t("Las sesiones vencen automáticamente y la aplicación cierra la sesión tras tres minutos sin conexión.")}</p>
      </section>
    </div>
  </main>;
}
