import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Пагинация">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn-secondary !px-3 !py-1.5 text-sm">
          ←
        </Link>
      )}
      {pages[0] > 1 && <span className="px-1 text-zinc-400">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
            p === page ? "bg-brand-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages && <span className="px-1 text-zinc-400">…</span>}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className="btn-secondary !px-3 !py-1.5 text-sm">
          →
        </Link>
      )}
    </nav>
  );
}
