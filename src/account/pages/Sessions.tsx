import type { Key } from "react";
import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import Template from "../Template";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCompactDateTime } from "@/lib/utils";

type Session = {
  id: string;
  ipAddress: string;
  started: string;
  lastAccess: string;
  expires: string;
  clients: string[];
};

export default function Sessions(props: PageProps<Extract<KcContext, { pageId: "sessions.ftl" }>, I18n>) {
  const { kcContext, i18n, Template: _Template = Template } = props;

  const { url, stateChecker, sessions } = kcContext;
  const { msg } = i18n;

  const sessionList = sessions.sessions as Session[];

  return (
    <_Template {...{ kcContext, i18n, doUseDefaultCss: false, classes: props.classes }} active="sessions">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{msg("sessionsHtmlTitle")}</h2>
        </div>

        {/* Mobile: card layout */}
        <div className="flex flex-col gap-2 md:hidden">
          {sessionList.map((session, index: number) => (
            <div key={session.id ?? (index as Key)} className="flex flex-col gap-1.5 rounded border p-3">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm">{session.ipAddress}</span>
                <span className="text-muted-foreground text-xs">{formatCompactDateTime(new Date(session.started))}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 text-muted-foreground text-xs">{msg("lastAccess")}:</span>
                  <span className="text-right text-xs">{formatCompactDateTime(new Date(session.lastAccess))}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 text-muted-foreground text-xs">{msg("expires")}:</span>
                  <span className="text-right text-xs">{formatCompactDateTime(new Date(session.expires))}</span>
                </div>
              </div>
              {session.clients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t pt-2">
                  {session.clients.map((client, clientIndex) => (
                    <span
                      key={clientIndex}
                      className="min-w-[16ch] max-w-full truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                      title={client}
                    >
                      {client}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden md:block rounded border">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-20 px-2 py-1.5 text-left font-medium">{msg("ip")}</th>
                <th className="w-24 px-2 py-1.5 text-left font-medium">{msg("started")}</th>
                <th className="w-24 px-2 py-1.5 text-left font-medium">{msg("lastAccess")}</th>
                <th className="w-24 px-2 py-1.5 text-left font-medium">{msg("expires")}</th>
                <th className="min-w-0 px-2 py-1.5 text-left font-medium">{msg("clients")}</th>
              </tr>
            </thead>
            <tbody>
              {sessionList.map((session, index) => (
                <tr key={session.id ?? index} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="break-words px-2 py-1.5 font-mono text-muted-foreground text-xs">{session.ipAddress}</td>
                  <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">{formatCompactDateTime(new Date(session.started))}</td>
                  <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">{formatCompactDateTime(new Date(session.lastAccess))}</td>
                  <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">{formatCompactDateTime(new Date(session.expires))}</td>
                  <td className="overflow-hidden px-2 py-1.5">
                    {session.clients.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {session.clients.map((client, clientIndex) => (
                          <span
                            key={clientIndex}
                            className="block min-w-[16ch] max-w-full truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                            title={client}
                          >
                            {client}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sessionList.length > 0 && (
          <form action={url.sessionsUrl} method="post" className="flex justify-end">
            <input type="hidden" id="stateChecker" name="stateChecker" value={stateChecker} />
            <Button type="submit" variant="destructive" id="logout-all-sessions">
              {msg("doLogOutAllSessions")}
            </Button>
          </form>
        )}
      </div>
    </_Template>
  );
}
