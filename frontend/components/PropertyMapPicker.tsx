'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { PropertyMapPin } from '@rentr/ui/organisms';

interface PropertyMapPickerProps {
  value: PropertyMapPin | null;
  onChange: (pin: PropertyMapPin) => void;
  onClose: () => void;
}

const CAIRO_CENTER: [number, number] = [30.0444, 31.2357];

function MapClickHandler({ onChange }: Pick<PropertyMapPickerProps, 'onChange'>): null {
  useMapEvents({
    click(event) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function SelectedPin({ value }: Pick<PropertyMapPickerProps, 'value'>): ReactElement | null {
  const map = useMap();

  useEffect(() => {
    if (value) map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 14));
  }, [map, value]);

  return value ? (
    <CircleMarker
      center={[value.latitude, value.longitude]}
      radius={9}
      pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.85 }}
    />
  ) : null;
}

export function PropertyMapPicker({
  value,
  onChange,
  onClose,
}: PropertyMapPickerProps): ReactElement {
  const [error, setError] = useState('');
  const center = value ? ([value.latitude, value.longitude] as [number, number]) : CAIRO_CENTER;

  const useCurrentLocation = (): void => {
    setError('');
    if (!navigator.geolocation) {
      setError('خدمة تحديد الموقع غير متاحة في هذا المتصفح.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => onChange({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setError('تعذر تحديد موقعك. يمكنك اختيار الموقع مباشرة من الخريطة.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
      aria-label="حدد موقع العقار على الخريطة"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">انقر على الخريطة لتحديد موقع العقار بدقة.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={useCurrentLocation}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink"
          >
            استخدم موقعي الحالي
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white"
          >
            تم
          </button>
        </div>
      </div>
      <div className="h-80 overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={value ? 14 : 11}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          <SelectedPin value={value} />
        </MapContainer>
      </div>
      {value ? (
        <p className="text-xs text-ink-muted" aria-live="polite">
          الموقع المحدد:{' '}
          <span dir="ltr">
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </span>
          {' — '}
          الإحداثيات خاصة ولن تظهر للعامة.
        </p>
      ) : (
        <p className="text-xs text-ink-muted">لم يتم تحديد موقع بعد.</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
