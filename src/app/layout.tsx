import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/auth/session-provider";

export const metadata: Metadata = {
  title: "HT Group App",
  description: "HT Group Application Management System",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
