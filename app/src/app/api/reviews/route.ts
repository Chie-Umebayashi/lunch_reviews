import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { rowToReview } from "@/lib/reviewMapper";

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query<{
      id: string;
      name: string;
      comment: string;
      lat: string;
      lng: string;
      likes: string;
    }>(
      `SELECT
        id::text,
        author_display_name AS name,
        comment,
        latitude::text AS lat,
        longitude::text AS lng,
        likes_count::text AS likes
      FROM reviews
      ORDER BY created_at DESC`
    );
    const reviews = result.rows.map((r) =>
      rowToReview({
        id: r.id,
        name: r.name,
        comment: r.comment,
        lat: r.lat,
        lng: r.lng,
        likes: r.likes,
      })
    );
    return NextResponse.json({ reviews });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const pool = getPool();
    const result = await pool.query<{
      id: string;
      name: string;
      comment: string;
      lat: string;
      lng: string;
      likes: string;
    }>(
      `INSERT INTO reviews (author_display_name, comment, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id::text,
         author_display_name AS name,
         comment,
         latitude::text AS lat,
         longitude::text AS lng,
         likes_count::text AS likes`,
      [trimmedName, trimmedComment, lat, lng]
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(rowToReview(row));
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
