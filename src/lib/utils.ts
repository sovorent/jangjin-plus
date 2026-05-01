import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind class names with clsx + tailwind-merge.
 * Used by shadcn/ui components and throughout the app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
