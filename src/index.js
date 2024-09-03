import dotenv from 'dotenv'
import { dbConnect } from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path:'./.env'
})

dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 6000, ()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("mongoDB connection failed !! ",error);
    
})