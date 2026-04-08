"use client";
import { useState } from "react";

interface HeartButtonProps {
  reviewId: number;
  /** 親の reviews 状態と常に一致させる（ローカルで件数を持たない） */
  likes: number;
  onLikesChange?: (likes: number) => void;
}

function parseLikesPayload(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const raw = (data as { likes?: unknown }).likes;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export default function HeartButton({ reviewId, likes, onLikesChange }: HeartButtonProps) {
  const [isAnimate, setIsAnimate] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setIsAnimate(true);
    setTimeout(() => setIsAnimate(false), 200);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: "POST" });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        return;
      }
      if (!res.ok) {
        console.log("いいねに失敗しました");
        console.log(data);
        return;
      }
      const n = parseLikesPayload(data);
      if (n !== null) {
        onLikesChange?.(n);
      }
    }catch{
      console.log("errorをcatchしました");
      
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
      disabled={busy}
      className={`flex items-center gap-1 group transition-all active:scale-90 ${isAnimate ? "scale-125" : "scale-100"} disabled:opacity-60`}
    >
      <span
        className={`text-xl transition-colors ${likes > 0 ? "text-pink-500" : "text-gray-300 group-hover:text-pink-400"}`}
      >
        ♡
      </span>
      <span className="text-xs font-bold text-gray-500 group-hover:text-pink-500">{likes}</span>
    </button>
  );
}
