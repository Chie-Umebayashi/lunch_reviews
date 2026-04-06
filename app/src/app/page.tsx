"use client";
import { useCallback, useEffect, useState } from "react";
import ReviewModal from "@/components/ReviewModal";
import { geocodeQuery } from "@/lib/geocodeClient";
import ReviewList from "@/components/ReviewList";
import ReviewDetail from "@/components/ReviewDetail";
import dynamic from "next/dynamic";
import type { Review } from "@/types/review";

const DEFAULT_LAT = 32.7523;
const DEFAULT_LNG = 129.8702;

type NewReviewMapDraft = { lat: number; lng: number; query: string };

const ReviewMap = dynamic(() => import("@/components/ReviewMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">地図を準備中...</div>
  ),
});

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

  const runMainMapSearch = useCallback(async () => {
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
      <div className="w-[40%] flex flex-col border-r border-gray-200">
        <ReviewDetail
          review={selectedReview}
          onEdit={openEditModal}
          onDelete={() => void handleDelete()}
        />

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {reviewsError && (
            <div className="px-6 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100 shrink-0">
              {reviewsError}
              <button
                type="button"
                onClick={() => void loadReviews()}
                className="ml-2 underline font-bold"
              >
                再読み込み
              </button>
            </div>
          )}
          {reviewsLoading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              口コミを読み込み中…
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReviewLikesChange={handleReviewLikesChange}
            />
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl z-10"
            aria-label="新規口コミを投稿"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 h-full w-full bg-slate-100 p-6">
        <div className="relative h-full w-full min-h-0 rounded-[2rem] overflow-hidden shadow-2xl border border-white">
          <ReviewMap
            reviews={reviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchFlyTo={mainMapFlyTo}
            searchHighlight={
              newReviewMapDraft
                ? { lat: newReviewMapDraft.lat, lng: newReviewMapDraft.lng }
                : null
            }
          />
          <div
            className="absolute z-[1100] top-3 right-3 left-14 sm:left-16 pointer-events-none flex flex-col items-stretch gap-1.5"
            aria-live="polite"
          >
            <div className="pointer-events-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/90 p-2.5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-600" htmlFor="main-map-search">
                住所・施設名で地図を移動
              </label>
              <div className="flex gap-2 min-w-0">
                <input
                  id="main-map-search"
                  type="search"
                  value={mainMapSearchQuery}
                  onChange={(e) => setMainMapSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runMainMapSearch();
                    }
                  }}
                  placeholder="例: 長崎駅、眼鏡橋…"
                  disabled={mainMapSearchBusy}
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
                  autoComplete="street-address"
                />
                <button
                  type="button"
                  onClick={() => void runMainMapSearch()}
                  disabled={mainMapSearchBusy}
                  className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-50 transition"
                >
                  {mainMapSearchBusy ? "…" : "移動"}
                </button>
              </div>
              {mainMapSearchError && (
                <p className="text-xs text-red-600" role="alert">
                  {mainMapSearchError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
