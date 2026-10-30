import { Router } from "express";
import {
  index,
  store,
  replace,
  stockIn,
  expiring,
  lowStock,
} from "../controller/productController.js";
import { authenticate } from "../controller/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import {
  validateId,
  validateProduct,
} from "../middlewares/productValidation.js";
import { validateStockIn } from "../middlewares/stockInValidation.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();
router.use(authenticate);

router.get("/", authorizeRoles("admin", "apoteker", "kasir"), index);
router.get("/expiring", authorizeRoles("admin", "apoteker"), expiring);
router.get("/low-stock", authorizeRoles("admin", "apoteker"), lowStock);

router.post(
  "/",
  authorizeRoles("admin", "apoteker"),
  validateProduct(),
  validateRequest,
  store,
);
router.post(
  "/:id/stock-in",
  authorizeRoles("admin", "apoteker"),
  validateId,
  validateStockIn(),
  validateRequest,
  stockIn,
);
router.put(
  "/:id",
  authorizeRoles("admin", "apoteker"),
  validateId,
  validateProduct(),
  validateRequest,
  replace,
);
export default router;
