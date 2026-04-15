import { api } from "./client";
import { getAdminToken } from "./authStorage";
import type { ActivityQr } from "./types";

export type ActivityQrsResponse = {
  success: true;
  data: ActivityQr[];
};

export async function fetchActivityQrs(): Promise<ActivityQr[]> {
  const { data } = await api.get<ActivityQrsResponse>("/activity-qrs");
  return data.data;
}

export async function createActivityQr(params: {
  activityName: string;
  activityAt: string;
  image: File;
}): Promise<void> {
  const token = getAdminToken();
  if (!token) {
    throw new Error("需要管理员登录");
  }
  const form = new FormData();
  form.append("activityName", params.activityName);
  form.append("activityAt", params.activityAt);
  form.append("image", params.image);
  await api.post("/activity-qrs", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
