import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactDateTime(date: Date): string {
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })} ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })}`;
}

export function parseAccountBaseUrl(url: string): string {
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, base);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}
