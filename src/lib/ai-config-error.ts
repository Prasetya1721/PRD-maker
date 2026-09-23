/**
 * Error konfigurasi AI (API key / base URL / provider tidak dikenal).
 *
 * Dipisah ke file sendiri agar tidak terjadi circular import antara
 * `api-request.ts` (validasi request) dan `ai-server.ts` (resolusi model).
 */
export class AiConfigError extends Error {
  /** true → masalah konfigurasi (API key / base URL) yang harus dibetulkan user */
  readonly isConfigError = true;

  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}
