import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireSession } from "../middleware/auth.js";
import { attachCurrentUser, adminInquiriesController, createInquiryController, myInquiriesController, updateInquiryController } from "../controllers/supportController.js";

export const supportRoutes=Router();
const userRateLimit=rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:"draft-7",legacyHeaders:false,message:{error:"Límite de consultas alcanzado. Inténtalo más tarde."}});
supportRoutes.use(requireSession,attachCurrentUser);
supportRoutes.get("/mine",myInquiriesController);
supportRoutes.post("/",userRateLimit,createInquiryController);
supportRoutes.get("/admin",adminInquiriesController);
supportRoutes.patch("/admin/:id",updateInquiryController);
