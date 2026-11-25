'use client';

import { useState, type ReactElement } from 'react';
import { ArrowLeft, ArrowRight, Check, Heart, Images, Share2 } from 'lucide-react';
import type { PropertyImage } from '@rentr/types';

export function PropertyPhotoGallery({
  images,
  title,
}: {
  images: readonly PropertyImage[];
  title: string;
}): ReactElement {
  const gallery = images.length
    ? images
    : [{ url: '/property-images/bright-apartment-living-room.jpg', alt: title }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [notice, setNotice] = useState('');

  const move = (step: number): void => {
    setActiveIndex((index) => (index + step + gallery.length) % gallery.length);
  };

  const share = async (): Promise<void> => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setNotice('تم نسخ رابط العقار.');
      window.setTimeout(() => setNotice(''), 2500);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setNotice('تعذرت مشاركة الرابط من هذا المتصفح.');
    }
  };

  const current = gallery[activeIndex]!;

  return (
    <section aria-label="صور العقار" className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 sm:aspect-[16/9] lg:aspect-[16/10]">
        <img
          src={current.url}
          alt={current.alt}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow-soft">
            <Images size={15} />
            {activeIndex + 1} / {gallery.length} صور
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              aria-pressed={favorite}
              onClick={() => setFavorite((value) => !value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/80 shadow-soft ${
                favorite ? 'bg-danger-50 text-danger-600' : 'bg-white/95 text-ink'
              }`}
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              aria-label="مشاركة العقار"
              onClick={() => void share()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/95 text-ink shadow-soft"
            >
              {notice ? <Check size={18} /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              onClick={() => move(-1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition hover:bg-white"
            >
              <ArrowRight size={19} />
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              onClick={() => move(1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition hover:bg-white"
            >
              <ArrowLeft size={19} />
            </button>
          </>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-ink shadow-soft"
          >
            {notice}
          </p>
        ) : null}
      </div>
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="معرض الصور المصغرة">
          {gallery.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`عرض الصورة ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                activeIndex === index ? 'border-brand-600' : 'border-transparent'
              }`}
            >
              <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
