"use client";

import dynamic from "next/dynamic";
import type { Review } from "@/types/review";

const ReviewMap = dynamic(() => import("@/components/tools/ReviewMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">地図を準備中...</div>
  ),
});

type HomeMapAreaProps = {
  reviews: Review[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchFlyTo: { lat: number; lng: number; token: number } | null;
  searchHighlight: { lat: number; lng: number } | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  searchBusy: boolean;
  searchError: string | null;
};

export default function HomeMapArea({
  reviews,
  selectedId,
  onSelect,
  searchFlyTo,
  searchHighlight,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchBusy,
  searchError,
}: HomeMapAreaProps) {
  return (
    <div className="flex-1 min-h-0 h-full w-full bg-slate-100 p-6">
      <div className="relative h-full w-full min-h-0 rounded-[2rem] overflow-hidden shadow-2xl border border-white">
        <ReviewMap
          reviews={reviews}
          selectedId={selectedId}
          onSelect={onSelect}
          searchFlyTo={searchFlyTo}
          searchHighlight={searchHighlight}
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
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onSearchSubmit();
                  }
                }}
                placeholder="例: 長崎駅、眼鏡橋…"
                disabled={searchBusy}
                className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
                autoComplete="street-address"
              />
              <button
                type="button"
                onClick={() => void onSearchSubmit()}
                disabled={searchBusy}
                className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-50 transition"
              >
                {searchBusy ? "…" : "移動"}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-600" role="alert">
                {searchError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
