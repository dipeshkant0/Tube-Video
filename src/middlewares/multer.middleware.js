import multer from "multer";

// storage of file locally in temp file
const storage= multer.diskStorage({
     destination: function (req , file , cb) {

          cb(null , "./public/temp")

     },
     filename: function (req ,file, cb){

          cb(null, file.originalname)

     }
})

export const upload = multer({
     storage
})