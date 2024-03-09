import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import clearTemp from "../utils/clearTemp.js";
import  Jwt  from "jsonwebtoken";

//generate Access and Refresh token
const generateAccessAndRefershToken = async(userId)=>{
    try { 
          const user = await User.findById(userId);

          const accessToken = await user.generateAccessToken();
          const refreshToken = await user.generateRefreshToken();

          user.refreshToken = refreshToken  //refreshToken added to user Object
          console.log(refreshToken);
          await user.save({ validateBeforeSave: false });
      
          return { accessToken, refreshToken};
      
    } catch (error) {
          throw new apiError(500, "Token is not created")     
    }
}

//Register User
const userRegister = asyncHandler( async (req , res)=>{
    /* get user details from frontend
     validate- not empty
     check user already exist using username email
     check for image ,-avatar
     upload them to cloudinary
     create user object , create entry in db
     remove password and refreshToken from res
     check for user creation 
     return response*/


    const {fullName , username, email, password } = req.body;


      // Check for empty field
    if(
      [fullName,username ,email, password].some((field)=>field === undefined || field === "")
    ){
            clearTemp(req);
            throw new apiError(400 ,"All fields is required")
     }
     
     // Check for existing user
     const existUser= await User.findOne({
      $or:[
            { username },
            { email }
      ]
     });

     if(existUser){
       throw new apiError(409, 'User already exist')
     }


     //avatar Local Path
     let avatarLocalPath;
     if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
      avatarLocalPath = req.files.avatar[0].path;
      }else{
            clearTemp(req);
            throw new apiError(400, "Avatar is required")
      }
     
      //coverImage Local path
     let coverImageLocalPath;
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
     }
     // Upload avatar and CoverImage On cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const coverImage =  await uploadOnCloudinary(coverImageLocalPath);

     // avatar is upload succesfull or not
     if(!avatar){
      clearTemp(req);
      throw new apiError(400 , "Avatar upload unsuccessful");
     }

     // create user object on database (MongoDb)
     const user = await User.create({
      fullName,
      email,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
      username: username.toLowerCase()
     });

     //Check user created successfully or Not
     const createdUser = await User.findById(user._id).select("-password -refreshToken");

     if (!createdUser) {
      throw new apiError(500 , "something is went wrong while registering user ")
     }

     // return a response
     return res.status(201).json( new apiResponse (
            200,
            createdUser,
            "User registered succesfully"
      ))

}) 

//Login User
const loginUser = asyncHandler( async (req, res)=>{

  // req body-> Data
  // validate Input
  // check password
  // generate refresh and access Token
  // create token 
  // return response

  const { username, email, password } = req.body;

  if((!username) && (!email)) {
    throw new apiError(400 , "username or email is required");
  }

  const user = await User.findOne({
    $or:[{username},{email}]
  })

  //Validate user
  if(!user){
    throw new apiError(401 ,"Invalid User")
  }

  //Validate Password
  if(!password){
    throw new apiError(400 , "Password Required")
  }

  const validatePassword = await user.isPasswordCorrect(password)
  if(!validatePassword){
    throw new apiError(400 , "Invalid credential")
  }

  //generate Token
  const { accessToken, refreshToken } = await generateAccessAndRefershToken(user._id);

  if(!accessToken || !refreshToken){
    throw new apiError(400, "Token is not generated")
  }

  const loggedUser =  await User.findById(user._id).select("-password -refreshToken");

  //cerate option for secure cookies
  const option ={
    httpOnly : true,
    secure : true
  }

  return res.status(200)
  .cookie("accessToken", accessToken, option)
  .cookie("refreshToken", refreshToken, option)
  .json(
    new apiResponse(201,loggedUser,"login succesfully")
  )
   
} )

//Logout user
const logoutUser = asyncHandler( async (req,res)=>{
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId,
      {
            $set:{
                  refreshToken: undefined
                }
      },
      {
        new:true
      }
    )
  
  const option={
    httpOnly:true,
    secure:true
  }
  
  return res.status(200)
  .clearCookie("accessToken",option)
  .clearCookie("refreshToken",option)
  .json(new apiResponse(201,{},"Logged out Successfully"))
  

}

)

//refresh Token

