import Jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";


// Middleware for very user using JWT (Token)
export const verifyJwt = asyncHandler( async(req,res,next)=>{
     try{
          const token = req.cookies?.accessToken || req.header("Authorization")?.replace('Bearer ','');

          if(!token){
               throw new apiError(402, "Token Not Found")
          }
     
          const decodedToken = Jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
     
          const user = await User.findById(decodedToken._id).select("-password -refreshToken");
     
          if(!user){
               throw new apiError(400, "Invalid Access Token");
          }
          req.user =  user
     
          next()
 
    } catch (error) {
          throw new apiError(400, error?.message||" Access token not found")
    }
})

