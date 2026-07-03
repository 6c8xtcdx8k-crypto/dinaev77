"use client";

import { useState } from "react";

export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string; alt: string }[];
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

  return (
    <div className="flex gap-3">
      {images.length > 1 && (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Фото ${i + 1}`}
              className={`h-16 w-12 overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-brand-600" : "border-transparent opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-2xl bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={images[active].alt || name}
          className="aspect-[3/4] h-auto w-full object-cover"
        />
      </div>
    </div>
  );
}
