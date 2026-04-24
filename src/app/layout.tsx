import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";
import { CustomCursor } from "@/components/ui/CustomCursor";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cvpadi.com";
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-next",
  weight: ["300", "400", "500", "700"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-mono-next",
  weight: ["400", "500"],
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading-next",
  style: ["normal", "italic"],
  weight: ["300", "700", "900"],
});

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
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} ${fraunces.variable}`}>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
