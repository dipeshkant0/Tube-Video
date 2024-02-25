import { Router } from "express";
import {userRegister, loginUser, logoutUser} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
     upload.fields([
          {
               name:"avatar",
               maxCount:1
          },
          {
               name:"coverImage",
               maxCount:1
          }
     ]),userRegister)
router.route('/login').post(loginUser)

//secure route
router.route('/logout').post(verifyJwt,logoutUser)


export default router;
