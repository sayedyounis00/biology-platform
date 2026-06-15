import type { Metadata } from "next";
import { Cairo, Rakkas } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-cairo",
});

const rakkas = Rakkas({
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-rakkas",
});


export const metadata: Metadata = {
  title: "ليرن وايز — مسارات تعليمية مركزة تصنع الفارق",
  description:
    "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${rakkas.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#0F1623] text-[#F0EDE6] font-sans">
        {children}
      </body>
    </html>
  );
}

