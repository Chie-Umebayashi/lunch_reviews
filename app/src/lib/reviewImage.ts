/** Max stored length for data URL (text in PostgreSQL). ~500KB base64 payload. */
const MAX_IMAGE_DATA_URL_LENGTH = 600_000;

/**
 * Validates optional client-sent image as a data URL. Returns null if absent/empty.
 * @throws Error with user-facing message if invalid type or too large
 */
export function parseOptionalImageDataUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    throw new Error("imageUrl は文字列にしてください(未入力可)");
  }
  const t = raw.trim();
  if (t === "") return null;
  if (!t.startsWith("data:image/")) {
    throw new Error("画像は data URL 形式である必要があります");
  }
  if (t.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error("画像が大きすぎます（別の画像を選ぶか、サイズを小さくしてください）");
  }
  return t;
}
