import { upload } from "../middlewares/multer.js"; 
import { verifyJWT } from "../middlewares/authMiddleware.js"; 
import { Router } from "express";
import { publishAVideo,getVideoById } from "../controllers/video.controllers.js";
;

const router = Router()
router.use(verifyJWT)

router.route("/").post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    },
    
]),publishAVideo)

router.route("/:videoId").get(getVideoById)

export default router

