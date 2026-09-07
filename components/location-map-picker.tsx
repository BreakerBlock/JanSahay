'use client';

import { useEffect, useRef } from 'react';
import type { CircleMarker, Map as LeafletMap } from 'leaflet';

type Props = {
  latitude: string;
  longitude: string;
  onSelect: (latitude: string, longitude: string) => void;
  instruction: string;
  selectedLabel: string;
};

function coordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
}

export default function LocationMapPicker({ latitude, longitude, onSelect, instruction, selectedLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    import('leaflet').then((L) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const selected = coordinates(latitude, longitude);
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true })
        .setView(selected ? [selected.lat, selected.lng] : [22.9734, 78.6569], selected ? 14 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      if (selected) {
        markerRef.current = L.circleMarker([selected.lat, selected.lng], {
          radius: 9, color: '#ffffff', weight: 3, fillColor: '#086ba6', fillOpacity: 1,
        }).addTo(map);
      }
      map.on('click', (event) => onSelectRef.current(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6)));
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      leafletRef.current = null;
    };
  }, []); // The picker is deliberately initialised once when opened.

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    const selected = coordinates(latitude, longitude);
    if (!selected) {
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = null;
      return;
    }
    if (markerRef.current) markerRef.current.setLatLng([selected.lat, selected.lng]);
    else markerRef.current = L.circleMarker([selected.lat, selected.lng], {
      radius: 9, color: '#ffffff', weight: 3, fillColor: '#086ba6', fillOpacity: 1,
    }).addTo(map);
    map.panTo([selected.lat, selected.lng]);
  }, [latitude, longitude]);

  const selected = coordinates(latitude, longitude);
  return (
    <div className="location-map-shell">
      <div className="location-map" ref={containerRef} role="application" aria-label={instruction} />
      <div className="map-caption">
        <span>{instruction}</span>
        {selected && <b>{selectedLabel}: {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}</b>}
      </div>
    </div>
  );
}
