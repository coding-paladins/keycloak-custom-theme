import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import type { ApiApplication } from "./accountFetchApplications";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = "keycloak-account";

type CachedItem<T> = {
  data: T;
  timestamp: number;
};

function cacheKey(environment: BaseEnvironment, suffix: string, locale?: string): string {
  const base = `${environment.serverBaseUrl}:${environment.realm}`;
  const localePart = locale != null ? `:${locale}` : "";
  return `${CACHE_PREFIX}:${base}:${suffix}${localePart}`;
}

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw) as CachedItem<T>;
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T): void {
  try {
    const item: CachedItem<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(item));
  } catch {
    /* sessionStorage full or unavailable */
  }
}

export type CachedProfile = Record<string, unknown> | null;
export type CachedMessages = Record<string, string>;
export type CachedCredentials = Record<string, unknown>[] | null;

export function getCachedProfile(environment: BaseEnvironment): CachedProfile | null {
  return getCached<CachedProfile>(cacheKey(environment, "profile", undefined));
}

export function setCachedProfile(
  environment: BaseEnvironment,
  profile: CachedProfile
): void {
  setCached(cacheKey(environment, "profile", undefined), profile);
}

export function getCachedMessages(
  environment: BaseEnvironment,
  locale: string
): CachedMessages | null {
  return getCached<CachedMessages>(cacheKey(environment, "messages", locale));
}

export function setCachedMessages(
  environment: BaseEnvironment,
  locale: string,
  messages: CachedMessages
): void {
  setCached(cacheKey(environment, "messages", locale), messages);
}

export function getCachedApplications(
  environment: BaseEnvironment
): ApiApplication[] | null {
  return getCached<ApiApplication[]>(cacheKey(environment, "applications", undefined));
}

export function setCachedApplications(
  environment: BaseEnvironment,
  applications: ApiApplication[]
): void {
  setCached(cacheKey(environment, "applications", undefined), applications);
}

export function getCachedCredentials(
  environment: BaseEnvironment
): CachedCredentials | null {
  return getCached<CachedCredentials>(cacheKey(environment, "credentials", undefined));
}

export function setCachedCredentials(
  environment: BaseEnvironment,
  credentials: CachedCredentials
): void {
  setCached(cacheKey(environment, "credentials", undefined), credentials);
}
