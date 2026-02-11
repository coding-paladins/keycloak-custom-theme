import type { KeycloakContext } from "@/shared/keycloak-ui-shared";
import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import { accountFetch } from "./accountFetch";

export type ApiApplication = {
  clientId: string;
  clientName?: string;
  id?: string;
  effectiveUrl?: string;
  userConsentRequired?: boolean;
  consent?: { grantedScopes?: { id: string; name?: string }[] };
};

/**
 * Fetches applications from Keycloak Account REST API.
 * Returns full client info (clientId, clientName, effectiveUrl, etc.) including test clients.
 *
 * @see https://github.com/keycloak/keycloak/blob/main/services/src/main/java/org/keycloak/services/resources/account/AccountRestService.java
 */
export async function fetchApplicationsFromApi(
  context: KeycloakContext<BaseEnvironment>,
  options: { signal?: AbortSignal; accessToken?: string } = {}
): Promise<ApiApplication[]> {
  const response = await accountFetch("/applications", context, {
    signal: options.signal,
    accessToken: options.accessToken
  });

  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return [];
  }

  const data = (await response.json()) as unknown;
  const items = Array.isArray(data) ? data : [];

  return items
    .map(item => {
      const raw = item as Record<string, unknown>;
      const consent = raw.consent as
        | { grantedScopes?: { id: string; name?: string }[] }
        | undefined;
      return {
        clientId: (raw.clientId as string) ?? "",
        clientName: (raw.clientName as string) ?? (raw.name as string),
        id: (raw.id as string) ?? undefined,
        effectiveUrl: (raw.effectiveUrl as string) ?? undefined,
        userConsentRequired: Boolean(raw.userConsentRequired),
        consent
      };
    })
    .filter(app => app.clientId.length > 0);
}
