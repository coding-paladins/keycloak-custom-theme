import type { BaseEnvironment, KeycloakContext } from "@/shared/keycloak-ui-shared";
import type { Keycloak } from "oidc-spa/keycloak-js";

/**
 * Fetches theme messages from Keycloak. Keycloak may not expose a messages JSON endpoint for
 * custom themes; messages mainly come from kcContext (server-injected via kcContextExclusionsFtl).
 * This fetch is best-effort for realm-localized keys when an endpoint exists.
 */
export type FetchKeycloakMessagesOptions = {
  signal?: AbortSignal;
  /** Pre-fetched token; when provided (including null), getAccessToken is skipped. */
  accessToken?: string | null;
};

export async function fetchKeycloakMessages(
  context: KeycloakContext<BaseEnvironment>,
  locale: string,
  signalOrOptions?: AbortSignal | FetchKeycloakMessagesOptions
): Promise<Record<string, string>> {
  const options: FetchKeycloakMessagesOptions =
    signalOrOptions &&
    typeof signalOrOptions === "object" &&
    signalOrOptions !== null &&
    ("signal" in signalOrOptions || "accessToken" in signalOrOptions)
      ? (signalOrOptions as FetchKeycloakMessagesOptions)
      : { signal: signalOrOptions as AbortSignal | undefined };

  const { environment, keycloak } = context;
  const base = environment.serverBaseUrl.replace(/\/$/, "");
  const token =
    "accessToken" in options
      ? (options.accessToken ?? undefined)
      : await getAccessToken(keycloak);
  const headers: Record<string, string> = { "Accept-Language": locale };
  if (token) headers.Authorization = `Bearer ${token}`;

  const urls = [
    `${base}/resources/${environment.realm}/account/${locale}`,
    `${base}/resources/${environment.realm}/login/${locale}`
  ];

  const results: Record<string, string>[] = [];
  for (const url of urls) {
    const result = await fetchThemeMessagesFromUrl(url, headers, options.signal);
    results.push(result);
  }

  const merged = { ...results[1], ...results[0] };
  return merged;
}

async function fetchThemeMessagesFromUrl(
  url: string,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  const response = await fetch(url, {
    signal,
    method: "GET",
    credentials: "include",
    headers
  });
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  if (!response.ok || !isJson) {
    return {};
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    return {};
  }
  const result = Object.fromEntries(
    (data as Array<{ key?: string; value?: string }>)
      .filter(
        (entry): entry is { key: string; value: string } =>
          typeof entry?.key === "string" && typeof entry?.value === "string"
      )
      .map(entry => [entry.key, entry.value])
  );
  return result;
}

function buildAccountUrl(environment: BaseEnvironment, path: string): string {
  const base = environment.serverBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/realms/${environment.realm}/account${normalizedPath}`;
}

/** Thrown when getAccessToken triggers a login redirect. Callers should not treat as error; keep loading state until redirect. */
export class LoginRedirectError extends Error {
  readonly name = "LoginRedirectError";
}

export type GetAccessTokenOptions = {
  /** When triggering login redirect (no token), pass locale so the login page opens in user's language. */
  locale?: string;
};

export async function getAccessToken(
  keycloak: Keycloak,
  options?: GetAccessTokenOptions
): Promise<string | undefined> {
  if (keycloak.token) {
    return keycloak.token;
  }
  try {
    await keycloak.updateToken(5);
  } catch {
    /* updateToken may throw when session expired or not logged in */
  }
  if (keycloak.token) {
    return keycloak.token;
  }
  keycloak.login(options?.locale ? { locale: options.locale } : undefined);
  throw new LoginRedirectError("login redirect triggered");
}

export type AccountFetchOptions = {
  signal?: AbortSignal;
  searchParams?: Record<string, string>;
  /** When set, adds Accept-Language header so Keycloak returns localized content (e.g. userProfileMetadata displayName). */
  locale?: string;
  /** Pre-fetched token to avoid concurrent updateToken calls. When provided (including null for "no token"), getAccessToken is skipped. */
  accessToken?: string | null;
};

export type AccountDeleteCredentialOptions = {
  signal?: AbortSignal;
};

export async function accountDeleteCredential(
  credentialId: string,
  context: KeycloakContext<BaseEnvironment>,
  options: AccountDeleteCredentialOptions = {}
): Promise<Response> {
  const { environment, keycloak } = context;
  const { signal } = options;

  const url = buildAccountUrl(
    environment,
    `/credentials/${encodeURIComponent(credentialId)}`
  );
  const token = await getAccessToken(keycloak);
  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    signal,
    method: "DELETE",
    headers,
    credentials: "include"
  });
}

export async function accountFetch(
  path: string,
  context: KeycloakContext<BaseEnvironment>,
  options: AccountFetchOptions = {}
): Promise<Response> {
  const { environment, keycloak } = context;
  const { signal, searchParams, locale } = options;

  let url = buildAccountUrl(environment, path);
  if (searchParams && Object.keys(searchParams).length > 0) {
    const params = new URLSearchParams(searchParams);
    url += (url.includes("?") ? "&" : "?") + params.toString();
  }

  const token =
    "accessToken" in options
      ? (options.accessToken ?? undefined)
      : await getAccessToken(keycloak);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (locale) {
    headers["Accept-Language"] = locale;
  }

  const response = await fetch(url, {
    signal,
    method: "GET",
    headers,
    credentials: "include"
  });
  return response;
}

const BUILT_IN_ATTRIBUTES = new Set(["username", "email", "firstName", "lastName"]);

export type UserRepresentationPayload = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, string[]>;
};

/**
 * Builds UserRepresentation from form data.
 * Built-in fields (username, email, firstName, lastName) go at root level.
 * Custom attributes go in attributes as Record<string, string[]>.
 * Includes attributes with empty arrays so Keycloak clears removed multivalued values.
 */
export function formDataToUserRepresentation(
  formData: Record<string, string | string[]>
): UserRepresentationPayload {
  const payload: UserRepresentationPayload = {};
  const attributes: Record<string, string[]> = {};

  for (const [name, valueOrValues] of Object.entries(formData)) {
    if (name === "stateChecker" || name === "submitAction") continue;

    const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
    const filtered = values.map(value => String(value ?? "").trim()).filter(Boolean);

    if (BUILT_IN_ATTRIBUTES.has(name)) {
      (payload as Record<string, string>)[name] = filtered[0] ?? "";
    } else {
      attributes[name] = filtered;
    }
  }

  if (Object.keys(attributes).length > 0) {
    payload.attributes = attributes;
  }

  return payload;
}

export type AccountUpdateAccountOptions = {
  signal?: AbortSignal;
};

const ACCOUNT_UPDATE_TIMEOUT_MS = 30_000;

export async function accountUpdateAccount(
  payload: UserRepresentationPayload,
  context: KeycloakContext<BaseEnvironment>,
  options: AccountUpdateAccountOptions = {}
): Promise<Response> {
  const { environment, keycloak } = context;
  const { signal } = options;

  const url = buildAccountUrl(environment, "/");
  const token = await getAccessToken(keycloak);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ACCOUNT_UPDATE_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    return await fetch(url, {
      signal: controller.signal,
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload)
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
