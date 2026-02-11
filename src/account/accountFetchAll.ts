import type { KeycloakContext } from "@/shared/keycloak-ui-shared";
import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import { accountFetch, fetchKeycloakMessages, getAccessToken } from "./accountFetch";
import { fetchApplicationsFromApi } from "./accountFetchApplications";
import {
  setCachedProfile,
  setCachedMessages,
  setCachedApplications,
  setCachedCredentials
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

/**
 * Fetches all account data in parallel and stores in sessionStorage.
 * Uses Promise.allSettled so a failed fetches (e.g. messages) do not cause others (e.g. applications) to fail.
 * Subsequent page navigations can use cached data for instant display.
 */
export async function fetchAllAccountData(
  context: KeycloakContext<BaseEnvironment>,
  locale: string,
  signal?: AbortSignal
): Promise<AccountData> {
  const { environment } = context;

  const profileSearchParams: Record<string, string> = { userProfileMetadata: "true" };
  if (locale) profileSearchParams.kc_locale = locale;

  const accessToken = await getAccessToken(context.keycloak, { locale });
  const [profileResult, messagesResult, applicationsResult, credentialsResult] =
    await Promise.allSettled([
      accountFetch("/", context, {
        searchParams: profileSearchParams,
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

  let profile: Record<string, unknown> | null = null;
  if (profileResult.status === "fulfilled") {
    const profileResponse = profileResult.value;
    if (
      profileResponse.ok &&
      profileResponse.headers.get("content-type")?.includes("application/json")
    ) {
      profile = (await profileResponse.json()) as Record<string, unknown>;
    }
  }

  const messages = messagesResult.status === "fulfilled" ? messagesResult.value : {};

  const applications =
    applicationsResult.status === "fulfilled" ? applicationsResult.value : [];

  let credentials: CredentialContainer[] | null = null;
  if (credentialsResult.status === "fulfilled") {
    const credentialsResponse = credentialsResult.value;
    if (
      credentialsResponse.ok &&
      credentialsResponse.headers.get("content-type")?.includes("application/json")
    ) {
      const parsed = await credentialsResponse.json();
      credentials = Array.isArray(parsed) ? parsed : [parsed];
    }
  }

  setCachedProfile(environment, profile);
  setCachedMessages(environment, locale, messages);
  setCachedApplications(environment, applications);
  setCachedCredentials(environment, credentials);

  return { profile, messages, applications, credentials };
}
