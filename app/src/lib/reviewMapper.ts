import type { Review } from "@/types/review";

type ReviewRow = {
  id: string | number;
  name: string;
  comment: string;
  lat: string | number;
  lng: string | number;
  likes: string | number;
  image_url?: string | null;
};

export function rowToReview(row: ReviewRow): Review {
  const rawImg = row.image_url;
  const imageUrl =
    rawImg != null && String(rawImg).trim() !== "" ? String(rawImg) : null;
  return {
    id: Number(row.id),
    name: row.name,
    comment: row.comment,
    lat: Number(row.lat),
    lng: Number(row.lng),
    likes: Number(row.likes),
    imageUrl,
  };
}
