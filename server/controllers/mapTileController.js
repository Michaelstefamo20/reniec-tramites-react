const TILE_HOST="https://tile.openstreetmap.org";
const MAX_ZOOM=19;

export async function mapTileController(req,res){
  const zoom=Number(req.params.zoom),x=Number(req.params.x),y=Number(req.params.y);
  if(!Number.isInteger(zoom)||zoom<0||zoom>MAX_ZOOM||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=2**zoom||y>=2**zoom){
    return res.status(400).json({error:"Coordenadas de mapa no válidas."});
  }
  try{
    const upstream=await fetch(`${TILE_HOST}/${zoom}/${x}/${y}.png`,{headers:{"User-Agent":"ReniecTramitesPrototype/1.0 (office map tiles)",Accept:"image/png"},signal:AbortSignal.timeout(10000)});
    if(!upstream.ok){
      console.error("Map tile provider returned:",upstream.status);
      return res.status(502).json({error:"La tesela del mapa no está disponible."});
    }
    const image=Buffer.from(await upstream.arrayBuffer());
    res.status(200);
    res.set("Content-Type","image/png");
    res.set("Cache-Control","public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    res.set("X-Content-Type-Options","nosniff");
    return res.send(image);
  }catch(error){
    console.error("Map tile proxy failed:",error.name||"network_error");
    return res.status(502).json({error:"No se pudo cargar una tesela del mapa."});
  }
}
