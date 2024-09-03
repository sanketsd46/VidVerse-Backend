import { Router } from "express";
import { getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();


router
  .route("/:channelId")
  .patch(verifyJWT, toggleSubscription)
  .get(verifyJWT,getUserChannelSubscribers)


  
 export default router 