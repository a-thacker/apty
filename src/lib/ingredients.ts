export type RawIngredient = { name: string; qty?: number | null; unit?: string | null };
export type MergedIngredient = {
  key: string;
  name: string;
  qty: number | null;
  unit: string | null;
  fromCount: number;
};

/**
 * Consolidates ingredients across recipes. Same name + same unit are summed;
 * different units (or unitless) are kept as separate lines.
 */
export function mergeIngredients(items: RawIngredient[]): MergedIngredient[] {
  const map = new Map<string, MergedIngredient>();
  for (const it of items) {
    const name = it.name.trim();
    if (!name) continue;
    const unit = it.unit?.trim() || null;
    const key = `${name.toLowerCase()}|${unit?.toLowerCase() ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      if (it.qty != null) existing.qty = (existing.qty ?? 0) + it.qty;
      existing.fromCount += 1;
    } else {
      map.set(key, { key, name, qty: it.qty ?? null, unit, fromCount: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Renders a quantity + unit into the freeform `qty` text a list item stores. */
export function formatQty(qty?: number | null, unit?: string | null): string | null {
  const q = qty != null && !Number.isNaN(qty) ? String(Number(qty.toFixed(2))) : "";
  const u = unit?.trim() ?? "";
  const s = [q, u].filter(Boolean).join(" ").trim();
  return s || null;
}
