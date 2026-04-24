import type { Metadata } from "next";
import { CustomCursor } from "@/components/ui/CustomCursor";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cvpadi.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "CVPadi",
  description: "Build a Nigerian-standard CV, track applications, and improve your job readiness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var theme=localStorage.getItem('cvpadi-theme')||'dark';document.documentElement.setAttribute('data-theme',theme);}catch(_e){document.documentElement.setAttribute('data-theme','dark');}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
