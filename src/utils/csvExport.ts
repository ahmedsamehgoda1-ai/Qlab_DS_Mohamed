/**
 * Minimal CSV export — client-side only, no backend, matching the rest of
 * this app's "no server" architecture. Escaping follows RFC 4180: a field
 * gets wrapped in quotes if it contains a comma, quote, or newline, and any
 * quote inside it gets doubled. Comments are free text an engineer typed,
 * so they're exactly the kind of field likely to contain a comma.
 */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map((cell) => escapeCsvField(String(cell))).join(","));
  return lines.join("\r\n");
}

/** Triggers a browser download — no server round-trip, the CSV is built and handed to the browser directly. */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
