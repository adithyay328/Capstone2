import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssemblerLab — ASU RISC-V workspace",
  description:
    "Browser-based RISC-V assembly workspace for ASU courses: write, run, and submit assembly code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-600 text-gray-100">
        {children}
      </body>
    </html>
  );
}
