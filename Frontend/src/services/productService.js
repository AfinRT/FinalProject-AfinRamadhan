// Menyediakan permintaan pencarian produk ke API dengan dukungan pembatalan request.
import { requestJson } from "./apiClient.js";

export function searchProducts(query = {}, options = {}) {
  const opts = query?.signal ? query : options;
  const filterObj = query?.signal ? {} : query;
  const params = new URLSearchParams();

  if (typeof filterObj === "string") {
    if (filterObj) params.set("search", filterObj);
  } else if (filterObj && typeof filterObj === "object") {
    if (filterObj.search) params.set("search", filterObj.search);
    if (filterObj.barcode) params.set("barcode", filterObj.barcode);
    if (filterObj.category_id) params.set("category_id", filterObj.category_id);
    if (filterObj.categoryId) params.set("category_id", filterObj.categoryId);
    if (filterObj.supplier_id) params.set("supplier_id", filterObj.supplier_id);
    if (filterObj.supplierFilter) params.set("supplier_id", filterObj.supplierFilter);
    if (filterObj.sort) params.set("sort", filterObj.sort);
    if (filterObj.page) params.set("page", filterObj.page);
    if (filterObj.pageSize) params.set("page_size", filterObj.pageSize);
  }

  const queryString = params.toString();
  return requestJson(`/api/products${queryString ? `?${queryString}` : ""}`, opts);
}

export function getLowStockProducts(filters = {}, options = {}) {
  const opts = filters?.signal ? filters : options;
  const filterObj = filters?.signal ? {} : filters;
  const params = new URLSearchParams();

  if (filterObj?.search) params.set("search", filterObj.search);
  if (filterObj?.supplier_id) params.set("supplier_id", filterObj.supplier_id);
  if (filterObj?.page) params.set("page", filterObj.page);
  if (filterObj?.pageSize) params.set("page_size", filterObj.pageSize);

  const queryString = params.toString();
  return requestJson(
    `/api/products/low-stock${queryString ? `?${queryString}` : ""}`,
    opts,
  );
}

export function getExpiringProducts(filters = {}, options = {}) {
  const opts = filters?.signal ? filters : options;
  const filterObj = filters?.signal ? {} : filters;
  const params = new URLSearchParams();

  if (filterObj?.search) params.set("search", filterObj.search);
  if (filterObj?.supplier_id) params.set("supplier_id", filterObj.supplier_id);
  if (filterObj?.page) params.set("page", filterObj.page);
  if (filterObj?.pageSize) params.set("page_size", filterObj.pageSize);

  const queryString = params.toString();
  return requestJson(
    `/api/products/expiring${queryString ? `?${queryString}` : ""}`,
    opts,
  );
}

export function createProduct(product) {
  return requestJson("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return requestJson(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export function stockInProduct(id, data) {
  return requestJson(`/api/products/${id}/stock-in`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
