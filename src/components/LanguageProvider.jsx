import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGE_OPTIONS, sourceText, translate } from "../locales.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "reniec-prototype-language";
const REGION_KEY = "reniec-prototype-region";
const regions = ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"];
const quechuaRegions = ["Apurímac", "Ayacucho", "Cusco", "Huancavelica", "Huánuco", "Junín", "Áncash", "Arequipa", "Lima", "Pasco"];
const aymaraRegions = ["Puno", "Tacna", "Moquegua"];
const textRecords=new WeakMap();
const attributeRecords=new WeakMap();
const TRANSLATED_ATTRIBUTES=["placeholder","title","aria-label","aria-description"];

function translateTextNode(node,language){
  if(!node?.nodeValue||!node.nodeValue.trim())return;
  const parent=node.parentElement;
  if(parent?.closest("[data-no-translate],script,style,textarea,code,pre"))return;
  let record=textRecords.get(node);
  const current=node.nodeValue;
  const original=sourceText(current);
  if(!record){record={source:original,translated:null};textRecords.set(node,record)}
  else if(current!==record.translated&&current!==record.source){record.source=original;record.translated=null}
  const leading=record.source.match(/^\s*/)?.[0]||"";
  const trailing=record.source.match(/\s*$/)?.[0]||"";
  const core=record.source.slice(leading.length,record.source.length-trailing.length);
  const translated=leading+translate(core,language)+trailing;
  record.translated=translated;
  if(node.nodeValue!==translated)node.nodeValue=translated;
}

function translateElementAttributes(element,language){
  let records=attributeRecords.get(element);
  if(!records){records=new Map();attributeRecords.set(element,records)}
  if(element.closest("[data-no-translate],script,style,textarea,code,pre"))return;
  for(const name of TRANSLATED_ATTRIBUTES){
    if(!element.hasAttribute(name))continue;
    const current=element.getAttribute(name);
    let record=records.get(name);
    const original=sourceText(current);
    if(!record){record={source:original,translated:null};records.set(name,record)}
    else if(current!==record.translated&&current!==record.source){record.source=original;record.translated=null}
    const translated=translate(record.source,language);record.translated=translated;
    if(current!==translated)element.setAttribute(name,translated);
  }
}

function translateSubtree(root,language){
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root,language);return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE){translateElementAttributes(root,language);if(["SCRIPT","STYLE","TEXTAREA","CODE","PRE"].includes(root.tagName))return}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode()))translateTextNode(node,language);
}

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
  const watchId = useRef(null);
  const lastLookup = useRef(0);
  const languageRef = useRef(language);
  const t = useMemo(() => (text) => translate(text, language), [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    languageRef.current = language;
    const root=document.getElementById("root");
    if(!root)return;
    translateSubtree(root,language);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==="characterData")translateTextNode(record.target,language);
        else if(record.type==="attributes")translateElementAttributes(record.target,language);
        else for(const node of record.addedNodes)translateSubtree(node,language);
      }
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:TRANSLATED_ATTRIBUTES});
    return()=>observer.disconnect();
  }, [language]);
  useEffect(() => { localStorage.setItem(REGION_KEY, region); }, [region]);

  const detectLocation = async () => {
    setLocationStatus("loading");
    setLocationNotice(null);
    try {
      const position = await getCoordinates();
      await updateDetectedPosition(position);
      if (navigator.geolocation.watchPosition && watchId.current === null) {
        watchId.current = navigator.geolocation.watchPosition(nextPosition => {
          if (Date.now() - lastLookup.current >= 60000) updateDetectedPosition(nextPosition).catch(() => {});
        }, () => {}, { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 });
      }
      setLocationStatus(watchId.current === null ? "success" : "tracking");
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

  const updateDetectedPosition = async position => {
      lastLookup.current = Date.now();
      const params = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        localityLanguage: "es",
      });
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
      if (!response.ok) throw new Error("No se pudo consultar la región de la ubicación.");
      const result = await response.json();
      if (result.countryCode && result.countryCode !== "PE") throw new Error("La ubicación detectada está fuera del Perú. Elige tu región manualmente.");
      const detectedRegion = findRegion(result.localityInfo?.administrative?.map(item => item.name).join(", ")
        ? { state: result.principalSubdivision, region: result.localityInfo.administrative.map(item => item.name).join(", "), city: result.city }
        : { state: result.principalSubdivision, region: result.locality, city: result.city });
      if (!detectedRegion) throw new Error("No pudimos identificar una región del Perú. Elige una manualmente.");
      const suggested = suggestion(detectedRegion);
      setRegion(detectedRegion);
      setLocationStatus(watchId.current === null ? "success" : "tracking");
      setLocationNotice({ region: detectedRegion, language: suggested, suggestLanguage: suggested !== languageRef.current });
      if (suggested !== languageRef.current) setLanguage(suggested);
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setLocationStatus("idle");
  };

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const value = {
    language, setLanguage, region, setRegion,
    suggestedLanguage: suggestion(region), regions, languages: LANGUAGE_OPTIONS, t,
    locationStatus, locationNotice, setLocationNotice, detectLocation, stopLocationTracking,
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return value;
}
