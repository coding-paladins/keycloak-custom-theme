/**
 * Skeleton for the account profile content area.
 * Shown while profile data is loading to avoid visible loading text.
 */
export function AccountProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-muted/80 animate-pulse" />
            <div className="h-4 w-64 rounded bg-muted/80 animate-pulse" />
          </div>
        </div>
      </header>
      <div className="space-y-3">
        <div className="h-10 w-full rounded-md bg-muted/80 animate-pulse" />
        <div className="h-10 w-full rounded-md bg-muted/80 animate-pulse" />
        <div className="h-10 w-3/4 rounded-md bg-muted/80 animate-pulse" />
        <div className="h-10 w-1/2 rounded-md bg-muted/80 animate-pulse" />
      </div>
    </div>
  );
}
