import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prepify — SAA-C03 practice",
  description: "Timed AWS Solutions Architect Associate practice exams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="app-brand">
              Prepify
            </Link>
            <AppNav />
          </div>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
