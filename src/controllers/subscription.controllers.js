import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriber.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";


const subscribe = asyncHandler( async(req, res)=>{

     const {username}= req.query;

     if(!username?.trim()){
          throw new apiError(400 ,"Empty Username")
     }

     //fetch channel details
     const channelId = await User.findOne({username})


     if(!channelId){
          throw new apiError(400 ,"Channel Id not found")
     }

     // Check user already subscribed or not
     const isSubscribed = await User.aggregate([
          {
               $match:{
                 username: req.user?.username
               }
          },
          { 
               $lookup:{
                 from:"subscriptions",
                 localField:"_id",
                 foreignField:"subscriber",
                 as:"subscribeTo"
               }
          },
          {// set new field
               $addFields:{
                    
                    isSubscribed:{
                         $cond:{ 
                         if:{$in:[channelId?._id,"$subscribeTo.channel"]},
                         
                         then:true,
                         else:false
                         }
                    }
               }
          },
          {
               $project:{
                    username:1, 
                    isSubscribed:1,
                    subscribeTo:1

               }
          }
     ])
     //console.log("isSubscribe",isSubscribed[0].subscribeTo);

     if(isSubscribed[0].isSubscribed){
          throw new apiError(402, "Channel already subscribed");
     }

     
     // create subscription
     const subscribed = await Subscription.create({
          subscriber: req.user?._id,
          channel:  channelId._id
     })


     if(!subscribed){
          throw new apiError(400,"Failed to subscribe");
     }


     return res.status(200)
     .json(
          new apiResponse(202, subscribed, "subscribed successfully")
     )

})


//Unsubscribe channel

const unsuscribed = asyncHandler( async (req,res)=>{
     const {username}= req.query

     if(!username){
          throw new apiError( 400 ,"Username Required")
     }
     //Fetch Channel details
     const channelId = await User.findOne({username})

     const isSubscribed = await User.aggregate([
          {
               $match:{
                    username: req.user?.username
               }
          },
          {
            
               $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribeTo"
               }

          },
          {
               $addFields:{
                    isSubscribe:{
                         $cond:{ 
                              if:{$in:[channelId?._id,"$subscribeTo.channel"]},
                              
                              then:true,
                              else:false
                              }
                    }
               }
          },
          {
               $project:{
                    isSubscribe:1,
                    subscribeTo:1
               }
          }
     ])


     if(!isSubscribed){
          throw new apiError(400,"Channel is not subscribed")
     }

     
    // console.log("isSubscribe",isSubscribed[0].subscribeTo);
    // console.log(channelId._id)


     // find  channel details to delete from db
     const channel_details = isSubscribed[0].subscribeTo.filter((obj)=> obj.channel.equals(channelId._id))

     if(channel_details.length<1){
          throw new apiError(402, "Already unsubscribed OR Channel Not Found")
     }

     const unsuscribed_Channel = await Subscription.findByIdAndDelete(channel_details,{
          new: true
     })

     return res.status(202)
     .json(
          new apiResponse(202 ,unsuscribed_Channel,"Unsubscribed Successfully")
     )
     
})


//get subscribed channel list

const subscribedList =asyncHandler(async(req,res)=>{
     const username = req.user?._id ;

     if(!username){
          throw new apiError(400, "sign in required")
     }
     const subscribedTo = await User.aggregate([
          {
               $match:{
                 username: req.user?.username
               }
          },
          { 
               $lookup:{
                 from:"subscriptions",
                 localField:"_id",
                 foreignField:"subscriber",
                 as:"subscribeTo"
               }
          },
          {
               $project:{
                    subscribeTo:1
               }
          }
     ])

     console.log(subscribedTo[0].subscribeTo[0].channel);

})

export
{
     subscribe ,
     unsuscribed,
     subscribedList
}