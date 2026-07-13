// SPDX-License-Identifier: MIT OR Apache-2.0
/**
 * Error thrown when the PoH API returns a non-2xx response.
 */
export class PohApiError extends Error {
  /** HTTP status code. */
  public readonly status: number;
  /** Machine-readable error code (same as the `error` field from the API). */
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PohApiError";
    this.status = status;
    this.code = code;
  }
}
