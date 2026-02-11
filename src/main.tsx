import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { KcPage } from "./kc.gen";

// The following block can be uncommented to test a specific page with `pnpm dev`
// Don't forget to comment back or your bundle size will increase

// import { getKcContextMock } from "./login/KcPageStory";

// if (import.meta.env.DEV) {
//   window.kcContext = getKcContextMock({
//     pageId: "login.ftl",
//     overrides: {}
//   });
// }

function redirectAccountUrlWithoutLocale(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("kc_locale")) return false;
  url.searchParams.delete("kc_locale");
  if (url.searchParams.toString()) {
    url.search = "?" + url.searchParams.toString();
  } else {
    url.search = "";
  }
  window.location.replace(url.pathname + url.search + url.hash);
  return true;
}

async function bootstrapAndRender(): Promise<void> {
  if (window.kcContext?.themeType === "account") {
    if (redirectAccountUrlWithoutLocale()) return;
    const { initAccountThemeI18n } = await import("./account/accountI18nBootstrap");
    await initAccountThemeI18n(window.kcContext);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {!window.kcContext ? (
        <h1>No Keycloak Context</h1>
      ) : (
        <KcPage kcContext={window.kcContext} />
      )}
    </StrictMode>
  );
}

bootstrapAndRender().catch(err => {
  console.error("[keycloak] bootstrapAndRender: fatal error", err);
});
