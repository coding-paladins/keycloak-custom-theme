type ThemeErrorFallbackProps = {
  title?: string;
  message?: string;
};

export function ThemeErrorFallback({
  title = "Something went wrong",
  message = "The page could not be displayed. Please try again or contact your administrator."
}: ThemeErrorFallbackProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-3 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
