import { requestJson } from "./apiClient.js";

const usersPath = "/api/users";

export function getUsers(filters = {}, options = {}) {
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
    `${usersPath}${queryString ? `?${queryString}` : ""}`,
    opts,
  );
}

export function createUser(user) {
  return requestJson(usersPath, {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function updateUser(id, user) {
  return requestJson(`${usersPath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });
}

export function deleteUser(id) {
  return requestJson(`${usersPath}/${id}`, { method: "DELETE" });
}