const refreshAccessToken = asyncHandler( async(req,res)=>{
  try {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
     if(!incomingRefreshToken){
       throw new apiError( 400 , " Unauthorized Access")
     }
 
    const decodedToken = Jwt.verify( 
     incomingRefreshToken ,
     process.env.REFRESH_TOKEN_SECRET
     );
 
     const user = await User.findById(decodedToken?._id);
 
     if(!user){
       throw new apiError( 402 ,"Invalid Refresh Token")
     }
 
     if(user.refreshToken !== incomingRefreshToken){
       throw new apiError(402 , "Unauthorized User");
     }
 
     const { accessToken , refreshToken} = await generateAccessAndRefershToken(user._id);
     const option ={
       httpOnly: true,
       secure: true
     }
 
     return res.status(200)
     .cookie("accessToken",accessToken,option)
     .cookie("refreshToken" ,refreshToken, option)
     .json(
       new apiResponse(201, {} , "Access Token regenerated Successfully")
     )
   } catch (error) {
      throw new apiError(
          400 ,
         "Invalid Token"
        )
   }

})

// Change Password

const changePassword = asyncHandler(async (req,res)=>{
  try {
    const {oldPassword ,newPassword }= req.body

    if(!(oldPassword && newPassword)){
        throw new apiError(402 , "All field required");
    }
    if(oldPassword === newPassword){
      throw new apiError(400 ,"old password and new password must different");
    }

    const user = await User.findById(req.user?._id)
    const iscorrectPassword = await user.isPasswordCorrect(oldPassword)
    if(!iscorrectPassword){
      throw new apiError(402 ,"Old password is Incorrect")
    }

    user.password = newPassword

    user.save({validateBeforeSave:false});

    return res.status(200)
    .json(
      new apiResponse(200, {}, "Password changed successfully")
    )


  } catch (error) {
    
  }
})

// get current User
const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(new apiResponse(
      200,
      req.user,
      "User fetched successfully"
  ))
})

// Update user profile

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const { email, fullName } = req.body
    if(!(email && fullName)){
      throw new apiError(400,"All fields are required");
    }

    const user = await User.findByIdAndUpdate(
          req.user?._id,

          {
            $set:  {
                      email,
                      fullName
                    }
          },

          {
            new:true
          }
          
      ).select("-password -refreshToken")

    return res.status(200)
    .json(
      new apiResponse(201 , "User details update successfully")
    )
    
})

//update avatar

const updateAvatar = asyncHandler( async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
      throw new apiError( 400 ,"avatar local path not found");
    }

    //Upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
      throw new apiError( 402 ," Avatar is not uploaded")
    }


    //retrieve user detail using ID 
    const user = await User.findByIdAndUpdate(
      req.user?._id,// user injected to req during auth middleware
      {
        $set:{
          avatar: avatar.url
        }
      },
      {new: true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
      new apiResponse(202 ,user,"Avatar update successfully")
    )

})

//update cover image

const updateCoverImage = asyncHandler( async (req,res)=>{
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new apiError( 400 ,"cover image local path not found");
  }

  //upload to cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage){
    throw new apiError( 402 ," cover image is not uploaded")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password -refreshToken");

  return res
  .status(200)
  .json(
    new apiResponse(202 ,user,"Cover Image update successfully")
  )

})

//delete coverImage

const deleteCoverImage = asyncHandler( async (req,res)=>{
    const coverImageUrl = req.user?.coverImage
    if(!coverImageUrl){
      throw new apiError(409 ,"Cover image is not fetched")
    }

    const user = await User.findOneAndUpdate(
      req.user?._id,
      {
        $set:{
          coverImage: ""
        }
      },
      {
        new:true
      }
    ).select("-password -refreshToken")

    const result = await deleteFromCloudinary(coverImageUrl, 'image');
    return res.status(200)
    .json(
      new apiResponse(202 , user ,"Cover Image delete succesfully ")
    )


})

// get User Channel Profile

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params;

  if(!username?.trim()){
    throw new apiError(402, "missing UserId")
  }

 const channel = await User.aggregate([
  {
    $match:{
      username: username?.toLowerCase()
    }
  },
  { // to find total subscriber
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    },
  },

  { // to find Subscribed to
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribeTo"
    }
  },
  {// set new field
    $addFields:{
      scbscriberCount:{
        $size:"$subscribers"
      },
      subscribeToCount:{
        $size:"$subscribeTo"
      },
      isSubscribed:{
        $cond:{ 
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
    }
  },
  {
    $project:{
      fullName:1,
      username:1,
      scbscriberCount:1,
      subscribeToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1
    }
  }
 ])

 if(!channel?.length){
  throw new apiError(402, "Channel doesn't exist")
 }

 return res.status(200)
        .json(
          new apiResponse(202,channel[0],"Chennel fetched successfully")
        )

})



export {

  userRegister,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  deleteCoverImage,
  getUserChannelProfile

};