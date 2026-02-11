import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import Template from "../Template";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export default function FederatedIdentity(props: PageProps<Extract<KcContext, { pageId: "federatedIdentity.ftl" }>, I18n>) {
  const { kcContext, i18n, Template: _Template = Template } = props;

  const { url, federatedIdentity, stateChecker } = kcContext;
  const { msg } = i18n;

  return (
    <_Template {...{ kcContext, i18n, doUseDefaultCss: false, classes: props.classes }} active="social">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold">{msg("federatedIdentitiesHtmlTitle")}</h2>
        </div>

        <div className="flex flex-col gap-4">
          {federatedIdentity.identities.map(identity => (
            <Card key={identity.providerId} className="overflow-hidden border-l-4 border-l-primary/50 !p-4">
              <CardContent className="flex flex-col gap-4 p-0 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium">{identity.displayName}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <Input id={identity.providerId} disabled value={identity.userName ?? ""} className="bg-muted" aria-label={identity.displayName} />
                </div>
                <div className="shrink-0">
                  {identity.connected ? (
                    federatedIdentity.removeLinkPossible && (
                      <form action={url.socialUrl} method="post" className="inline">
                        <input type="hidden" name="stateChecker" value={stateChecker} />
                        <input type="hidden" name="action" value="remove" />
                        <input type="hidden" name="providerId" value={identity.providerId} />
                        <Button type="submit" variant="destructive" size="sm" id={`remove-link-${identity.providerId}`}>
                          {msg("doRemove")}
                        </Button>
                      </form>
                    )
                  ) : (
                    <form action={url.socialUrl} method="post" className="inline">
                      <input type="hidden" name="stateChecker" value={stateChecker} />
                      <input type="hidden" name="action" value="add" />
                      <input type="hidden" name="providerId" value={identity.providerId} />
                      <Button type="submit" variant="outline" size="sm" id={`add-link-${identity.providerId}`}>
                        {msg("doAdd")}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </_Template>
  );
}
