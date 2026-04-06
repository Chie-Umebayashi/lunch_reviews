"use client";

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { geocodeQuery } from "@/lib/geocodeClient";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type LatLng = { lat: number; lng: number };

interface LocationPickMapProps {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  defaultCenter: LatLng;
}

function DropOnMap({ onPick }: { onPick: (ll: L.LatLng) => void }) {
  const map = useMap();
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const el = map.getContainer();
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ll = map.containerPointToLatLng(L.point(x, y));
      onPickRef.current(ll);
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [map]);

  return null;
}

function ClickToPick({ onPick }: { onPick: (ll: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

/** 住所検索などで地図の表示中心を移動 */
function FlyTo({
  target,
}: {
  target: { lat: number; lng: number; token: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], 16, { animate: true });
  }, [map, target]);
  return null;
}

export default function LocationPickMap({
  value,
  onChange,
  defaultCenter,
}: LocationPickMapProps) {
  const center: [number, number] = [defaultCenter.lat, defaultCenter.lng];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; token: number } | null>(
    null
  );

  const handlePick = useCallback(
    (ll: L.LatLng) => {
      onChange({ lat: ll.lat, lng: ll.lng });
    },
    [onChange]
  );

  const runSearch = useCallback(async () => {
    setSearchError(null);
    setSearchBusy(true);
    try {
      const r = await geocodeQuery(searchQuery);
      if (!r.ok) {
        setSearchError(r.error);
        return;
      }
      onChange({ lat: r.lat, lng: r.lng });
      setFlyTo({ lat: r.lat, lng: r.lng, token: Date.now() });
    } finally {
      setSearchBusy(false);
    }
  }, [searchQuery, onChange]);

  return (
    <div className="relative w-full min-h-[320px]">
      <div className="mb-3 space-y-1.5">
        <label className="block text-xs font-bold text-slate-600" htmlFor="location-search">
          住所・施設名で検索
        </label>
        <div className="flex gap-2">
          <input
            id="location-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="例: 長崎駅、東京都千代田区..."
            disabled={searchBusy}
            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
            autoComplete="street-address"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searchBusy}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-50 transition"
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

      <div className="h-[320px] w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100">
        <MapContainer
          center={center}
          zoom={15}
          className="h-full w-full z-0"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FlyTo target={flyTo} />
          <DropOnMap onPick={handlePick} />
          <ClickToPick onPick={handlePick} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const p = m.getLatLng();
                  onChange({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div
        className="absolute -bottom-1 -right-1 z-[5000] flex flex-col items-end gap-1 pointer-events-auto"
        title="このピンを地図上にドラッグして離すか、地図をクリックして位置を指定"
      >
        <img
          src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
          alt=""
          width={28}
          height={46}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "pin");
            e.dataTransfer.effectAllowed = "copy";
          }}
          className="cursor-grab active:cursor-grabbing drop-shadow-lg select-none"
          aria-hidden
        />
        <span className="text-[10px] text-slate-500 max-w-[100px] text-right leading-tight bg-white/90 px-1 rounded">
          地図へドラッグ
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        地図を動かしたうえで、右下のピンを地図へドロップするか、地図をクリックして位置を決められます。ピンはドラッグで微調整できます。
      </p>
      {value && (
        <p className="mt-1 font-mono text-xs text-slate-600">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
