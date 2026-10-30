// Mengelola pemuatan riwayat pembelian per pemasok, pencarian, filter tanggal invoice, paginasi, dan detail modal invoice.
import { useEffect, useRef, useState } from "react";
import {
  getAllOrderHistory,
  getOrderHistory,
  getSuppliers,
} from "../services/supplierService.js";

export const pageSize = 10;

export const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? String(value) : dateTime.format(date);
}

export default function useOrderHistory() {
  const [orderHistory, setOrderHistory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    page_size: pageSize,
    total_items: 0,
    total_pages: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getAllOrderHistory({
          product: productSearch.trim(),
          supplierId: supplierFilter,
          invoiceDate,
          page: currentPage,
          pageSize,
          signal: controller.signal,
        });
        if (!Array.isArray(result?.items) || !result?.pagination) {
          throw new Error(
            "Format data riwayat pembelian dari server tidak valid.",
          );
        }
        setOrderHistory(result.items);
        setServerPagination(result.pagination);
        setCurrentPage(result.pagination.page);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setOrderHistory([]);
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
  }, [invoiceDate, productSearch, refreshKey, supplierFilter, currentPage]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSuppliers() {
      try {
        const result = await getSuppliers({
          page: 1,
          pageSize: 100,
        }, { signal: controller.signal });
        if (!Array.isArray(result?.items)) {
          throw new Error("Format data supplier dari server tidak valid.");
        }
        setSuppliers(result.items);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      }
    }

    loadSuppliers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => detailRequest.current?.abort();
  }, []);

  const pageOrders = orderHistory;
  const totalPages = serverPagination.total_pages;
  const activePage = serverPagination.page;
  const firstVisible = serverPagination.total_items
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisible = Math.min(
    activePage * pageSize,
    serverPagination.total_items,
  );
  const hasActiveFilters = Boolean(
    productSearch.trim() || supplierFilter || invoiceDate,
  );

  function resetFilters() {
    setSupplierFilter("");
    setProductSearch("");
    setInvoiceDate("");
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

  function handleInvoiceDateChange(value) {
    setInvoiceDate(value);
    setCurrentPage(1);
  }

  function refreshOrderHistory() {
    setRefreshKey((key) => key + 1);
  }

  async function openOrderDetails(order) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelectedOrder(order);
    setDetailError("");

    if (!order.invoice_number) {
      setDetailLoading(false);
      detailRequest.current = null;
      return;
    }

    setDetailLoading(true);
    try {
      const result = await getOrderHistory(
        order.supplier_id,
        order.invoice_number,
        {
          signal: controller.signal,
        },
      );
      if (!Array.isArray(result?.items)) {
        throw new Error("Format detail invoice dari server tidak valid.");
      }
      setSelectedOrder({ ...order, ...result });
    } catch (loadError) {
      if (loadError.name !== "AbortError") setDetailError(loadError.message);
    } finally {
      if (detailRequest.current === controller) {
        detailRequest.current = null;
        setDetailLoading(false);
      }
    }
  }

  function closeOrderDetails() {
    detailRequest.current?.abort();
    detailRequest.current = null;
    setSelectedOrder(null);
    setDetailLoading(false);
    setDetailError("");
  }

  return {
    orderHistory,
    suppliers,
    loading,
    error,
    productSearch,
    setProductSearch,
    handleProductSearchChange,
    supplierFilter,
    setSupplierFilter,
    handleSupplierFilterChange,
    invoiceDate,
    setInvoiceDate,
    handleInvoiceDateChange,
    currentPage,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount: serverPagination.total_items,
    pageOrders,
    hasActiveFilters,
    selectedOrder,
    detailLoading,
    detailError,
    resetFilters,
    refreshOrderHistory,
    openOrderDetails,
    closeOrderDetails,
    formatDate,
    currency,
  };
}
