import type { ExtendKcContext } from "keycloakify/account";
import type { Attribute } from "keycloakify/login/KcContext";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
  themeName: ThemeName;
  properties: Record<KcEnvName, string>;
  /** Dark mode restriction from realm config. When false, dark mode is disallowed. */
  darkMode?: boolean;
  // NOTE: Here you can declare more properties to extend the KcContext
  // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
};

export type KcContextExtensionPerPage = {
  "account.ftl"?: {
    profile?: { attributesByName?: Record<string, Attribute> };
  };
  "totp.ftl"?: {
    mockPasskeys?: unknown[];
    mockPasskeysLoading?: boolean;
    mockPasskeysError?: string | null;
  };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;

/** Returns the runtime kcContext injected by the server. For use in scripts that run before React (e.g. color scheme). */
export function getKcContext(): { kcContext: KcContext } {
  if (!window.kcContext) {
    throw new Error(
      "kcContext not found. Ensure the account page is loaded via Keycloak."
    );
  }
  return { kcContext: window.kcContext as KcContext };
}
