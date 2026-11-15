import { useState } from "react";
import { useLanguage } from "./LanguageProvider.jsx";

const guide = [
  { title: "Bienvenido a Trámites+", text: "Encuentra tus trámites, revisa su estado y recibe orientación desde un solo lugar." },
  { title: "Elige y completa", text: "Selecciona el trámite, ingresa tus datos y sigue las indicaciones. Puedes volver atrás para corregir." },
  { title: "Revisa antes de enviar", text: "Verifica el resumen antes de confirmar. Usa el selector de idioma y las opciones de ayuda cuando las necesites." },
];

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();
  return <div className="tour-backdrop" role="presentation">
    <section className="tour card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <button className="tour-skip" onClick={onClose}>{t("Omitir tutorial")}</button>
      <div className="tour-count">{step + 1} / {guide.length}</div>
      <div className="tour-mark" aria-hidden="true">{["👋", "🧭", "✓"][step]}</div>
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
