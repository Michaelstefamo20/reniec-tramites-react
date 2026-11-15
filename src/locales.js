export const LANGUAGE_OPTIONS = [
  { code: "es", name: "Español", regions: ["all"] },
  { code: "qu", name: "Quechua", regions: ["Apurímac", "Ayacucho", "Cusco", "Huancavelica", "Huánuco", "Junín", "Puno"] },
  { code: "ay", name: "Aimara", regions: ["Puno", "Tacna", "Moquegua"] },
];

const translations = {
  qu: {
    "Inicio": "Qallariy", "Nuevo trámite": "Musuq ruwana", "Mis trámites": "Ruwasqaykuna", "Mi familia": "Aylluy", "Ayuda": "Yanapay",
    "Hola, bienvenido": "Allin hamusqayki", "Realiza tus trámites de identidad sin colas ni errores.": "Identidadniykimanta ruwanakunata ruray, mana siqikuna ni pantaykuna.",
    "Iniciar un trámite": "Ruwana qallariy", "Accesos rápidos": "Utqay yaykuna", "Renovar DNIe": "DNIe musuqchay", "Duplicado": "Iskay DNI mañay", "Copia de acta": "Acta qillqasqa mañay", "Trámite familiar": "Ayllu ruwana",
    "¿Qué trámite necesitas?": "¿Ima ruwanatataq munanki?", "Tus datos": "Willakuyniyki", "Foto con validación en tiempo real": "Rikchay, kunan pacha chiqapchasqa", "Revisión previa": "Ñawpaq qhawariy", "Pago integrado": "Hukllapi qullqi pagay",
    "Atrás": "Qhipaman", "Continuar": "Qatiy", "Idioma": "Rimay", "Región": "Suyu", "Omitir tutorial": "Yachachiyta saqiy", "Siguiente": "Qatiq", "Finalizar": "Tukuy", "Comenzar tutorial": "Yachachiy qallariy",
  },
  ay: {
    "Inicio": "Qallta", "Nuevo trámite": "Machaq lurawi", "Mis trámites": "Lurawinakaja", "Mi familia": "Familija", "Ayuda": "Yanapa",
    "Hola, bienvenido": "Aski jutäwi", "Realiza tus trámites de identidad sin colas ni errores.": "Jaqi uñt'ayäwi lurawinakamxa jan siqimpi jan pantjasisa luram.",
    "Iniciar un trámite": "Mä lurawi qalltaña", "Accesos rápidos": "Jank'aki mantaña", "Renovar DNIe": "DNIe machaqar tukuyaña", "Duplicado": "Payïr DNI mayiña", "Copia de acta": "Qillqata copia mayiña", "Trámite familiar": "Familia lurawi",
    "¿Qué trámite necesitas?": "¿Kuna lurawsa munta?", "Tus datos": "Yatiyäwinakama", "Foto con validación en tiempo real": "Jichha pachan uñakipata jamuqa", "Revisión previa": "Nayraqata uñakipäwi", "Pago integrado": "Mä chiqaru paylläwi",
    "Atrás": "Qhipäxaru", "Continuar": "Sarantaña", "Idioma": "Aru", "Región": "Suyu", "Omitir tutorial": "Yatichäwi jaytaña", "Siguiente": "Jutiri", "Finalizar": "Tukuyäwi", "Comenzar tutorial": "Yatichäwi qalltaña",
  },
};

export function translate(text, language) {
  return translations[language]?.[text] || text;
}
