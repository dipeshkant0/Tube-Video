import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideo } from "../controllers/video.controllers.js";



const router = Router();

router.route("/upload-Video").post(
          verifyJwt,
          upload.fields([
               {
                    name: "video",
                    maxCount:1
               },
               {
                    name: "thumbnail",
                    maxCount:1
               }
          ]),
          uploadVideo
     )

export default router;