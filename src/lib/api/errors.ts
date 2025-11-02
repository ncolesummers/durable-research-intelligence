import { NextResponse } from "next/server";

/**
 * Error helpers for consistent API responses.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Build a JSON error response with the given status code and optional details.
 *
 * @param statusCode - HTTP status code to return.
 * @param message - Human-readable error message.
 * @param details - Optional additional error data.
 * @returns A Next.js JSON response object.
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: statusCode },
  );
}

/**
 * Convenience helpers for common HTTP error responses.
 */
export const ERRORS = {
  BAD_REQUEST: (message: string, details?: unknown) =>
    createErrorResponse(400, message, details),
  UNAUTHORIZED: (message: string = "Unauthorized") =>
    createErrorResponse(401, message),
  NOT_FOUND: (message: string = "Resource not found") =>
    createErrorResponse(404, message),
  TOO_MANY_REQUESTS: (message: string = "Rate limit exceeded") =>
    createErrorResponse(429, message),
  INTERNAL_SERVER_ERROR: (message: string = "Internal server error") =>
    createErrorResponse(500, message),
};
