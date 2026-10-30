import { requestJson } from "./apiClient.js";

const suppliersPath = "/api/suppliers";

export function getSuppliers(filters = {}, options = {}) {
  const opts = filters?.signal ? filters : options;
  const filterObj = filters?.signal ? {} : filters;
  const params = new URLSearchParams();

  if (typeof filterObj === "string" && filterObj) {
    params.set("search", filterObj);
  } else if (filterObj?.search) {
    params.set("search", filterObj.search);
  }
  if (filterObj?.page) params.set("page", filterObj.page);
  if (filterObj?.pageSize) params.set("page_size", filterObj.pageSize);

  const queryString = params.toString();
  return requestJson(
    `${suppliersPath}${queryString ? `?${queryString}` : ""}`,
    opts,
  );
}

export function getAllOrderHistory({
  product,
  supplierId,
  invoiceDate,
  page,
  pageSize,
  signal,
} = {}) {
  const query = new URLSearchParams();
  if (product) query.set("product", product);
  if (supplierId) query.set("supplier_id", supplierId);
  if (invoiceDate) query.set("invoice_date", invoiceDate);
  if (page) query.set("page", page);
  if (pageSize) query.set("page_size", pageSize);
  const queryString = query.toString();

  return requestJson(
    `${suppliersPath}/purchases${queryString ? `?${queryString}` : ""}`,
    { signal },
  );
}

export function getOrderHistory(id, invoiceNumber, { signal } = {}) {
  return requestJson(
    `${suppliersPath}/${id}/purchases/${encodeURIComponent(invoiceNumber)}`,
    { signal },
  );
}

export function createSupplier(supplier) {
  return requestJson(suppliersPath, {
    method: "POST",
    body: JSON.stringify(supplier),
  });
}

export function updateSupplier(id, supplier) {
  return requestJson(`${suppliersPath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(supplier),
  });
}

export function deleteSupplier(id) {
  return requestJson(`${suppliersPath}/${id}`, { method: "DELETE" });
}
