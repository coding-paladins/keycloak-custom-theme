import "../global.css";
import "../custom.css";
import { type ReactNode, Suspense } from "react";
import type { ClassKey } from "keycloakify/account";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/account/DefaultPage";
import Template from "./Template";
import Account from "./pages/Account";
import Applications from "./pages/Applications";
import FederatedIdentity from "./pages/FederatedIdentity";
import Log from "./pages/Log";
import Password from "./pages/Password";
import Sessions from "./pages/Sessions";
import Totp from "./pages/Totp";
import { KeycloakProvider } from "@/shared/keycloak-ui-shared";
import { buildAccountEnvironment } from "./accountEnvironment";

function hasAccountMockProfile(
  kcContext: Extract<KcContext, { pageId: "account.ftl" }>
): boolean {
  const ext = kcContext as KcContext & {
    profile?: { attributesByName?: Record<string, unknown> };
  };
  return (
    ext.profile?.attributesByName != null &&
    Object.keys(ext.profile.attributesByName).length > 0
  );
}

function hasTotpMockPasskeys(
  kcContext: Extract<KcContext, { pageId: "totp.ftl" }>
): boolean {
  const ext = kcContext as KcContext & {
    mockPasskeys?: unknown[];
    mockPasskeysLoading?: boolean;
    mockPasskeysError?: string | null;
  };
  return (
    ext.mockPasskeys !== undefined ||
    ext.mockPasskeysError !== undefined ||
    ext.mockPasskeysLoading === true
  );
}

type CommonProps = {
  kcContext: KcContext;
  i18n: ReturnType<typeof useI18n>["i18n"];
  classes: { [key in ClassKey]?: string };
  Template: typeof Template;
  doUseDefaultCss: boolean;
};

function getAccountPageContent(
  kcContext: KcContext,
  commonProps: CommonProps
): ReactNode {
  switch (kcContext.pageId) {
    case "account.ftl": {
      const accountContext = kcContext as Extract<KcContext, { pageId: "account.ftl" }>;
      const environment = buildAccountEnvironment(kcContext);
      const hasMockProfile = hasAccountMockProfile(accountContext);
      const useMock = hasMockProfile || !environment;

      const accountPage = (
        <Account {...commonProps} kcContext={accountContext} useMockData={useMock} />
      );

      return environment && !useMock ? (
        <KeycloakProvider environment={environment}>{accountPage}</KeycloakProvider>
      ) : (
        accountPage
      );
    }
    case "applications.ftl": {
      const applicationsContext = kcContext as Extract<
        KcContext,
        { pageId: "applications.ftl" }
      >;
      const environment = buildAccountEnvironment(
        kcContext,
        kcContext.url.applicationsUrl
      );
      const useMock = !environment;

      const applicationsPage = (
        <Applications
          {...commonProps}
          kcContext={applicationsContext}
          useMockData={useMock}
        />
      );

      return environment && !useMock ? (
        <KeycloakProvider environment={environment}>{applicationsPage}</KeycloakProvider>
      ) : (
        applicationsPage
      );
    }
    case "federatedIdentity.ftl":
      return <FederatedIdentity {...commonProps} kcContext={kcContext} />;
    case "log.ftl":
      return <Log {...commonProps} kcContext={kcContext} />;
    case "password.ftl":
      return <Password {...commonProps} kcContext={kcContext} />;
    case "sessions.ftl":
      return <Sessions {...commonProps} kcContext={kcContext} />;
    case "totp.ftl": {
      const totpContext = kcContext as Extract<KcContext, { pageId: "totp.ftl" }>;
      const useMock = hasTotpMockPasskeys(totpContext);
      const environment = buildAccountEnvironment(kcContext, totpContext.url.totpUrl);

      const totpPage = (
        <Totp {...commonProps} kcContext={totpContext} useMockData={useMock} />
      );

      return environment && !useMock ? (
        <KeycloakProvider environment={environment}>{totpPage}</KeycloakProvider>
      ) : (
        totpPage
      );
    }
    default:
      return <DefaultPage {...commonProps} />;
  }
}

export default function KcPage(props: { kcContext: KcContext }) {
  const { kcContext } = props;

  const { i18n } = useI18n({ kcContext });

  const classes = {} satisfies { [key in ClassKey]?: string };

  const commonProps: CommonProps = {
    kcContext,
    i18n,
    classes,
    Template,
    doUseDefaultCss: false
  };

  return <Suspense>{getAccountPageContent(kcContext, commonProps)}</Suspense>;
}
