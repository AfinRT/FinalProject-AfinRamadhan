// Mengelola pemuatan, pencarian, pemfilteran, paginasi, dan formulir data pengguna (CRUD user).
import { useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../services/userService.js";
import showAlert from "../utils/showAlert.js";

export const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Apoteker" },
  { id: 3, name: "Kasir" },
];

export const pageSize = 10;

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role_id: "",
  status: "active",
};

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getUsers(
          { search: search.trim(), page: currentPage, pageSize },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format data pengguna dari server tidak valid.");
        }
        setUsers(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setUsers([]);
          setServerPagination({
            page: 1,
            page_size: pageSize,
            total_items: 0,
            total_pages: 1,
          });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [refreshKey, search, currentPage]);

  const totalPages = serverPagination.total_pages;
  const activePage = serverPagination.page;
  const pageUsers = users;
  const firstVisible = serverPagination.total_items
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisible = Math.min(activePage * pageSize, serverPagination.total_items);

  function resetFilters() {
    setSearch("");
    setCurrentPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function refreshUsers() {
    setRefreshKey((key) => key + 1);
  }

  function openCreateForm() {
    setForm({ ...emptyForm });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(user) {
    setForm({
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      role_id: String(user.role_id ?? ""),
      status: user.status ?? "active",
    });
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setFormError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const userData = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: Number(form.role_id),
      ...(form.password ? { password: form.password } : {}),
      ...(form.id && form.status ? { status: form.status } : {}),
    };

    try {
      const isEdit = Boolean(form.id);
      if (isEdit) {
        await updateUser(form.id, userData);
      } else {
        await createUser(userData);
      }
      setFormOpen(false);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: isEdit
          ? "Akun pengguna berhasil diperbarui."
          : "Akun pengguna baru berhasil ditambahkan.",
        timer: 1500,
      });
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user) {
    const confirmation = await showAlert({
      icon: "warning",
      title: "Hapus pengguna?",
      text: `Akun "${user.name}" akan dihapus secara permanen.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
    });
    if (!confirmation.isConfirmed) return;

    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Pengguna berhasil dihapus.",
        timer: 1500,
      });
    } catch (deleteError) {
      await showAlert({
        icon: "error",
        title: "Pengguna tidak dapat dihapus",
        text: deleteError.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return {
    users,
    loading,
    error,
    search,
    setSearch,
    handleSearchChange,
    currentPage,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount: serverPagination.total_items,
    pageUsers,
    roles,
    resetFilters,
    refreshUsers,
    formOpen,
    form,
    formError,
    saving,
    deletingId,
    openCreateForm,
    openEditForm,
    closeForm,
    updateForm,
    submitForm,
    removeUser,
  };
}
