export type GeocodeResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; error: string };

export async function geocodeQuery(q: string): Promise<GeocodeResult> {
  const trimmed = q.trim();
  if (!trimmed) {
    return { ok: false, error: "住所や施設名を入力してください" };
  }
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
    const body = (await res.json()) as { error?: string; lat?: number; lng?: number };
    if (!res.ok) {
      return { ok: false, error: body.error ?? "検索に失敗しました" };
    }
    if (body.lat == null || body.lng == null) {
      return { ok: false, error: "結果を解釈できませんでした" };
    }
    return { ok: true, lat: body.lat, lng: body.lng };
  } catch {
    return { ok: false, error: "通信エラーが発生しました" };
  }
}
