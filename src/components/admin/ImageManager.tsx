"use client";

import { useRef, useState, useTransition } from "react";
import {
  addProductImageAction,
  deleteProductImageAction,
  setMainImageAction,
  moveImageAction,
} from "@/actions/admin";

type Image = { id: string; url: string; alt: string; sort: number };

/**
 * Фотографии товара: загрузка файлов с предпросмотром, выбор главного,
 * сортировка стрелками и удаление с подтверждением.
 * Первое фото (главное) показывается в каталоге.
 */
export function ImageManager({ productId, images }: { productId: string; images: Image[] }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...previews];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setPreviews(next);
  }

  async function uploadAll() {
    setUploading(true);
    setError(null);
    try {
      for (const item of previews) {
        const form = new FormData();
        form.append("file", item.file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
        const added = await addProductImageAction(productId, json.url);
        if (!added.ok) throw new Error(added.error ?? "Не удалось сохранить");
        URL.revokeObjectURL(item.url);
      }
      setPreviews([]);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function addByUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setError(null);
    const res = await addProductImageAction(productId, url);
    if (res.ok) setUrlInput("");
    else setError(res.error ?? "Ошибка");
  }

  return (
    <div className="card p-5">
      <h3 className="mb-1 font-bold">Фотографии</h3>
      <p className="mb-3 text-xs text-zinc-400">
        Первое фото — главное: оно показывается в каталоге. Порядок меняется стрелками.
      </p>

      {/* Текущие фото */}
      {images.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <figure key={img.id} className="w-24">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt}
                  className={`h-32 w-24 rounded-xl object-cover ${i === 0 ? "ring-2 ring-brand-400" : ""}`}
                />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-brand-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Главное
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <button
                  type="button"
                  disabled={pending || i === 0}
                  title="Влево"
                  onClick={() => startTransition(() => moveImageAction(img.id, productId, "left"))}
                  className="rounded border border-sky-200 px-1.5 text-xs text-sky-700 disabled:opacity-30"
                >
                  ←
                </button>
                {i !== 0 && (
                  <button
                    type="button"
                    disabled={pending}
                    title="Сделать главным"
                    onClick={() => startTransition(() => setMainImageAction(img.id, productId))}
                    className="rounded border border-brand-200 px-1.5 text-xs text-brand-600"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending || i === images.length - 1}
                  title="Вправо"
                  onClick={() => startTransition(() => moveImageAction(img.id, productId, "right"))}
                  className="rounded border border-sky-200 px-1.5 text-xs text-sky-700 disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={pending}
                  title="Удалить"
                  onClick={() => {
                    if (confirm("Удалить это фото?")) {
                      startTransition(() => deleteProductImageAction(img.id, productId));
                    }
                  }}
                  className="rounded border border-red-200 px-1.5 text-xs text-red-600"
                >
                  ✕
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}

      {/* Загрузка файлов с предпросмотром */}
      <div
        className="rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-4 text-center transition hover:border-brand-300"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pickFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
        />
        <p className="text-sm font-semibold">Перетащите фото сюда или</p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="btn-secondary mt-2 !py-1.5 text-sm"
        >
          Выбрать файлы
        </button>
        <p className="mt-1 text-xs text-zinc-400">JPG, PNG, WebP · до 8 МБ</p>
      </div>

      {/* Предпросмотр перед сохранением */}
      {previews.length > 0 && (
        <div className="mt-3 animate-fade-up">
          <p className="mb-2 text-sm font-semibold">Предпросмотр ({previews.length}):</p>
          <div className="flex flex-wrap gap-2">
            {previews.map((pr, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pr.url} alt="" className="h-24 w-18 rounded-lg object-cover" style={{ width: 72 }} />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pr.url);
                    setPreviews(previews.filter((_, j) => j !== i));
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                  aria-label="Убрать из загрузки"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={uploadAll}
            disabled={uploading}
            className="btn-primary mt-3 !py-2 text-sm"
          >
            {uploading ? "Загружаем…" : `Загрузить ${previews.length} фото`}
          </button>
        </div>
      )}

      {/* Альтернатива: по ссылке */}
      <div className="mt-3 flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="…или вставьте ссылку на изображение"
          className="input !py-2 text-sm"
        />
        <button type="button" onClick={addByUrl} className="btn-secondary shrink-0 !py-2 text-sm">
          Добавить
        </button>
      </div>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
