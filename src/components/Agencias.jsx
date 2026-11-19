import { useMemo, useState } from "react";

const REGIONS=["Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"];

export default function Agencias({region="Lima"}){
  const [selectedRegion,setSelectedRegion]=useState(region);
  const [district,setDistrict]=useState("");
  const [items,setItems]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("Las ubicaciones vienen de OpenStreetMap y pueden estar incompletas; verifica la atención en canales oficiales de RENIEC.");
  const [position,setPosition]=useState(null);
  const center=useMemo(()=>position||fallbackCenter(selectedRegion),[position,selectedRegion]);
  const mapUrl=`https://www.openstreetmap.org/export/embed.html?bbox=${center.lon-0.22}%2C${center.lat-0.16}%2C${center.lon+0.22}%2C${center.lat+0.16}&layer=mapnik&marker=${center.lat}%2C${center.lon}`;

  const find=async(lat,lon)=>{
    setBusy(true);setError("");setItems([]);
    try{
      const query=["RENIEC",district.trim(),selectedRegion,"Perú"].filter(Boolean).join(" ");
      const params=new URLSearchParams({format:"jsonv2",q:query,countrycodes:"pe",limit:"40",addressdetails:"1",dedupe:"1"});
      if(lat&&lon){params.set("viewbox",`${lon-0.7},${lat+0.5},${lon+0.7},${lat-0.5}`);params.set("bounded","1");}
      const response=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{headers:{Accept:"application/json"}});
      if(!response.ok)throw new Error("No se pudo consultar el mapa. Intenta de nuevo más tarde.");
      const results=await response.json();
      const matches=results.filter(item=>/reniec|registro nacional de identificacion/i.test(item.name||item.display_name||""));
      const nearest=lat&&lon?matches.map(item=>({...item,distance:distanceKm(lat,lon,Number(item.lat),Number(item.lon))})).sort((a,b)=>a.distance-b.distance):matches;
      setItems(nearest.slice(0,15));
      setNotice(matches.length?"Resultados encontrados en datos abiertos de OpenStreetMap. Confirma horarios y atención en RENIEC antes de desplazarte.":"No encontramos oficinas RENIEC etiquetadas en este sector de OpenStreetMap. Prueba otra región o consulta el directorio oficial.");
    }catch(e){setError(e.message||"No se pudo buscar oficinas.")}
    finally{setBusy(false)}
  };
  const nearMe=()=>{
    if(!navigator.geolocation){setError("Este navegador no ofrece ubicación. Selecciona una región y distrito manualmente.");return}
    setBusy(true);setError("");navigator.geolocation.getCurrentPosition(position=>{const coords={lat:position.coords.latitude,lon:position.coords.longitude};setPosition(coords);find(coords.lat,coords.lon)},e=>{setBusy(false);setError(e.code===1?"Permite la ubicación o busca por región y distrito.":"No se pudo obtener la ubicación. Busca por región y distrito.")},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  };
  return <section className="agency-page">
    <div><span className="eyebrow">DIRECTORIO Y MAPA</span><h2>Encuentra una oficina cercana</h2><p className="sub">Busca por departamento y distrito, o permite ubicación para ordenar resultados próximos.</p></div>
    <div className="card agency-search"><div className="agency-fields"><div><label htmlFor="agency-region">Departamento / región</label><select id="agency-region" value={selectedRegion} onChange={event=>setSelectedRegion(event.target.value)}>{REGIONS.map(item=><option key={item}>{item}</option>)}</select></div><div><label htmlFor="agency-district">Distrito o localidad (opcional)</label><input id="agency-district" value={district} maxLength={80} onChange={event=>setDistrict(event.target.value)} placeholder="Ej.: Miraflores"/></div><button className="btn" disabled={busy} onClick={()=>find()}>{busy?"Buscando…":"Buscar oficinas"}</button><button className="btn ghost" disabled={busy} onClick={nearMe}>⌖ Usar mi ubicación</button></div><p className="agency-source">Ubicación opcional: el navegador te pedirá permiso. No almacenamos tus coordenadas.</p></div>
    <div className="agency-layout"><div className="card agency-map-card"><h3>Mapa de referencia</h3><iframe title="Mapa de oficinas en OpenStreetMap" src={mapUrl} loading="lazy" referrerPolicy="no-referrer"/><a href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=12/${center.lat}/${center.lon}`} target="_blank" rel="noreferrer">Abrir mapa en OpenStreetMap ↗</a></div><div className="agency-results"><div className="card agency-notice"><b>Importante</b><span>{notice}</span></div>{error&&<p className="form-error" role="alert">{error}</p>}{items.map((item,index)=><article className="card agency-result" key={item.place_id}><div className="agency-result-number">{index+1}</div><div><b>{item.name||"Oficina etiquetada RENIEC"}</b><span>{item.display_name}</span>{Number.isFinite(item.distance)&&<small>Aprox. {item.distance.toFixed(1)} km en línea recta</small>}<a href={`https://www.openstreetmap.org/directions?from=&to=${item.lat}%2C${item.lon}`} target="_blank" rel="noreferrer">Ver ruta ↗</a></div></article>)}{!items.length&&!busy&&<div className="card agency-empty">Elige una región y pulsa «Buscar oficinas» para consultar el mapa.</div>}</div></div>
  </section>;
}
function distanceKm(lat1,lon1,lat2,lon2){const r=6371,rad=value=>value*Math.PI/180;const dLat=rad(lat2-lat1),dLon=rad(lon2-lon1);const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function fallbackCenter(region){const centers={"Amazonas":[-5.2,-78.5],"Áncash":[-9.5,-77.5],"Apurímac":[-13.6,-72.9],"Arequipa":[-16.4,-71.5],"Ayacucho":[-13.2,-74.2],"Cajamarca":[-7.2,-78.5],"Callao":[-12.05,-77.13],"Cusco":[-13.52,-71.97],"Huancavelica":[-12.8,-74.97],"Huánuco":[-9.93,-76.24],"Ica":[-14.07,-75.73],"Junín":[-11.16,-75.99],"La Libertad":[-8.11,-79.03],"Lambayeque":[-6.77,-79.84],"Lima":[-12.05,-77.04],"Loreto":[-3.75,-73.25],"Madre de Dios":[-12.59,-69.19],"Moquegua":[-17.19,-70.94],"Pasco":[-10.68,-76.26],"Piura":[-5.19,-80.63],"Puno":[-15.84,-70.02],"San Martín":[-6.49,-76.37],"Tacna":[-18.01,-70.25],"Tumbes":[-3.57,-80.45],"Ucayali":[-8.38,-74.53]};const [lat,lon]=centers[region]||centers.Lima;return{lat,lon}}
