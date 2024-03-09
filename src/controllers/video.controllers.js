import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js"
import clearTemp from "../utils/clearTemp.js";
import { apiResponse } from "../utils/apiResponse.js";

const uploadVideo = asyncHandler( async(req, res)=>{
     const { title, description }= req.body
     const owner = req.user?._id

     if(!title || !description){
          throw new apiError(400 , "all fields required")
     }

     // console.log(req.files.video[0].path);

     let videoLocalPath ;
     if(req.files && Array.isArray(req.files.video) && req.files.video[0].path){
          videoLocalPath= req.files.video[0].path
     }else{
          clearTemp(req);
          throw new apiError(400, "video is required")
     }

     let thumbnailLocalPath ;
     if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail[0].path){
          thumbnailLocalPath= req.files.thumbnail[0].path
     }else{
          clearTemp(req);
          throw new apiError(400, "thumbnail is required")
     }
     const videoUrl = await uploadOnCloudinary(videoLocalPath);
     const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);

     if(!videoUrl || !thumbnailUrl){
          clearTemp(req);
          throw new apiError(400 , "Uploading Failed")
     }
     //console.log(videoUrl);

     const video = await Video.create({
          videoFile: videoUrl.url,
          thumbnail: thumbnailUrl.url,
          owner: owner,
          title: title,
          description: description,
          duration: videoUrl.duration

     })

     if(!video){
          throw new apiError(400 , "Uploading Failed")
     }

     return res.status(200)
     .json(
          new apiResponse(
               200,
               video,
               "Video Uploaded Successfully"
               )
     )
})

export {
     uploadVideo,
}