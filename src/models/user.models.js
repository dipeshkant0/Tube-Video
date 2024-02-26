import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Jwt  from 'jsonwebtoken';
import { apiError } from '../utils/apiError.js';


// create a user schema
const userSchema = new mongoose.Schema({
     username:{
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
          index: true
     },
     email:{
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
     },
     fullName:{
          type: String,
          required: true,
          trim: true,
          index: true
     },
     avatar:{
          type: String,//cloudinary url
          required: true,
     },
     coverImage: {
          type: String 
     },
     watchHistory:[
          {
               type: mongoose.Schema.Types.ObjectId,
               ref:"Video"
          }
     ],
     password:{
          type: String,
          required:[true,'Password is requires']
     },
     refreshToken:{
          type: String
     }
 }, 
     {
      timestamps: true
     }
)

// encrypt the password before storing at database
userSchema.pre("save", async function (next){
     if(!this.isModified("password")) return next;
     this.password = await bcrypt.hash(this.password,10);
     next();
})

// create a explict methods to check password
userSchema.methods.isPasswordCorrect = async function (password){
     return await bcrypt.compare(password, this.password);
}

// Generate a json web token (Access Token)
userSchema.methods.generateAccessToken = function (){
     try {
          return Jwt.sign(
               {
                    _id: this._id,
                    email: this.email,
                    username: this.username,
                    fullName: this.fullName
               },
               process.env.ACCESS_TOKEN_SECRET,
               {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
               }
          )
     } catch (error) {
          throw new apiError(500 , "Problem in jwt sign(Access Token)")
     }
}

// generate a json web token (Redresh Token)
userSchema.methods.generateRefreshToken = function(){
     try {
           return Jwt.sign(
               {
                    _id: this._id
               },
               process.env.REFRESH_TOKEN_SECRET,
               {
                    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
               }
          )
     } catch (error) {
          throw new apiError(500 , "Problem in jwt sign(refresh Token)")
     }
}


export const User = mongoose.model("User", userSchema)