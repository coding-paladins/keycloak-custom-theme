import { useState } from "react";
import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import Template from "../Template";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/overrides/custom-password-input";

export default function Password(props: PageProps<Extract<KcContext, { pageId: "password.ftl" }>, I18n>) {
  const { kcContext, i18n, Template: _Template = Template } = props;

  const { url, password, account, stateChecker } = kcContext;
  const { msgStr, msg } = i18n;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [newPasswordConfirmError, setNewPasswordConfirmError] = useState("");
  const [hasNewPasswordBlurred, setHasNewPasswordBlurred] = useState(false);
  const [hasNewPasswordConfirmBlurred, setHasNewPasswordConfirmBlurred] = useState(false);

  const checkNewPassword = (value: string) => {
    if (!password.passwordSet) return;
    if (value === currentPassword) {
      setNewPasswordError(msgStr("newPasswordSameAsOld"));
    } else {
      setNewPasswordError("");
    }
  };

  const checkNewPasswordConfirm = (value: string) => {
    if (value === "") return;
    if (value !== newPassword) {
      setNewPasswordConfirmError(msgStr("passwordConfirmNotMatch"));
    } else {
      setNewPasswordConfirmError("");
    }
  };

  const kcContextWithMessage = {
    ...kcContext,
    message: (() => {
      if (newPasswordError !== "") {
        return { type: "error" as const, summary: newPasswordError };
      }
      if (newPasswordConfirmError !== "") {
        return { type: "error" as const, summary: newPasswordConfirmError };
      }
      return kcContext.message;
    })()
  };

  const isDisabled = newPasswordError !== "" || newPasswordConfirmError !== "";

  return (
    <_Template
      {...{
        kcContext: kcContextWithMessage,
        i18n,
        doUseDefaultCss: false,
        classes: props.classes
      }}
      active="password"
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Key className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">{msg("changePasswordHtmlTitle")}</h2>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">{msg("allFieldsRequired")}</p>
        </header>

        <form id="kc-password-form" action={url.passwordUrl} method="post" className="flex flex-col gap-2">
          <input type="hidden" id="username" name="username" value={account.username ?? ""} autoComplete="username" readOnly />
          <input type="hidden" id="stateChecker" name="stateChecker" value={stateChecker} />

          {password.passwordSet && (
            <Field>
              <FieldLabel htmlFor="password">
                {msg("password")} <span className="text-destructive">*</span>
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoFocus
                autoComplete="current-password"
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
              />
            </Field>
          )}

          <Field data-invalid={newPasswordError ? true : undefined}>
            <FieldLabel htmlFor="password-new">
              {msg("passwordNew")} <span className="text-destructive">*</span>
            </FieldLabel>
            <PasswordInput
              id="password-new"
              name="password-new"
              autoComplete="new-password"
              value={newPassword}
              onChange={event => {
                const value = event.target.value;
                setNewPassword(value);
                if (hasNewPasswordBlurred) checkNewPassword(value);
              }}
              onBlur={() => {
                setHasNewPasswordBlurred(true);
                checkNewPassword(newPassword);
              }}
            />
            {newPasswordError && <FieldError>{newPasswordError}</FieldError>}
          </Field>

          <Field data-invalid={newPasswordConfirmError ? true : undefined}>
            <FieldLabel htmlFor="password-confirm">
              {msg("passwordConfirm")} <span className="text-destructive">*</span>
            </FieldLabel>
            <PasswordInput
              id="password-confirm"
              name="password-confirm"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={event => {
                const value = event.target.value;
                setNewPasswordConfirm(value);
                if (hasNewPasswordConfirmBlurred) checkNewPasswordConfirm(value);
              }}
              onBlur={() => {
                setHasNewPasswordConfirmBlurred(true);
                checkNewPasswordConfirm(newPasswordConfirm);
              }}
            />
            {newPasswordConfirmError && <FieldError>{newPasswordConfirmError}</FieldError>}
          </Field>
        </form>

        <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-end md:gap-2">
          <Button
            type="submit"
            form="kc-password-form"
            name="submitAction"
            value="Save"
            disabled={isDisabled}
            className="w-full min-w-[7rem] md:w-[7rem]"
          >
            {msgStr("doSave")}
          </Button>
          <Button
            type="submit"
            form="kc-password-form"
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
    </_Template>
  );
}
