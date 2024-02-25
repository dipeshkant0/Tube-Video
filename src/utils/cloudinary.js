import {v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import  dotenv from 'dotenv'
        
dotenv.config(
     {
        path:'./.env'
     }
   )


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// create a function to upload files on cloudinary
const uploadOnCloudinary = async (localFilePath)=>{
     try {
          if(!localFilePath){
               console.log("Local File Path is not Found")
               return null;
          }
          const result = await cloudinary.uploader.upload(localFilePath, {
               resource_type:"auto",
          })

          // file uploaded at cloudinary

          // console.log("file is uploaded on cloudinary", result.url);
          fs.unlinkSync(localFilePath);// that file should be clear after uploaded

          return result;

     } catch (error) {
          console.error(error);
          fs.unlinkSync(localFilePath) // remove file i.e uploaded in temp folder
          return null;
     }
}

export {uploadOnCloudinary};