import { Router } from "express";
import { login } from "../controller/authController.js";
import { validateLogin } from "../middlewares/authValidation.js";

const router = Router();
router.post("/login", validateLogin, login);

export default router;
