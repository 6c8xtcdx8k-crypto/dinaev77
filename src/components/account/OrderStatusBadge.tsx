import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const COLORS: Record<OrderStatus, string> = {
  NEW: "bg-zinc-100 text-zinc-700",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-sky-200 text-sky-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-brand-100 text-brand-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return (
    <span className={`badge ${COLORS[s] ?? "bg-zinc-100 text-zinc-700"}`}>
      {ORDER_STATUS_LABELS[s] ?? status}
    </span>
  );
}
