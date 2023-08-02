import "./globals.css";
import "@douyinfe/semi-ui/dist/css/semi.min.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { UIProviders } from "./providers";

import { TRPCProvider } from "@/providers/trpcProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <TRPCProvider>
        <body className={inter.className}>{children}</body>
      </TRPCProvider>
    </html>
  );
}