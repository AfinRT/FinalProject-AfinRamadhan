// Mengelola pemuatan, pencarian, pemfilteran, paginasi, formulir produk, dan pengelolaan batch.
import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../services/categoryService.js";
import {
  createProduct,
  searchProducts,
  updateProduct,
  stockInProduct,
} from "../services/productService.js";
import { getSuppliers } from "../services/supplierService.js";
import showAlert from "../utils/showAlert.js";

const pageSize = 10;
const units = ["Pcs", "Botol", "Strip", "Box", "Tablet", "Kaplet", "Kapsul"];

function getRequiredSaleUnitNames(baseUnit) {
  const normalizedUnit = String(baseUnit ?? "")
    .trim()
    .toLowerCase();
  if (normalizedUnit === "tablet") return ["Strip", "Box"];
  if (normalizedUnit === "kapsul" || normalizedUnit === "strip") {
    return ["Box"];
  }
  return [];
}

function getSaleUnitsForBaseUnit(baseUnit, existingUnits = []) {
  return getRequiredSaleUnitNames(baseUnit).map((unitName) => {
    const existingUnit = existingUnits.find(
      (unit) =>
        String(unit.unit_name).trim().toLowerCase() === unitName.toLowerCase(),
    );

    return {
      unit_name: unitName,
      base_quantity: existingUnit ? String(existingUnit.base_quantity) : "",
    };
  });
}

const emptyForm = {
  barcode: "",
  name: "",
  category_id: "",
  supplier_id: "",
  invoice_number: "",
  invoice_date: "",
  unit: "",
  sale_units: [],
  purchase_price: "",
  stock: "",
  min_stock: "",
  exp_date: "",
  isEditMode: false,
};

