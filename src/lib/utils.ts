import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build a Walmart search deep link for a grocery item. */
export function walmartSearchUrl(query: string) {
  return `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
}
