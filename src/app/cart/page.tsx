import Link from "next/link";
import type { Metadata } from "next";
import { getCart, getCartLines } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { CartItemControls } from "@/components/cart/CartItemControls";
import { IconCart } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Корзина" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCart();
  const lines = cart ? await getCartLines(cart.id) : [];

  if (lines.length === 0) {
    return (
      <div className="container py-16 text-center">
        <IconCart />
        <h1 className="mt-4 text-2xl font-bold">Корзина пуста</h1>
        <p className="mt-2 text-zinc-500">Загляните в каталог — там много интересного.</p>
        <Link href="/catalog" className="btn-primary mt-6">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">
        Корзина <span className="text-base font-normal text-zinc-400">{count} шт.</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line.itemId} className="card flex gap-4 p-4">
              <Link href={`/product/${line.slug}`} className="shrink-0">
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.imageUrl}
                    alt={line.name}
                    className="h-28 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-20 items-center justify-center rounded-xl bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="" className="w-10 rounded-lg opacity-30" />
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link href={`/product/${line.slug}`} className="font-semibold hover:text-brand-600">
                  {line.name}
                </Link>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Размер: {line.size} · Цвет: {line.color}
                </p>
                {line.desiredColor && (
                  <p className="text-sm font-medium text-brand-600">
                    Желаемый цвет: {line.desiredColor}
                  </p>
                )}
                {line.stock < line.qty && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Осталось только {line.stock} шт.
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <CartItemControls itemId={line.itemId} qty={line.qty} maxQty={line.stock} />
                  <div className="text-right">
                    <div className="font-bold">{formatPrice(line.price * line.qty)}</div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-5 lg:sticky lg:top-36">
          <h2 className="text-lg font-bold">Итого</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Товары, {count} шт.</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
              <dt>К оплате</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-4 w-full !py-3">
            Перейти к оформлению
          </Link>
        </aside>
      </div>
    </div>
  );
}
