// Menampilkan manajemen kategori obat (CRUD kategori) dengan pencarian, paginasi, dan formulir modal.
import {
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import FormModal from "../components/FormModal.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useCategories from "../hooks/useCategories.js";

const categoryColumns = [
  { key: "name", label: "Nama kategori" },
  { key: "description", label: "Deskripsi" },
  { key: "actions", label: "Aksi", align: "right" },
];

export default function CategoryPage() {
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
    pageCategories,
    resetFilters,
    refreshCategories,
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
    removeCategory,
  } = useCategories();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Data kategori"
        title="Kategori"
        description="Kelola informasi kategori obat."
        actions={
          <Button onClick={openCreateForm} className="primary-action-button">
            <Plus aria-hidden="true" size={17} />
            Tambah kategori
          </Button>
        }
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshCategories}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar kategori">
        <FilterField
          type="group"
          className="crud-filter-bar"
          hasActiveFilters={Boolean(search.trim())}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari kategori"
            onChange={handleSearchChange}
            placeholder="Cari nama atau deskripsi"
            value={search}
          />
        </FilterField>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={categoryColumns} />
              <TableBody
                loading={loading}
                data={pageCategories}
                columnsCount={categoryColumns.length}
                loadingText="Memuat data kategori..."
                emptyText={
                  <>
                    <Building2
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {search
                        ? "Kategori tidak ditemukan"
                        : "Belum ada kategori"}
                    </p>
                    <p className="data-table-empty-description">
                      {search
                        ? "Coba kata pencarian yang lain."
                        : "Tambahkan kategori untuk mengelompokkan data obat."}
                    </p>
                  </>
                }
                renderRow={(category) => (
                  <tr className="data-table-row-top" key={category.id}>
                    <td className="data-table-cell font-semibold text-slate-800">
                      {category.name}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {category.description || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="table-action-group">
                        <Button
                          className="action-button text-blue-700 hover:bg-blue-50"
                          icon={Pencil}
                          ariaLabel={`Ubah ${category.name}`}
                          disabled={deletingId === category.id}
                          onClick={() => openEditForm(category)}
                          title="Ubah kategori"
                          label="Edit"
                        />
                        <Button
                          className="action-button text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          ariaLabel={`Hapus ${category.name}`}
                          disabled={deletingId === category.id}
                          onClick={() => removeCategory(category)}
                          title="Hapus kategori"
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
              Menampilkan {totalFilteredCount === 0 ? 0 : firstVisible} -{" "}
              {lastVisible} dari {totalFilteredCount} kategori
            </span>
            <Pagination
              activePage={activePage}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalPages={totalPages}
            />
          </footer>
        </div>
      </section>

      <FormModal
        error={formError}
        eyebrow="Formulir kategori"
        onClose={closeForm}
        onSubmit={submitForm}
        open={formOpen}
        saving={saving}
        title={form.id ? "Ubah kategori" : "Tambah kategori baru"}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="form-field-label">
              Nama kategori <span className="text-red-500">*</span>
            </span>
            <input
              className="form-input"
              maxLength={100}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Contoh: Obat Bebas"
              required
              value={form.name}
            />
          </label>
          <label className="block">
            <span className="form-field-label">Deskripsi</span>
            <textarea
              className="form-textarea"
              maxLength={255}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Keterangan singkat tentang kategori obat"
              rows={3}
              value={form.description}
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
            {saving ? "Menyimpan..." : "Simpan kategori"}
          </Button>
        </div>
      </FormModal>
    </main>
  );
}
