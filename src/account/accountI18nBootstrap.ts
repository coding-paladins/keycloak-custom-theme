/**
 * Initializes react-i18next for the account theme when served by Keycloak (KcPage flow).
 * The account extension components (ErrorPage, Alerts, etc.) use useTranslation, which requires
 * an i18n instance connected via initReactI18next. This bootstrap runs before the first render.
 */
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import type { KcContext } from "./KcContext";
import { accountEnFallbacks } from "./accountEnFallbacks";

export async function initAccountThemeI18n(kcContext: KcContext): Promise<void> {
  const locale = kcContext.locale?.currentLanguageTag ?? "en";
  const messages =
    (
      kcContext as KcContext & { "x-keycloakify"?: { messages?: Record<string, string> } }
    )["x-keycloakify"]?.messages ?? {};

  const enTranslation =
    locale === "en" ? { ...accountEnFallbacks, ...messages } : accountEnFallbacks;

  const resources = {
    [locale]: { translation: messages },
    en: { translation: enTranslation }
  };

  const i18n = createInstance({
    lng: locale,
    fallbackLng: "en",
    nsSeparator: false,
    interpolation: { escapeValue: false },
    resources
  });

  await i18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: "en",
    nsSeparator: false,
    interpolation: { escapeValue: false },
    resources
  });
}
