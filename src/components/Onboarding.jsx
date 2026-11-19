import { useState } from "react";
import { useLanguage } from "./LanguageProvider.jsx";

const guide = [
  { title: "Bienvenido a Trámites+", text: "Este prototipo reúne orientación y accesos para que encuentres con facilidad lo que buscas." },
  { title: "Personaliza tu tablero", text: "Añade o quita accesos desde «Personalizar». Tus preferencias se guardan en tu cuenta." },
  { title: "Ubicación e idioma", text: "Puedes permitir el acceso a ubicación para sugerir región e idioma. También puedes elegirlos manualmente." },
  { title: "Usa el asistente y las consultas", text: "El asistente ofrece orientación general. Para solicitar ayuda al equipo, abre Mis consultas." },
  { title: "Confirma antes de gestionar", text: "Revisa cada dato. Los trámites, pagos y estados oficiales requieren conexión autorizada con RENIEC." },
];

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();
  return <div className="tour-backdrop" role="presentation">
    <section className="tour card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <button className="tour-skip" onClick={onClose}>{t("Omitir tutorial")}</button>
      <div className="tour-count">{step + 1} / {guide.length}</div>
      <div className="tour-mark" aria-hidden="true">{["👋", "🧭", "📍", "💬", "✓"][step]}</div>
      <h2 id="tour-title">{guide[step].title}</h2>
      <p className="sub">{guide[step].text}</p>
      <div className="tour-dots" aria-label={`Paso ${step + 1} de ${guide.length}`}>
        {guide.map((item, index) => <span key={item.title} className={index === step ? "active" : ""} />)}
      </div>
      <button className="btn" onClick={() => step === guide.length - 1 ? onClose() : setStep(step + 1)}>
        {step === guide.length - 1 ? t("Finalizar") : t("Siguiente")}
      </button>
    </section>
  </div>;
}
