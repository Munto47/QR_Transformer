import { api } from "./client";
import { getAdminToken } from "./authStorage";
import type { ActivityQr } from "./types";

export type ActivityQrsResponse = {
  success: true;
  data: ActivityQr[];
};

export async function fetchActivityQrs(
  school: string
): Promise<ActivityQr[]> {
  const { data } = await api.get<ActivityQrsResponse>("/activity-qrs", {
    params: { school },
  });
  return data.data;
}

export async function shareActivityQr(params: {
  school: string;
  activityName: string;
  signInAt: string | null;
  qrPayload: string;
}): Promise<void> {
  await api.post("/activity-qrs/share", {
    school: params.school,
    activityName: params.activityName,
    signInAt: params.signInAt ?? undefined,
    qrPayload: params.qrPayload,
  });
}

export async function createActivityQr(params: {
  activityName: string;
  activityAt: string;
  school: string;
  signInAt: string | null;
  image: File;
}): Promise<void> {
  const token = getAdminToken();
  if (!token) {
    throw new Error("需要管理员登录");
  }
  const form = new FormData();
  form.append("activityName", params.activityName);
  form.append("activityAt", params.activityAt);
  form.append("school", params.school);
  if (params.signInAt) {
    form.append("signInAt", params.signInAt);
  }
  form.append("image", params.image);
  await api.post("/activity-qrs", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
