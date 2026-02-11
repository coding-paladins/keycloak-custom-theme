import { useEffect, useState, useRef } from "react";
import { getKcClsx } from "keycloakify/account/lib/kcClsx";
import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import { getCachedApplications } from "../accountDataCache";
import { fetchAllAccountData } from "../accountFetchAll";
import type { ApiApplication } from "../accountFetchApplications";
import { Button } from "@/components/ui/button";
import { AppWindow, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function mapServerApplicationToApi(app: Record<string, unknown>): ApiApplication {
  const client = (app.client as Record<string, unknown>) ?? {};
  const clientId = (app.clientId as string) ?? (client.clientId as string) ?? "";
  const clientScopesGranted = (app.clientScopesGranted as string[]) ?? [];
  return {
    clientId,
    clientName: (app.clientName as string) ?? (client.name as string) ?? (client.clientName as string),
    id: (app.id as string) ?? (client.id as string) ?? clientId,
    effectiveUrl: (app.effectiveUrl as string) ?? undefined,
    userConsentRequired: Boolean(app.userConsentRequired ?? client.consentRequired ?? client.userConsentRequired),
    consent: {
      grantedScopes: clientScopesGranted.map((name, index) => ({ id: String(index), name }))
    }
  };
}

function ApplicationsContent(
  props: PageProps<Extract<KcContext, { pageId: "applications.ftl" }>, I18n> & {
    applications: ApiApplication[];
  }
) {
  const { kcContext, i18n, doUseDefaultCss, classes, Template, applications } = props;

  const { kcClsx } = getKcClsx({
    doUseDefaultCss,
    classes
  });

  const { url, stateChecker } = kcContext;
  const { msg, advancedMsg } = i18n;

  const clientScopesGranted = (app: ApiApplication) => app.consent?.grantedScopes?.map(s => s.name ?? s.id) ?? [];

  return (
    <Template {...{ kcContext, i18n, doUseDefaultCss, classes }} active="applications">
      <div className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <AppWindow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{msg("applicationsHtmlTitle")}</h2>
              <p className="text-sm text-muted-foreground">{msg("applicationsIntroMessage")}</p>
            </div>
          </div>
        </header>

        <form action={url.applicationsUrl} method="post" className="flex flex-col gap-3">
          <input type="hidden" id="stateChecker" name="stateChecker" value={stateChecker} />
          <input type="hidden" id="referrer" name="referrer" value={kcContext.referrer?.url ?? ""} />

          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-4 text-center text-sm text-muted-foreground">
              no applications
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map(application => {
                const displayName =
                  application.clientName && application.clientName !== "application" && application.clientName !== "applications"
                    ? advancedMsg(application.clientName)
                    : application.clientId;
                const scopes = clientScopesGranted(application);
                const canRevoke = application.userConsentRequired && scopes.length > 0;

                return (
                  <div
                    key={application.clientId}
                    className="overflow-hidden rounded-xl border border-l-4 border-l-primary/60 bg-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <div className="flex flex-row items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <AppWindow className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {application.effectiveUrl ? (
                              <a
                                href={application.effectiveUrl}
                                className="group inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                              >
                                {displayName}
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
                              </a>
                            ) : (
                              <span className="font-semibold">{displayName}</span>
                            )}
                            {application.effectiveUrl && <p className="mt-0.5 truncate text-xs text-muted-foreground">{application.effectiveUrl}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-12">
                          <span className="text-xs font-medium text-muted-foreground">{msg("grantedPermissions")}:</span>
                          {application.userConsentRequired ? (
                            scopes.length > 0 ? (
                              scopes.map(claim => (
                                <span
                                  key={claim}
                                  className={cn(
                                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                                    "bg-background/80 text-muted-foreground border border-border/80"
                                  )}
                                >
                                  {advancedMsg(claim)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              )}
                            >
                              {msg("fullAccess")}
                            </span>
                          )}
                        </div>
                      </div>
                      {canRevoke && (
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          className={kcClsx("kcButtonPrimaryClass", "kcButtonClass")}
                          id={`revoke-${application.clientId}`}
                          name="clientId"
                          value={application.id ?? application.clientId}
                        >
                          {msg("revoke")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </div>
    </Template>
  );
}

function ApplicationsFetcher(props: PageProps<Extract<KcContext, { pageId: "applications.ftl" }>, I18n>) {
  const { kcContext } = props;
  const context = useEnvironment();
  const [applications, setApplications] = useState<ApiApplication[]>(() => {
    const cached = getCachedApplications(context.environment);
    return cached ?? [];
  });

  const serverBaseUrl = context.environment.serverBaseUrl;
  const realm = context.environment.realm;
  const locale = kcContext.locale?.currentLanguageTag ?? "en";
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    const abortController = new AbortController();

    async function load() {
      try {
        const cached = getCachedApplications(context.environment);
        if (cached != null) {
          if (!cancelled) {
            setApplications(cached);
          }
          return;
        }

        const { applications } = await fetchAllAccountData(context, locale, abortController.signal);
        if (!cancelled) {
          setApplications(applications);
        }
      } catch {
        if (!cancelled) {
          setApplications([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [serverBaseUrl, realm, locale]);

  return <ApplicationsContent {...props} applications={applications} />;
}

export default function Applications(
  props: PageProps<Extract<KcContext, { pageId: "applications.ftl" }>, I18n> & {
    useMockData?: boolean;
  }
) {
  if (props.useMockData) {
    const serverApplications = props.kcContext.applications?.applications ?? [];
    const applications = serverApplications.map(app => mapServerApplicationToApi(app as Record<string, unknown>));
    return <ApplicationsContent {...props} applications={applications} />;
  }

  return <ApplicationsFetcher {...props} />;
}
