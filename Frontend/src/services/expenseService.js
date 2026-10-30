import { requestJson } from "./apiClient.js";

export function getExpenses(
  { dateFrom, dateTo, search, page, pageSize } = {},
  options = {},
) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  if (search) params.set("search", search);
  if (page) params.set("page", page);
  if (pageSize) params.set("page_size", pageSize);
  const query = params.toString();

  return requestJson(`/api/expenses${query ? `?${query}` : ""}`, options);
}

export function createExpense(expense) {
  return requestJson("/api/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

export function updateExpense(expenseId, expense) {
  return requestJson(`/api/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(expenseId) {
  return requestJson(`/api/expenses/${expenseId}`, {
    method: "DELETE",
  });
}
