import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getOrCreateAnonymousUserId } from "@/lib/anonymousUser";

type RouteContext = { params: Promise<{ id: string }> };

/** 未ログイン用: 同一ユーザー（匿名ユーザー行）につき 1 レビュー 1 いいねまで */
export async function POST(_req: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const reviewId = Number(idParam);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "不正な id です" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const userId = await getOrCreateAnonymousUserId(pool);
    await pool.query(
      `WITH deleted AS (
        DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2
        RETURNING *
      )
      INSERT INTO review_likes (review_id, user_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM deleted)`,
      [reviewId, userId]
    );
    const count = await pool.query<{ likes: string }>(
      "SELECT likes_count::text AS likes FROM reviews WHERE id = $1",
      [reviewId]
    );
    const row = count.rows[0];
    if (!row) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ likes: Number(row.likes) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB エラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
