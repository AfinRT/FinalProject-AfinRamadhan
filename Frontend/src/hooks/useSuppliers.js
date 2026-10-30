// Mengelola pemuatan, pencarian, pemfilteran, paginasi, dan formulir data pemasok / distributor obat.
import { useEffect, useState } from "react";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/supplierService.js";
import showAlert from "../utils/showAlert.js";

export const pageSize = 10;
const emptyForm = { name: "", phone: "", email: "", address: "" };

export default function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
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
        const result = await getSuppliers(
          { search: search.trim(), page: currentPage, pageSize },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format data distributor dari server tidak valid.");
        }
        setSuppliers(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setSuppliers([]);
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
  const pageSuppliers = suppliers;
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

  function refreshSuppliers() {
    setRefreshKey((key) => key + 1);
  }

  function openCreateForm() {
    setForm({ ...emptyForm });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(supplier) {
    setForm({
      id: supplier.id,
      name: supplier.name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
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
    const supplierData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    try {
      const isEdit = Boolean(form.id);
      if (isEdit) {
        await updateSupplier(form.id, supplierData);
      } else {
        await createSupplier(supplierData);
      }
      setFormOpen(false);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: isEdit
          ? "Distributor berhasil diperbarui."
          : "Distributor baru berhasil ditambahkan.",
        timer: 1500,
      });
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSupplier(supplier) {
    const confirmation = await showAlert({
      icon: "warning",
      title: "Hapus distributor?",
      text: `Data distributor "${supplier.name}" akan dihapus secara permanen.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
    });
    if (!confirmation.isConfirmed) return;

    setDeletingId(supplier.id);
    try {
      await deleteSupplier(supplier.id);
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Distributor berhasil dihapus.",
        timer: 1500,
      });
    } catch (deleteError) {
      await showAlert({
        icon: "error",
        title: "Distributor tidak dapat dihapus",
        text: deleteError.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return {
    suppliers,
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
    pageSuppliers,
    resetFilters,
    refreshSuppliers,
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
    removeSupplier,
  };
}