export default function useMedicineCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
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

  // State Modal Form (Tambah, Edit Master, Restock)
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // State Modal Kelola Batch
  const [batchModal, setBatchModal] = useState({
    open: false,
    selectedProduct: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadMeta() {
      try {
        const [categoryResult, supplierResult] = await Promise.all([
          getCategories(
            { page: 1, pageSize: 100 },
            { signal: controller.signal },
          ),
          getSuppliers(
            { page: 1, pageSize: 100 },
            { signal: controller.signal },
          ),
        ]);

        if (Array.isArray(categoryResult?.items)) {
          setCategories(categoryResult.items);
        }
        if (Array.isArray(supplierResult?.items)) {
          setSuppliers(supplierResult.items);
        }
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          console.error(loadError);
        }
      }
    }

    loadMeta();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const productResult = await searchProducts(
          {
            search: search.trim(),
            category_id: categoryFilter,
            supplier_id: supplierFilter,
            page: currentPage,
            pageSize,
          },
          { signal: controller.signal },
        );

        if (!Array.isArray(productResult?.items) || !productResult?.pagination) {
          throw new Error("Format data katalog dari server tidak valid.");
        }

        setProducts(productResult.items);
        setServerPagination(productResult.pagination);
        setCurrentPage(productResult.pagination.page);
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
  }, [refreshKey, search, categoryFilter, supplierFilter, currentPage]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories],
  );

  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [String(supplier.id), supplier.name])),
    [suppliers],
  );

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
    search.trim() || categoryFilter || supplierFilter,
  );

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setSupplierFilter("");
    setCurrentPage(1);
  }

  function openCreateForm() {
    setForm({ ...emptyForm, isEditMode: false });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(product) {
    setForm({
      id: product.id,
      barcode: product.barcode ?? "",
      name: product.name ?? "",
      category_id: String(product.category_id ?? ""),
      supplier_id: String(product.supplier_id ?? ""),
      invoice_number: product.invoice_number ?? "",
      invoice_date: product.invoice_date
        ? String(product.invoice_date).slice(0, 10)
        : "",
      unit: product.unit ?? "",
      sale_units: getSaleUnitsForBaseUnit(
        product.unit,
        product.sale_units ?? [],
      ),
      purchase_price: String(product.purchase_price ?? 0),
      stock: String(Number(product.stock) || 0),
      min_stock: String(Number(product.min_stock) || 0),
      exp_date: product.exp_date
        ? String(product.exp_date).slice(0, 10)
        : "",
      isEditMode: true,
    });
    setFormError("");
    setFormOpen(true);
  }

  function openRestockForm(product) {
    setForm({
      id: product.id,
      barcode: product.barcode ?? "",
      name: product.name ?? "",
      category_id: String(product.category_id ?? ""),
      supplier_id: String(product.supplier_id ?? ""),
      invoice_number: "",
      invoice_date: "",
      unit: product.unit ?? "",
      sale_units: product.sale_units ?? [],
      purchase_price: "",
      stock: "",
      min_stock: String(Number(product.min_stock) || 0),
      exp_date: "",
      isEditMode: false,
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

  function updateSaleUnit(index, field, value) {
    setForm((current) => ({
      ...current,
      sale_units: current.sale_units.map((saleUnit, saleUnitIndex) =>
        saleUnitIndex === index ? { ...saleUnit, [field]: value } : saleUnit,
      ),
    }));
  }

  function changeBaseUnit(unit) {
    setForm((current) => ({
      ...current,
      unit,
      sale_units: getSaleUnitsForBaseUnit(unit, current.sale_units),
    }));
  }

  function openBatchManagerModal(product) {
    setBatchModal({ open: true, selectedProduct: product });
  }

  function closeBatchModal() {
    setBatchModal({ open: false, selectedProduct: null });
  }

  function refreshCatalog() {
    setRefreshKey((key) => key + 1);
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (form.id && !form.isEditMode) {
        // Mode Restock
        const stockToAdd = Number(form.stock);
        if (!stockToAdd || stockToAdd <= 0) {
          throw new Error("Jumlah stok masuk harus lebih dari 0.");
        }
        const purchasePrice = Number(form.purchase_price);
        if (!purchasePrice || purchasePrice <= 0) {
          throw new Error("Modal total faktur baru harus lebih dari 0.");
        }

        await stockInProduct(form.id, {
          invoice_number: form.invoice_number ? form.invoice_number.trim() : null,
          ...(form.invoice_date ? { invoice_date: form.invoice_date } : {}),
          box_quantity: stockToAdd,
          conversion_factor: 1,
          purchase_price: purchasePrice,
          ...(form.exp_date ? { exp_date: form.exp_date } : {}),
        });

        await showAlert({
          icon: "success",
          title: "Berhasil",
          text: "Stok produk berhasil ditambahkan.",
          timer: 1500,
        });
      } else if (form.id) {
        // Mode Edit Master Data
        const productData = {
          barcode: form.barcode.trim(),
          name: form.name.trim(),
          category_id: Number(form.category_id),
          supplier_id: Number(form.supplier_id),
          invoice_number: form.invoice_number ? form.invoice_number.trim() : null,
          ...(form.invoice_date ? { invoice_date: form.invoice_date } : {}),
          unit: form.unit,
          sale_units: form.sale_units.map((saleUnit) => ({
            unit_name: saleUnit.unit_name.trim(),
            base_quantity: Number(saleUnit.base_quantity),
          })),
          purchase_price: Number(form.purchase_price) || 0,
          stock: Number(form.stock) || 0,
          min_stock: Number(form.min_stock) || 0,
          ...(form.exp_date ? { exp_date: form.exp_date } : {}),
        };

        await updateProduct(form.id, productData);

        await showAlert({
          icon: "success",
          title: "Berhasil",
          text: "Master produk berhasil diperbarui.",
          timer: 1500,
        });
      } else {
        // Mode Tambah Produk Baru
        const stock = Number(form.stock) || 0;
        const productData = {
          barcode: form.barcode.trim(),
          name: form.name.trim(),
          category_id: Number(form.category_id),
          supplier_id: Number(form.supplier_id),
          invoice_number: form.invoice_number ? form.invoice_number.trim() : null,
          ...(form.invoice_date ? { invoice_date: form.invoice_date } : {}),
          unit: form.unit,
          sale_units: form.sale_units.map((saleUnit) => ({
            unit_name: saleUnit.unit_name.trim(),
            base_quantity: Number(saleUnit.base_quantity),
          })),
          purchase_price: Number(form.purchase_price) || 0,
          stock,
          min_stock: Number(form.min_stock) || 0,
          ...(form.exp_date ? { exp_date: form.exp_date } : {}),
        };

        await createProduct(productData);

        await showAlert({
          icon: "success",
          title: "Berhasil",
          text: "Produk baru berhasil ditambahkan.",
          timer: 1500,
        });
      }

      setFormOpen(false);
      refreshCatalog();
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  const isCreateMode = !form.id;
  const isRestockMode = Boolean(form.id && !form.isEditMode);
  const isEditMasterMode = Boolean(form.id && form.isEditMode);

  return {
    products: pageProducts,
    totalFilteredCount: serverPagination.total_items,
    categories,
    suppliers,
    categoriesById,
    suppliersById,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    supplierFilter,
    setSupplierFilter,
    currentPage: activePage,
    setCurrentPage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    loading,
    error,
    refreshCatalog,
    hasActiveFilters,
    resetFilters,
    formOpen,
    form,
    formError,
    saving,
    isCreateMode,
    isEditMasterMode,
    isRestockMode,
    openCreateForm,
    openEditForm,
    openRestockForm,
    closeForm,
    updateForm,
    updateSaleUnit,
    changeBaseUnit,
    submitForm,
    batchModal,
    openBatchManagerModal,
    closeBatchModal,
    units,
  };
}
