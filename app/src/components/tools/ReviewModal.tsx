"use client";
import { useId, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Review } from "@/types/review";

const MAX_IMAGE_FILE_BYTES = 512 * 1024;

const LocationPickMap = dynamic(() => import("@/components/tools/LocationPickMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-2xl bg-slate-100 flex items-center justify-center text-sm text-slate-500">
      地図を準備中…
    </div>
  ),
});

type NewReviewMapDraft = { lat: number; lng: number; query: string };

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 指定時は編集モード（店名・感想を事前入力） */
  reviewToEdit: Review | null;
  defaultMapCenter: { lat: number; lng: number };
  /** 新規のみ: メイン画面の検索結果をフォーム・ピック地図に引き継ぐ */
  newReviewMapDraft: NewReviewMapDraft | null;
  onSave: (data: {
    id?: number;
    name: string;
    location: string;
    comment: string;
    lat: number;
    lng: number;
    imageUrl: string | null;
  }) => void | Promise<void>;
}

export default function ReviewModal({
  isOpen,
  onClose,
  reviewToEdit,
  defaultMapCenter,
  newReviewMapDraft,
  onSave,
}: ReviewModalProps) {
  const photoInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const isEdit = reviewToEdit != null;

  // モーダルを開いたとき・編集対象が変わったときにフォームを親の props から同期する
  /* eslint-disable react-hooks/set-state-in-effect -- controlled reset when isOpen / reviewToEdit / draft changes */
  useLayoutEffect(() => {
    if (!isOpen) return;
    if (reviewToEdit) {
      setName(reviewToEdit.name);
      setComment(reviewToEdit.comment);
      setLocation("");
      setPicked({ lat: reviewToEdit.lat, lng: reviewToEdit.lng });
      setImageDataUrl(reviewToEdit.imageUrl);
    } else {
      setName("");
      setComment("");
      setLocation(newReviewMapDraft?.query ?? "");
      setPicked(
        newReviewMapDraft != null
          ? { lat: newReviewMapDraft.lat, lng: newReviewMapDraft.lng }
          : null
      );
      setImageDataUrl(null);
    }
  }, [isOpen, reviewToEdit, newReviewMapDraft]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const applyImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選んでください");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      alert("画像は 512KB 以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const latLng = picked ?? { lat: defaultMapCenter.lat, lng: defaultMapCenter.lng };
    try {
      await onSave({
        id: reviewToEdit?.id,
        name,
        location,
        comment,
        lat: latLng.lat,
        lng: latLng.lng,
        imageUrl: imageDataUrl,
      });
      onClose();
    } catch {
      // 親で alert 等する想定。ここでは閉じない。
    }
  };

  const mapSeed = reviewToEdit
    ? { lat: reviewToEdit.lat, lng: reviewToEdit.lng }
    : newReviewMapDraft != null
      ? { lat: newReviewMapDraft.lat, lng: newReviewMapDraft.lng }
      : defaultMapCenter;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl p-6 sm:p-8 overflow-y-auto relative z-[10001]">
        <div className="flex justify-between items-center mb-6">
          <h2 id="review-modal-title" className="text-2xl font-bold text-slate-800">
            {isEdit ? "口コミを編集" : "新規口コミ投稿"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ✕
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-x-10 lg:gap-y-8 lg:items-start">
          <div className="space-y-5 min-w-0 lg:pr-2">
          <div>
            <label htmlFor={photoInputId} className="block text-sm font-bold text-gray-700 mb-1">
              お店の写真
            </label>
            <input
              id={photoInputId}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) applyImageFile(file);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) applyImageFile(file);
              }}
              className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
            >
              {imageDataUrl ? (
                <div className="relative inline-block max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL from user upload */}
                  <img
                    src={imageDataUrl}
                    alt=""
                    className="max-h-48 w-auto mx-auto rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    className="mt-3 text-sm font-bold text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageDataUrl(null);
                    }}
                  >
                    写真を削除
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                  <p className="text-sm text-gray-500 font-medium">クリックして写真を選択</p>
                  <p className="text-xs text-gray-400 mt-1">またはドラッグ＆ドロップ（512KB まで）</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">お店の名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: カフェ・ラテ"
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">場所</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: A棟 2F"
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">感想</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="味や金額の感想をどうぞ"
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            {isEdit ? "保存する" : "投稿する"}
          </button>
          </div>

          <div className="min-w-0 lg:border-l lg:border-slate-100 lg:pl-8">
            <h3 className="text-sm font-bold text-slate-700 mb-3">地図で位置を指定</h3>
            <LocationPickMap
              key={
                reviewToEdit != null
                  ? `e-${reviewToEdit.id}`
                  : `n-${newReviewMapDraft?.lat ?? "x"}-${newReviewMapDraft?.lng ?? "y"}`
              }
              value={picked}
              onChange={setPicked}
              defaultCenter={mapSeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
