"use client";
import HeartButton from "./HeartButton";
import type { Review } from "@/types/review";

interface ReviewListProps {
  reviews: Review[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReviewLikesChange?: (reviewId: number, likes: number) => void;
}

export default function ReviewList({
  reviews,
  selectedId,
  onSelect,
  onReviewLikesChange,
}: ReviewListProps) {
  return (
    <section className="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Reviews</h2>
      <div className="space-y-3 pb-20">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            onClick={() => onSelect(review.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm
              ${selectedId === review.id 
                ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" 
                : "bg-white border-gray-200 hover:border-blue-300"}`}
          >
            <div className="flex items-center justify-between">
                <p className="font-bold text-lg">{review.name}</p>
                <p className="text-sm text-gray-500 truncate">{review.comment}</p>
            </div>
          
          <div className="flex flex-col justify-end items-end min-w-[40px]">
            <HeartButton
              reviewId={review.id}
              likes={review.likes}
              onLikesChange={(next) => onReviewLikesChange?.(review.id, next)}
            />
        </div>
        </div>
        ))}
      </div>
    </section>
  );
}