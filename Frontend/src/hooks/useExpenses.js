import { useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense as deleteExpenseRequest,
  getExpenses,
  updateExpense,
} from "../services/expenseService.js";
import showAlert from "../utils/showAlert.js";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const pageSize = 10;

// Menampilkan angka nominal dengan pemisah ribuan.
function formatAmountInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? numberFormat.format(Number(digits)) : "";
}

// Mengubah nominal berformat tampilan menjadi angka untuk API.
function parseAmountInput(value) {
  return Number(String(value ?? "").replace(/\D/g, ""));
}

// Mengambil tanggal hari ini sesuai waktu lokal.
function getToday() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

// Menampilkan tanggal pengeluaran dalam format Indonesia.
function formatExpenseDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

// Membuat formulir pengeluaran dalam keadaan kosong.
function createEmptyForm() {
  return {
    category: "",
    description: "",
    amount: "",
    payment_method: "cash",
    expense_date: getToday(),
  };
}

// Mengelola data, formulir, filter, dan aksi pengeluaran.
export default function useExpenses(user) {
  const isAdmin = Number(user?.role_id) === 1;
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Memuat ulang daftar saat filter atau kunci refresh berubah.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getExpenses(
          {
            dateFrom: isAdmin ? dateFrom : "",
            dateTo: isAdmin ? dateTo : "",
            search: search.trim(),
            page: currentPage,
            pageSize,
          },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format daftar pengeluaran dari server tidak valid.");
        }

        setExpenses(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setExpenses([]);
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
  }, [refreshKey, isAdmin, dateFrom, dateTo, search, currentPage]);

  const displayedExpenseCount = serverPagination.total_items;


  const totalPages = serverPagination.total_pages;
  const activePage = serverPagination.page;
  const pageExpenses = expenses;

  // Membuka formulir untuk pengeluaran baru.
  function openCreateForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setError("");
    setFormOpen(true);
  }

  // Mengisi formulir dengan data pengeluaran yang dipilih.
  function openEditForm(expense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category ?? "",
      description: expense.description ?? "",
      amount: formatAmountInput(expense.amount),
      payment_method: expense.payment_method ?? "cash",
      expense_date:
        String(expense.expense_date ?? "").slice(0, 10) || getToday(),
    });
    setError("");
    setFormOpen(true);
  }

  // Menutup formulir dan mengembalikannya ke keadaan awal.
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }

  // Memperbarui nilai salah satu kolom formulir.
  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Menyimpan pengeluaran baru atau perubahan pengeluaran.
  async function submitExpense(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const expenseData = {
        ...form,
        amount: parseAmountInput(form.amount),
        expense_date: `${form.expense_date} 00:00:00`,
      };
      if (editingId) {
        await updateExpense(editingId, expenseData);
      } else {
        await createExpense(expenseData);
      }

      const successMessage = editingId
        ? "Pengeluaran berhasil diperbarui."
        : "Pengeluaran berhasil ditambahkan.";
      closeForm();
      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: successMessage,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (saveError) {
      setError(saveError.message);
      await showAlert({
        icon: "error",
        title: "Gagal menyimpan",
        text: saveError.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  }

  // Meminta konfirmasi lalu menghapus pengeluaran yang dipilih.
  async function deleteExpense(expense) {
    const confirmation = await showAlert({
      icon: "warning",
      title: "Hapus pengeluaran?",
      text: `Catatan pengeluaran ${expense.category} sebesar ${currency.format(Number(expense.amount) || 0)} akan dihapus.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
    });
    if (!confirmation.isConfirmed) return;

    setError("");
    try {
      await deleteExpenseRequest(expense.id);

      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Pengeluaran berhasil dihapus.",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (deleteError) {
      setError(deleteError.message);
      await showAlert({
        icon: "error",
        title: "Gagal menghapus",
        text: deleteError.message,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  }

  // Memicu pemuatan ulang daftar pengeluaran.
  function refreshExpenses() {
    setRefreshKey((key) => key + 1);
  }

  return {
    isAdmin,
    error,
    formOpen,
    form,
    formatAmountInput,
    isEditing: Boolean(editingId),
    closeForm,
    submitExpense,
    saving,
    updateForm,
    pageExpenses,
    pageSize,
    activePage,
    currentPage,
    setCurrentPage,
    totalPages,
    currency,
    displayedExpenseCount,
    filteredExpenses: expenses,
    formatExpenseDate,
    loading,
    deleteExpense,
    openEditForm,
    search,
    setSearch,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    openCreateForm,
    refreshExpenses,
  };
}
