// Mengelola pemuatan, pencarian, pemfilteran, dan perhitungan sisa hari untuk produk yang mendekati atau telah kedaluwarsa.
import { useEffect, useMemo, useState } from "react";
import { getExpiringProducts } from "../services/productService.js";
import { getSuppliers } from "../services/supplierService.js";

export const pageSize = 10;

export function formatSaleDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

export function daysRemaining(expDateString) {
  if (!expDateString) return "-";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expDateString);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Sudah Kedaluwarsa";
  if (diffDays === 0) return "Hari Ini";
  return `${diffDays} Hari Lagi`;
}

export default function useExpired() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getExpiringProducts(
          {
            search: productSearch.trim(),
            supplier_id: supplierFilter,
            page: currentPage,
            pageSize,
          },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error(
            "Format data produk kedaluwarsa dari server tidak valid.",
          );
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
  }, [refreshKey, productSearch, supplierFilter, currentPage]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSuppliers() {
      try {
        const result = await getSuppliers({
          page: 1,
          pageSize: 100,
        }, { signal: controller.signal });
        if (!Array.isArray(result?.items)) {
          throw new Error("Format data pemasok dari server tidak valid.");
        }
        setSuppliers(result.items);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      }
    }

    loadSuppliers();
    return () => controller.abort();
  }, [refreshKey]);

  const supplierNames = useMemo(() => {
    return new Map(
      suppliers.map((supplier) => [String(supplier.id), supplier.name]),
    );
  }, [suppliers]);

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
  const hasActiveFilters = Boolean(productSearch.trim() || supplierFilter);

  function resetFilters() {
    setProductSearch("");
    setSupplierFilter("");
    setCurrentPage(1);
  }

  function handleProductSearchChange(value) {
    setProductSearch(value);
    setCurrentPage(1);
  }

  function handleSupplierFilterChange(value) {
    setSupplierFilter(value);
    setCurrentPage(1);
  }

  function refreshExpired() {
    setRefreshKey((key) => key + 1);
  }

  return {
    products,
    suppliers,
    supplierNames,
    loading,
    error,
    productSearch,
    setProductSearch,
    handleProductSearchChange,
    supplierFilter,
    setSupplierFilter,
    handleSupplierFilterChange,
    currentPage,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    pageProducts,
    totalFilteredCount: serverPagination.total_items,
    hasActiveFilters,
    resetFilters,
    refreshExpired,
    formatSaleDate,
    daysRemaining,
  };
}
