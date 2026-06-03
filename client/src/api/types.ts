export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type TransformResponse = {
  success: true;
  data: {
    raw: string;
    extractedId: string;
    final: Record<string, unknown>;
    finalContent: string;
  };
};

export type ActivityQr = {
  id: string;
  activityName: string;
  activityAt: string;
  school: string;
  signInAt: string | null;
  createdAt: string;
  mimeType: string;
  originalName: string | null;
  sizeBytes: number;
  downloadCount?: number;
};
