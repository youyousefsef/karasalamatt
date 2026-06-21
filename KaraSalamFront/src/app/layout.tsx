import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";

export const metadata: Metadata = {
  title: "کارا سلامت",
  description: "سامانه مدیریت HSE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-background text-dark">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
