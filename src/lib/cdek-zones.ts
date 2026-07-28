import "server-only";
import cities from "@/data/cdek-cities.json";

type CityRow = { c: number; n: string; z: string };

const byCode = new Map<number, CityRow>();
for (const c of cities as CityRow[]) byCode.set(c.c, c);

/** Зона доставки по коду города CDEK (msk | spb | center | volga_ural | siberia | far). */
export function zoneForCity(code: number | undefined): string | undefined {
  if (!code) return undefined;
  return byCode.get(code)?.z;
}
