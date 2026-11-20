import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider.jsx";

const REGIONS=["Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"];
const ZOOM=13,COLS=4,ROWS=3,TILE=256;

export default function Agencias({region="Lima"}){
  const {t}=useLanguage();
  const [selectedRegion,setSelectedRegion]=useState(region);
  const [district,setDistrict]=useState("");
  const [items,setItems]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("Las ubicaciones vienen de datos abiertos de OpenStreetMap y pueden estar incompletas. Confirma la atención en RENIEC.");
  const [position,setPosition]=useState(null);
  const [selected,setSelected]=useState(null);
  const center=useMemo(()=>selected||position||fallbackCenter(selectedRegion),[selected,position,selectedRegion]);
  const map=useMemo(()=>buildMap(center),[center]);
  const markers=items.map((item,index)=>({...item,index,...markerPosition(Number(item.lat),Number(item.lon),map)})).filter(item=>item.x>=0&&item.x<=100&&item.y>=0&&item.y<=100);

  const find=async(lat,lon)=>{
    setBusy(true);setError("");setItems([]);setSelected(null);
    try{
      const params=new URLSearchParams({region:selectedRegion});
      if(district.trim())params.set("district",district.trim());
      if(lat!==undefined&&lon!==undefined){params.set("latitude",String(lat));params.set("longitude",String(lon));}
      let response;
      try{response=await fetch(`/api/agencies?${params}`,{headers:{Accept:"application/json"},credentials:"same-origin",signal:AbortSignal.timeout(18000)})}catch(cause){throw new Error(cause.name==="TimeoutError"?"La búsqueda tardó demasiado. Intenta otra vez.":"No se pudo conectar con el servicio del mapa. Comprueba tu conexión e inténtalo otra vez.")}
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||`No se pudo consultar el mapa (${response.status}).`);
      const matches=result.items||[];
      setItems(matches);
      if(lat!==undefined&&lon!==undefined)setPosition({lat,lon});
      else if(matches[0])setSelected({lat:Number(matches[0].lat),lon:Number(matches[0].lon)});
      setNotice(result.notice||"Los resultados vienen de datos abiertos; confirma los detalles en los canales oficiales de RENIEC.");
    }catch(e){setError(e.message||"No se pudo buscar oficinas.")}
    finally{setBusy(false)}
  };
  const nearMe=()=>{
    if(!navigator.geolocation){setError("Este navegador no ofrece ubicación. Selecciona una región y distrito manualmente.");return}
    setBusy(true);setError("");navigator.geolocation.getCurrentPosition(pos=>{const coords={lat:pos.coords.latitude,lon:pos.coords.longitude};setPosition(coords);find(coords.lat,coords.lon)},e=>{setBusy(false);setError(e.code===1?"Permite la ubicación o busca por región y distrito.":"No se pudo obtener la ubicación. Busca por región y distrito.")},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  };
  return <section className="agency-page">
    <div><span className="eyebrow">{t("DIRECTORIO Y MAPA")}</span><h2>{t("Encuentra una oficina cercana")}</h2><p className="sub">{t("Busca por departamento y distrito, o permite ubicación para ordenar resultados próximos.")}</p></div>
    <div className="card agency-search"><div className="agency-fields"><div><label htmlFor="agency-region">{t("Departamento / región")}</label><select id="agency-region" value={selectedRegion} onChange={event=>{setSelectedRegion(event.target.value);setSelected(null);setItems([])}}>{REGIONS.map(item=><option key={item}>{item}</option>)}</select></div><div><label htmlFor="agency-district">{t("Distrito o localidad (opcional)")}</label><input id="agency-district" value={district} maxLength={80} onChange={event=>setDistrict(event.target.value)} placeholder={t("Ej.: Miraflores")}/></div><button className="btn" disabled={busy} onClick={()=>find()}>{busy?t("Buscando…"):t("Buscar oficinas")}</button><button className="btn ghost" disabled={busy} onClick={nearMe}>⌖ {t("Usar mi ubicación")}</button></div><p className="agency-source">{t("Ubicación opcional: el navegador te pedirá permiso. No almacenamos tus coordenadas.")}</p></div>
    <div className="agency-layout"><div className="card agency-map-card"><h3>{t("Mapa de referencia")}</h3><div className="agency-map" role="img" aria-label={`Mapa de ${selectedRegion} con ${markers.length} oficinas encontradas`}>
      <div className="agency-map-tiles">{map.tiles.map(tile=><img key={`${tile.x}/${tile.y}`} className="agency-map-tile" style={{left:`${tile.left}%`,top:`${tile.top}%`}} src={`/api/map-tiles/${ZOOM}/${tile.x}/${tile.y}.png`} alt="" draggable="false" loading={tile.left>50||tile.top>50?"lazy":"eager"} onError={event=>{event.currentTarget.style.background="#e7e4dc"}}/>)}</div>
      {markers.map(marker=><button key={marker.place_id} className={`agency-map-marker${selected&&Number(marker.lat)===selected.lat&&Number(marker.lon)===selected.lon?" selected":""}`} style={{left:`${marker.x}%`,top:`${marker.y}%`}} title={marker.name||"Oficina RENIEC"} aria-label={`Ver ${marker.name||"oficina RENIEC"}`} onClick={()=>setSelected({lat:Number(marker.lat),lon:Number(marker.lon)})}>{marker.index+1}</button>)}
      {position&&<span className="agency-user-marker" style={markerPosition(position.lat,position.lon,map)} title="Tu ubicación aproximada" aria-label="Tu ubicación aproximada"/>}
      {!markers.length&&<div className="agency-map-empty">{items.length?"No hay marcadores dentro de esta vista":"Busca oficinas para mostrar marcadores"}</div>}
    </div><a href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=${ZOOM}/${center.lat}/${center.lon}`} target="_blank" rel="noreferrer">Ver mapa completo en OpenStreetMap ↗</a><small className="agency-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></small></div><div className="agency-results"><div className="card agency-notice"><b>{t("Importante")}</b><span>{t(notice)}</span></div>{error&&<p className="form-error" role="alert">{error}</p>}{items.map((item,index)=><article className={`card agency-result${selected?.lat===Number(item.lat)&&selected?.lon===Number(item.lon)?" selected":""}`} key={item.place_id} onClick={()=>setSelected({lat:Number(item.lat),lon:Number(item.lon)})}><div className="agency-result-number">{index+1}</div><div><b>{item.name||"Oficina etiquetada RENIEC"}</b><span>{item.display_name}</span>{Number.isFinite(item.distance)&&<small>Aprox. {item.distance.toFixed(1)} km en línea recta</small>}<a href={`https://www.openstreetmap.org/directions?from=&to=${item.lat}%2C${item.lon}`} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()}>Ver ruta ↗</a></div></article>)}{!items.length&&!busy&&<div className="card agency-empty">{t("Elige una región y pulsa «Buscar oficinas» para consultar el mapa.")}</div>}</div></div>
  </section>;
}
function markerPosition(lat,lon,map){const global=latLonToPixel(lat,lon,ZOOM);return{x:((global.x-map.originX)/(COLS*TILE))*100,y:((global.y-map.originY)/(ROWS*TILE))*100}}
function buildMap(center){const point=latLonToPixel(center.lat,center.lon,ZOOM);const originX=point.x-COLS*TILE/2,originY=point.y-ROWS*TILE/2;const startX=Math.floor(originX/TILE),startY=Math.floor(originY/TILE);const tiles=[];for(let row=0;row<=ROWS;row++)for(let col=0;col<=COLS;col++){const rawX=startX+col,world=2**ZOOM,x=((rawX%world)+world)%world,y=startY+row;if(y>=0&&y<world)tiles.push({x,y,left:(rawX*TILE-originX)/(COLS*TILE)*100,top:(y*TILE-originY)/(ROWS*TILE)*100})}return{originX,originY,tiles}}
function latLonToPixel(lat,lon,zoom){const scale=TILE*2**zoom,safeLat=Math.max(-85.05112878,Math.min(85.05112878,lat));const sin=Math.sin(safeLat*Math.PI/180);return{x:(lon+180)/360*scale,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale}}
function fallbackCenter(region){const centers={"Amazonas":[-5.2,-78.5],"Áncash":[-9.5,-77.5],"Apurímac":[-13.6,-72.9],"Arequipa":[-16.4,-71.5],"Ayacucho":[-13.2,-74.2],"Cajamarca":[-7.2,-78.5],"Callao":[-12.05,-77.13],"Cusco":[-13.52,-71.97],"Huancavelica":[-12.8,-74.97],"Huánuco":[-9.93,-76.24],"Ica":[-14.07,-75.73],"Junín":[-11.16,-75.99],"La Libertad":[-8.11,-79.03],"Lambayeque":[-6.77,-79.84],"Lima":[-12.05,-77.04],"Loreto":[-3.75,-73.25],"Madre de Dios":[-12.59,-69.19],"Moquegua":[-17.19,-70.94],"Pasco":[-10.68,-76.26],"Piura":[-5.19,-80.63],"Puno":[-15.84,-70.02],"San Martín":[-6.49,-76.37],"Tacna":[-18.01,-70.25],"Tumbes":[-3.57,-80.45],"Ucayali":[-8.38,-74.53]};const [lat,lon]=centers[region]||centers.Lima;return{lat,lon}}
