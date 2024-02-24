import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";


const userRegister = asyncHandler( async (req , res)=>{
     // get user details from frontend
     // validate- not empty
     // check user already exist using username email
     // check for image ,-avatar
     // upload them to cloudinary
     // create user object , create entry in db
     // remove password and refreshToken from res
     // check for user creation 
     // return response


    const {fullName , username, email, password } = req.body

    if(
          [fullName,username,email, password].some((field)=> field?.trim() === "" )
    ){
          throw new apiError(400,"All fields is required")
     }
     
     const existUser= await User.findOne({
      $or:[
            { username },
            { email }
      ]
     });

     if(existUser){
      throw new apiError(409, 'User already exist')
     }


     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?Array.isArray(req.files.coverImage) && (req.files.coverImage >0) ? req.files.coverImage[0].path:"":"";  ;

     if(!avatarLocalPath){
       throw new apiError(400, "Avatar is required")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const coverImage =  await uploadOnCloudinary(coverImageLocalPath);

     if(!avatar){
      throw new apiError(400 , "Avatar upload unsuccessful");
     }

     const user = await User.create({
      fullName,
      email,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
      username: username.toLowerCase()
     });

     const createdUser = await User.findById(user._id).select("-password -refreshToken");

     if (!createdUser) {
      throw new apiError(500 , "something is went wrong while registering user ")
     }

     return res.status(201).json( new apiResponse (
            200,
            createdUser,
            "User registered succesfully"
      ))

}) 

export {userRegister};