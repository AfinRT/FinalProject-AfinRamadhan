import { Router } from "express";
import {
  batches,
  updateBatch,
  destroyBatch,
} from "../controller/productController.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import { validateId } from "../middlewares/productValidation.js";
import { validateProductBatch } from "../middlewares/productBatchValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();
router.use(authenticate);

router.get("/:id", authorizeRoles("admin", "apoteker"), validateId, batches);
router.put(
  "/:id",
  authorizeRoles("admin", "apoteker"),
  validateId,
  validateProductBatch(),
  validateRequest,
  updateBatch,
);
router.delete(
  "/:id",
  authorizeRoles("admin", "apoteker"),
  validateId,
  validateRequest,
  destroyBatch,
);

export default router;
