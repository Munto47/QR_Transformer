import { api } from "./client";
import { getAdminToken } from "./authStorage";

function authHeaders() {
  const token = getAdminToken();
  if (!token) throw new Error("需要管理员登录");
  return { Authorization: `Bearer ${token}` };
}

export type AdminStats = {
  totalLogs: number;
  todayLogs: number;
  totalActivities: number;
  todayActivities: number;
  totalDownloads: number;
};

export type AdminLogRow = {
  id: string;
  rawContent: string;
  extractedId: string;
  finalContent: string;
  createdAt: string;
  mimeType: string;
  originalName: string | null;
  sizeBytes: number;
};

export type AdminActivityRow = {
  id: string;
  activityName: string;
  activityAt: string;
  school: string;
  signInAt: string | null;
  createdAt: string;
  mimeType: string;
  originalName: string | null;
  sizeBytes: number;
  downloadCount: number;
};

export type PagedResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StatsResp = { success: true; data: AdminStats };
type LogsResp = { success: true; data: PagedResponse<AdminLogRow> };
type ActivitiesResp = { success: true; data: PagedResponse<AdminActivityRow> };

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<StatsResp>("/admin/stats", { headers: authHeaders() });
  return data.data;
}

export async function fetchAdminProcessingLogs(
  page: number,
  limit: number,
  search?: string
): Promise<PagedResponse<AdminLogRow>> {
  const { data } = await api.get<LogsResp>("/admin/processing-logs", {
    headers: authHeaders(),
    params: { page, limit, ...(search ? { search } : {}) },
  });
  return data.data;
}

export async function deleteAdminProcessingLog(id: string): Promise<void> {
  await api.delete(`/admin/processing-logs/${id}`, { headers: authHeaders() });
}

export async function fetchAdminActivityQrs(
  page: number,
  limit: number,
  filters?: { school?: string; dateFrom?: string; dateTo?: string; search?: string }
): Promise<PagedResponse<AdminActivityRow>> {
  const { data } = await api.get<ActivitiesResp>("/admin/activity-qrs", {
    headers: authHeaders(),
    params: { page, limit, ...filters },
  });
  return data.data;
}

export async function deleteAdminActivityQr(id: string): Promise<void> {
  await api.delete(`/admin/activity-qrs/${id}`, { headers: authHeaders() });
}
