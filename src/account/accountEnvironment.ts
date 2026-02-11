import type { BaseEnvironment } from "@/shared/keycloak-ui-shared";
import type { KcContext } from "./KcContext";

export type AccountEnvironment = BaseEnvironment & { accountBasePath: string };

/**
 * Matches common locale path segments (e.g. "es", "en", "zh-CN", "pt-BR").
 * When Keycloak uses locale in the URL path (/es/realms/...), we must strip it
 * so serverBaseUrl points to the Keycloak root (API is at /realms/..., not /es/realms/...).
 */
function isLocalePathSegment(segment: string): boolean {
  return /^[a-z]{2}(-[A-Za-z]{2,3})?$/i.test(segment);
}

/**
 * Builds AccountEnvironment from kcContext for KeycloakProvider.
 * Returns null when accountUrl cannot be parsed (e.g. Storybook uses "/account" without /realms/).
 *
 * @param kcContext - The Keycloak context
 * @param basePathUrl - Optional URL to use for accountBasePath (e.g. totpUrl when on Totp page).
 *   When provided, redirects stay on the current page instead of the account root.
 */
export function buildAccountEnvironment(
  kcContext: KcContext,
  basePathUrl?: string
): AccountEnvironment | null {
  const { url } = kcContext;
  const accountUrl = url.accountUrl;
  const resourceUrl = url.resourceUrl ?? "";
  const urlForPath = basePathUrl ?? accountUrl;

  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(accountUrl, base);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const realmsIndex = pathParts.indexOf("realms");
    if (realmsIndex < 0 || realmsIndex + 1 >= pathParts.length) {
      return null;
    }
    const realm = pathParts[realmsIndex + 1];
    let pathBeforeRealms = pathParts.slice(0, realmsIndex).join("/");
    if (realmsIndex === 1 && pathBeforeRealms && isLocalePathSegment(pathParts[0])) {
      pathBeforeRealms = "";
    }
    const serverBaseUrl = [parsed.origin, pathBeforeRealms ? `/${pathBeforeRealms}` : ""]
      .join("")
      .replace(/\/$/, "");

    const pathParsed = new URL(urlForPath, base);
    const accountBasePath = pathParsed.pathname.replace(/\/$/, "") || "/";
    const result = {
      serverBaseUrl,
      realm,
      clientId: "account-console",
      resourceUrl,
      logo: "",
      logoUrl: "",
      accountBasePath
    };
    return result;
  } catch {
    return null;
  }
}
