import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.route.js'
import subscriptionRouter from "./routes/subscription.route.js";
import VideoRouter from "./routes/video.route.js"
import TweetRouter from './routes/tweet.route.js'
import CommentRouter from "./routes/comment.router.js"
import LikeRouter from "./routes/like.route.js"
import PlaylistRouter from "./routes/playlist.route.js"
import DashboardRouter from "./routes/dashboard.route.js"


app.use('/api/v1/users', userRouter)
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/videos",VideoRouter)
app.use ("/api/v1/tweet",TweetRouter)
app.use("/api/v1/comment",CommentRouter)
app.use("/api/v1/like",LikeRouter)
app.use("/api/v1/playlist",PlaylistRouter)
app.use("/api/v1/dashboard",DashboardRouter)

export { app }