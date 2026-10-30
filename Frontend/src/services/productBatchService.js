// Layanan API untuk mengelola data batch obat (product_batches).
import { requestJson } from "./apiClient.js";

export function getProductBatches(productId, { signal } = {}) {
  return requestJson(`/api/product-batches/${productId}`, { signal });
}

export function updateProductBatch(batchId, data) {
  return requestJson(`/api/product-batches/${batchId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProductBatch(batchId) {
  return requestJson(`/api/product-batches/${batchId}`, {
    method: "DELETE",
  });
}
