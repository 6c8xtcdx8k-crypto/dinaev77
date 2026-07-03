import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCart, getCartLines } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Оформление заказа" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  if (lines.length === 0) redirect("/cart");

  const user = await getCurrentUser();
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">Оформление заказа</h1>
      <CheckoutForm
        subtotal={subtotal}
        defaults={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
        }}
      />
    </div>
  );
}
