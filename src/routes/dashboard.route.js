import { Router } from 'express';
import { getChannelStats,getChannelVideos } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/authMiddleware.js'; 

const router = Router();

router.use(verifyJWT); 

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router