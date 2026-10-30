import { requestJson } from "./apiClient.js";

const categoriesPath = "/api/categories";

export function getCategories(filters = {}, options = {}) {
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
    `${categoriesPath}${queryString ? `?${queryString}` : ""}`,
    opts,
  );
}

export function createCategory(category) {
  return requestJson(categoriesPath, {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export function updateCategory(id, category) {
  return requestJson(`${categoriesPath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });
}

export function deleteCategory(id) {
  return requestJson(`${categoriesPath}/${id}`, { method: "DELETE" });
}
