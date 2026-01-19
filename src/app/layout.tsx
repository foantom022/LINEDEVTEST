import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { ClientLayout } from "@/components/providers/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LINE Chat - Connect with friends",
  description: "LINE-style chat application built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <ClientLayout>
          {children}
          <Toaster />
          <HotToaster position="top-center" />
        </ClientLayout>
      </body>
    </html>
  );
}
