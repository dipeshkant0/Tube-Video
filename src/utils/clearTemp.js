import fs from 'fs'
// Function to clear temp folder
const clearTemp = (req,res)=>{
     if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
          fs.unlinkSync(req.files.avatar[0].path);
     }
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
          fs.unlinkSync(req.files.coverImage[0].path);
     }
}

export default clearTemp;