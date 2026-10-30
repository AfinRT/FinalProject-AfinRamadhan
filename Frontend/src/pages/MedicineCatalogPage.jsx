// Menampilkan katalog obat dengan dukungan pencarian, pemfilteran, paginasi, formulir, dan pengelolaan batch.
import {
  PackageSearch,
  Pencil,
  Plus,
  RefreshCw,
  PackagePlus,
  Boxes,
} from "lucide-react";
import Button from "../components/Button.jsx";
import FilterField from "../components/FilterField.jsx";
import FormModal from "../components/FormModal.jsx";
import BatchManagerModal from "../components/BatchManagerModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Pagination from "../components/Pagination.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useMedicineCatalog from "../hooks/useMedicineCatalog.js";

const columns = [
  { key: "product", label: "Nama produk" },
  { key: "category", label: "Kategori" },
  { key: "supplier", label: "Distributor" },
  { key: "stock", label: "Total Stok", align: "center" },
  { key: "unit", label: "Satuan", align: "center" },
  { key: "price", label: "Harga jual", align: "center" },
  { key: "actions", label: "Aksi", align: "center" },
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const quantityFormatter = new Intl.NumberFormat("id-ID");

export default function MedicineCatalogPage({ user }) {
  const {
    products,
    totalFilteredCount,
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
    currentPage,
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
  } = useMedicineCatalog(user);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Inventaris obat"
        title="Katalog Obat"
        description="Lihat daftar produk, kategori, distributor, total stok, tanggal kedaluwarsa terdekat, dan kelola batch."
        actions={
          <Button onClick={openCreateForm} className="primary-action-button">
            <Plus aria-hidden="true" size={17} /> Tambah produk
          </Button>
        }
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshCatalog}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar katalog obat">
        <FilterField
          type="group"
          className="crud-filter-bar"
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari produk"
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            placeholder="Nama produk atau barcode"
            value={search}
          />
          <FilterField
            emptyOption="Semua kategori"
            label="Kategori"
            onChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            type="select"
            value={categoryFilter}
          />
          <FilterField
            emptyOption="Semua distributor"
            label="Distributor"
            onChange={(value) => {
              setSupplierFilter(value);
              setCurrentPage(1);
            }}
            options={suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            }))}
            type="select"
            value={supplierFilter}
          />
        </FilterField>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={columns} />
              <TableBody
                loading={loading}
                data={products}
                columnsCount={columns.length}
                loadingText="Memuat katalog obat..."
                emptyText={
                  <>
                    <PackageSearch
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {hasActiveFilters
                        ? "Produk tidak ditemukan"
                        : "Belum ada produk"}
                    </p>
                    <p className="data-table-empty-description">
                      {hasActiveFilters
                        ? "Coba ubah filter pencarian."
                        : "Produk yang tersedia akan tampil di katalog ini."}
                    </p>
                  </>
                }
                renderRow={(product) => {
                  return (
                    <tr className="data-table-row" key={product.id}>
                      <td className="data-table-cell">
                        <p className="font-semibold text-slate-800">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 font-mono">
                          {product.barcode || "-"}
                        </p>
                      </td>

                      <td className="data-table-cell text-slate-600">
                        {categoriesById.get(String(product.category_id)) || "-"}
                      </td>
                      <td className="data-table-cell text-slate-600">
                        {suppliersById.get(String(product.supplier_id)) || "-"}
                      </td>

                      <td className="data-table-cell text-center font-bold text-slate-800">
                        {quantityFormatter.format(Number(product.stock) || 0)}
                      </td>
                      <td className="data-table-cell text-center text-slate-600">
                        {product.unit}
                      </td>
                      <td className="data-table-cell-amount">
                        {currency.format(Number(product.selling_price) || 0)}
                      </td>
                      <td className="data-table-cell text-center">
                        <div className="table-action-group">
                          <Button
                            className="action-button text-blue-700 hover:bg-blue-50"
                            icon={Pencil}
                            ariaLabel={`Edit master ${product.name}`}
                            onClick={() => openEditForm(product)}
                            title="Edit master obat"
                            label="Edit"
                          />
                          <Button
                            className="action-button text-emerald-500 hover:bg-emerald-50"
                            icon={PackagePlus}
                            ariaLabel={`Restock ${product.name}`}
                            onClick={() => openRestockForm(product)}
                            title="Restock obat / batch baru"
                            label="Restock"
                          />
                          <Button
                            className="action-button text-slate-700 hover:bg-slate-50"
                            icon={Boxes}
                            ariaLabel={`Kelola batch ${product.name}`}
                            onClick={() => openBatchManagerModal(product)}
                            title="Kelola rincian batch obat"
                            label="Batch"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }}
              />
            </table>
          </div>
          <footer className="data-table-footer">
            <span>
              {loading
                ? " "
                : `Menampilkan ${firstVisible}–${lastVisible} dari ${totalFilteredCount} produk`}
            </span>
            {totalFilteredCount > pageSize && (
              <Pagination
                activePage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </footer>
        </div>
      </section>

      <FormModal
        eyebrow="Inventaris obat"
        error={formError}
        onClose={closeForm}
        onSubmit={submitForm}
        open={formOpen}
        saving={saving}
        title={
          isCreateMode
            ? "Tambah Produk Baru"
            : isEditMasterMode
              ? `Ubah Master: ${form.name}`
              : `Restock Obat: ${form.name}`
        }
      >
        {isRestockMode && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/80 p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Nama Obat:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {form.name}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Barcode:</span>
                <p className="font-mono font-medium text-slate-700 mt-0.5">
                  {form.barcode || "-"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Satuan Terkecil:</span>
                <p className="font-bold text-blue-700 mt-0.5">{form.unit}</p>
              </div>
            </div>
          </div>
        )}

        <div className="form-grid">
          {!isRestockMode && (
            <>
              <label className="form-field-label">
                Nama produk
                <input
                  autoFocus={isCreateMode || isEditMasterMode}
                  className="form-input"
                  maxLength={100}
                  minLength={2}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  value={form.name}
                />
              </label>

              <label className="form-field-label">
                Barcode
                <input
                  className="form-input"
                  maxLength={50}
                  minLength={3}
                  onChange={(event) =>
                    updateForm("barcode", event.target.value)
                  }
                  required
                  value={form.barcode}
                />
              </label>

              <label className="form-field-label">
                Kategori
                <select
                  className="form-input"
                  onChange={(event) =>
                    updateForm("category_id", event.target.value)
                  }
                  required
                  value={form.category_id}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field-label">
                Satuan terkecil
                <select
                  className="form-input"
                  onChange={(event) => changeBaseUnit(event.target.value)}
                  required
                  value={form.unit}
                >
                  <option value="">Pilih satuan</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field-label">
                Distributor
                <select
                  className="form-input"
                  onChange={(event) =>
                    updateForm("supplier_id", event.target.value)
                  }
                  required
                  value={form.supplier_id}
                >
                  <option value="">Pilih distributor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field-label">
                Stok minimum
                <input
                  className="form-input"
                  min="0"
                  onChange={(event) =>
                    updateForm("min_stock", event.target.value)
                  }
                  required
                  step="1"
                  type="number"
                  value={form.min_stock}
                />
              </label>

              <div className="form-field-label-wide">
                <span>Konversi unit jual</span>
                {form.sale_units.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {form.sale_units.map((saleUnit, index) => (
                      <div
                        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                        key={`sale-unit-${index}`}
                      >
                        <p className="grid min-h-11 content-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                          {saleUnit.unit_name}
                        </p>
                        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
                          Isi {saleUnit.unit_name} dalam {form.unit}
                          <input
                            className="form-input"
                            min="1"
                            onChange={(event) =>
                              updateSaleUnit(
                                index,
                                "base_quantity",
                                event.target.value,
                              )
                            }
                            required
                            step="1"
                            type="number"
                            value={saleUnit.base_quantity}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-normal text-slate-500">
                    Satuan ini dijual langsung dalam satuan dasar.
                  </p>
                )}
              </div>
            </>
          )}

          {!isEditMasterMode && (
            <>
              <label className="form-field-label">
                No Invoice Faktur
                <input
                  autoFocus={isRestockMode}
                  className="form-input"
                  maxLength={100}
                  minLength={2}
                  onChange={(event) =>
                    updateForm("invoice_number", event.target.value)
                  }
                  placeholder="Contoh: INV-2026-001"
                  value={form.invoice_number}
                />
              </label>

              <label className="form-field-label">
                Tanggal Faktur
                <input
                  className="form-input"
                  onChange={(event) =>
                    updateForm("invoice_date", event.target.value)
                  }
                  type="date"
                  value={form.invoice_date}
                />
              </label>

              <label className="form-field-label">
                {isRestockMode
                  ? `Jumlah stok masuk (${form.unit || "unit"})`
                  : "Stok awal"}
                <input
                  className="form-input"
                  min={isRestockMode ? "1" : "0"}
                  onChange={(event) => updateForm("stock", event.target.value)}
                  required
                  step="1"
                  type="number"
                  placeholder={isRestockMode ? "Masukkan jumlah stok..." : "0"}
                  value={form.stock}
                />
              </label>

              <label className="form-field-label">
                {isRestockMode ? "Total modal faktur baru" : "Modal total"}
                <input
                  className="form-input"
                  min="0"
                  onChange={(event) =>
                    updateForm("purchase_price", event.target.value)
                  }
                  required
                  step="any"
                  type="number"
                  placeholder="0"
                  value={form.purchase_price}
                />
                <span className="text-xs font-normal text-slate-500">
                  Total harga beli sesuai faktur untuk stok masuk.
                </span>
              </label>

              <label className="form-field-label">
                {isRestockMode
                  ? "Tanggal kedaluwarsa batch ini"
                  : "Tanggal kedaluwarsa"}
                <input
                  className="form-input"
                  onChange={(event) =>
                    updateForm("exp_date", event.target.value)
                  }
                  required={isRestockMode}
                  type="date"
                  value={form.exp_date}
                />
              </label>
            </>
          )}
        </div>

        <div className="form-actions">
          <Button
            className="form-cancel-button"
            disabled={saving}
            onClick={closeForm}
            type="button"
          >
            Batal
          </Button>
          <Button
            className="form-submit-button"
            disabled={saving}
            type="submit"
          >
            {saving
              ? "Menyimpan..."
              : isCreateMode
                ? "Simpan Produk"
                : isEditMasterMode
                  ? "Simpan Perubahan Master"
                  : "Simpan Stok Masuk"}
          </Button>
        </div>
      </FormModal>

      <BatchManagerModal
        isOpen={batchModal.open}
        product={batchModal.selectedProduct}
        onClose={closeBatchModal}
        onBatchUpdated={refreshCatalog}
      />
    </main>
  );
}
