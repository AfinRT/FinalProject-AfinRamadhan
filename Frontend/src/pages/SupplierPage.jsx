// Menampilkan manajemen data pemasok / distributor obat dengan pencarian, paginasi, dan formulir modal.
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import FormModal from "../components/FormModal.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useSuppliers from "../hooks/useSuppliers.js";

const supplierColumns = [
  { key: "name", label: "Distributor" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Alamat" },
  { key: "actions", label: "Aksi", align: "right" },
];

export default function SupplierPage() {
  const {
    loading,
    error,
    search,
    handleSearchChange,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount,
    pageSuppliers,
    resetFilters,
    refreshSuppliers,
    formOpen,
    form,
    formError,
    saving,
    deletingId,
    openCreateForm,
    openEditForm,
    closeForm,
    updateForm,
    submitForm,
    removeSupplier,
  } = useSuppliers();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Data pemasok"
        title="Distributor"
        description="Kelola informasi kontak distributor obat."
        actions={
          <Button onClick={openCreateForm} className="primary-action-button">
            <Plus aria-hidden="true" size={17} />
            Tambah distributor
          </Button>
        }
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshSuppliers}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}
      <section className="mt-6" aria-label="Daftar distributor">
        <FilterField
          type="group"
          className="crud-filter-bar"
          hasActiveFilters={Boolean(search.trim())}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari distributor"
            onChange={handleSearchChange}
            placeholder="Cari nama, kontak, atau alamat"
            value={search}
          />
        </FilterField>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={supplierColumns} />
              <TableBody
                loading={loading}
                data={pageSuppliers}
                columnsCount={supplierColumns.length}
                loadingText="Memuat data distributor..."
                emptyText={
                  <>
                    <Building2
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {search
                        ? "Distributor tidak ditemukan"
                        : "Belum ada distributor"}
                    </p>
                    <p className="data-table-empty-description">
                      {search
                        ? "Coba kata pencarian yang lain."
                        : "Tambahkan distributor untuk mulai mengelola data pemasok."}
                    </p>
                  </>
                }
                renderRow={(supplier) => (
                  <tr className="data-table-row-top" key={supplier.id}>
                    <td className="data-table-cell">{supplier.name}</td>
                    <td className="data-table-cell">
                      <div className="grid gap-2 text-slate-600">
                        {supplier.phone || "-"}
                      </div>
                    </td>
                    <td className="data-table-cell">{supplier.email || "-"}</td>
                    <td className="data-table-cell max-w-sm text-slate-600">
                      {supplier.address || "-"}
                    </td>
                    <td className="data-table-cell">
                      <div className="table-action-group">
                        <Button
                          className="action-button text-blue-700 hover:bg-blue-50"
                          icon={Pencil}
                          ariaLabel={`Ubah ${supplier.name}`}
                          disabled={deletingId === supplier.id}
                          onClick={() => openEditForm(supplier)}
                          title="Ubah distributor"
                          label="Edit"
                        />
                        <Button
                          className="action-button text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          ariaLabel={`Hapus ${supplier.name}`}
                          disabled={deletingId === supplier.id}
                          onClick={() => removeSupplier(supplier)}
                          title="Hapus distributor"
                          label="Hapus"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              />
            </table>
          </div>
          <footer className="data-table-footer">
            <span>
              {loading
                ? " "
                : `Menampilkan ${firstVisible}–${lastVisible} dari ${totalFilteredCount} distributor`}
            </span>
            {totalFilteredCount > pageSize && (
              <Pagination
                activePage={activePage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </footer>
        </div>
      </section>

      <FormModal
        eyebrow="Data pemasok"
        error={formError}
        onClose={closeForm}
        onSubmit={submitForm}
        open={formOpen}
        saving={saving}
        title={form.id ? "Ubah distributor" : "Distributor baru"}
      >
        <div className="form-grid">
          <label className="form-field-label">
            Nama distributor
            <input
              autoFocus
              className="form-input"
              maxLength={100}
              minLength={2}
              onChange={(event) => updateForm("name", event.target.value)}
              required
              value={form.name}
            />
          </label>
          <label className="form-field-label">
            Nomor telepon
            <input
              className="form-input"
              maxLength={20}
              onChange={(event) => updateForm("phone", event.target.value)}
              required
              type="tel"
              value={form.phone}
            />
          </label>
          <label className="form-field-label">
            Email
            <input
              className="form-input"
              onChange={(event) => updateForm("email", event.target.value)}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="form-field-label-wide">
            Alamat
            <textarea
              className="form-textarea"
              maxLength={255}
              minLength={5}
              onChange={(event) => updateForm("address", event.target.value)}
              required
              rows={4}
              value={form.address}
            />
          </label>
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
            {saving ? "Menyimpan..." : "Simpan distributor"}
          </Button>
        </div>
      </FormModal>
    </main>
  );
}
