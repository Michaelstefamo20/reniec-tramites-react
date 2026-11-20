import { searchAgencies } from "../services/agencyService.js";

export async function searchAgenciesController(req,res,next){
  try{
    const result=await searchAgencies({region:req.query.region,district:req.query.district,latitude:req.query.latitude,longitude:req.query.longitude});
    res.set("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
    res.json(result);
  }catch(error){
    if(error.status)return res.status(error.status).json({error:error.message});
    next(error);
  }
}
