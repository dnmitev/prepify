import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prepify — SAA-C03 practice",
  description: "Timed AWS Solutions Architect Associate practice exams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
