"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { SpaceSummary } from "@/lib/types";

type MapPanelProps = {
  spaces: SpaceSummary[];
};

export function MapPanel({ spaces }: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    let mounted = true;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;

    async function initializeMap() {
      if (!mapRef.current || instanceRef.current) return;

      const L = await import("leaflet");

      if (!mounted || !mapRef.current) return;

      if (instanceRef.current) return;

      const validSpaces = spaces.filter(
        (space) =>
          typeof space.coordinates?.lat === "number" &&
          typeof space.coordinates?.lng === "number",
      );

      const center: [number, number] =
        validSpaces.length > 0
          ? [
              validSpaces[0].coordinates!.lat,
              validSpaces[0].coordinates!.lng,
            ]
          : [12.9716, 77.5946];

      const map = L.map(mapRef.current, {
        center,
        zoom: 13,
        scrollWheelZoom: false,
      });

      instanceRef.current = map;

      L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILES ||
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      ).addTo(map);

      const markerIcon = L.divIcon({
        className: "sparc-map-marker",
        html: `
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            background: #17251f;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            border: 3px solid white;
          ">
            <span style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #d8f5df;
            "></span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      validSpaces.forEach((space) => {
        const { lat, lng } = space.coordinates!;

        const marker = L.marker([lat, lng], {
          icon: markerIcon,
        }).addTo(map);

        marker.bindPopup(`
	  <div style="min-width:180px">
	    <strong>${space.title}</strong>
	    <div>${space.zone}</div>
	    <div style="margin-top:6px">
	      &#8377;${space.price}/hr &middot; ${space.available} available
	    </div>
	    <div style="margin-top:4px">
	      ${space.verified ? "&#10003; Verified" : "Verification pending"}
	    </div>
	  </div>
	`);
      });

      if (validSpaces.length > 1) {
        const bounds = L.latLngBounds(
          validSpaces.map((space) => [
            space.coordinates!.lat,
            space.coordinates!.lng,
          ]),
        );

        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 14,
        });
      }

      invalidateTimer = setTimeout(() => {
        if (
          mounted &&
          instanceRef.current === map &&
          mapRef.current === map.getContainer()
        ) {
          map.invalidateSize();
        }
      }, 100);
    }

    initializeMap();

    return () => {
      mounted = false;

      if (invalidateTimer) {
        clearTimeout(invalidateTimer);
      }

      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [spaces]);

  return (
    <div className="relative min-h-[310px] overflow-hidden rounded-3xl bg-[#dbe6df]">
      <div
        ref={mapRef}
        className="absolute inset-0 z-0 min-h-[310px]"
      />

      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[500] flex justify-between">
        <span className="chip bg-white shadow-sm">
          Map view Ãƒâ€šÃ‚· Bengaluru
        </span>

        <span className="chip bg-mint shadow-sm">
          OpenStreetMap
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-ink shadow-sm">
        Live demo locations Ãƒâ€šÃ‚· availability is simulated
      </div>
    </div>
  );
}



