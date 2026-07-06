import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import type { Keycloak } from "oidc-spa/keycloak-js";
import type { ApiApplication } from "./accountFetchApplications";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = "keycloak-account";

type CachedItem<T> = {
  data: T;
  timestamp: number;
};

export function getAccountCacheUserId(keycloak: Keycloak): string | null {
  if (!keycloak.authenticated) {
    return null;
  }

  return keycloak.subject ?? keycloak.tokenParsed?.sub ?? null;
}

function cacheKey(environment: BaseEnvironment, userId: string, suffix: string, locale?: string): string {
  const base = `${environment.serverBaseUrl}:${environment.realm}:${userId}`;
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

export function getCachedProfile(environment: BaseEnvironment, userId: string | null): CachedProfile | null {
  if (userId == null) return null;
  return getCached<CachedProfile>(cacheKey(environment, userId, "profile", undefined));
}

export function setCachedProfile(
  environment: BaseEnvironment,
  userId: string | null,
  profile: CachedProfile
): void {
  if (userId == null) return;
  setCached(cacheKey(environment, userId, "profile", undefined), profile);
}

export function getCachedMessages(
  environment: BaseEnvironment,
  userId: string | null,
  locale: string
): CachedMessages | null {
  if (userId == null) return null;
  return getCached<CachedMessages>(cacheKey(environment, userId, "messages", locale));
}

export function setCachedMessages(
  environment: BaseEnvironment,
  userId: string | null,
  locale: string,
  messages: CachedMessages
): void {
  if (userId == null) return;
  setCached(cacheKey(environment, userId, "messages", locale), messages);
}

export function getCachedApplications(
  environment: BaseEnvironment,
  userId: string | null
): ApiApplication[] | null {
  if (userId == null) return null;
  return getCached<ApiApplication[]>(cacheKey(environment, userId, "applications", undefined));
}

export function setCachedApplications(
  environment: BaseEnvironment,
  userId: string | null,
  applications: ApiApplication[]
): void {
  if (userId == null) return;
  setCached(cacheKey(environment, userId, "applications", undefined), applications);
}

export function getCachedCredentials(
  environment: BaseEnvironment,
  userId: string | null
): CachedCredentials | null {
  if (userId == null) return null;
  return getCached<CachedCredentials>(cacheKey(environment, userId, "credentials", undefined));
}

export function setCachedCredentials(
  environment: BaseEnvironment,
  userId: string | null,
  credentials: CachedCredentials
): void {
  if (userId == null) return;
  setCached(cacheKey(environment, userId, "credentials", undefined), credentials);
}
