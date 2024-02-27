import { Router } from "express";
import {  userRegister,
          loginUser, logoutUser,
          refreshAccessToken,
          changePassword,
          getCurrentUser,
          updateAccountDetails,
          updateAvatar,
          updateCoverImage,
          deleteCoverImage
     } from "../controllers/user.controllers.js"
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
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJwt,changePassword)
router.route('/get-current-user').get(verifyJwt,getCurrentUser)
router.route('/update-user-detail').post(verifyJwt,updateAccountDetails)
router.route('/change-avatar').post(verifyJwt, upload.single("avatar"),updateAvatar)
router.route('/change-coverimage').post(verifyJwt, upload.single("coverImage"),updateCoverImage)
router.route('/delete-coverimage').post(verifyJwt,deleteCoverImage)


export default router;
