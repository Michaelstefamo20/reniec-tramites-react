import {FER} from "./data.js";

export function analyze(file,cb){
  const url=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{
    const s=64,c=document.createElement("canvas");c.width=c.height=s;
    const x=c.getContext("2d");x.drawImage(im,0,0,s,s);
    const d=x.getImageData(0,0,s,s).data;let sum=0,n=0,b=[],cen=0,cn=0;
    for(let i=0;i<s;i++)for(let j=0;j<s;j++){
      const k=(i*s+j)*4,l=.299*d[k]+.587*d[k+1]+.114*d[k+2];sum+=l;n++;
      if(i<6||j<6||i>s-7||j>s-7)b.push(l);
      if(i>20&&i<44&&j>20&&j<44){cen+=l;cn++}}
    const m=sum/n,bm=b.reduce((a,v)=>a+v,0)/b.length;
    const sd=Math.sqrt(b.reduce((a,v)=>a+(v-bm)**2,0)/b.length);
    const res=[
      {k:"Iluminación",ok:m>70&&m<200,t:m<=70?"Muy oscura: busca más luz":m>=200?"Sobreexpuesta: reduce la luz directa":"Buena iluminación"},
      {k:"Fondo uniforme",ok:sd<35&&bm>130,t:sd>=35?"El fondo tiene objetos o sombras":bm<=130?"Usa un fondo claro":"Fondo claro y uniforme"},
      {k:"Encuadre",ok:im.height>=im.width*.9,t:im.height<im.width*.9?"Usa formato vertical":"Encuadre vertical correcto"},
      {k:"Resolución",ok:im.width>=300,t:im.width<300?"Imagen muy pequeña (mín. 300 px)":"Resolución suficiente"}];
    cb({url,res});};
  im.src=url;}

export function sharp(file,cb){const im=new Image();im.onload=()=>{const w=160,h=Math.max(3,Math.round(im.height/im.width*w)),c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data,g=[];for(let i=0;i<d.length;i+=4)g.push(.299*d[i]+.587*d[i+1]+.114*d[i+2]);
  let a=0,b=0,n=0;for(let y=1;y<h-1;y++)for(let q=1;q<w-1;q++){const i=y*w+q,l=4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w];a+=l;b+=l*l;n++}cb(b/n-(a/n)**2);};
  im.onerror=()=>cb(null);im.src=URL.createObjectURL(file);}

export function dias(n){const out=[],h=new Date();h.setHours(12,0,0,0);
  for(let i=0;out.length<n&&i<40;i++){const d=new Date(h);d.setDate(h.getDate()+i);const w=d.getDay();if(w===0)continue;
    let b={1:3,2:2,3:1,4:1,5:2,6:1}[w];
    if(FER.some(f=>Math.abs((new Date(f+"T12:00:00")-d)/864e5)<=1.5))b+=1;
    out.push({lv:b>=3?2:b===2?1:0,lbl:d.toLocaleDateString("es-PE",{weekday:"short",day:"numeric",month:"short"})});}
  return out;}

