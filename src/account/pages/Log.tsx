import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import Template from "../Template";
import { FileText } from "lucide-react";
import { cn, formatCompactDateTime } from "@/lib/utils";

export default function Log(props: PageProps<Extract<KcContext, { pageId: "log.ftl" }>, I18n>) {
  const { kcContext, i18n, Template: _Template = Template } = props;

  const { log } = kcContext;
  const { msg } = i18n;

  return (
    <_Template {...{ kcContext, i18n, doUseDefaultCss: false, classes: props.classes }} active="log">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{msg("accountLogHtmlTitle")}</h2>
        </div>

        {/* Mobile: card layout */}
        <div className="flex flex-col gap-2 md:hidden">
          {log.events.map(
            (
              event: {
                date: string | number | Date;
                event: string;
                ipAddress: string;
                client: string;
                details: { key: string; value: string }[];
              },
              index: number
            ) => (
              <div key={index} className="flex flex-col gap-1.5 rounded border p-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">{event.date ? formatCompactDateTime(new Date(event.date)) : ""}</span>
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                    <span
                      className={cn(
                        "block min-w-0 truncate rounded px-1 py-0.5 text-[10px] font-medium",
                        event.event === "login"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : event.event === "logout" || event.event === "logout_error"
                            ? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                            : "bg-muted text-muted-foreground"
                      )}
                      title={event.event}
                    >
                      {event.event}
                    </span>
                    {event.client && (
                      <span
                        className="min-w-[16ch] max-w-full truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                        title={event.client}
                      >
                        {event.client}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 text-muted-foreground text-xs">{msg("ip")}:</span>
                    <span className="font-mono text-right">{event.ipAddress}</span>
                  </div>
                  {event.details.length > 0 && (
                    <div className="mt-2 flex flex-col gap-0.5 border-t pt-2">
                      {event.details.map((d, i) => (
                        <span key={i} className="font-mono text-xs">
                          {d.key} = {d.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden md:block rounded border">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-16 px-2 py-1.5 text-left font-medium">{msg("date")}</th>
                <th className="w-20 px-2 py-1.5 text-left font-medium">{msg("event")}</th>
                <th className="w-24 px-2 py-1.5 text-left font-medium">{msg("ip")}</th>
                <th className="w-24 px-2 py-1.5 text-left font-medium">{msg("client")}</th>
                <th className="min-w-0 px-2 py-1.5 text-left font-medium">{msg("details")}</th>
              </tr>
            </thead>
            <tbody>
              {log.events.map(
                (
                  event: {
                    date: string | number | Date;
                    event: string;
                    ipAddress: string;
                    client: string;
                    details: { key: string; value: string }[];
                  },
                  index: number
                ) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="break-words px-2 py-1.5 text-muted-foreground text-xs">
                      {event.date ? formatCompactDateTime(new Date(event.date)) : ""}
                    </td>
                    <td className="overflow-hidden px-2 py-1.5">
                      <span
                        className={cn(
                          "block truncate rounded px-1 py-0.5 text-[10px] font-medium",
                          event.event === "login"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : event.event === "logout" || event.event === "logout_error"
                              ? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                              : "bg-muted text-muted-foreground"
                        )}
                        title={event.event}
                      >
                        {event.event}
                      </span>
                    </td>
                    <td className="break-words px-2 py-1.5 font-mono text-muted-foreground text-xs">{event.ipAddress}</td>
                    <td className="overflow-hidden px-2 py-1.5">
                      {event.client ? (
                        <span
                          className="block min-w-[16ch] max-w-full truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                          title={event.client}
                        >
                          {event.client}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="min-w-0 break-words px-2 py-1.5 text-xs">
                      {event.details.length > 0 ? (
                        <span className="flex flex-col gap-0.5">
                          {event.details.map((detail, detailIndex) => (
                            <span key={detailIndex} className="font-mono">
                              {detail.key} = {detail.value}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </_Template>
  );
}
