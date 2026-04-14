import { isAxiosError } from "axios";
import { api } from "./client";
import type { ApiErrorBody, LogsResponse, TransformResponse } from "./types";

export async function transformImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<TransformResponse>("/transform", form);
  return data;
}

export async function fetchProcessingLogs() {
  const { data } = await api.get<LogsResponse>("/processing-logs");
  return data.data;
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (typeof err.message === "string") return err.message;
  }
  if (err instanceof Error) return err.message;
  return "请求失败";
}
