import { Router } from "express";
import {
  index,
  allPurchaseHistory,
  purchaseDetails,
  store,
  replace,
  destroy,
} from "../controller/supplierController.js";
import {
  validateId,
  validateSupplier,
} from "../middlewares/supplierValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin", "apoteker"));

router.get("/", index);
router.get("/purchases", allPurchaseHistory);
router.get("/:id/purchases/:invoiceNumber", validateId, purchaseDetails);
router.post("/", validateSupplier(), validateRequest, store);
router.put("/:id", validateId, validateSupplier(), validateRequest, replace);
router.delete("/:id", validateId, validateRequest, destroy);

export default router;
