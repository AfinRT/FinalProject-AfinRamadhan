import { Router } from "express";
import {
  destroy,
  index,
  replace,
  store,
} from "../controller/expenseController.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import {
  validateExpense,
  validateId,
} from "../middlewares/expenseValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();
router.use(authenticate);

router.get("/", authorizeRoles("admin", "kasir"), index);
router.post(
  "/",
  authorizeRoles("admin", "kasir"),
  validateExpense(),
  validateRequest,
  store,
);
router.put(
  "/:id",
  authorizeRoles("admin", "kasir"),
  validateId,
  validateExpense(),
  validateRequest,
  replace,
);
router.delete(
  "/:id",
  authorizeRoles("admin", "kasir"),
  validateId,
  validateRequest,
  destroy,
);

export default router;
