import { Component, type ErrorInfo, type ReactNode } from "react";
import { ThemeErrorFallback } from "./theme-error-fallback";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ThemeErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[keycloak] render error", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return <ThemeErrorFallback message={this.state.error.message} />;
    }

    return this.props.children;
  }
}
