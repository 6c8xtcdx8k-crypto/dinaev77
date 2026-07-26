"use client";

import { useState } from "react";

type Media = { id: string; url: string; alt: string };

/** Видео определяем по ссылке: Cloudinary отдаёт ролики через /video/upload/. */
function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes("/video/upload/");
}

/** Постер для видео — кадр из ролика (Cloudinary отдаёт .jpg вместо .mp4). */
function posterFor(url: string): string {
  return url.replace(/\.(mp4|webm|mov|m4v)(\?|$)/i, ".jpg$2");
}

export function ProductGallery({
  images,
  name,
}: {
  images: Media[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-24 rounded-2xl opacity-30" />
      </div>
    );
  }

  const current = images[active];

  return (
    <div className="flex gap-3">
      {images.length > 1 && (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={isVideo(img.url) ? `Видео ${i + 1}` : `Фото ${i + 1}`}
              className={`relative h-16 w-12 overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                i === active ? "border-brand-600 shadow-glow" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isVideo(img.url) ? posterFor(img.url) : img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              {isVideo(img.url) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/55">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-2xl bg-zinc-100 shadow-card">
        {isVideo(current.url) ? (
          <video
            key={active}
            src={current.url}
            poster={posterFor(current.url)}
            controls
            playsInline
            preload="metadata"
            className="aspect-[3/4] h-auto w-full animate-scale-in bg-black object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={active}
            src={current.url}
            alt={current.alt || name}
            className="aspect-[3/4] h-auto w-full animate-scale-in object-cover"
          />
        )}
      </div>
    </div>
  );
}
