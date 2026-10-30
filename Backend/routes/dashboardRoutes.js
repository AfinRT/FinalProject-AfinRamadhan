import { Router } from "express";
import { summary, yearly } from "../controller/dashboardController.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";


const router = Router();
router.use(authenticate,authorizeRoles("admin", "apoteker", "kasir"));

router.get("/summary", summary);
router.get("/yearly", yearly);

export default router;
