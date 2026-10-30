// Mengelola analisis penjualan produk, rentang bulan, pengurutan terlaris/tersedikit, pencarian, dan paginasi.
import { useEffect, useState } from "react";
import { getProductSalesAnalysis } from "../services/saleService.js";

export const pageSize = 10;

export const quantityFormatter = new Intl.NumberFormat("id-ID");

export function getCurrentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const dateTo = new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);

  return { dateFrom: `${month}-01`, dateTo };
}

export default function useProductAnalysis() {
  const [defaultMonth] = useState(getCurrentMonth);
  const [month, setMonth] = useState(defaultMonth);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { dateFrom, dateTo } = getMonthRange(month);
        const result = await getProductSalesAnalysis(
          {
            dateFrom,
            dateTo,
            search: search.trim(),
            order: sortOrder,
            page: currentPage,
            pageSize,
          },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format analisis produk dari server tidak valid.");
        }
        setProducts(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setProducts([]);
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
  }, [month, refreshKey, search, sortOrder, currentPage]);

  const totalPages = serverPagination.total_pages;
  const activePage = serverPagination.page;
  const pageProducts = products;

  const firstVisible = serverPagination.total_items
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisible = Math.min(
    activePage * pageSize,
    serverPagination.total_items,
  );
  const hasActiveFilters = Boolean(
    search.trim() || month !== defaultMonth || sortOrder !== "DESC",
  );

  function resetFilters() {
    setSearch("");
    setMonth(defaultMonth);
    setSortOrder("DESC");
    setCurrentPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleMonthChange(value) {
    if (!value) return;
    setMonth(value);
    setCurrentPage(1);
  }

  function handleSortOrderChange(value) {
    setSortOrder(value);
    setCurrentPage(1);
  }

  function refreshProductAnalysis() {
    setRefreshKey((key) => key + 1);
  }

  return {
    month,
    setMonth,
    defaultMonth,
    handleMonthChange,
    sortOrder,
    setSortOrder,
    handleSortOrderChange,
    search,
    setSearch,
    handleSearchChange,
    products,
    loading,
    error,
    currentPage,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount: serverPagination.total_items,
    pageProducts,
    hasActiveFilters,
    resetFilters,
    refreshProductAnalysis,
    quantityFormatter,
  };
}
