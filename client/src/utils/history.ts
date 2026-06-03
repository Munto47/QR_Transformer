const HISTORY_KEY = "qr-history";
const MAX_ENTRIES = 5;

export type HistoryEntry = {
  id: string;
  payload: string;
  label: string;
  at: number;
};

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistory(payload: string): HistoryEntry[] {
  const entries = loadHistory().filter((e) => e.payload !== payload);
  const label = payload.length > 40 ? payload.slice(0, 40) + "…" : payload;
  const next: HistoryEntry[] = [
    { id: String(Date.now()), payload, label, at: Date.now() },
    ...entries,
  ].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // 存储配额已满时静默失败
  }
  return next;
}

export function clearHistory(): HistoryEntry[] {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
