import { useEffect, useMemo, useRef, useState } from "react";
import {
  allocateQuantity,
  currency,
  formatMoney,
  getAvailableQuantity,
  getDefaultUnitKey,
  getExpInfo,
  getLineTotal,
  getPriceLabel,
  groupProducts,
} from "../utils/kasirProducts.js";
import showAlert from "../utils/showAlert.js";
import { searchProducts } from "../services/productService.js";
import { createSale, getSaleReceipt } from "../services/saleService.js";

export default function useKasir() {
  const searchInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    if (!error) return;

    showAlert({
      icon: "error",
      title: "Perhatian",
      text: error,
    });
  }, [error]);

  useEffect(() => {
    if (!search.trim()) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingProducts(true);
      setError("");

      try {
        const result = await searchProducts(
          { search: search.trim(), page: 1, pageSize: 100 },
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.items)) {
          throw new Error("Format daftar produk dari server tidak valid.");
        }
        setProducts(result.items);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const groupedProducts = useMemo(() => groupProducts(products), [products]);
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + getLineTotal(item.product, item.quantity, item.unitKey),
        0,
      ),
    [cart],
  );
  const discountValue = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountValue);
  const paidValue = paymentMethod === "cash" ? Number(paidAmount) || 0 : total;
  const change = paidValue - total;

  // Memperbarui pencarian produk.
  function handleSearchChange(value) {
    setSearch(value);
    setLoadingProducts(Boolean(value.trim()));
    setError("");
    if (!value.trim()) {
      setProducts([]);
    }
  }

  // Menyimpan nominal pembayaran hanya sebagai angka.
  function handlePaidAmountChange(value) {
    const cleaned = value.replace(/[^\d]/g, "");
    setPaidAmount(cleaned ? Number(cleaned) : "");
  }

  // Menambahkan produk ke keranjang jika stok layak jual cukup dan memberi info jika ada batch lama di etalase.
  async function addProduct(product) {
    setError("");
    const existing = cart.find((item) => item.product.id === product.id);
    const unitKey = getDefaultUnitKey(product);
    const salableStock = Number(product.stock) || 0;

    if (salableStock < 1) {
      setError(
        `Obat "${product.name}" tidak memiliki stok yang layak jual (seluruh batch <= 30 hari atau kedaluwarsa).`,
      );
      return;
    }

    if (Number(product.criticalBatchCount) > 0 && !existing) {
      const criticalInfo = getExpInfo(product.criticalExpDate);
      const activeExpInfo = getExpInfo(product.exp_date);
      const statusText = criticalInfo?.isExpired
        ? `sudah kedaluwarsa (${criticalInfo?.formattedDate})`
        : `mendekati kedaluwarsa (${criticalInfo?.formattedDate} · sisa ${criticalInfo?.diffDays} hari)`;
      const confirmation = await showAlert({
        icon: "info",
        title: "Perhatian Batch Obat",
        text: `Terdapat batch obat yang ${statusText}.\n\nSistem mengarahkan penjualan ke Batch Baru (Exp: ${activeExpInfo?.formattedDate || "-"}). Pastikan Anda mengambil fisik batch baru di rak etalase.\n\nLanjutkan?`,
        showCancelButton: true,
        confirmButtonText: "Ya, Lanjutkan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#2563EB",
      });
      if (!confirmation.isConfirmed) return;
    }

    if (
      existing &&
      existing.quantity >= getAvailableQuantity(product, existing.unitKey)
    ) {
      setError(`Stok ${product.name} tidak mencukupi untuk unit yang dipilih.`);
      return;
    }

    setCart((currentCart) =>
      existing
        ? currentCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...currentCart, { product, quantity: 1, unitKey }],
    );
    setSearch("");
    setProducts([]);
    setLoadingProducts(false);
    searchInputRef.current?.focus();
  }

  // Mengubah jumlah produk tanpa melebihi stok.
  function changeQuantity(productId, amount) {
    const item = cart.find((cartItem) => cartItem.product.id === productId);
    if (!item) return;

    const nextQuantity = item.quantity + amount;
    if (nextQuantity < 1) return;
    if (nextQuantity > getAvailableQuantity(item.product, item.unitKey)) {
      setError(
        `Stok ${item.product.name} hanya ${getAvailableQuantity(item.product, item.unitKey)} ${item.product.saleUnits.find((unit) => unit.key === item.unitKey)?.unit_name || "unit"}.`,
      );
      return;
    }

    setError("");
    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.product.id === productId
          ? { ...cartItem, quantity: nextQuantity }
          : cartItem,
      ),
    );
  }

  // Mengganti satuan produk jika stok untuk satuan itu cukup.
  function changeUnit(productId, unitKey) {
    const item = cart.find((cartItem) => cartItem.product.id === productId);
    if (!item) return;

    const available = getAvailableQuantity(item.product, unitKey);
    if (item.quantity > available) {
      setError(
        `Stok ${item.product.name} hanya ${available} ${item.product.saleUnits.find((unit) => unit.key === unitKey)?.unit_name || "unit"}.`,
      );
      return;
    }

    setError("");
    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.product.id === productId ? { ...cartItem, unitKey } : cartItem,
      ),
    );
  }

  // Menghapus produk dari keranjang.
  function removeProduct(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId),
    );
  }

  // Mengosongkan keranjang dan pembayaran untuk transaksi baru.
  function startNewTransaction() {
    setCart([]);
    setDiscount("");
    setPaidAmount("");
    setPaymentMethod("cash");
    setError("");
  }

  // Memvalidasi pembayaran, menyimpan transaksi, lalu memuat struk.
  async function submitSale(event) {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Pilih minimal satu produk untuk melanjutkan.");
      return;
    }
    if (discountValue > subtotal) {
      setError("Diskon tidak boleh melebihi subtotal.");
      return;
    }
    if (paidValue < total) {
      setError("Nominal pembayaran kurang dari total yang harus dibayar.");
      return;
    }

    setSaving(true);
    try {
      const savedSale = await createSale({
        items: cart.flatMap(({ product, quantity, unitKey }) =>
          allocateQuantity(product, quantity, unitKey),
        ),
        discount: discountValue,
        paid_amount: paidValue,
        payment_method: paymentMethod,
      });

      startNewTransaction();
      try {
        if (!savedSale?.id) {
          throw new Error("ID transaksi tidak diterima dari server.");
        }

        const receipt = await getSaleReceipt(savedSale.id);
        if (!Array.isArray(receipt?.items)) {
          throw new Error("Format data struk dari server tidak valid.");
        }

        setReceiptPreview(receipt);
      } catch (receiptError) {
        await showAlert({
          icon: "warning",
          title: "Transaksi tersimpan",
          text: `Struk gagal dibuka: ${receiptError.message}. Cetak ulang dari halaman Penjualan.`,
        });
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return {
    searchInputRef,
    search,
    handleSearchChange,
    groupedProducts,
    loadingProducts,
    getPriceLabel,
    addProduct,
    cart,
    currency,
    getLineTotal,
    startNewTransaction,
    changeQuantity,
    changeUnit,
    removeProduct,
    submitSale,
    subtotal,
    discount,
    setDiscount,
    total,
    paymentMethod,
    setPaymentMethod,
    paidAmount,
    handlePaidAmountChange,
    change,
    formatMoney,
    saving,
    paidValue,
    receiptPreview,
  };
}
