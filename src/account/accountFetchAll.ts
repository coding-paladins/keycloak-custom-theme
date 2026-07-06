import type { KeycloakContext } from "@/shared/keycloak-ui-shared";
import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import { accountFetch, fetchKeycloakMessages, getAccessToken } from "./accountFetch";
import { fetchApplicationsFromApi } from "./accountFetchApplications";
import {
  setCachedProfile,
  setCachedMessages,
  setCachedApplications,
  setCachedCredentials,
  getAccountCacheUserId
} from "./accountDataCache";

export type CredentialContainer = {
  type?: string;
  category?: string;
  displayName?: string;
  userCredentialMetadatas?: unknown[];
  userCredentials?: unknown[];
};

export type AccountData = {
  profile: Record<string, unknown> | null;
  messages: Record<string, string>;
  applications: Awaited<ReturnType<typeof fetchApplicationsFromApi>>;
  credentials: CredentialContainer[] | null;
};

export type AccountPageData = Pick<AccountData, "profile" | "messages">;

async function parseProfileResponse(
  profileResult: PromiseSettledResult<Response>
): Promise<Record<string, unknown> | null> {
  if (profileResult.status !== "fulfilled") {
    return null;
  }
  const profileResponse = profileResult.value;
  if (
    !profileResponse.ok ||
    !profileResponse.headers.get("content-type")?.includes("application/json")
  ) {
    return null;
  }
  return (await profileResponse.json()) as Record<string, unknown>;
}

async function parseCredentialsResponse(
  credentialsResult: PromiseSettledResult<Response>
): Promise<CredentialContainer[] | null> {
  if (credentialsResult.status !== "fulfilled") {
    return null;
  }
  const credentialsResponse = credentialsResult.value;
  if (
    !credentialsResponse.ok ||
    !credentialsResponse.headers.get("content-type")?.includes("application/json")
  ) {
    return null;
  }
  const parsed = await credentialsResponse.json();
  return Array.isArray(parsed) ? parsed : [parsed];
}

function profileSearchParams(locale: string): Record<string, string> {
  const params: Record<string, string> = { userProfileMetadata: "true" };
  if (locale) {
    params.kc_locale = locale;
  }
  return params;
}

/**
 * Fetches only theme messages for the Account page (e.g. when profile is already cached).
 */
export async function fetchAccountMessages(
  context: KeycloakContext<BaseEnvironment>,
  locale: string,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  const { environment } = context;
  const userId = getAccountCacheUserId(context.keycloak);
  const accessToken = await getAccessToken(context.keycloak, { locale });
  const messages = await fetchKeycloakMessages(context, locale, { signal, accessToken });
  setCachedMessages(environment, userId, locale, messages);
  return messages;
}

/**
 * Fetches only profile and messages for the Account page.
 * Avoids blocking on applications/credentials endpoints.
 */
export async function fetchAccountPageData(
  context: KeycloakContext<BaseEnvironment>,
  locale: string,
  signal?: AbortSignal
): Promise<AccountPageData> {
  const { environment } = context;
  const userId = getAccountCacheUserId(context.keycloak);
  const accessToken = await getAccessToken(context.keycloak, { locale });

  const [profileResult, messagesResult] = await Promise.allSettled([
    accountFetch("/", context, {
      searchParams: profileSearchParams(locale),
      signal,
      locale,
      accessToken
    }),
    fetchKeycloakMessages(context, locale, { signal, accessToken })
  ]);

  const profile = await parseProfileResponse(profileResult);
  const messages = messagesResult.status === "fulfilled" ? messagesResult.value : {};

  setCachedProfile(environment, userId, profile);
  setCachedMessages(environment, userId, locale, messages);

  return { profile, messages };
}

/**
 * Fetches only applications for the Applications page.
 */
export async function fetchApplicationsPageData(
  context: KeycloakContext<BaseEnvironment>,
  signal?: AbortSignal
): Promise<AccountData["applications"]> {
  const { environment } = context;
  const userId = getAccountCacheUserId(context.keycloak);
  const accessToken = await getAccessToken(context.keycloak);

  const applications = await fetchApplicationsFromApi(context, { signal, accessToken });
  setCachedApplications(environment, userId, applications);

  return applications;
}

/**
 * Fetches all account data in parallel and stores in sessionStorage.
 * Use fetchAccountPageData or fetchApplicationsPageData when loading a single page.
 */
export async function fetchAllAccountData(
  context: KeycloakContext<BaseEnvironment>,
  locale: string,
  signal?: AbortSignal
): Promise<AccountData> {
  const { environment } = context;
  const userId = getAccountCacheUserId(context.keycloak);
  const accessToken = await getAccessToken(context.keycloak, { locale });

  const [profileResult, messagesResult, applicationsResult, credentialsResult] =
    await Promise.allSettled([
      accountFetch("/", context, {
        searchParams: profileSearchParams(locale),
        signal,
        locale,
        accessToken
      }),
      fetchKeycloakMessages(context, locale, { signal, accessToken }),
      fetchApplicationsFromApi(context, { signal, accessToken }),
      accountFetch("/credentials", context, {
        searchParams: { "user-credentials": "true" },
        signal,
        accessToken
      })
    ]);

  const profile = await parseProfileResponse(profileResult);
  const messages = messagesResult.status === "fulfilled" ? messagesResult.value : {};
  const applications =
    applicationsResult.status === "fulfilled" ? applicationsResult.value : [];
  const credentials = await parseCredentialsResponse(credentialsResult);

  setCachedProfile(environment, userId, profile);
  setCachedMessages(environment, userId, locale, messages);
  setCachedApplications(environment, userId, applications);
  setCachedCredentials(environment, userId, credentials);

  return { profile, messages, applications, credentials };
}
