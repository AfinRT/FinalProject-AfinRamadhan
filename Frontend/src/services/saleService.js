// Menyediakan operasi API untuk menyimpan transaksi dan mengambil data struk.
import { requestJson } from "./apiClient.js";

export function getSales(filters = {}, options = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    params.set(key === "pageSize" ? "page_size" : key, value);
  }
  const query = params.toString();
  return requestJson(`/api/sales${query ? `?${query}` : ""}`, options);
}

export function getSaleDetails(saleId, options = {}) {
  return requestJson(`/api/sales/${saleId}`, options);
}

export function createSale(sale) {
  return requestJson("/api/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export function deleteSale(saleId, sale) {
  return requestJson(`/api/sales/${saleId}`, {
    method: "DELETE",
    body: JSON.stringify(sale),
  });
}

export function getSaleReceipt(saleId, options = {}) {
  return requestJson(`/api/sales/${saleId}/receipt`, options);
}

export function getProductSalesAnalysis(filters = {}, options = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (filters.order) params.set("order", filters.order);
  if (filters.page) params.set("page", filters.page);
  if (filters.pageSize) params.set("page_size", filters.pageSize);

  const queryString = params.toString();
  return requestJson(
    `/api/sales/product-analysis${queryString ? `?${queryString}` : ""}`,
    options,
  );
}
