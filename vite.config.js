import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_BASE_URL || `http://127.0.0.1:${process.env.API_PORT || process.env.PORT || 4175}`;

export default defineConfig({
  plugins:[react()],
  server:{
    proxy:{"/api":{target:apiTarget,changeOrigin:true,configure:(proxy)=>proxy.on("error",(_error,_request,response)=>{if(!response.headersSent){response.writeHead(503,{"Content-Type":"application/json"});response.end(JSON.stringify({error:`La API no está disponible en ${apiTarget}.` }));}})}},
    watch:{ignored:["**/.env"]},
  },
});
