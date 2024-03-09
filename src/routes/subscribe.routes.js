import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { subscribe,unsuscribed , subscribedList} from "../controllers/subscription.controllers.js";

const router = Router();

router.route("/subscribe").post(verifyJwt,subscribe)
router.route("/unsubscribe").post(verifyJwt,unsuscribed)
router.route("/subscribed-list").get(verifyJwt,subscribedList)
export default router