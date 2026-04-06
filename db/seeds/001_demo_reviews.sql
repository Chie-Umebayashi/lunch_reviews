-- デモ用（マイグレーション適用後、任意で実行）
-- psql "$DATABASE_URL" -f db/seeds/001_demo_reviews.sql

INSERT INTO reviews (author_display_name, comment, latitude, longitude, likes_count)
SELECT v.name, v.comment, v.lat, v.lng, v.likes
FROM (
  VALUES
    (
      '長崎ちゃんぽんの名店',
      '具だくさんでスープが濃厚！観光客にもおすすめ。',
      32.7523::double precision,
      129.8702::double precision,
      0
    ),
    (
      '稲佐山展望台近くのカフェ',
      '夜景が見える最高のロケーションです。',
      32.7535::double precision,
      129.8533::double precision,
      5
    ),
    (
      '眼鏡橋そばの喫茶店',
      'レトロな雰囲気で落ち着きます。カステラが絶品。',
      32.7472::double precision,
      129.88::double precision,
      3
    )
) AS v(name, comment, lat, lng, likes)
WHERE NOT EXISTS (SELECT 1 FROM reviews LIMIT 1);
