import { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import Template from "../Template";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { buildAccountProfileContext } from "../accountProfileContext";
import { AccountProfileSkeleton } from "@/account/AccountProfileSkeleton";

const UserProfileFormFields = lazy(() => import("@/login/UserProfileFormFields"));
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import { useEnvironmentOptional } from "@/shared/keycloak-ui-shared/context/KeycloakContext";
import { accountUpdateAccount, formDataToUserRepresentation } from "../accountFetch";
import { fetchAllAccountData } from "../accountFetchAll";
import { LoginRedirectError } from "../accountFetch";
import { getCachedProfile, getCachedMessages } from "../accountDataCache";
import { parseAccountBaseUrl } from "@/lib/utils";

type AccountContext = Extract<KcContext, { pageId: "account.ftl" }>;

/**
 * Builds the AIA (Application Initiated Action) URL for delete_account.
 * Goes through the OIDC auth endpoint so Keycloak creates a proper auth session
 * and redirects to the delete-account-confirm required action page.
 */
function buildDeleteAccountUrl(accountUrl: string): string {
  const accountBase = parseAccountBaseUrl(accountUrl);
  const baseRealmUrl = accountBase.replace(/\/account\/?.*$/, "").replace(/\/$/, "") || accountBase.split("/account")[0];

  if (baseRealmUrl && accountBase.includes("/realms/")) {
    return `${baseRealmUrl}/protocol/openid-connect/auth?client_id=account&redirect_uri=${encodeURIComponent(accountBase)}&response_type=code&scope=openid&kc_action=delete_account`;
  }
  return `${accountBase}${accountBase.includes("?") ? "&" : "?"}kc_action=delete_account`;
}

function hasMockProfile(kcContext: AccountContext & { profile?: { attributesByName?: Record<string, unknown> } }): boolean {
  return kcContext.profile?.attributesByName != null && Object.keys(kcContext.profile.attributesByName).length > 0;
}

/** Parses the Keycloak Account API error response into per-field errors and a general message. */
function parseServerErrors(responseText: string): { fieldErrors: Record<string, string>; generalMessage: string } {
  const fieldErrors: Record<string, string> = {};
  let generalMessage = "failed to save";

  try {
    const parsed = JSON.parse(responseText) as {
      errorMessage?: string;
      field?: string;
      params?: unknown[];
      errors?: Array<{ field?: string; errorMessage?: string; params?: unknown[] }>;
    };

    const errors = parsed.errors ?? (parsed.field ? [parsed] : []);
    for (const error of errors) {
      const field = error.field;
      const message = error.errorMessage ?? "";
      if (field && message) {
        fieldErrors[field] = message;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      generalMessage = "";
    } else {
      const params = parsed.params ?? parsed.errors?.[0]?.params;
      const lastParam = Array.isArray(params) && params.length > 0 ? params[params.length - 1] : undefined;
      if (typeof lastParam === "string") {
        generalMessage = lastParam;
      } else if (typeof parsed.errorMessage === "string") {
        generalMessage = parsed.errorMessage;
      }
    }
  } catch {
    if (responseText) generalMessage = responseText;
  }

  return { fieldErrors, generalMessage };
}

function AccountContent(
  props: PageProps<AccountContext, I18n> & {
    profileContext: ReturnType<typeof buildAccountProfileContext>;
    isLoading: boolean;
    context?: ReturnType<typeof useEnvironment>;
    onSaveSuccess?: () => void;
  }
) {
  const { kcContext, i18n, Template: _Template = Template, profileContext, isLoading, context, onSaveSuccess } = props;

  const { url, stateChecker } = kcContext;
  const { msg, msgStr, advancedMsgStr } = i18n;

  const { kcClsx } = getKcClsx({
    doUseDefaultCss: false,
    classes: props.classes as Parameters<typeof getKcClsx>[0]["classes"]
  });

  const [isFormSubmittable, setIsFormSubmittable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const formDataRef = useRef<(() => Record<string, string | string[]>) | null>(null);

  const hasProfileFields = Object.keys(profileContext.profile.attributesByName).length > 0;

  const hasRequiredFields = hasProfileFields && Object.values(profileContext.profile.attributesByName).some(attribute => attribute.required);

  const deleteAccountUrl = buildDeleteAccountUrl(url.accountUrl);

  // Apply aria-invalid on input DOM elements for fields with server errors.
  // The Input component already has CSS: aria-invalid:border-destructive.
  useEffect(() => {
    const fieldNames = Object.keys(serverFieldErrors);
    const elements: HTMLElement[] = [];
    for (const name of fieldNames) {
      const element = document.getElementById(name);
      if (element) {
        element.setAttribute("aria-invalid", "true");
        elements.push(element);
      }
    }
    return () => {
      for (const element of elements) {
        element.removeAttribute("aria-invalid");
      }
    };
  }, [serverFieldErrors]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const submitAction = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    if (submitAction === "Cancel") {
      window.location.href = url.accountUrl;
      return;
    }
    if (submitAction !== "Save") return;
    if (!context || !formDataRef.current) return;

    setSaveError(null);
    setServerFieldErrors({});
    setIsSaving(true);
    try {
      const formData = formDataRef.current();
      if (!formData) {
        setIsSaving(false);
        return;
      }
      const payload = formDataToUserRepresentation(formData);
      const response = await accountUpdateAccount(payload, context);
      if (response.ok) {
        onSaveSuccess?.();
      } else {
        const text = await response.text();
        const { fieldErrors, generalMessage } = parseServerErrors(text);
        // Translate Keycloak error message keys (e.g. "error-invalid-date") into localized strings.
        const translatedFieldErrors: Record<string, string> = {};
        for (const [field, message] of Object.entries(fieldErrors)) {
          translatedFieldErrors[field] = advancedMsgStr(message);
        }
        setServerFieldErrors(translatedFieldErrors);
        if (generalMessage) {
          setSaveError(advancedMsgStr(generalMessage));
        }
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const ServerFieldErrorAfterField = useCallback(
    (fieldProps: { attribute: { name: string } }) => {
      const errorMessage = serverFieldErrors[fieldProps.attribute.name];
      if (!errorMessage) return null;
      return (
        <div className="text-sm text-destructive mt-1" role="alert" aria-live="polite">
          {errorMessage}
        </div>
      );
    },
    [serverFieldErrors]
  );

  const hasServerFieldErrors = Object.keys(serverFieldErrors).length > 0;

  return (
    <_Template {...{ kcContext, i18n, doUseDefaultCss: false, classes: props.classes }} active="account">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{msg("personalInfoHtmlTitle")}</h2>
              <p className="text-sm text-muted-foreground">{msg("personalInfoIntroMessage")}</p>
            </div>
          </div>
          {hasRequiredFields && (
            <p className="shrink-0 text-sm text-muted-foreground">
              <span className="text-destructive">*</span> {msg("requiredFields")}
            </p>
          )}
        </header>

        {hasProfileFields ? (
          <>
            <form id="kc-account-form" className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <input type="hidden" id="stateChecker" name="stateChecker" value={stateChecker} />

              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}

              <Suspense fallback={<AccountProfileSkeleton />}>
                <UserProfileFormFields
                  kcContext={profileContext as unknown as Parameters<typeof import("@/login/UserProfileFormFields").default>[0]["kcContext"]}
                  i18n={i18n as Parameters<typeof import("@/login/UserProfileFormFields").default>[0]["i18n"]}
                  kcClsx={kcClsx}
                  onIsFormSubmittableValueChange={setIsFormSubmittable}
                  doMakeUserConfirmPassword={false}
                  formDataRef={formDataRef}
                  AfterField={hasServerFieldErrors ? ServerFieldErrorAfterField : undefined}
                />
              </Suspense>
            </form>

            <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-between md:items-end md:gap-2">
              <Button asChild variant="destructive" size="lg" className="w-full md:w-auto">
                <a href={deleteAccountUrl}>Delete account</a>
              </Button>
              <div className="flex flex-col gap-2 md:flex-row md:gap-2">
                <Button
                  type="submit"
                  form="kc-account-form"
                  name="submitAction"
                  value="Save"
                  disabled={!isFormSubmittable || isSaving}
                  className="w-full min-w-[7rem] md:w-[7rem]"
                >
                  {msgStr("doSave")}
                </Button>
                <Button
                  type="submit"
                  form="kc-account-form"
                  variant="outline"
                  name="submitAction"
                  value="Cancel"
                  formNoValidate
                  className="w-full min-w-[7rem] md:w-[7rem]"
                >
                  {msg("doCancel")}
                </Button>
              </div>
            </div>
          </>
        ) : isLoading ? (
          <AccountProfileSkeleton />
        ) : (
          <p className="text-sm text-muted-foreground">no profile fields</p>
        )}
      </div>
    </_Template>
  );
}

function applyCachedMessages(kcContext: AccountContext, cachedProfile: Record<string, unknown>, cachedMessages: Record<string, string>): void {
  const hasProfileFields =
    Array.isArray((cachedProfile.userProfileMetadata as { attributes?: unknown[] })?.attributes) &&
    ((cachedProfile.userProfileMetadata as { attributes: unknown[] }).attributes?.length ?? 0) > 0;
  if (hasProfileFields && Object.keys(cachedMessages).length > 0) {
    const keycloakifyMessages = kcContext["x-keycloakify"]?.messages;
    if (keycloakifyMessages && typeof keycloakifyMessages === "object") {
      Object.assign(keycloakifyMessages, cachedMessages);
    }
  }
}

function AccountFetcher(props: PageProps<AccountContext, I18n>) {
  const { kcContext } = props;
  const context = useEnvironment();

  const locale = kcContext.locale?.currentLanguageTag ?? "en";
  const [apiResponse, setApiResponse] = useState<Record<string, unknown> | null>(() => {
    const cachedProfile = getCachedProfile(context.environment);
    const cachedMessages = getCachedMessages(context.environment, locale);
    if (cachedProfile != null) {
      if (cachedMessages != null) {
        applyCachedMessages(kcContext, cachedProfile, cachedMessages);
      }
      return cachedProfile;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cachedProfile = getCachedProfile(context.environment);
    const cachedMessages = getCachedMessages(context.environment, locale);
    return cachedProfile == null || cachedMessages == null;
  });

  const serverBaseUrl = context.environment.serverBaseUrl;
  const realm = context.environment.realm;
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    let loadError: unknown;
    const abortController = new AbortController();

    async function load() {
      loadError = undefined;
      try {
        if (!isLoading) {
          return;
        }
        const { profile, messages } = await fetchAllAccountData(context, locale, abortController.signal);
        if (cancelled) {
          return;
        }

        applyCachedMessages(kcContext, profile ?? {}, messages);
        setApiResponse(profile ?? null);
      } catch (err) {
        loadError = err;
        if (err instanceof LoginRedirectError) {
          return;
        }
        if (!cancelled) setApiResponse(null);
      } finally {
        if (!cancelled && !(loadError instanceof LoginRedirectError)) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [serverBaseUrl, realm, locale, isLoading]);

  const profileContext = buildAccountProfileContext(kcContext, apiResponse ?? undefined);

  const handleSaveSuccess = async () => {
    try {
      const { profile, messages } = await fetchAllAccountData(context, locale);
      applyCachedMessages(kcContext, profile ?? {}, messages);
      setApiResponse(profile ?? null);
    } catch {
      setApiResponse(null);
    }
  };

  return (
    <AccountContent
      {...props}
      profileContext={profileContext}
      isLoading={isLoading}
      context={context ?? undefined}
      onSaveSuccess={handleSaveSuccess}
    />
  );
}

export default function Account(props: PageProps<AccountContext, I18n> & { useMockData?: boolean }) {
  const { kcContext, useMockData } = props;

  const useMock = useMockData ?? hasMockProfile(kcContext as AccountContext & { profile?: { attributesByName?: Record<string, unknown> } });

  if (useMock) {
    const profileContext = buildAccountProfileContext(kcContext, undefined);
    return <AccountContentWithOptionalContext {...props} profileContext={profileContext} isLoading={false} />;
  }

  return <AccountFetcher {...props} />;
}

function AccountContentWithOptionalContext(
  props: PageProps<AccountContext, I18n> & {
    profileContext: ReturnType<typeof buildAccountProfileContext>;
    isLoading: boolean;
  }
) {
  const context = useEnvironmentOptional();
  const [savedProfile, setSavedProfile] = useState<Record<string, unknown> | null>(null);
  const locale = props.kcContext.locale?.currentLanguageTag ?? "en";

  const handleSaveSuccess = async () => {
    if (!context) return;
    try {
      const { profile, messages } = await fetchAllAccountData(context, locale);
      applyCachedMessages(props.kcContext, profile ?? {}, messages);
      setSavedProfile(profile ?? null);
    } catch {
      setSavedProfile(null);
    }
  };

  const profileContext = savedProfile != null ? buildAccountProfileContext(props.kcContext, savedProfile) : props.profileContext;

  return <AccountContent {...props} profileContext={profileContext} context={context ?? undefined} onSaveSuccess={handleSaveSuccess} />;
}
