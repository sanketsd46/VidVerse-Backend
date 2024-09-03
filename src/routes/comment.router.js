import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { addComment, getVideoComments,deleteComment,updateComment } from "../controllers/comment.controller.js";


const router = Router()

router.use(verifyJWT)

router.route("/:videoId")
.post(addComment)
.get(getVideoComments)

router.route("/c/:commentId")
.delete(deleteComment)
.patch(updateComment);

export default router