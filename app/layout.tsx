import type { Metadata, Viewport } from "next";
import { Cairo, Rakkas, Amiri, Badeen_Display, Lalezar } from "next/font/google";
import "./globals.css";
import SupportFAB from "@/components/layout/SupportFAB";

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

const amiri = Amiri({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-amiri",
});

const badeenDisplay = Badeen_Display({
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-badeen-display",
  adjustFontFallback: false,
});

const lalezar = Lalezar({
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-lalezar",
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1623" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bioamrahmedsaad.com/"),
  title: {
    default: "منصة مستر أحمد سعد للأحياء",
    template: "%s | منصة مستر أحمد سعد للأحياء",
  },
  description:
    "المنصة التعليمية الأولى لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر أحمد سعد.",
  keywords: ["أحياء", "ثانوية عامة", "مستر أحمد سعد", "منصة أحياء", "بسيون", "تعليم أحياء"],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://bioamrahmedsaad.com/",
    siteName: "منصة مستر أحمد سعد للأحياء",
    title: "منصة مستر أحمد سعد للأحياء",
    description: "المنصة التعليمية الأولى لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر أحمد سعد.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "منصة مستر أحمد سعد للأحياء" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة مستر أحمد سعد للأحياء",
    description: "المنصة التعليمية الأولى لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر أحمد سعد.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${rakkas.variable} ${amiri.variable} ${badeenDisplay.variable} ${lalezar.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#0F1623] text-[#F0EDE6] font-sans">
        {children}
        <SupportFAB />
      </body>
    </html>
  );
}

