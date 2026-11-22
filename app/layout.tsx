import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Rail } from "@/components/Rail";

export const metadata: Metadata = {
  title: "Zamp Outreach Desk",
  description: "Research a prospect, pick the right reason to write, and approve a sourced first email.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="font-sans text-[14px] leading-[1.5]">
        <div className="flex min-h-screen">
          <Rail />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
