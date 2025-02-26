import { useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "@/login/KcContext";
import type { I18n } from "@/login/i18n";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/overrides/custom-password-input";
import { Label } from "@/components/ui/label";

export default function LoginPassword(props: PageProps<Extract<KcContext, { pageId: "login-password.ftl" }>, I18n>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
  const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);
  const { realm, url, messagesPerField } = kcContext;
  const { msg, msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("doLogIn")}
      displayMessage={!messagesPerField.existsError("password")}
    >
      <div id="kc-form">
        <div id="kc-form-wrapper">
          <form
            id="kc-form-login"
            className="flex flex-col gap-4"
            onSubmit={() => {
              setIsLoginButtonDisabled(true);
              return true;
            }}
            action={url.loginAction}
            method="post"
          >
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{msg("password")}</Label>
                {realm.resetPasswordAllowed && (
                  <a tabIndex={5} href={url.loginResetCredentialsUrl} className="ml-auto text-sm underline-offset-4 hover:underline">
                    {msg("doForgotPassword")}
                  </a>
                )}
              </div>

              <PasswordInput
                tabIndex={2}
                id="password"
                name="password"
                autoFocus
                autoComplete="on"
                aria-invalid={messagesPerField.existsError("username", "password")}
              />

              {messagesPerField.existsError("password") && (
                <span
                  id="input-error-password"
                  className="text-destructive text-sm"
                  dangerouslySetInnerHTML={{
                    __html: kcSanitize(messagesPerField.get("password"))
                  }}
                />
              )}
            </div>

            <div id="kc-form-buttons">
              <Button id="kc-login" tabIndex={4} name="login" type="submit" className="w-full" disabled={isLoginButtonDisabled}>
                {msgStr("doLogIn")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Template>
  );
}
