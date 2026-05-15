export function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function pickAllowedFields<T extends Record<string, unknown>>(
  body: T,
  allowed: string[],
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      result[key] = body[key];
    }
  }
  return result as Partial<T>;
}
