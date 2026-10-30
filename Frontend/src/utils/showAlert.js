import Swal from "sweetalert2";

export default function showAlert(options = {}) {
  const useTimer = options.timer !== undefined;
  const isConfirmDialog = Boolean(options.showCancelButton);

  return Swal.fire({
    confirmButtonColor: isConfirmDialog ? "#DC2626" : "#2563EB",
    confirmButtonText: isConfirmDialog ? "Hapus" : "OK",
    cancelButtonColor: "#64748B",
    cancelButtonText: "Batal",
    showConfirmButton: !useTimer,
    timerProgressBar: useTimer,
    reverseButtons: isConfirmDialog,
    ...options,
  });
}
