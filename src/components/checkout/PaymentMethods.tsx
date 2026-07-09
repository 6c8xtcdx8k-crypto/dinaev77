import { qrUrlFor, type PaymentMethod } from "@/lib/payment";
import { CopyButton } from "./CopyButton";

/**
 * Блок с реквизитами оплаты: для каждого способа — QR-код, подпись и
 * копируемое значение. Используется на экране успеха и странице заказа.
 */
export function PaymentMethods({
  methods,
  compact = false,
}: {
  methods: PaymentMethod[];
  compact?: boolean;
}) {
  const qrSize = compact ? "h-32 w-32" : "h-40 w-40";
  return (
    <div className="space-y-4">
      {methods.map((m) => (
        <div key={m.key} className={methods.length > 1 ? "rounded-xl border border-sky-100 p-3" : ""}>
          <p className="text-center text-sm font-semibold text-brand-800">Оплата — {m.title}</p>
          <div className={`mt-3 flex flex-col items-center gap-3 ${compact ? "sm:flex-row sm:items-start" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrlFor(m.qrData, "")}
              alt={`QR-код: ${m.title}`}
              className={`${qrSize} shrink-0 rounded-xl border border-sky-100`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500">{m.label}:</p>
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-sky-50 p-2">
                <code className="flex-1 break-all text-xs text-zinc-700">{m.value}</code>
                <CopyButton text={m.value} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-sm text-zinc-500">
        Отсканируйте QR или скопируйте реквизиты. После оплаты пришлите боту чек —
        заказ подтвердят после проверки поступления.
      </p>
    </div>
  );
}
