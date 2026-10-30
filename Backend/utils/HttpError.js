// Membuat error HTTP terstruktur dengan status dan detail validasi opsional.
export class HttpError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}
