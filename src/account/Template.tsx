import { useEffect } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx } from "keycloakify/account/lib/kcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/account/Template.useInitialize";
import type { TemplateProps } from "keycloakify/account/TemplateProps";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";
import { ThemeProvider } from "next-themes";
import { LogOut, User, Key, Shield, Smartphone, Link2, Monitor, List, FileText, Menu, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Template(props: TemplateProps<KcContext, I18n> & { defaultOpenMobileMenu?: boolean }) {
  const { kcContext, i18n, doUseDefaultCss, active, classes, children, defaultOpenMobileMenu = false } = props;

  const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });

  const { msg, msgStr, advancedMsgStr, currentLanguage, enabledLanguages } = i18n;

  const { url, features, realm, message, referrer } = kcContext;

  const referrerLabel =
    referrer?.name != null ? advancedMsgStr(referrer.name) : "Application";

  useEffect(() => {
    document.title = msgStr("accountManagementTitle");
  }, []);

  useSetClassName({
    qualifiedName: "html",
    className: kcClsx("kcHtmlClass")
  });

  useSetClassName({
    qualifiedName: "body",
    className: clsx("admin-console", "user", kcClsx("kcBodyClass"))
  });

  const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

  if (!isReadyToRender) {
    return null;
  }

  const navLinkClass = (isActive: boolean) =>
    clsx(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="relative min-h-svh bg-card md:bg-transparent">
        {/* Same gradient background as login theme */}
        <div className="hidden md:block fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        {/* Top bar: mobile menu + back link + locale + sign out */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="md:hidden">
            <DropdownMenu defaultOpen={defaultOpenMobileMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="size-4" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={url.accountUrl} className={clsx(active === "account" && "bg-primary/10 text-primary")}>
                    <User className="size-4" />
                    {msg("account")}
                  </a>
                </DropdownMenuItem>
                {features.passwordUpdateSupported && (
                  <DropdownMenuItem asChild>
                    <a href={url.passwordUrl} className={clsx(active === "password" && "bg-primary/10 text-primary")}>
                      <Key className="size-4" />
                      {msg("password")}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <a href={url.totpUrl} className={clsx(active === "totp" && "bg-primary/10 text-primary")}>
                    <Smartphone className="size-4" />
                    {msg("authenticator")}
                  </a>
                </DropdownMenuItem>
                {features.identityFederation && (
                  <DropdownMenuItem asChild>
                    <a href={url.socialUrl} className={clsx(active === "social" && "bg-primary/10 text-primary")}>
                      <Link2 className="size-4" />
                      {msg("federatedIdentity")}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <a href={url.sessionsUrl} className={clsx(active === "sessions" && "bg-primary/10 text-primary")}>
                    <Monitor className="size-4" />
                    {msg("sessions")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={url.applicationsUrl} className={clsx(active === "applications" && "bg-primary/10 text-primary")}>
                    <List className="size-4" />
                    {msg("applications")}
                  </a>
                </DropdownMenuItem>
                {features.log && (
                  <DropdownMenuItem asChild>
                    <a href={url.logUrl} className={clsx(active === "log" && "bg-primary/10 text-primary")}>
                      <FileText className="size-4" />
                      {msg("log")}
                    </a>
                  </DropdownMenuItem>
                )}
                {realm.userManagedAccessAllowed && features.authorization && (
                  <DropdownMenuItem asChild>
                    <a href={url.resourceUrl} className={clsx(active === "authorization" && "bg-primary/10 text-primary")}>
                      <Shield className="size-4" />
                      {msg("myResources")}
                    </a>
                  </DropdownMenuItem>
                )}
                {referrer?.url && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href={referrer.url} id="referrer">
                        <Home className="size-4" />
                        {msg("backTo", referrerLabel)}
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            {enabledLanguages.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {currentLanguage.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {enabledLanguages.map(({ languageTag, label, href }) => (
                    <DropdownMenuItem key={languageTag} asChild>
                      <a href={href}>{label}</a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={url.getLogoutUrl()}>
                <LogOut className="size-4" />
                {msg("doSignOut")}
              </a>
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-svh items-start justify-center pt-16 pb-8">
          <div className="grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-[minmax(200px,200px)_1fr] md:items-start">
            {/* Sidebar nav - hidden on mobile, dropdown shown in top bar instead */}
            <Card className="hidden md:block md:w-[200px] md:min-w-[200px] md:max-w-[200px] h-fit md:sticky md:top-16 md:self-start !py-0">
              <CardContent className="flex flex-col gap-1 p-4">
                <a href={url.accountUrl} className={navLinkClass(active === "account")}>
                  <User className="size-4" />
                  {msg("account")}
                </a>
                {features.passwordUpdateSupported && (
                  <a href={url.passwordUrl} className={navLinkClass(active === "password")}>
                    <Key className="size-4" />
                    {msg("password")}
                  </a>
                )}
                <a href={url.totpUrl} className={navLinkClass(active === "totp")}>
                  <Smartphone className="size-4" />
                  {msg("authenticator")}
                </a>
                {features.identityFederation && (
                  <a href={url.socialUrl} className={navLinkClass(active === "social")}>
                    <Link2 className="size-4" />
                    {msg("federatedIdentity")}
                  </a>
                )}
                <a href={url.sessionsUrl} className={navLinkClass(active === "sessions")}>
                  <Monitor className="size-4" />
                  {msg("sessions")}
                </a>
                <a href={url.applicationsUrl} className={navLinkClass(active === "applications")}>
                  <List className="size-4" />
                  {msg("applications")}
                </a>
                {features.log && (
                  <a href={url.logUrl} className={navLinkClass(active === "log")}>
                    <FileText className="size-4" />
                    {msg("log")}
                  </a>
                )}
                {realm.userManagedAccessAllowed && features.authorization && (
                  <a href={url.resourceUrl} className={navLinkClass(active === "authorization")}>
                    <Shield className="size-4" />
                    {msg("myResources")}
                  </a>
                )}
                {referrer?.url && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <a
                      href={referrer.url}
                      id="referrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Home className="size-4" />
                      {msg("backTo", referrerLabel)}
                    </a>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Main content */}
            <Card className="min-w-0 self-start !p-4">
              <CardContent className="p-0">
                {message !== undefined && (
                  <div
                    className={clsx(
                      "mb-4 rounded-lg border p-4 text-sm",
                      message.type === "success" &&
                        "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200",
                      message.type === "error" && "border-destructive/50 bg-destructive/10 text-destructive"
                    )}
                  >
                    <span
                      className="kc-feedback-text"
                      dangerouslySetInnerHTML={{
                        __html: kcSanitize(message.summary)
                      }}
                    />
                  </div>
                )}

                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
