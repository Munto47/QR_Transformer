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

export type ProcessingLog = {
  id: string;
  rawContent: string;
  extractedId: string;
  finalContent: string;
  createdAt: string;
  mimeType: string;
  originalName: string | null;
  sizeBytes: number;
};

export type LogsResponse = {
  success: true;
  data: ProcessingLog[];
};

export type ActivityQr = {
  id: string;
  activityName: string;
  activityAt: string;
  createdAt: string;
  mimeType: string;
  originalName: string | null;
  sizeBytes: number;
};
