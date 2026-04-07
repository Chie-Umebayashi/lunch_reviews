"use client";
import { useCallback, useEffect, useState } from "react";
import ReviewModal from "@/components/tools/ReviewModal";
import HomeMapArea from "@/components/home/HomeMapArea";
import HomeReviewSidebar from "@/components/home/HomeReviewSidebar";
import { geocodeQuery } from "@/lib/geocodeClient";
import type { Review } from "@/types/review";

const DEFAULT_LAT = 32.7523;
const DEFAULT_LNG = 129.8702;

type NewReviewMapDraft = { lat: number; lng: number; query: string };

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [mainMapSearchQuery, setMainMapSearchQuery] = useState("");
  const [mainMapSearchBusy, setMainMapSearchBusy] = useState(false);
  const [mainMapSearchError, setMainMapSearchError] = useState<string | null>(null);
  const [mainMapFlyTo, setMainMapFlyTo] = useState<{
    lat: number;
    lng: number;
    token: number;
  } | null>(null);
  const [newReviewMapDraft, setNewReviewMapDraft] = useState<NewReviewMapDraft | null>(null);

  const selectedReview = reviews.find((r) => r.id === selectedId);

  const loadReviews = useCallback(async () => {
    setReviewsError(null);
    setReviewsLoading(true);
    try {
      const res = await fetch("/api/reviews");
      const data: unknown = await res.json();
      if (!res.ok) {
        const err =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "読み込みに失敗しました";
        throw new Error(err);
      }
      if (
        typeof data !== "object" ||
        data === null ||
        !Array.isArray((data as { reviews?: unknown }).reviews)
      ) {
        throw new Error("応答の形式が不正です");
      }
      setReviews((data as { reviews: Review[] }).reviews);
    } catch (e) {
      setReviewsError(e instanceof Error ? e.message : "エラーが発生しました");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const runMainMapSearch = useCallback(async () => {//
    setMainMapSearchError(null);
    setMainMapSearchBusy(true);
    try {
      const r = await geocodeQuery(mainMapSearchQuery);
      if (!r.ok) {
        setMainMapSearchError(r.error);
        return;
      }
      setMainMapFlyTo({ lat: r.lat, lng: r.lng, token: Date.now() });
      setNewReviewMapDraft({
        lat: r.lat,
        lng: r.lng,
        query: mainMapSearchQuery.trim(),
      });
    } finally {
      setMainMapSearchBusy(false);
    }
  }, [mainMapSearchQuery]);

  const openCreateModal = () => {
    setReviewToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedReview) return;
    setReviewToEdit(selectedReview);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReviewToEdit(null);
  };

  const handleSave = async (data: {
    id?: number;
    name: string;
    location: string;
    comment: string;
    lat: number;
    lng: number;
    imageUrl: string | null;
  }) => {
    if (data.id != null) {
      const res = await fetch(`/api/reviews/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          comment: data.comment,
          lat: data.lat,
          lng: data.lng,
          imageUrl: data.imageUrl,
        }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "保存に失敗しました";
        alert(msg);
        throw new Error(msg);
      }
      const review = body as Review;
      setReviews((prev) => prev.map((r) => (r.id === data.id ? review : r)));
    } else {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          comment: data.comment,
          lat: data.lat,
          lng: data.lng,
          imageUrl: data.imageUrl,
        }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "投稿に失敗しました";
        alert(msg);
        throw new Error(msg);
      }
      const review = body as Review;
      setReviews((prev) => [...prev, review]);
      setNewReviewMapDraft(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    if (!confirm("この口コミを削除しますか？")) return;
    const id = selectedReview.id;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    const body: unknown = await res.json();
    if (!res.ok) {
      const msg =
        typeof body === "object" && body !== null && "error" in body
          ? String((body as { error: unknown }).error)
          : "削除に失敗しました";
      alert(msg);
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleReviewLikesChange = useCallback((reviewId: number, likes: number) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, likes } : r)));
    setReviewToEdit((cur) => (cur && cur.id === reviewId ? { ...cur, likes } : cur));
  }, []);

  return (
    <main className="flex h-screen w-full overflow-hidden text-slate-800 relative">
      <HomeReviewSidebar
        selectedReview={selectedReview}
        onEdit={openEditModal}
        onDelete={() => void handleDelete()}
        reviewsError={reviewsError}
        onRetryLoad={loadReviews}
        reviewsLoading={reviewsLoading}
        reviews={reviews}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onReviewLikesChange={handleReviewLikesChange}
        onOpenCreateModal={openCreateModal}
      />

      <HomeMapArea
        reviews={reviews}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchFlyTo={mainMapFlyTo}
        searchHighlight={
          newReviewMapDraft
            ? { lat: newReviewMapDraft.lat, lng: newReviewMapDraft.lng }
            : null
        }
        searchQuery={mainMapSearchQuery}
        onSearchQueryChange={setMainMapSearchQuery}
        onSearchSubmit={runMainMapSearch}
        searchBusy={mainMapSearchBusy}
        searchError={mainMapSearchError}
      />

      <ReviewModal
        isOpen={isModalOpen}
        onClose={closeModal}
        reviewToEdit={reviewToEdit}
        defaultMapCenter={{ lat: DEFAULT_LAT, lng: DEFAULT_LNG }}
        newReviewMapDraft={reviewToEdit ? null : newReviewMapDraft}
        onSave={handleSave}
      />
    </main>
  );
}
