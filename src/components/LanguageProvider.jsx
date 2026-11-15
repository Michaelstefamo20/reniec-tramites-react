import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGE_OPTIONS, translate } from "../locales.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "reniec-prototype-language";
const REGION_KEY = "reniec-prototype-region";
const regions = ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"];
const quechuaRegions = ["Apurímac", "Ayacucho", "Cusco", "Huancavelica", "Huánuco", "Junín", "Áncash", "Arequipa", "Lima", "Pasco"];
const aymaraRegions = ["Puno", "Tacna", "Moquegua"];

function normalize(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findRegion(address = {}) {
  const labels = [address.state, address.region, address.county, address.city, address.town, address.municipality]
    .filter(Boolean).map(normalize);
  return regions.find(region => labels.some(label => label === normalize(region) || label.includes(normalize(region)))) || null;
}

function suggestion(region) {
  if (aymaraRegions.includes(region)) return "ay";
  if (quechuaRegions.includes(region)) return "qu";
  return "es";
}

function getCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Este navegador no ofrece acceso a ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
  });
}

export function LanguageProvider({ children }) {
  const [region, setRegion] = useState(() => localStorage.getItem(REGION_KEY) || "Lima");
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || "es");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationNotice, setLocationNotice] = useState(null);
  const t = useMemo(() => (text) => translate(text, language), [language]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, language); document.documentElement.lang = language; }, [language]);
  useEffect(() => { localStorage.setItem(REGION_KEY, region); }, [region]);

  const detectLocation = async () => {
    setLocationStatus("loading");
    setLocationNotice(null);
    try {
      const position = await getCoordinates();
      const params = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        localityLanguage: "es",
      });
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
      if (!response.ok) throw new Error("No se pudo consultar la región de la ubicación.");
      const result = await response.json();
      const detectedRegion = findRegion(result.localityInfo?.administrative?.map(item => item.name).join(", ")
        ? { state: result.principalSubdivision, region: result.localityInfo.administrative.map(item => item.name).join(", "), city: result.city }
        : { state: result.principalSubdivision, region: result.locality, city: result.city });
      if (!detectedRegion) throw new Error("No pudimos identificar una región del Perú. Elige una manualmente.");
      const suggested = suggestion(detectedRegion);
      setRegion(detectedRegion);
      setLocationStatus("success");
      setLocationNotice({ region: detectedRegion, language: suggested });
    } catch (error) {
      setLocationStatus("error");
      const message = error.code === 1
        ? "No se autorizó la ubicación. Puedes elegir tu región manualmente."
        : error.code === 3
          ? "La ubicación tardó demasiado. Inténtalo otra vez o elige tu región manualmente."
          : error.message || "No pudimos detectar tu ubicación. Elige tu región manualmente.";
      setLocationNotice({ error: message });
    }
  };

  const value = {
    language, setLanguage, region, setRegion,
    suggestedLanguage: suggestion(region), regions, languages: LANGUAGE_OPTIONS, t,
    locationStatus, locationNotice, setLocationNotice, detectLocation,
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return value;
}
