import { Router } from "express";
import {userRegister, loginUser, logoutUser, refreshAccessToken} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();
//register route
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
//login router
router.route('/login').post(loginUser)

//secure route

//logout router
router.route('/logout').post(verifyJwt,logoutUser)
router.route('/refreshAccessToken').post(refreshAccessToken)


export default router;
