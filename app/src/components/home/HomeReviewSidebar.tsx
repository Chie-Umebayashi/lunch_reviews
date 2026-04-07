"use client";

import ReviewDetail from "@/components/tools/ReviewDetail";
import ReviewList from "@/components/tools/ReviewList";
import type { Review } from "@/types/review";

type HomeReviewSidebarProps = {
  selectedReview: Review | undefined;
  onEdit: () => void;
  onDelete: () => void;
  reviewsError: string | null;
  onRetryLoad: () => void;
  reviewsLoading: boolean;
  reviews: Review[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReviewLikesChange: (reviewId: number, likes: number) => void;
  onOpenCreateModal: () => void;
};

export default function HomeReviewSidebar({
  selectedReview,
  onEdit,
  onDelete,
  reviewsError,
  onRetryLoad,
  reviewsLoading,
  reviews,
  selectedId,
  onSelect,
  onReviewLikesChange,
  onOpenCreateModal,
}: HomeReviewSidebarProps) {
  return (
    <div className="w-[40%] flex flex-col border-r border-gray-200">
      <ReviewDetail review={selectedReview} onEdit={onEdit} onDelete={onDelete} />

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {reviewsError && (
          <div className="px-6 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100 shrink-0">
            {reviewsError}
            <button
              type="button"
              onClick={() => void onRetryLoad()}
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
            onSelect={onSelect}
            onReviewLikesChange={onReviewLikesChange}
          />
        )}

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl z-10"
          aria-label="新規口コミを投稿"
        >
          +
        </button>
      </div>
    </div>
  );
}
