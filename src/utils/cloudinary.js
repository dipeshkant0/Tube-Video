import {v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
        
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

          console.log("file is uploaded on cloudinary", result.url);

          return result;

     } catch (error) {
          fs.unlinkSync(localFilePath) // remove file i.e uploaded in temp folder
          return null;
     }
}

export {uploadOnCloudinary};