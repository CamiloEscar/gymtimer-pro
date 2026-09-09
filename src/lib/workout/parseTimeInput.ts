export function parseTimeInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length === 2) {
      const [mStr, ssStr] = parts;
      if (!/^\d+$/.test(mStr) || !/^\d{1,2}$/.test(ssStr)) return null;
      const m = Number(mStr);
      const ss = Number(ssStr);
      if (ss >= 60) return null;
      if (m < 0 || m > 999) return null;
      return m * 60 + ss;
    }
    if (parts.length === 3) {
      const [hStr, mmStr, ssStr] = parts;
      if (!/^\d+$/.test(hStr) || !/^\d{1,2}$/.test(mmStr) || !/^\d{1,2}$/.test(ssStr)) return null;
      const h = Number(hStr);
      const mm = Number(mmStr);
      const ss = Number(ssStr);
      if (mm >= 60 || ss >= 60) return null;
      if (h < 0 || h > 999) return null;
      return h * 3600 + mm * 60 + ss;
    }
    return null;
  }
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (n < 0 || n > 59) return null;
  return n * 60;
}

export function formatTimeInput(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}
