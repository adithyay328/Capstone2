import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RISC-V Emulator",
  description: "Modern RISC-V Emulator in your browser. Designed to enhance your learning experience!",
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
