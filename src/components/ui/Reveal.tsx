/**
 * Лёгкое появление контента при загрузке страницы (чистый CSS).
 * Контент не скрывается в ожидании скролла или JS — фотографии
 * видны сразу. variant="stagger" анимирует детей по очереди.
 */
export function Reveal({
  children,
  variant = "block",
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: "block" | "stagger";
  className?: string;
  as?: "div" | "section" | "ul";
}) {
  return (
    <Tag className={`${variant === "stagger" ? "stagger" : "reveal"} ${className}`}>
      {children}
    </Tag>
  );
}
