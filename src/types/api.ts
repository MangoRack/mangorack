export interface ApiResponse<T = unknown> {
  data?: T;
  meta?: { total?: number; page?: number; limit?: number };
  error?: { code: string; message: string; upgrade?: boolean };
}
