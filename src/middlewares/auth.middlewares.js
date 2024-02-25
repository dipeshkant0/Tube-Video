import Jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";

export const verifyJwt = asyncHandler( async(req,res,next)=>{
     const token = res.cookies?.accessToken || res.header("Authorization")?.replace('Bearer ','');

    try {
          if(!token){
               throw new apiError(400, "Unauthorize Token")
          }
     
          const decodedToken = Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     
          const user = await User.findById(decodedToken._id).select("-password -refreshToken");
     
          if(!user){
               throw new apiError(400, "Invalid Access Token");
          }
          req.user =  user
     
          next()
 
    } catch (error) {
          throw new apiError(400, "Error during token verification")
    }
})

