export type RawIngredient = { name: string; qty?: number | null; unit?: string | null };
export type MergedIngredient = {
  key: string;
  name: string;
  qty: number | null;
  unit: string | null;
  fromCount: number;
};

/** Canonical form for common unit spellings, so "2 lbs" and "1 lb" combine. */
const UNIT_CANON: Record<string, string> = {
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  oz: "oz", ounce: "oz", ounces: "oz",
  g: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tbs: "tbsp", tbl: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup",
  clove: "clove", cloves: "clove",
  can: "can", cans: "can",
  pkg: "pkg", package: "pkg", packages: "pkg",
  ml: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
  qt: "qt", quart: "qt", quarts: "qt",
  pt: "pt", pint: "pt", pints: "pt",
  gal: "gal", gallon: "gal", gallons: "gal",
  pinch: "pinch", pinches: "pinch",
  bunch: "bunch", bunches: "bunch",
  slice: "slice", slices: "slice",
  piece: "piece", pieces: "piece",
  head: "head", heads: "head",
  stalk: "stalk", stalks: "stalk",
  stick: "stick", sticks: "stick",
};

/**
 * Normalizes an ingredient name for matching: lowercases, drops parenthetical
 * and trailing ", …" descriptors ("chicken breast, diced" → "chicken breast"),
 * unifies "&"/"and", and strips punctuation + extra whitespace. Intentionally
 * conservative — it does NOT fold singular/plural, so "green pepper" and "red
 * pepper" stay distinct.
 */
export function normalizeName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parentheticals
    .split(",")[0] // drop trailing ", descriptor"
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || raw.trim().toLowerCase();
}

/** Canonical unit key, mapping known synonyms together (unknown units pass through). */
export function normalizeUnit(raw?: string | null): string {
  const u = (raw ?? "").toLowerCase().trim().replace(/\.+$/, "");
  return UNIT_CANON[u] ?? u;
}

/**
 * Consolidates ingredients across recipes/components. Items whose normalized
 * name AND normalized unit match are summed into one line; different units (or
 * unitless) stay as separate lines. The first-seen spelling is kept for display.
 */
export function mergeIngredients(items: RawIngredient[]): MergedIngredient[] {
  const map = new Map<string, MergedIngredient>();
  for (const it of items) {
    const name = it.name.trim();
    if (!name) continue;
    const unit = it.unit?.trim() || null;
    const key = `${normalizeName(name)}|${normalizeUnit(unit)}`;
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
