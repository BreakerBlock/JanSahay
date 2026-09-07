'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from './language-provider';

type Props = {
  latitude: string;
  longitude: string;
  onSelect: (latitude: string, longitude: string) => void;
  instruction: string;
  selectedLabel: string;
};

type SelectedPlace = {
  lat?: string | number;
  lng?: string | number;
};

type MapObject = {
  on: (event: string, callback: () => void) => void;
  remove: () => void;
};

type PickerObject = {
  remove?: () => void;
  setLocation?: (location: { lat: number; lng: number }) => void;
};

type MapplsRuntime = {
  maps: { Map: (options: { id: string; properties: Record<string, unknown> }) => MapObject };
  plugins: { placePicker: (options: Record<string, unknown>, callback: (response: { data?: SelectedPlace } | SelectedPlace) => void) => PickerObject };
};

let runtimePromise: Promise<MapplsRuntime> | null = null;

function coordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
}

function loadMappls(token: string): Promise<MapplsRuntime> {
  if (!runtimePromise) {
    const pending = import('mappls-web-maps').then(({ mappls, mappls_plugin }) => new Promise<MapplsRuntime>((resolve, reject) => {
      const maps = new mappls();
      const plugins = new mappls_plugin();
      const timeout = window.setTimeout(() => reject(new Error('Map service did not finish loading.')), 15000);
      maps.initialize(token, { map: true, version: '3.0', plugins: ['placePicker', 'search'] }, () => {
        window.clearTimeout(timeout);
        resolve({ maps, plugins });
      });
    })).catch((error) => {
      runtimePromise = null;
      throw error;
    });
    runtimePromise = pending;
    return pending;
  }
  return runtimePromise;
}

export default function LocationMapPicker({ latitude, longitude, onSelect, instruction, selectedLabel }: Props) {
  const { t } = useLanguage();
  const mapId = `jansahay-map-${useId().replaceAll(':', '')}`;
  const mapRef = useRef<MapObject | null>(null);
  const pickerRef = useRef<PickerObject | null>(null);
  const onSelectRef = useRef(onSelect);
  const coordinatesRef = useRef(coordinates(latitude, longitude));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'' | 'config' | 'load'>('');
  const token = process.env.NEXT_PUBLIC_MAPPLS_TOKEN?.trim() || '';

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { coordinatesRef.current = coordinates(latitude, longitude); }, [latitude, longitude]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('config');
      return;
    }
    let disposed = false;
    loadMappls(token).then(({ maps, plugins }) => {
      if (disposed) return;
      const selected = coordinatesRef.current;
      const map = maps.Map({
        id: mapId,
        properties: {
          center: selected ? [selected.lat, selected.lng] : [22.9734, 78.6569],
          zoom: selected ? 15 : 4,
          minZoom: 3,
          maxZoom: 20,
        },
      });
      mapRef.current = map;
      map.on('load', () => {
        if (disposed) return;
        const current = coordinatesRef.current;
        pickerRef.current = plugins.placePicker({
          map,
          ...(current ? { location: current } : {}),
          search: true,
          geolocation: true,
          region: 'IND',
          closeBtn: false,
          topText: instruction,
          searchChars: 2,
        }, (response) => {
          const candidate = response as SelectedPlace & { data?: SelectedPlace };
          const place = candidate.data ?? candidate;
          if (!place) return;
          const selectedPlace = coordinates(String(place.lat ?? ''), String(place.lng ?? ''));
          if (!selectedPlace) return;
          onSelectRef.current(selectedPlace.lat.toFixed(6), selectedPlace.lng.toFixed(6));
        });
        setLoading(false);
      });
    }).catch(() => {
      if (!disposed) {
        setLoading(false);
        setError('load');
      }
    });
    return () => {
      disposed = true;
      pickerRef.current?.remove?.();
      pickerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [instruction, mapId, token]);

  useEffect(() => {
    const selected = coordinates(latitude, longitude);
    if (selected) pickerRef.current?.setLocation?.(selected);
  }, [latitude, longitude]);

  const selected = coordinates(latitude, longitude);
  return (
    <div className="location-map-shell">
      <div id={mapId} className="location-map" aria-label={instruction} />
      {loading && <div className="map-state" role="status">{t('Loading India map and location search…', 'भारत का मानचित्र और स्थान खोज लोड हो रही है…')}</div>}
      {error === 'config' && <div className="map-state map-error" role="alert">{t('Mappls is not configured. Add NEXT_PUBLIC_MAPPLS_TOKEN in Vercel and redeploy.', 'Mappls कॉन्फ़िगर नहीं है। Vercel में NEXT_PUBLIC_MAPPLS_TOKEN जोड़कर पुनः डिप्लॉय करें।')}</div>}
      {error === 'load' && <div className="map-state map-error" role="alert">{t('The India map could not be loaded. Check the Mappls key and its allowed domains.', 'भारत का मानचित्र लोड नहीं हुआ। Mappls कुंजी और अनुमत डोमेन जाँचें।')}</div>}
      <div className="map-caption">
        <span>{instruction} {t('Search for a place or PIN code to jump closer, then fine-tune the pin.', 'पास जाने के लिए स्थान या पिन कोड खोजें, फिर पिन को सटीक जगह पर रखें।')}</span>
        {selected && <b>{selectedLabel}: {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}</b>}
      </div>
    </div>
  );
}
