import { api } from "./client";
import { setAdminToken } from "./authStorage";

export type LoginResponse = {
  success: true;
  data: { token: string; expiresAt: string };
};

export async function loginAdmin(password: string): Promise<string> {
  const { data } = await api.post<LoginResponse>("/admin/login", { password });
  setAdminToken(data.data.token);
  return data.data.token;
}
