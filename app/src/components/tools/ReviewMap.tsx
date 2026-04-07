"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Pane } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import type { Review } from "@/types/review";

// LeafletのデフォルトアイコンがNext.jsで表示されない問題の対策
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface ReviewMapProps {
  reviews: Review[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** 住所検索などで地図中心を移動（token を変えると同じ座標でも再実行） */
  searchFlyTo: { lat: number; lng: number; token: number } | null;
  /** 検索で得た位置の強調表示（新規下書き用） */
  searchHighlight: { lat: number; lng: number } | null;
}

// 選択されたときに地図を移動させるための補助コンポーネント
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function FlyToSearch({
  target,
}: {
  target: { lat: number; lng: number; token: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], 15, { animate: true });
  }, [map, target]);
  return null;
}

export default function ReviewMap({
  reviews,
  selectedId,
  onSelect,
  searchFlyTo,
  searchHighlight,
}: ReviewMapProps) {
  const selectedReview = reviews.find((r) => r.id === selectedId);
  const center: [number, number] = [32.7523, 129.8702];

  return (
    <div className="h-full w-full z-0">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FlyToSearch target={searchFlyTo} />
        {reviews.map((review) => (
          <Marker 
          key={review.id} 
          position={[review.lat, review.lng]} 
          icon={markerIcon}
          eventHandlers={{
            click: () => onSelect(review.id), // ★親から渡された onSelect を呼ぶ
          }}
        >
            <Popup>
              <span className="font-bold">{review.name}</span>
            </Popup>
          </Marker>
        ))}
        {/* 選択された口コミがあれば、そこへジャンプする */}
        {selectedReview && (
          <RecenterMap lat={selectedReview.lat} lng={selectedReview.lng} />
        )}
        {searchHighlight && (
          <Pane name="search-highlight" style={{ zIndex: 660 }}>
            <CircleMarker
              center={[searchHighlight.lat, searchHighlight.lng]}
              radius={18}
              pathOptions={{
                color: "#1d4ed8",
                weight: 3,
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                opacity: 1,
              }}
            />
            <CircleMarker
              center={[searchHighlight.lat, searchHighlight.lng]}
              radius={4}
              pathOptions={{
                color: "#1e40af",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 0.9,
                opacity: 1,
              }}
            />
          </Pane>
        )}
      </MapContainer>
    </div>
  );
}