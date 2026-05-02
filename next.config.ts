import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // @react-pdf/renderer uses Node.js APIs (fs, Buffer, canvas) and initialises
  // a React reconciler at module load time. If it ends up in a static-generation
  // worker bundle it calls React's null dispatcher and crashes /_global-error.
  // Marking it (and its sub-packages) as server-external prevents bundling and
  // loads them from node_modules at runtime only, which is correct for a
  // server-side API route.
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@react-pdf/reconciler",
    "@react-pdf/layout",
    "@react-pdf/render",
    "@react-pdf/pdfkit",
    "@react-pdf/font",
    "@react-pdf/primitives",
    "@react-pdf/fns",
  ],
};

export default withNextIntl(nextConfig);
