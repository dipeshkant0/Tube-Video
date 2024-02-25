import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import clearTemp from "../utils/clearTemp.js";


//generate Access and Refresh token
const generateAccessAndRefershToken = async(userId)=>{
    try { 
          const user = await User.findById(userId);

          const accessToken = user.generateAccessToken();
          const refreshToken = user.generateRefreshToken();

          user.refreshToken = refreshToken  //refreshToken added to user Object
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
  if(!username && !email){
    throw new apiError(400 , "username or email is required");
  }

  const user = User.findOne({
    $or:[{username},{email}]
  })

  //Validate user
  if(!user){
    throw new apiError(401 ,"Invalid User")
  }

  //Validate Password
  const validatePassword = user.isPasswordCorrect(password)
  if(!validatePassword){
    throw new apiError(400 , "Invalid credential")
  }

  //generate Token
  const { accessToken, refreshToken } = await generateAccessAndRefershToken(user._id);

  const loggedUser =  await User.findById(user._id).select("-passward -refreshToken");

  //cerate option for secure cookies
  const option ={
    httpOnly : true,
    secure : true
  }

  return res.status(200)
  .cookie("accessToken", accessToken, option)
  .cookie("refreshToken", refreshToken, option)
  .json(
    new apiResponse(201,loggedUser,"loggin succesfully")
  )
   
} )

//Logout user
const logoutUser = asyncHandler( async (req,res)=>{
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId,{
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


export {
  userRegister,
  loginUser,
  logoutUser
};