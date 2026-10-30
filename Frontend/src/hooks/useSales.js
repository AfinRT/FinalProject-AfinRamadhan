import { useEffect, useRef, useState } from "react";
import {
  getSaleDetails,
  deleteSale as deleteSaleRequest,
  getSales,
  getSaleReceipt,
} from "../services/saleService.js";
import { buildReceiptDocument } from "../utils/receipt.js";
import showAlert from "../utils/showAlert.js";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const paymentLabels = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
};
const pageSize = 10;

// Menampilkan waktu transaksi dalam format Indonesia.
function formatSaleDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Mengelola data, filter, detail, dan struk penjualan.
export default function useSales(user) {
  const isAdmin = Number(user?.role_id) === 1;
  const isPharmacist = Number(user?.role_id) === 2;
  const isCashier = Number(user?.role_id) === 3;
  const [sales, setSales] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cashierSearch, setCashierSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const detailRequest = useRef(null);
  const hasFullAccess = isAdmin || isPharmacist;
  // Muat ulang daftar transaksi saat diminta.
  useEffect(() => {
    const controller = new AbortController();
    const filters = {
      invoice: invoiceSearch.trim(),
      product: productSearch.trim(),
      cashier: hasFullAccess ? cashierSearch.trim() : "",
      date_from: hasFullAccess ? dateFrom : "",
      date_to: hasFullAccess ? dateTo : "",
      payment_method: paymentFilter,
      page: currentPage,
      pageSize,
    };

    // Mengambil daftar transaksi dari server.
    async function loadSales() {
      setLoading(true);
      setError("");

      try {
        const result = await getSales(filters, { signal: controller.signal });
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format daftar penjualan dari server tidak valid.");
        }

        setSales(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setSales([]);
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
    }

    const timer = window.setTimeout(loadSales, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    refreshKey,
    hasFullAccess,
    invoiceSearch,
    productSearch,
    cashierSearch,
    dateFrom,
    dateTo,
    paymentFilter,
    currentPage,
  ]);

  const totalPages = serverPagination.total_pages;
  const activePage = serverPagination.page;
  const pageSales = sales;
  const hasActiveFilters = Boolean(
    invoiceSearch ||
    productSearch ||
    (hasFullAccess && cashierSearch) || 
    (hasFullAccess && (dateFrom || dateTo)) || 
    paymentFilter,
  );

  useEffect(() => () => detailRequest.current?.abort(), []);

  // Memuat rincian transaksi yang dipilih.
  async function showSaleDetails(sale) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelectedSale(sale);
    setLoadingDetails(true);
    setDetailError("");

    try {
      const result = await getSaleDetails(sale.id, {
        signal: controller.signal,
      });
      if (!Array.isArray(result?.items)) {
        throw new Error("Format detail transaksi dari server tidak valid.");
      }

      setSelectedSale(result);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setDetailError(loadError.message);
    } finally {
      if (detailRequest.current === controller) {
        detailRequest.current = null;
        setLoadingDetails(false);
      }
    }
  }

  async function deleteSale(sale) {
    const confirmation = await showAlert({
      icon: "warning",
      title: "Hapus transaksi?",
      text: `Transaksi ${sale.invoice_number || sale.id} sebesar ${currency.format(Number(sale.grand_total ?? sale.total) || 0)} akan dihapus.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
    });
    if (!confirmation.isConfirmed) return;

    setError("");
    try {
      await deleteSaleRequest(sale.id);

      setRefreshKey((key) => key + 1);
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil dihapus.",
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
  // Menutup detail dan membatalkan permintaan yang masih berjalan.
  function closeSaleDetails() {
    detailRequest.current?.abort();
    detailRequest.current = null;
    setSelectedSale(null);
    setLoadingDetails(false);
    setDetailError("");
  }

  // Mengambil data struk dan membuka halaman cetak.
  async function printSaleReceipt(sale) {
    const printWindow = window.open("", "_blank", "width=420,height=720");
    if (!printWindow) {
      setDetailError("Izinkan pop-up browser untuk mencetak struk.");
      return;
    }

    setPrintingReceipt(true);
    setDetailError("");
    try {
      const receipt = await getSaleReceipt(sale.id);
      if (!Array.isArray(receipt?.items)) {
        throw new Error("Format data struk dari server tidak valid.");
      }

      printWindow.document.open();
      printWindow.document.write(buildReceiptDocument(receipt));
      printWindow.document.close();
      printWindow.focus();
    } catch (printError) {
      printWindow.close();
      setDetailError(printError.message);
    } finally {
      setPrintingReceipt(false);
    }
  }

  // Meminta hook memuat ulang daftar transaksi.
  function refreshSales() {
    setRefreshKey((key) => key + 1);
  }

  return {
    hasFullAccess,
    isAdmin,
    isPharmacist,
    isCashier,
    error,
    refreshSales,
    invoiceSearch,
    setInvoiceSearch,
    productSearch,
    setProductSearch,
    cashierSearch,
    setCashierSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    paymentFilter,
    setPaymentFilter,
    setCurrentPage,
    hasActiveFilters,
    loading,
    pageSales,
    filteredSalesCount: serverPagination.total_items,
    currentPage,
    activePage,
    totalPages,
    pageSize,
    showSaleDetails,
    currency,
    formatSaleDate,
    paymentLabels,
    deleteSale,
    selectedSale,
    loadingDetails,
    detailError,
    closeSaleDetails,
    printSaleReceipt,
    printingReceipt,
  };
}
