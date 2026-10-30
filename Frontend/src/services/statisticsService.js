import { requestJson } from "./apiClient.js";

export function getSalesSummary({ dateFrom, dateTo } = {}, options = {}) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const query = params.toString();

  return requestJson(
    `/api/dashboard/summary${query ? `?${query}` : ""}`,
    options,
  );
}

export function getYearlySalesSummary({ year } = {}, options = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  const query = params.toString();

  return requestJson(
    `/api/dashboard/yearly${query ? `?${query}` : ""}`,
    options,
  );
}
