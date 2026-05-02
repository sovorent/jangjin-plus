"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

// Simplified Toaster without next-themes.
// We don't use ThemeProvider in this app — useTheme() inside the shadcn
// default returns null during /_global-error prerendering and crashes the build.
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    style={
      {
        "--normal-bg": "var(--surface)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
