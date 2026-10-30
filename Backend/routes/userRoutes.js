import { Router } from "express";
import {
  index,
  store,
  replace,
  destroy,
} from "../controller/userController.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
} from "../middlewares/userValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin"));

router.get("/", index);
router.post("/", validateCreateUser(), validateRequest, store);
router.put(
  "/:id",
  validateUserId,
  validateUpdateUser(),
  validateRequest,
  replace,
);
router.delete("/:id", validateUserId, validateRequest, destroy);
export default router;
