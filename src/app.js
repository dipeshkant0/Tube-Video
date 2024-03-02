import express  from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = new express();

app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.routes.js"
import subscribeRouter  from "./routes/subscribe.routes.js";

app.use("/api/v1/user",userRouter); //http://localhost:3550/api/v1/user
app.use("/api/v1/subscription",subscribeRouter)//http://localhost:3550/api/vi/subscription

export { app }
