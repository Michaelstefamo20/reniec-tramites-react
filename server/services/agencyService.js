const NOMINATIM_URL="https://nominatim.openstreetmap.org/search";
const REGIONS=new Set(["Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"]);
let lastRequestAt=0;

export async function searchAgencies({region,district,latitude,longitude}){
  if(!REGIONS.has(region)){const error=new Error("Selecciona una región válida del Perú.");error.status=400;throw error;}
  const lat=latitude===undefined?null:Number(latitude),lon=longitude===undefined?null:Number(longitude);
  if((lat===null)!==(lon===null)||(lat!==null&&(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180))){const error=new Error("La ubicación recibida no es válida.");error.status=400;throw error;}
  const cleanDistrict=typeof district==="string"?district.trim().replace(/[<>]/g,"").slice(0,80):"";
  const query=["RENIEC",cleanDistrict,region,"Perú"].filter(Boolean).join(" ");
  const params=new URLSearchParams({format:"jsonv2",q:query,countrycodes:"pe",limit:"40",addressdetails:"1",dedupe:"1"});
  if(lat!==null){params.set("viewbox",`${lon-0.7},${lat+0.5},${lon+0.7},${lat-0.5}`);params.set("bounded","1");}
  const delay=Math.max(0,1100-(Date.now()-lastRequestAt));
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  let response;
  try{
    lastRequestAt=Date.now();
    response=await fetch(`${NOMINATIM_URL}?${params}`,{headers:{"User-Agent":"ReniecTramitesPrototype/1.0 (public office map)",Accept:"application/json"},signal:AbortSignal.timeout(12000)});
  }catch(error){
    console.error("Agency map provider request failed:",error.name||"network_error");
    const failure=new Error("No se pudo conectar con el proveedor del mapa. Intenta nuevamente.");failure.status=502;throw failure;
  }
  if(!response.ok){
    console.error("Agency map provider returned:",response.status);
    const error=new Error(response.status===429?"El proveedor del mapa está limitando consultas. Espera un momento e inténtalo otra vez.":"El proveedor del mapa no está disponible temporalmente.");error.status=response.status===429?429:502;throw error;
  }
  let results;
  try{results=await response.json()}catch{const error=new Error("El proveedor del mapa devolvió una respuesta no válida.");error.status=502;throw error;}
  const matches=Array.isArray(results)?results.filter(item=>/reniec|registro nacional de identificacion/i.test(`${item.name||""} ${item.display_name||""}`)):[];
  const sorted=lat===null?matches:matches.map(item=>({...item,distance:distanceKm(lat,lon,Number(item.lat),Number(item.lon))})).sort((a,b)=>a.distance-b.distance);
  return{items:sorted.slice(0,15),source:"OpenStreetMap",notice:matches.length?"Resultados de datos abiertos de OpenStreetMap. Confirma dirección y horario en RENIEC antes de viajar.":"OpenStreetMap no tiene oficinas etiquetadas en esta búsqueda. Prueba solo región o distrito, o consulta el directorio oficial."};
}
function distanceKm(lat1,lon1,lat2,lon2){const r=6371,rad=value=>value*Math.PI/180;const dLat=rad(lat2-lat1),dLon=rad(lon2-lon1);const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
