import { Router } from "express";
import {
  index,
  store,
  replace,
  destroy,
} from "../controller/categoryController.js";
import { authenticate } from "../controller/authenticate.js";
import {
  validateCategory,
  validateId,
} from "../middlewares/categoryValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin", "apoteker"));

router.get("/", index);
router.post("/", validateCategory(), validateRequest, store);
router.put("/:id", validateId, validateCategory(), validateRequest, replace);
router.delete("/:id", validateId, validateRequest, destroy);

export default router;
