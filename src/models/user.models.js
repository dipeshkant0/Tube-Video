import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Jwt  from 'jsonwebtoken';


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

// create a explict method to check password
userSchema.methods.isPasswordCorrect = async function (password){
     return await bcrypt.compare(this.password,password);
}

// Generate a json web token (Access Token)
userSchema.methods.generateAccessToken = function (){
     Jwt.sign(
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
}

// generate a json web token (Redresh Token)
userSchema.methods.generateRefreshToken = function(){
     Jwt.sign(
          {
               _id: this._id
          },
          process.env.REFRESH_TOKEN_SECRET,
          {
               expiresIn: process.env.REFRESH_TOKEN_EXPIRY
          }
     )
}


export const User = mongoose.model("User", userSchema)