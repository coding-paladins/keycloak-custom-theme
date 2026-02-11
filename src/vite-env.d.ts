/// <reference types="vite/client" />

declare module "*.properties?raw" {
  const content: string;
  export default content;
}

// Make JSX namespace available globally
import "react";

declare global {
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
