import { upload } from "../middlewares/multer.js"; 
import { verifyJWT } from "../middlewares/authMiddleware.js"; 
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, userRegistration, verifyEmail } from "../controllers/user.controller.js";
import { Router } from "express";


const router = Router()

router.route("/register").post(userRegistration)

router.route("/verify").post(verifyEmail)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,  logoutUser)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router

