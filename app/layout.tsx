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
  fallback: ["system-ui", "arial"],
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
  metadataBase: new URL("https://bioamrahmedsaad.com"),
  title: {
    default: "منصة مستر أحمد سعد للأحياء | منصه مستر احمد سعد",
    template: "%s | منصة مستر أحمد سعد للأحياء",
  },
  description:
    "منصة مستر أحمد سعد التعليمية (منصه مستر احمد سعد) لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر احمد سعد.",
  keywords: [
    "منصة مستر أحمد سعد",
    "منصه مستر احمد سعد",
    "منصة مستر احمد سعد",
    "مستر أحمد سعد",
    "مستر احمد سعد",
    "أحياء ثانوية عامة",
    "احياء بسيون",
  ],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://bioamrahmedsaad.com",
    siteName: "منصة مستر أحمد سعد للأحياء",
    title: "منصة مستر أحمد سعد للأحياء | منصه مستر احمد سعد",
    description:
      "منصة مستر أحمد سعد التعليمية (منصه مستر احمد سعد) لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر احمد سعد.",
    images: [{ url: "/website-logo.png", width: 1200, height: 630, alt: "منصة مستر أحمد سعد للأحياء" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة مستر أحمد سعد للأحياء | منصه مستر احمد سعد",
    description:
      "منصة مستر أحمد سعد التعليمية (منصه مستر احمد سعد) لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون - دروس مكثفة ومتابعة مستمرة مع مستر احمد سعد.",
    images: ["/website-logo.png"],
  },
  alternates: {
    canonical: "https://bioamrahmedsaad.com",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "EducationalOrganization"],
        "@id": "https://bioamrahmedsaad.com/#organization",
        "name": "منصة مستر أحمد سعد للأحياء",
        "alternateName": ["منصه مستر احمد سعد", "منصة أحمد سعد", "منصه احمد سعد"],
        "url": "https://bioamrahmedsaad.com",
        "logo": "https://bioamrahmedsaad.com/website-logo.png",
        "description": "منصة مستر أحمد سعد التعليمية لتبسيط مادة الأحياء لطلاب الثانوية العامة في بسيون",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "بسيون",
          "addressRegion": "الغربية",
          "addressCountry": "EG",
        },
      },
      {
        "@type": "Person",
        "@id": "https://bioamrahmedsaad.com/#teacher",
        "name": "أحمد سعد",
        "alternateName": "احمد سعد",
        "jobTitle": "مدرس أحياء للثانوية العامة",
        "worksFor": {
          "@id": "https://bioamrahmedsaad.com/#organization",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://bioamrahmedsaad.com/#website",
        "url": "https://bioamrahmedsaad.com",
        "name": "منصة مستر أحمد سعد للأحياء",
        "alternateName": "منصه مستر احمد سعد",
        "publisher": {
          "@id": "https://bioamrahmedsaad.com/#organization",
        },
        "inLanguage": "ar",
      },
    ],
  };

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${rakkas.variable} ${amiri.variable} ${badeenDisplay.variable} ${lalezar.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#0F1623] text-[#F0EDE6] font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <SupportFAB />
      </body>
    </html>
  );
}



