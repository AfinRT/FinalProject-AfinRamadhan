import { useEffect, useState, useCallback } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";
import Button from "./Button.jsx";
import {
  getProductBatches,
  updateProductBatch,
  deleteProductBatch,
} from "../services/productBatchService.js";
import showAlert from "../utils/showAlert.js";

function formatThousands(val) {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("id-ID");
}

export default function BatchManagerModal({
  isOpen,
  onClose,
  product,
  onBatchUpdated,
}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editForm, setEditForm] = useState({
    invoice_number: "",
    invoice_date: "",
    quantity_received: "",
    quantity_remaining: "",
    exp_date: "",
    unit_cost: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const productId = product?.id;

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBatches = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isOpen || !productId) return;
    let cancelled = false;

    async function loadBatches() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getProductBatches(productId);
        if (!cancelled) {
          setBatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Gagal memuat batch.");
          setBatches([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBatches();
    return () => {
      cancelled = true;
    };
  }, [isOpen, productId, refreshKey]);

  function startEdit(batch) {
    setEditingBatchId(batch.id);
    const initialReceived = Number(batch.quantity_received ?? 0);
    const initialRemaining = Number(batch.quantity_remaining ?? 0);
    
    setEditForm({
      invoice_number: batch.invoice_number ?? "",
      invoice_date: batch.invoice_date
        ? String(batch.invoice_date).slice(0, 10)
        : "",
      quantity_received: String(initialReceived),
      quantity_remaining: String(initialRemaining),
      initial_received: initialReceived,
      initial_remaining: initialRemaining,
      exp_date: batch.exp_date ? String(batch.exp_date).slice(0, 10) : "",
      unit_cost: batch.unit_cost ? String(batch.unit_cost) : "",
    });
  }

  function cancelEdit() {
    if (savingEdit) return;
    setEditingBatchId(null);
  }

  async function handleSaveEdit(batchId) {
    const qtyReceived = Number(editForm.quantity_received);
    if (isNaN(qtyReceived) || qtyReceived < 0) {
      await showAlert({
        icon: "error",
        title: "Validasi Gagal",
        text: "Stok diterima tidak boleh negatif.",
      });
      return;
    }

    const qtyRemaining = Number(editForm.quantity_remaining);
    if (isNaN(qtyRemaining) || qtyRemaining < 0) {
      await showAlert({
        icon: "error",
        title: "Validasi Gagal",
        text: "Sisa stok tidak boleh negatif.",
      });
      return;
    }

    if (qtyRemaining > qtyReceived) {
      await showAlert({
        icon: "error",
        title: "Validasi Gagal",
        text: "Sisa stok tidak boleh lebih besar dari stok diterima.",
      });
      return;
    }

    const unitCost = Number(editForm.unit_cost);
    if (isNaN(unitCost) || unitCost < 0) {
      await showAlert({
        icon: "error",
        title: "Validasi Gagal",
        text: "Harga modal per unit tidak boleh negatif.",
      });
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updateProductBatch(batchId, {
        invoice_number: editForm.invoice_number.trim() || null,
        invoice_date: editForm.invoice_date || null,
        quantity_received: qtyReceived,
        quantity_remaining: qtyRemaining,
        exp_date: editForm.exp_date || null,
        unit_cost: unitCost,
      });

      const savedUnitCost =
        res?.data?.unit_cost !== undefined
          ? Number(res.data.unit_cost)
          : Number((unitCost / (qtyReceived > 0 ? qtyReceived : 1)).toFixed(2));

      setBatches((current) =>
        current.map((b) =>
          b.id === batchId
            ? {
                ...b,
                invoice_number: editForm.invoice_number.trim() || null,
                invoice_date: editForm.invoice_date || null,
                quantity_received: qtyReceived,
                quantity_remaining: qtyRemaining,
                exp_date: editForm.exp_date || null,
                unit_cost: savedUnitCost,
              }
            : b,
        ),
      );

      setEditingBatchId(null);
      if (onBatchUpdated) onBatchUpdated();

      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Batch berhasil diperbarui.",
        timer: 1500,
      });
    } catch (err) {
      await showAlert({
        icon: "error",
        title: "Gagal memperbarui batch",
        text: err.message,
      });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteBatch(batch) {
    const confirmation = await showAlert({
      icon: "warning",
      title: `Hapus batch #${batch.id}?`,
      text: `Sisa stok (${batch.quantity_remaining} ${product.unit}) pada batch ini akan memotong total stok obat.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#DC2626",
    });

    if (!confirmation.isConfirmed) return;

    setDeletingId(batch.id);
    try {
      await deleteProductBatch(batch.id);
      setBatches((current) => current.filter((b) => b.id !== batch.id));
      if (onBatchUpdated) onBatchUpdated();
      await showAlert({
        icon: "success",
        title: "Berhasil",
        text: "Batch berhasil dihapus.",
        timer: 1500,
      });
    } catch (err) {
      await showAlert({
        icon: "error",
        title: "Gagal menghapus batch",
        text: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen || !product) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !savingEdit &&
          !deletingId
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/75">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              Inventaris Batch Obat
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-800 tracking-tight">
              Kelola Batch: {product.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Barcode:{" "}
                <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {product.barcode || "-"}
                </span>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Satuan:{" "}
                <span className="font-semibold text-slate-700">
                  {product.unit}
                </span>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Total stok:{" "}
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {product.stock} {product.unit}
                </span>
              </span>
            </div>
          </div>
          <Button
            onClick={onClose}
            disabled={savingEdit || Boolean(deletingId)}
            className="modal-close-button"
            aria-label="Tutup Modal"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Isi Tabel Batch */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 className="animate-spin text-blue-600" size={22} />{" "}
              <span>Memuat rincian batch...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-600 gap-3">
              <AlertCircle size={38} />
              <p className="text-sm font-semibold">{loadError}</p>
              <Button onClick={fetchBatches} className="primary-action-button">
                <RefreshCw size={14} /> Coba Lagi
              </Button>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <AlertCircle size={38} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada batch untuk obat ini.
              </p>
              <p className="text-xs text-slate-400">
                Gunakan menu Restock pada tabel utama untuk menambah batch baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-3.5 text-left">No. Faktur</th>
                    <th className="py-3 px-3.5 text-center">Tgl. Faktur</th>
                    <th className="py-3 px-3.5 text-center">
                      Tgl. Kedaluwarsa
                    </th>
                    <th className="py-3 px-3.5 text-center">Jumlah Diterima</th>
                    <th className="py-3 px-3.5 text-center">Sisa Stok</th>
                    <th className="py-3 px-3.5 text-right">Modal/Unit</th>
                    <th className="py-3 px-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const isEditing = editingBatchId === batch.id;
                    const isExpired =
                      batch.exp_date && new Date(batch.exp_date) < new Date();
                    const expDateObj = batch.exp_date
                      ? new Date(batch.exp_date)
                      : null;
                    const thirtyDaysAhead = new Date();
                    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
                    const isExpiringSoon =
                      expDateObj && !isExpired && expDateObj <= thirtyDaysAhead;

                    if (isEditing) {
                      return (
                        <tr
                          key={batch.id}
                          className="bg-blue-50/40 border-b border-blue-100/80 transition-colors"
                        >
                          {/* Nomor Faktur */}
                          <td className="py-3 px-3.5 align-middle">
                            <input
                              type="text"
                              className="h-9 w-full min-w-32 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                              value={editForm.invoice_number}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  invoice_number: e.target.value,
                                }))
                              }
                              placeholder="INV-..."
                              disabled={savingEdit}
                            />
                          </td>

                          {/* Tanggal Faktur */}
                          <td className="py-3 px-3.5 text-center align-middle">
                            <input
                              type="date"
                              className="h-9 w-32 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                              value={editForm.invoice_date}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  invoice_date: e.target.value,
                                }))
                              }
                              title="Tanggal faktur"
                              disabled={savingEdit}
                            />
                          </td>

                          {/* Tanggal Kedaluwarsa */}
                          <td className="py-3 px-3.5 text-center align-middle">
                            <input
                              type="date"
                              className="h-9 w-32 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                              value={editForm.exp_date}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  exp_date: e.target.value,
                                }))
                              }
                              title="Tanggal kedaluwarsa"
                              disabled={savingEdit}
                            />
                          </td>

                          {/* Jumlah Diterima (dengan unit seperti 'Pcs' di dalam input) */}
                          <td className="py-3 px-3.5 text-center align-middle">
                            <div className="relative inline-flex items-center w-26">
                              <input
                                type="number"
                                min="0"
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-2.5 pr-9 text-center text-xs font-semibold text-slate-800 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                value={editForm.quantity_received}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const numVal = Number(val) || 0;
                                  setEditForm((f) => ({
                                    ...f,
                                    quantity_received: val,
                                    quantity_remaining:
                                      Number(f.quantity_remaining) > numVal
                                        ? String(numVal)
                                        : f.quantity_remaining,
                                  }));
                                }}
                                disabled={savingEdit}
                                title="Jumlah stok diterima (dapat diedit)"
                              />
                              <span className="pointer-events-none absolute right-2.5 text-[11px] font-semibold text-slate-400 select-none">
                                {product.unit || "Pcs"}
                              </span>
                            </div>
                          </td>

                          {/* Sisa Stok (Dapat diedit / dinolkan jika kedaluwarsa) */}
                          <td className="py-3 px-3.5 text-center align-middle">
                            <div className="relative inline-flex items-center w-26">
                              <input
                                type="number"
                                min="0"
                                max={editForm.quantity_received || undefined}
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-2.5 pr-9 text-center text-xs font-semibold text-slate-800 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                value={editForm.quantity_remaining}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm((f) => ({
                                    ...f,
                                    quantity_remaining: val,
                                  }));
                                }}
                                disabled={savingEdit}
                                title="Sisa stok batch (dapat disesuaikan atau dinolkan jika kedaluwarsa)"
                              />
                              <span className="pointer-events-none absolute right-2.5 text-[11px] font-semibold text-slate-400 select-none">
                                {product.unit || "Pcs"}
                              </span>
                            </div>
                          </td>

                          {/* Modal / Unit (dengan prefix 'Rp' dan pemisah ribuan) */}
                          <td className="py-3 px-3.5 text-right align-middle">
                            <div className="relative inline-flex items-center w-36">
                              <span className="pointer-events-none absolute left-2.5 text-xs font-bold text-slate-400 select-none">
                                Rp
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 text-right text-xs font-semibold text-slate-800 shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                value={formatThousands(editForm.unit_cost)}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "");
                                  setEditForm((f) => ({
                                    ...f,
                                    unit_cost: raw,
                                  }));
                                }}
                                placeholder="0"
                                disabled={savingEdit}
                                title="Total modal faktur (dibagi stok masuk untuk harga satuan)"
                              />
                            </div>
                          </td>

                          {/* Tombol Aksi (Simpan dan Batal) */}
                          <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                onClick={() => handleSaveEdit(batch.id)}
                                disabled={savingEdit}
                                className="table-save-button h-9 px-3.5"
                                title="Simpan perubahan batch"
                              >
                                <Check size={14} className="shrink-0" />
                                <span>{savingEdit ? "..." : "Simpan"}</span>
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                disabled={savingEdit}
                                className="table-cancel-button h-9 px-3"
                                title="Batal ubah"
                              >
                                <X size={14} className="shrink-0" />
                                <span>Batal</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Tampilan Baris Normal
                    return (
                      <tr
                        key={batch.id}
                        className="border-b border-slate-100 transition-colors"
                      >
                        {/* No. Faktur */}
                        <td className="py-3 px-3.5 align-middle">
                          {batch.invoice_number ? (
                            <span className="font-semibold text-slate-800">
                              {batch.invoice_number}
                            </span>
                          ) : (
                            <span className="italic text-slate-400 text-xs">
                              Tanpa nomor faktur
                            </span>
                          )}
                        </td>

                        {/* Tgl. Faktur */}
                        <td className="py-3 px-3.5 text-center align-middle text-xs font-medium text-slate-600">
                          {batch.invoice_date || "-"}
                        </td>

                        {/* Tgl. Kedaluwarsa */}
                        <td className="py-3 px-3.5 text-center align-middle">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border ${
                              isExpired
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isExpiringSoon
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {batch.exp_date || "-"}
                          </span>
                        </td>

                        {/* Jumlah Diterima */}
                        <td className="py-3 px-3.5 text-center align-middle text-xs font-medium text-slate-700">
                          {batch.quantity_received} {product.unit || "Pcs"}
                        </td>

                        {/* Sisa Stok */}
                        <td className="py-3 px-3.5 text-center align-middle">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                            {batch.quantity_remaining} {product.unit || "Pcs"}
                          </span>
                        </td>

                        {/* Modal / Unit */}
                        <td className="py-3 px-3.5 text-right align-middle text-xs font-semibold text-slate-800">
                          Rp {Number(batch.unit_cost || 0).toLocaleString("id-ID")}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              onClick={() => startEdit(batch)}
                              disabled={
                                Boolean(editingBatchId) || Boolean(deletingId)
                              }
                              title="Edit data batch ini"
                              className="action-button h-8.5 px-2.5 text-xs text-blue-700 hover:bg-blue-50 hover:border-blue-200"
                            >
                              <Pencil size={12} className="shrink-0" /> Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteBatch(batch)}
                              disabled={
                                Boolean(editingBatchId) ||
                                deletingId === batch.id
                              }
                              title="Hapus baris batch ini"
                              className="action-button h-8.5 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                            >
                              <Trash2 size={12} className="shrink-0" /> Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50/75">
          <Button
            onClick={onClose}
            disabled={savingEdit || Boolean(deletingId)}
            className="secondary-action-button"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
