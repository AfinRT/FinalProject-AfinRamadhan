// Menampilkan manajemen pengguna (CRUD user) dengan pencarian, paginasi, dan formulir modal.
import { Pencil, Plus, RefreshCw, Trash2, UserRound } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import FormModal from "../components/FormModal.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useUsers from "../hooks/useUsers.js";

const userColumns = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Aksi", align: "right" },
];

export default function UserPage() {
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
    pageUsers,
    roles,
    resetFilters,
    refreshUsers,
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
    removeUser,
  } = useUsers();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Manajemen pengguna"
        title="Users"
        description="Kelola akun dan hak akses pengguna aplikasi."
        actions={
          <Button onClick={openCreateForm} className="primary-action-button">
            <Plus aria-hidden="true" size={17} /> Tambah user
          </Button>
        }
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshUsers}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar users">
        <FilterField
          type="group"
          className="crud-filter-bar"
          hasActiveFilters={Boolean(search.trim())}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari users"
            onChange={handleSearchChange}
            placeholder="Cari nama, email, atau role"
            value={search}
          />
        </FilterField>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={userColumns} />
              <TableBody
                loading={loading}
                data={pageUsers}
                columnsCount={userColumns.length}
                loadingText="Memuat data users..."
                emptyText={
                  <>
                    <UserRound
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {search ? "User tidak ditemukan" : "Belum ada user"}
                    </p>
                    <p className="data-table-empty-description">
                      {search
                        ? "Coba kata pencarian yang lain."
                        : "Tambahkan user untuk mengelola akses aplikasi."}
                    </p>
                  </>
                }
                renderRow={(user) => (
                  <tr className="data-table-row-top" key={user.id}>
                    <td className="data-table-cell font-semibold text-slate-800">
                      {user.name}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {user.email}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {roles.find((role) => role.id === Number(user.role_id))
                        ?.name ?? "Tidak diketahui"}
                    </td>
                    <td className="data-table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {user.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="table-action-group">
                        <Button
                          className="action-button text-blue-700 hover:bg-blue-50"
                          icon={Pencil}
                          ariaLabel={`Ubah ${user.name}`}
                          disabled={deletingId === user.id}
                          onClick={() => openEditForm(user)}
                          title="Ubah user"
                          label="Edit"
                        />
                        <Button
                          className="action-button text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          ariaLabel={`Hapus ${user.name}`}
                          disabled={deletingId === user.id}
                          onClick={() => removeUser(user)}
                          title="Hapus user"
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
                : `Menampilkan ${firstVisible}–${lastVisible} dari ${totalFilteredCount} user`}
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
        eyebrow="Manajemen pengguna"
        error={formError}
        onClose={closeForm}
        onSubmit={submitForm}
        open={formOpen}
        saving={saving}
        title={form.id ? "Ubah user" : "User baru"}
      >
        <div className="form-grid">
          <label className="form-field-label">
            Nama lengkap
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
            Email
            <input
              className="form-input"
              onChange={(event) => updateForm("email", event.target.value)}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="form-field-label">
            {form.id ? "Password baru (opsional)" : "Password"}
            <input
              autoComplete="new-password"
              className="form-input"
              minLength={8}
              onChange={(event) => updateForm("password", event.target.value)}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,72}"
              required={!form.id}
              title="Minimal 8 karakter, dengan huruf besar, huruf kecil, angka, dan karakter spesial."
              type="password"
              value={form.password}
            />
          </label>
          <label className="form-field-label">
            Role
            <select
              className="form-input"
              onChange={(event) => updateForm("role_id", event.target.value)}
              required
              value={form.role_id}
            >
              <option value="">Pilih role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          {form.id && (
            <label className="form-field-label">
              Status akun
              <select
                className="form-input"
                onChange={(event) => updateForm("status", event.target.value)}
                required
                value={form.status}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
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
            {saving ? "Menyimpan..." : "Simpan user"}
          </Button>
        </div>
      </FormModal>
    </main>
  );
}
