import { useEffect, useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";

type PasskeyCredential = {
  id: string;
  userLabel: string;
  createdAt?: number;
  provider?: string;
  transports: string;
};
import type { I18n } from "../i18n";
import Template from "../Template";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smartphone, Trash2, Fingerprint, PlusCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import { formatCompactDateTime, parseAccountBaseUrl } from "@/lib/utils";
import { accountFetch, accountDeleteCredential } from "../accountFetch";

type CredentialContainer = {
  type?: string;
  category?: string;
  displayName?: string;
  userCredentialMetadatas?: Array<{
    credential?: { id?: string; userLabel?: string; createdDate?: number; transports?: string[] | { displayNameProperties?: string[] } };
    credentialId?: string;
    userLabel?: string;
    createdDate?: number;
    transports?: string[] | { displayNameProperties?: string[] };
  }>;
  userCredentials?: Array<{ id?: string; userLabel?: string; createdDate?: number }>;
};

function formatCredentialDate(timestamp?: number): string {
  if (timestamp == null) return "—";
  try {
    return formatCompactDateTime(new Date(timestamp));
  } catch {
    return "—";
  }
}

function formatTransports(transports: string[] | { displayNameProperties?: string[] } | undefined): string {
  if (!transports) return "—";
  if (Array.isArray(transports)) return transports.join(", ");
  const props = transports.displayNameProperties;
  return props?.length ? props.join(", ") : "—";
}

function isWebAuthnType(type: string, category?: string): boolean {
  const lower = type.toLowerCase();
  const cat = (category ?? "").toLowerCase();
  return (
    lower.includes("webauthn") || lower.includes("passwordless") || lower.includes("passkey") || cat.includes("webauthn") || cat.includes("passkey")
  );
}

function hasPasskeyContainer(containers: CredentialContainer[]): boolean {
  return containers.some(c => isWebAuthnType(c.type ?? "", c.category));
}

function extractPasskeyCredentials(containers: CredentialContainer[], defaultLabel: string): PasskeyCredential[] {
  const credentials: PasskeyCredential[] = [];

  for (const container of containers) {
    const type = container.type ?? "";
    if (!isWebAuthnType(type, container.category)) continue;

    const items = container.userCredentialMetadatas ?? container.userCredentials ?? [];

    for (const item of items) {
      const asRecord = item as Record<string, unknown>;
      const credential = asRecord.credential as
        | { id?: string; userLabel?: string; createdDate?: number; transports?: string[] | { displayNameProperties?: string[] } }
        | undefined;
      const id = (credential?.id ?? asRecord.credentialId ?? (item as { id?: string }).id ?? "") as string;
      if (!id) continue;

      const userLabel = (credential?.userLabel ??
        asRecord.userLabel ??
        (item as { userLabel?: string }).userLabel ??
        container.displayName ??
        defaultLabel) as string;

      const createdAtRaw = credential?.createdDate ?? asRecord.createdDate;
      const createdAt = typeof createdAtRaw === "number" ? createdAtRaw : undefined;
      const provider = (userLabel !== defaultLabel ? userLabel : container.displayName) ?? undefined;
      const transportsRaw = credential?.transports ?? (asRecord.transports as string[] | { displayNameProperties?: string[] } | undefined);

      credentials.push({
        id,
        userLabel,
        createdAt,
        provider: provider ?? undefined,
        transports: formatTransports(transportsRaw)
      });
    }
  }

  return credentials;
}

function useAccountBase(url: { accountUrl: string; totpUrl: string }) {
  const accountBase = parseAccountBaseUrl(url.accountUrl);
  const baseRealmUrl = accountBase.replace(/\/account\/?.*$/, "").replace(/\/$/, "") || accountBase.split("/account")[0];
  const totpBase = parseAccountBaseUrl(url.totpUrl);
  const passkeyDeleteUrl = (credentialId: string) =>
    `${accountBase}${accountBase.includes("?") ? "&" : "?"}kc_action=delete_credential:${encodeURIComponent(credentialId)}`;
  const passkeyRegisterAiaUrl =
    baseRealmUrl && accountBase.includes("/realms/")
      ? `${baseRealmUrl}/protocol/openid-connect/auth?client_id=account&redirect_uri=${encodeURIComponent(totpBase)}&response_type=code&scope=openid&kc_action=webauthn-register-passwordless`
      : `${totpBase}${totpBase.includes("?") ? "&" : "?"}kc_action=webauthn-register-passwordless`;

  return { passkeyDeleteUrl, passkeyRegisterAiaUrl };
}

function TotpFetcher(props: PageProps<Extract<KcContext, { pageId: "totp.ftl" }>, I18n>) {
  const { kcContext } = props;
  const context = useEnvironment();
  const { passkeyRegisterAiaUrl } = useAccountBase(kcContext.url);

  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [passkeysError, setPasskeysError] = useState<string | null>(null);
  const [passkeysEnabled, setPasskeysEnabled] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCredentials = async (signal?: AbortSignal): Promise<{ data: CredentialContainer[] | null; passkeysEnabled: boolean }> => {
    try {
      const response = await accountFetch("/credentials", context, {
        signal,
        searchParams: { "user-credentials": "true" }
      });
      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const parsed = await response.json();
        const data = Array.isArray(parsed) ? parsed : [parsed];
        return { data, passkeysEnabled: hasPasskeyContainer(data) };
      }
      return { data: null, passkeysEnabled: true };
    } catch {
      return { data: null, passkeysEnabled: true };
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const controller = new AbortController();
        const { data, passkeysEnabled: enabled } = await fetchCredentials(controller.signal);
        if (cancelled) return;

        setPasskeysEnabled(enabled);
        if (data === null) {
          setPasskeysError("passkeys could not be loaded. check your connection or try again later.");
          setPasskeys([]);
        } else {
          setPasskeysError(null);
          setPasskeys(extractPasskeyCredentials(data, "Passkey"));
        }
      } catch {
        if (!cancelled) {
          setPasskeysError("passkeys could not be loaded. check your connection or try again later.");
          setPasskeys([]);
        }
      } finally {
        if (!cancelled) setPasskeysLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [kcContext.url.accountUrl]);

  useEffect(() => {
    const onFocus = () => {
      const tryFetch = async (): Promise<void> => {
        try {
          const { data, passkeysEnabled: enabled } = await fetchCredentials();
          setPasskeysEnabled(enabled);
          if (data !== null) {
            setPasskeys(extractPasskeyCredentials(data, "Passkey"));
            setPasskeysError(null);
          }
        } catch {
          /* ignore */
        }
      };
      setPasskeysLoading(true);
      tryFetch().finally(() => setPasskeysLoading(false));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [kcContext.url.accountUrl]);

  const onDeletePasskey = async (credentialId: string) => {
    if (deletingId) return;
    setDeletingId(credentialId);
    try {
      const response = await accountDeleteCredential(credentialId, context);
      if (response.ok) {
        const { data } = await fetchCredentials();
        if (data !== null) {
          setPasskeys(extractPasskeyCredentials(data, "Passkey"));
          setPasskeysError(null);
        }
      } else {
        setPasskeysError("failed to delete passkey. try again later.");
      }
    } catch {
      setPasskeysError("failed to delete passkey. try again later.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TotpContent
      {...props}
      passkeys={passkeys}
      passkeysLoading={passkeysLoading}
      passkeysError={passkeysError}
      passkeysEnabled={passkeysEnabled}
      onDeletePasskey={onDeletePasskey}
      deletingPasskeyId={deletingId}
      passkeyRegisterAiaUrl={passkeyRegisterAiaUrl}
    />
  );
}

function TotpContent(
  props: PageProps<Extract<KcContext, { pageId: "totp.ftl" }>, I18n> & {
    passkeys: PasskeyCredential[];
    passkeysLoading: boolean;
    passkeysError: string | null;
    passkeysEnabled: boolean;
    onDeletePasskey: (credentialId: string) => Promise<void>;
    deletingPasskeyId: string | null;
    passkeyRegisterAiaUrl: string;
  }
) {
  const {
    kcContext,
    i18n,
    Template: _Template = Template,
    passkeys,
    passkeysLoading,
    passkeysError,
    passkeysEnabled,
    onDeletePasskey,
    deletingPasskeyId,
    passkeyRegisterAiaUrl
  } = props;

  const { totp, mode: contextMode, url, messagesPerField, stateChecker } = kcContext;
  const { msg, msgStr, advancedMsg } = i18n;

  const credentials = totp.otpCredentials;

  const urlMode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;
  const mode = urlMode ?? contextMode;

  const manualUrl = (totp as { manualUrl?: string }).manualUrl || `${url.totpUrl}${url.totpUrl.includes("?") ? "&" : "?"}mode=manual`;

  const qrUrl =
    (totp as { qrUrl?: string }).qrUrl ||
    (typeof window !== "undefined"
      ? (() => {
          const params = new URLSearchParams(window.location.search);
          params.delete("mode");
          const search = params.toString();
          return `${window.location.pathname}${search ? `?${search}` : ""}`;
        })()
      : url.totpUrl);

  return (
    <_Template {...{ kcContext, i18n, doUseDefaultCss: false, classes: props.classes }} active="totp">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">{msg("authenticatorTitle")}</h2>
          </div>
          {passkeysEnabled && !totp.enabled && credentials.length === 0 && (
            <p className="shrink-0 text-sm text-muted-foreground">
              <span className="text-destructive">*</span> {msg("requiredFields")}
            </p>
          )}
        </header>

        {/* Passkeys section */}
        {passkeysEnabled && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                Passkey
              </h3>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={passkeyRegisterAiaUrl}>
                  <PlusCircle className="h-4 w-4" />
                  {msgStr("doAdd")} Passkey
                </a>
              </Button>
            </div>

            {passkeysLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </p>
            )}

            {passkeysError && !passkeysLoading && <p className="text-sm text-destructive">{passkeysError}</p>}

            {!passkeysLoading &&
              !passkeysError &&
              (passkeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">{msg("authenticatorSubMessage")}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 md:hidden">
                    {passkeys.map(credential => (
                      <Card key={credential.id} className="overflow-hidden !p-4">
                        <CardContent className="flex flex-col gap-3 p-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Fingerprint className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate font-medium">{credential.userLabel || "Passkey"}</span>
                                {credential.createdAt != null && (
                                  <span className="block text-xs text-muted-foreground">Created: {formatCredentialDate(credential.createdAt)}</span>
                                )}
                                {credential.provider && (
                                  <span className="block text-xs text-muted-foreground">Authenticator Provider: {credential.provider}</span>
                                )}
                                {credential.transports && credential.transports !== "—" && (
                                  <span className="block text-xs text-muted-foreground">Transport Media: {credential.transports}</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={msgStr("doRemove")}
                                className="h-9 w-9"
                                disabled={deletingPasskeyId === credential.id}
                                onClick={() => onDeletePasskey(credential.id)}
                              >
                                {deletingPasskeyId === credential.id ? (
                                  <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded border">
                    <table className="w-full min-w-[32rem] table-fixed text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="min-w-0 whitespace-nowrap px-2 py-1.5 text-left font-medium">{msg("totpDeviceName")}</th>
                          <th className="w-24 whitespace-nowrap px-2 py-1.5 text-left font-medium">Created Date</th>
                          <th className="min-w-0 whitespace-nowrap px-2 py-1.5 text-left font-medium">Authenticator Provider</th>
                          <th className="min-w-0 whitespace-nowrap px-2 py-1.5 text-left font-medium">Transport Media</th>
                          <th className="w-12 px-2 py-1.5 text-left font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {passkeys.map(credential => (
                          <tr key={credential.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="break-words px-2 py-1.5">{credential.userLabel || "—"}</td>
                            <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">{formatCredentialDate(credential.createdAt)}</td>
                            <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">
                              {credential.provider || credential.userLabel || "—"}
                            </td>
                            <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">{credential.transports || "—"}</td>
                            <td className="w-12 px-2 py-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={msgStr("doRemove")}
                                className="h-8 w-8 shrink-0"
                                disabled={deletingPasskeyId === credential.id}
                                onClick={() => onDeletePasskey(credential.id)}
                              >
                                {deletingPasskeyId === credential.id ? (
                                  <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ))}
          </div>
        )}

        {/* TOTP / mobile authenticator section */}
        {totp.enabled && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {msg("mobile")}
            </h3>
            {/* Mobile: card layout */}
            <div className="flex flex-col gap-2 md:hidden">
              {credentials.map((credential, index) => (
                <Card key={credential.id} className="overflow-hidden !p-4">
                  <CardContent className="flex flex-col gap-3 p-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-medium">{credential.userLabel || msg("mobile")}</span>
                          {credentials.length > 1 && <span className="block truncate text-xs text-muted-foreground">{credential.id}</span>}
                        </div>
                      </div>
                      <form action={url.totpUrl} method="post" className="shrink-0">
                        <input type="hidden" name="stateChecker" value={stateChecker} />
                        <input type="hidden" name="submitAction" value="Delete" />
                        <input type="hidden" name="credentialId" value={credential.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          id={`remove-mobile-${index}`}
                          aria-label={msgStr("doRemove")}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block rounded border">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-20 px-2 py-1.5 text-left font-medium">{msg("mobile")}</th>
                    {credentials.length > 1 && <th className="min-w-0 px-2 py-1.5 text-left font-medium">Credential identifier</th>}
                    <th className="min-w-0 px-2 py-1.5 text-left font-medium">{msg("totpDeviceName")}</th>
                    <th className="w-12 px-2 py-1.5 text-left font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((credential, index) => (
                    <tr key={credential.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-2 py-1.5 text-muted-foreground text-xs">{msg("mobile")}</td>
                      {credentials.length > 1 && <td className="break-words px-2 py-1.5 font-mono text-xs text-muted-foreground">{credential.id}</td>}
                      <td className="break-words px-2 py-1.5">{credential.userLabel || "—"}</td>
                      <td className="w-12 px-2 py-1.5">
                        <form action={url.totpUrl} method="post" className="inline">
                          <input type="hidden" name="stateChecker" value={stateChecker} />
                          <input type="hidden" name="submitAction" value="Delete" />
                          <input type="hidden" name="credentialId" value={credential.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            id={`remove-mobile-${index}`}
                            aria-label={msgStr("doRemove")}
                            className="h-8 w-8 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!totp.enabled && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {msg("mobile")}
            </h3>
            <ol id="kc-totp-settings" className="space-y-4 list-decimal list-outside ml-6 text-sm text-muted-foreground">
              <li className="space-y-2 pl-2">
                <p>{msg("totpStep1")}</p>
                {totp.supportedApplications && totp.supportedApplications.length > 0 && (
                  <ul id="kc-totp-supported-apps" className="list-disc list-inside ml-4 space-y-1">
                    {totp.supportedApplications.map(app => (
                      <li key={app}>{advancedMsg(app)}</li>
                    ))}
                  </ul>
                )}
              </li>

              {mode === "manual" ? (
                <>
                  <li className="space-y-2 pl-2">
                    <p>{msg("totpManualStep2")}</p>
                    <p className="font-mono text-base break-all bg-muted p-3 rounded">
                      <span id="kc-totp-secret-key">{totp.totpSecretEncoded}</span>
                    </p>
                    <p>
                      <a href={qrUrl} id="mode-barcode" className="underline underline-offset-4">
                        {msg("totpScanBarcode")}
                      </a>
                    </p>
                  </li>
                  <li className="space-y-2 pl-2">
                    <p>{msg("totpManualStep3")}</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li id="kc-totp-type">
                        {msg("totpType")}: {msg(`totp.${totp.policy.type}`)}
                      </li>
                      <li id="kc-totp-algorithm">
                        {msg("totpAlgorithm")}: {totp.policy.getAlgorithmKey()}
                      </li>
                      <li id="kc-totp-digits">
                        {msg("totpDigits")}: {totp.policy.digits}
                      </li>
                      {totp.policy.type === "totp" ? (
                        <li id="kc-totp-period">
                          {msg("totpInterval")}: {totp.policy.period}
                        </li>
                      ) : (
                        <li id="kc-totp-counter">
                          {msg("totpCounter")}: {(totp.policy as { initialCounter: number }).initialCounter}
                        </li>
                      )}
                    </ul>
                  </li>
                </>
              ) : (
                <li className="space-y-2 pl-2">
                  <p>{msg("totpStep2")}</p>
                  <div className="flex justify-center">
                    {totp.totpSecretQrCode ? (
                      <img
                        id="kc-totp-secret-qr-code"
                        src={`data:image/png;base64, ${totp.totpSecretQrCode}`}
                        alt="Figure: Barcode"
                        className="border rounded w-48 h-48 object-contain"
                        width={192}
                        height={192}
                      />
                    ) : (
                      <div className="flex w-48 h-48 items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
                        QR code not available
                      </div>
                    )}
                  </div>
                  <p>
                    <a href={manualUrl} id="mode-manual" className="underline underline-offset-4">
                      {msg("totpUnableToScan")}
                    </a>
                  </p>
                </li>
              )}

              <li className="space-y-2 pl-2">
                <p>{msg("totpStep3")}</p>
                <p>{msg("totpStep3DeviceName")}</p>
              </li>
            </ol>

            <form action={url.totpUrl} method="post" id="kc-totp-settings-form" className="space-y-4">
              <input type="hidden" name="stateChecker" value={stateChecker} />
              <input type="hidden" name="totpSecret" value={totp.totpSecret} />
              {mode && <input type="hidden" name="mode" value={mode} />}

              <Field>
                <FieldLabel htmlFor="totp">
                  {msg("authenticatorCode")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input type="text" id="totp" name="totp" autoComplete="off" aria-invalid={messagesPerField.existsError("totp")} />
                {messagesPerField.existsError("totp") && (
                  <span
                    id="input-error-otp-code"
                    className="text-destructive text-sm"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{
                      __html: kcSanitize(messagesPerField.get("totp"))
                    }}
                  />
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="userLabel">
                  {msg("totpDeviceName")}
                  {credentials.length >= 1 && <span className="text-destructive ml-1">*</span>}
                </FieldLabel>
                <Input type="text" id="userLabel" name="userLabel" autoComplete="off" aria-invalid={messagesPerField.existsError("userLabel")} />
                {messagesPerField.existsError("userLabel") && (
                  <span
                    id="input-error-otp-label"
                    className="text-destructive text-sm"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{
                      __html: kcSanitize(messagesPerField.get("userLabel"))
                    }}
                  />
                )}
              </Field>

              <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-end md:gap-2">
                <Button type="submit" id="saveTOTPBtn" name="submitAction" value="Save" className="w-full min-w-[7rem] md:w-[7rem]">
                  {msgStr("doSave")}
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  name="submitAction"
                  value="Cancel"
                  id="cancelTOTPBtn"
                  formNoValidate
                  className="w-full min-w-[7rem] md:w-[7rem]"
                >
                  {msg("doCancel")}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </_Template>
  );
}

export default function Totp(props: PageProps<Extract<KcContext, { pageId: "totp.ftl" }>, I18n> & { useMockData?: boolean }) {
  const { kcContext, useMockData } = props;

  const totpExtension = kcContext as KcContext & {
    mockPasskeys?: PasskeyCredential[];
    mockPasskeysLoading?: boolean;
    mockPasskeysError?: string | null;
  };
  const hasMock =
    totpExtension.mockPasskeys !== undefined || totpExtension.mockPasskeysError !== undefined || totpExtension.mockPasskeysLoading === true;

  if (useMockData ?? hasMock) {
    const { passkeyRegisterAiaUrl } = useAccountBase(kcContext.url);
    const mockPasskeysEnabled = (totpExtension as { mockPasskeysEnabled?: boolean }).mockPasskeysEnabled ?? true;
    return (
      <TotpContent
        {...props}
        passkeys={totpExtension.mockPasskeys ?? []}
        passkeysLoading={totpExtension.mockPasskeysLoading ?? false}
        passkeysError={totpExtension.mockPasskeysError ?? null}
        passkeysEnabled={mockPasskeysEnabled}
        onDeletePasskey={async () => {}}
        deletingPasskeyId={null}
        passkeyRegisterAiaUrl={passkeyRegisterAiaUrl}
      />
    );
  }

  return <TotpFetcher {...props} />;
}
