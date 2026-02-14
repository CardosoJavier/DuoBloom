import { AppError } from "./error";

export type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: AppError; data?: never };
