import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { createTweet,getUserTweets,deleteTweet,updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router