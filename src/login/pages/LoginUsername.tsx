import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "@/login/KcContext";
import type { I18n } from "@/login/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialProviders } from "@/components/overrides/social-providers";

export default function LoginUsername(props: PageProps<Extract<KcContext, { pageId: "login-username.ftl" }>, I18n>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
  const { social, realm, url, usernameHidden, login, registrationDisabled, messagesPerField } = kcContext;
  const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);
  const { msg, msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={!messagesPerField.existsError("username")}
      displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled}
      infoNode={
        <div className="text-center text-sm mt-4">
          {msg("noAccount")}{" "}
          <a tabIndex={6} href={url.registrationUrl} className="underline underline-offset-4">
            {msg("doRegister")}
          </a>
        </div>
      }
      headerNode={msg("doLogIn")}
      socialProvidersNode={<SocialProviders providers={social?.providers} label={msgStr("identity-provider-login-label")} />}
    >
      <div id="kc-form">
        <div id="kc-form-wrapper">
          {realm.password && (
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
              {!usernameHidden && (
                <div className="grid gap-2">
                  <Label htmlFor="username">
                    {!realm.loginWithEmailAllowed ? msg("username") : !realm.registrationEmailAsUsername ? msg("usernameOrEmail") : msg("email")}
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    tabIndex={2}
                    defaultValue={login.username ?? ""}
                    type="text"
                    autoFocus
                    autoComplete="username"
                    aria-invalid={messagesPerField.existsError("username")}
                  />
                  {messagesPerField.existsError("username") && (
                    <span
                      className="text-destructive text-sm"
                      dangerouslySetInnerHTML={{
                        __html: messagesPerField.getFirstError("username")
                      }}
                    />
                  )}
                </div>
              )}

              <div id="kc-form-options">
                {realm.rememberMe && !usernameHidden && (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rememberMe" name="rememberMe" defaultChecked={!!login.rememberMe} tabIndex={3} />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {msg("rememberMe")}
                    </label>
                  </div>
                )}
              </div>

              <div id="kc-form-buttons">
                <Button tabIndex={4} type="submit" className="w-full" disabled={isLoginButtonDisabled}>
                  {msgStr("doLogIn")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Template>
  );
}
