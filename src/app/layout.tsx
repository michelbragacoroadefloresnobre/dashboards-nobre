import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const isDev = process.env.NODE_ENV === "development";
const prefix = isDev ? "[DEV] " : "";

export const metadata: Metadata = {
  title: {
    template: `${prefix}%s - FloraHub`,
    default: `${prefix}FloraHub`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-bg text-text-primary h-screen overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
