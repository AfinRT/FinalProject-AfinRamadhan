// Mengelola pemuatan, pencarian, pemfilteran, paginasi, dan formulir data kategori obat.
import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService.js";
import showAlert from "../utils/showAlert.js";

export const pageSize = 10;
const emptyForm = { name: "", description: "" };

export default function useCategories() {
  const [categories, setCategories] = useState([]);
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
        const result = await getCategories(
          { search: search.trim(), page: currentPage, pageSize },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format data kategori dari server tidak valid.");
        }
        setCategories(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setCategories([]);
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
  const pageCategories = categories;
  const firstVisible = serverPagination.total_items
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisible = Math.min(
    activePage * pageSize,
    serverPagination.total_items,
  );

  function resetFilters() {
    setSearch("");
    setCurrentPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function refreshCategories() {
    setRefreshKey((key) => key + 1);
  }

  function openCreateForm() {
    setForm({ ...emptyForm });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(category) {
    setForm({
      id: category.id,
      name: category.name ?? "",
      description: category.description ?? "",
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
    const categoryData = {
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      const isEdit = Boolean(form.id);
      if (isEdit) {
        await updateCategory(form.id, categoryData);
      } else {
        await createCategory(categoryData);
      }
      setFormOpen(false);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: isEdit
          ? "Kategori berhasil diperbarui."
          : "Kategori baru berhasil ditambahkan.",
        timer: 1500,
      });
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category) {
    const confirmation = await showAlert({
      icon: "warning",
      title: "Hapus kategori?",
      text: `Data kategori "${category.name}" akan dihapus secara permanen.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
    });
    if (!confirmation.isConfirmed) return;

    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Kategori berhasil dihapus.",
        timer: 1500,
      });
    } catch (deleteError) {
      await showAlert({
        icon: "error",
        title: "Kategori tidak dapat dihapus",
        text: deleteError.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return {
    categories,
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
    pageCategories,
    resetFilters,
    refreshCategories,
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
    removeCategory,
  };
}
