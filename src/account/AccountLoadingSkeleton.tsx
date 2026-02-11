import { ThemeProvider } from "next-themes";

/**
 * Skeleton that mimics the account layout structure.
 * Used during Keycloak init, lazy page load, and profile fetch to avoid visible loading screens.
 */
export function AccountLoadingSkeleton() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative min-h-svh bg-card md:bg-transparent">
        <div className="hidden md:block fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="md:hidden">
            <div className="h-9 w-20 rounded-md bg-muted/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <div className="h-9 w-24 rounded-md bg-muted/80 animate-pulse" />
          </div>
        </div>

        <div className="relative flex min-h-svh items-start justify-center pt-16 pb-8">
          <div className="grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-[minmax(200px,200px)_1fr] md:items-start">
            <div className="hidden md:block md:w-[200px] md:min-w-[200px] md:max-w-[200px] h-fit md:sticky md:top-16 md:self-start rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-9 rounded-md bg-muted/80 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="min-w-0 self-start rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 rounded bg-muted/80 animate-pulse" />
                    <div className="h-4 w-64 rounded bg-muted/80 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-10 w-full rounded-md bg-muted/80 animate-pulse" />
                  <div className="h-10 w-full rounded-md bg-muted/80 animate-pulse" />
                  <div className="h-10 w-3/4 rounded-md bg-muted/80 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
