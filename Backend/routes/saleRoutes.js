import { Router } from "express";
import {
  destroy,
  index,
  receipt,
  show,
  store,
  productAnalysis,
} from "../controller/saleController.js";
import { authenticate } from "../controller/authenticate.js";
import { validateSale, validateSaleId } from "../middlewares/saleValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = Router();
router.use(authenticate);

router.get("/", authorizeRoles("admin", "apoteker", "kasir"), index);
router.get("/product-analysis", authorizeRoles("admin", "apoteker"), productAnalysis);
router.get(
  "/:id/receipt",
  authorizeRoles("admin", "apoteker", "kasir"),
  validateSaleId,
  validateRequest,
  receipt,
);
router.get(
  "/:id",
  authorizeRoles("admin", "apoteker", "kasir"),
  validateSaleId,
  validateRequest,
  show,
);
router.post(
  "/",
  authorizeRoles("kasir"),
  validateSale(),
  validateRequest,
  store,
);
router.delete(
  "/:id",
  authorizeRoles("admin"),
  validateSaleId,
  validateRequest,
  destroy,
);

export default router;
