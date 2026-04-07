import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { parseOptionalImageDataUrl } from "@/lib/reviewImage";
import { rowToReview } from "@/lib/reviewMapper";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "不正な id です" }, { status: 400 });
  }

  try {
    const body: unknown = await req.json();
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as { name?: unknown }).name !== "string" ||
      typeof (body as { comment?: unknown }).comment !== "string" ||
      typeof (body as { lat?: unknown }).lat !== "number" ||
      typeof (body as { lng?: unknown }).lng !== "number"
    ) {
      return NextResponse.json(
        { error: "name, comment, lat, lng が必要です" },
        { status: 400 }
      );
    }
    const { name, comment, lat, lng } = body as {
      name: string;
      comment: string;
      lat: number;
      lng: number;
    };
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();
    if (!trimmedName || !trimmedComment) {
      return NextResponse.json({ error: "名前と感想を入力してください" }, { status: 400 });
    }

    const bodyRecord = body as Record<string, unknown>;
    const shouldUpdateImage = Object.hasOwn(bodyRecord, "imageUrl");
    let imageUrlValue: string | null = null;
    if (shouldUpdateImage) {
      try {
        imageUrlValue = parseOptionalImageDataUrl(bodyRecord.imageUrl);
      } catch (e) {
        const message = e instanceof Error ? e.message : "画像が不正です";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const pool = getPool();
    const result = await pool.query<{
      id: string;
      name: string;
      comment: string;
      lat: string;
      lng: string;
      likes: string;
      image_url: string | null;
    }>(
      `UPDATE reviews
       SET
         author_display_name = $1,
         comment = $2,
         latitude = $3,
         longitude = $4,
         image_url = CASE WHEN $6::boolean THEN $5 ELSE image_url END,
         updated_at = now()
       WHERE id = $7
       RETURNING
         id::text,
         author_display_name AS name,
         comment,
         latitude::text AS lat,
         longitude::text AS lng,
         likes_count::text AS likes,
         image_url`,
      [trimmedName, trimmedComment, lat, lng, imageUrlValue, shouldUpdateImage, id]
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json(rowToReview(row));
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "不正な id です" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await pool.query<{ id: string }>(
      "DELETE FROM reviews WHERE id = $1 RETURNING id::text AS id",
      [id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: Number(result.rows[0]!.id) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
