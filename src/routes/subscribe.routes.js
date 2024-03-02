import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { subscribe,unsuscribed } from "../controllers/subscription.controllers.js";

const router = Router();

router.route("/subscribe").post(verifyJwt,subscribe)
router.route("/unsubscribe").post(verifyJwt,unsuscribed)

export default router