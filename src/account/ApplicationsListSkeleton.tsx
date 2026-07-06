export function ApplicationsListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading applications">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-l-4 border-l-primary/20 bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex flex-row items-start gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted/80 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-40 rounded bg-muted/80 animate-pulse" />
              <div className="h-3 w-56 rounded bg-muted/60 animate-pulse" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-16 rounded-md bg-muted/60 animate-pulse" />
                <div className="h-5 w-20 rounded-md bg-muted/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
