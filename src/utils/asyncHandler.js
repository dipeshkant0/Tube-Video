// create a function that execute a function asynchronuosly
const asyncHandler = (requestHandler)=>{
     return (req,res,next)=>{
          Promise.resolve( requestHandler(req,res,next)).catch(error=> next(error))
     }
}

export {asyncHandler}