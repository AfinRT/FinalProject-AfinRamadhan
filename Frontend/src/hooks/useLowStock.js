// Mengelola pemuatan, pencarian, pemfilteran distributor, dan paginasi untuk produk dengan stok menipis.
import { useEffect, useMemo, useState } from "react";
import { getLowStockProducts } from "../services/productService.js";
import { getSuppliers } from "../services/supplierService.js";

export const pageSize = 10;

export default function useLowStock() {
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
        const result = await getLowStockProducts(
          {
            search: productSearch.trim(),
            supplier_id: supplierFilter,
            page: currentPage,
            pageSize,
          },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error("Format data stok produk dari server tidak valid.");
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

  function refreshLowStock() {
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
    refreshLowStock,
  };
}
