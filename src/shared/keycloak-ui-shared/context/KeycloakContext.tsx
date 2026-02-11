/**
 * This file has been claimed for ownership from @keycloakify/keycloak-ui-shared version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "shared/keycloak-ui-shared/context/KeycloakContext.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import { oidcEarlyInit } from "oidc-spa/entrypoint";
import { Keycloak } from "oidc-spa/keycloak-js";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { AlertProvider } from "../alerts/Alerts";
import { ErrorPage } from "./ErrorPage";
import { Help } from "./HelpContext";
import { BaseEnvironment } from "./environment";

function getAccountBasePath(): string {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname;
  const match = path.match(/^(\/.*?\/realms\/[^/]+\/account)/);
  return match ? match[1] : path.replace(/\/$/, "") || "/";
}

oidcEarlyInit({
  BASE_URL: getAccountBasePath(),
  sessionRestorationMethod: "iframe"
});

export type KeycloakContext<T extends BaseEnvironment = BaseEnvironment> =
  KeycloakContextProps<T> & {
    keycloak: Keycloak;
  };

const createKeycloakEnvContext = <T extends BaseEnvironment>() =>
  createContext<KeycloakContext<T> | undefined>(undefined);

let KeycloakEnvContext: any;

export const useEnvironment = <T extends BaseEnvironment = BaseEnvironment>() => {
  const context = useContext<KeycloakContext<T>>(KeycloakEnvContext);
  if (!context)
    throw Error("no environment provider in the hierarchy make sure to add the provider");
  return context;
};

export const useEnvironmentOptional = <T extends BaseEnvironment = BaseEnvironment>():
  | KeycloakContext<T>
  | undefined => useContext<KeycloakContext<T>>(KeycloakEnvContext);

interface KeycloakContextProps<T extends BaseEnvironment> {
  environment: T;
}

export const KeycloakProvider = <T extends BaseEnvironment>({
  environment,
  children
}: PropsWithChildren<KeycloakContextProps<T>>) => {
  KeycloakEnvContext = createKeycloakEnvContext<T>();
  const calledOnce = useRef(false);
  const [init, setInit] = useState(false);
  const [error, setError] = useState<unknown>();
  const baseUrl =
    typeof window !== "undefined"
      ? "accountBasePath" in environment && environment.accountBasePath
        ? environment.accountBasePath
        : window.location.pathname.replace(/\/$/, "") || "/"
      : "/";

  const keycloak = useMemo(() => {
    return new Keycloak({
      url: environment.serverBaseUrl,
      realm: environment.realm,
      clientId: environment.clientId,
      BASE_URL: baseUrl,
      sessionRestorationMethod: "iframe"
    });
  }, [environment.serverBaseUrl, environment.realm, environment.clientId, baseUrl]);

  useEffect(() => {
    if (calledOnce.current) {
      return;
    }

    const run = async () => {
      await keycloak.init({
        onLoad: "login-required",
        pkceMethod: "S256",
        scope: environment.scope,
        enableLogging: false,
        checkLoginIframe: false
      });
      if (!keycloak.token) {
        try {
          await keycloak.updateToken(5);
        } catch {
          /* session may have expired */
        }
      }
    };

    run()
      .then(() => setInit(true))
      .catch(err => setError(err));

    calledOnce.current = true;
  }, [keycloak]);

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!init) {
    return null;
  }

  return (
    <KeycloakEnvContext.Provider value={{ environment, keycloak }}>
      <AlertProvider>
        <Help>{children}</Help>
      </AlertProvider>
    </KeycloakEnvContext.Provider>
  );
};
