import { NextRequest, NextResponse } from "next/server";

/** Nominatim 経由のジオコーディング（ブラウザ直叩きは避け、User-Agent を付与する） */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q が必要です" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  url.searchParams.set("accept-language", "ja");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "LunchReviews/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 502 });
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: "見つかりませんでした" }, { status: 404 });
  }

  const hit = data[0] as { lat?: string; lon?: string; display_name?: string };
  const lat = hit.lat != null ? Number(hit.lat) : NaN;
  const lng = hit.lon != null ? Number(hit.lon) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "結果の形式が不正です" }, { status: 502 });
  }

  return NextResponse.json({
    lat,
    lng,
    displayName: hit.display_name ?? "",
  });
}
