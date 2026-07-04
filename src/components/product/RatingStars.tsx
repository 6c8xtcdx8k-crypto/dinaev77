export function RatingStars({
  rating,
  count,
  size = "md",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className={`flex items-center gap-1 ${cls}`}>
      <div className="flex text-brand-400" aria-label={`Рейтинг ${rating} из 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= Math.round(rating) ? "" : "text-zinc-300"}>
            ★
          </span>
        ))}
      </div>
      {rating > 0 && <span className="font-medium text-zinc-700">{rating.toFixed(1)}</span>}
      {count !== undefined && count > 0 && (
        <span className="text-zinc-400">({count})</span>
      )}
    </div>
  );
}
