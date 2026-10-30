// Mengelola pemuatan, pencarian, pembuatan, perubahan, dan penghapusan pengeluaran.
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import FormModal from "../components/FormModal.jsx";
import FilterField from "../components/FilterField.jsx";
import Pagination from "../components/Pagination.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useExpenses from "../hooks/useExpenses.js";

const expenseColumns = [
  { key: "date", label: "Tanggal" },
  { key: "category", label: "Kategori" },
  { key: "method", label: "Metode", align: "center" },
  { key: "description", label: "Keterangan" },
  { key: "amount", label: "Jumlah", align: "right" },
  { key: "actions", label: "Aksi", align: "center" },
];

export default function ExpensePage({ user }) {
  const expensePage = useExpenses(user);
  const {
    isAdmin,
    error,
    formOpen,
    form,
    formatAmountInput,
    isEditing,
    closeForm,
    submitExpense,
    saving,
    updateForm,
    currency,
    displayedExpenseCount,
    pageExpenses,
    formatExpenseDate,
    loading,
    activePage,
    totalPages,
    pageSize,
    setCurrentPage,
    deleteExpense,
    openEditForm,
    search,
    setSearch,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    openCreateForm,
    refreshExpenses,
  } = expensePage;

  const hasActiveFilters = Boolean(
    search.trim() || (isAdmin && (dateFrom || dateTo)),
  );

  function resetFilters() {
    setSearch("");
    if (isAdmin) {
      setDateFrom("");
      setDateTo("");
    }
    setCurrentPage(1);
  }

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Catatan keuangan"
        title="Pengeluaran"
        description={
          isAdmin
            ? "Kelola seluruh pengeluaran operasional yang tercatat."
            : "Catat dan pantau pengeluaran Anda hari ini."
        }
        actions={
          <Button onClick={openCreateForm} className="primary-action-button">
            <Plus aria-hidden="true" size={17} />
            Tambah pengeluaran
          </Button>
        }
      />

      {error && !formOpen && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          {!formOpen && (
            <Button
              className="page-error-retry"
              onClick={refreshExpenses}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={15} /> Coba lagi
            </Button>
          )}
        </div>
      )}

      <section className="mt-6" aria-label="Daftar pengeluaran">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <FilterField
            type="group"
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end"
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          >
            <FilterField
              label="Cari kategori atau keterangan"
              onChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Cari kategori atau keterangan"
              value={search}
            />
            {isAdmin && (
              <div className="grid min-w-0 gap-1.5 sm:w-md">
                <div className="grid grid-cols-2 gap-3">
                  <FilterField
                    ariaDescribedBy="expense-date-hint"
                    ariaLabel="Tanggal pengeluaran"
                    label="Dari tanggal"
                    max={dateTo}
                    onChange={(value) => {
                      setDateFrom(value);
                      setCurrentPage(1);
                    }}
                    type="date"
                    value={dateFrom}
                    wrapperClassName="grid min-w-0 gap-1 text-[11px] font-medium text-slate-500"
                  />
                  <FilterField
                    ariaDescribedBy="expense-date-hint"
                    ariaLabel="Tanggal akhir pengeluaran"
                    label="Sampai tanggal"
                    min={dateFrom}
                    onChange={(value) => {
                      setDateTo(value);
                      setCurrentPage(1);
                    }}
                    type="date"
                    value={dateTo}
                    wrapperClassName="grid min-w-0 gap-1 text-[11px] font-medium text-slate-500"
                  />
                </div>
              </div>
            )}
          </FilterField>
        </div>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table min-w-170 border-collapse">
              <TableHeader columns={expenseColumns} />
              <TableBody
                loading={loading}
                data={pageExpenses}
                columnsCount={expenseColumns.length}
                loadingText="Memuat pengeluaran..."
                emptyText={
                  search
                    ? "Tidak ada pengeluaran yang cocok."
                    : isAdmin
                      ? "Belum ada pengeluaran tercatat."
                      : "Belum ada pengeluaran tercatat hari ini."
                }
                renderRow={(expense) => (
                  <tr className="data-table-row" key={expense.id}>
                    <td className="data-table-cell-nowrap">
                      {formatExpenseDate(expense.expense_date)}
                    </td>
                    <td className="data-table-cell font-semibold text-slate-800">
                      {expense.category}
                    </td>
                    <td className="data-table-cell text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          expense.payment_method === "transfer"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {expense.payment_method === "transfer" ? "Transfer" : "Tunai"}
                      </span>
                    </td>
                    <td
                      className="data-table-cell max-w-xs truncate"
                      title={expense.description || "-"}
                    >
                      {expense.description || "-"}
                    </td>
                    <td className="data-table-cell-amount">
                      {currency.format(Number(expense.amount) || 0)}
                    </td>
                    <td className="data-table-cell whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          className="action-button text-blue-700 hover:bg-blue-50"
                          icon={Pencil}
                          ariaLabel={`Ubah pengeluaran ${expense.category}`}
                          onClick={() => openEditForm(expense)}
                          title="Ubah"
                          label="Edit"
                        />
                        <Button
                          className="action-button text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          ariaLabel={`Hapus pengeluaran ${expense.category}`}
                          onClick={() => deleteExpense(expense)}
                          title="Hapus"
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
              Menampilkan {pageExpenses.length} dari {displayedExpenseCount}{" "}
              pengeluaran
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
        error={error && formOpen ? error : ""}
        eyebrow="Formulir pengeluaran"
        onClose={closeForm}
        onSubmit={submitExpense}
        open={formOpen}
        saving={saving}
        title={isEditing ? "Ubah pengeluaran" : "Catat pengeluaran"}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="form-field-label">
              Tanggal <span className="text-red-500">*</span>
            </span>
            <input
              className="form-input"
              disabled={!isAdmin}
              onChange={(event) =>
                updateForm("expense_date", event.target.value)
              }
              required
              type="date"
              value={form.expense_date}
            />
          </label>
          <label className="block">
            <span className="form-field-label">
              Kategori <span className="text-red-500">*</span>
            </span>
            <input
              className="form-input"
              maxLength={100}
              onChange={(event) => updateForm("category", event.target.value)}
              placeholder="Contoh: Listrik, Kebersihan, Operasional"
              required
              value={form.category}
            />
          </label>
          <label className="block">
            <span className="form-field-label">
              Metode Pengeluaran <span className="text-red-500">*</span>
            </span>
            <select
              className="form-input"
              value={form.payment_method || "cash"}
              onChange={(event) => updateForm("payment_method", event.target.value)}
              required
            >
              <option value="cash">Tunai (Kas Laci)</option>
              <option value="transfer">Transfer Bank</option>
            </select>
          </label>
          <label className="block">
            <span className="form-field-label">
              Jumlah (Rp) <span className="text-red-500">*</span>
            </span>
            <input
              className="form-input"
              inputMode="numeric"
              onChange={(event) => formatAmountInput(event.target.value)}
              placeholder="Contoh: 150000"
              required
              value={form.amount}
            />
          </label>
          <label className="block">
            <span className="form-field-label">Keterangan</span>
            <textarea
              className="form-textarea"
              maxLength={255}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Opsional"
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
            {saving
              ? "Menyimpan..."
              : isEditing
                ? "Simpan perubahan"
                : "Simpan pengeluaran"}
          </Button>
        </div>
      </FormModal>
    </main>
  );
}
