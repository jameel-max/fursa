export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

export function badRequest(code: string, message: string, details?: unknown) {
  return new ApiError(400, code, message, details);
}

export function notFound(code: string, message: string) {
  return new ApiError(404, code, message);
}

export function forbidden(code: string, message: string) {
  return new ApiError(403, code, message);
}

export function conflict(code: string, message: string) {
  return new ApiError(409, code, message);
}

export function unprocessableEntity(code: string, message: string, details?: unknown) {
  return new ApiError(422, code, message, details);
}
