import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ContactFormProvider from "./components/ContactForm/ContactFormProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taambetter.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "TAAM | Content Marketing Agency for High-Performance Businesses",
    template: "%s | TAAM",
  },
  description: "TAAM is a unified content marketing agency specializing in strategy, creation, development, and campaign execution. Stop paying for excuses. Start seeing results.",
  keywords: [
    "content marketing agency",
    "digital agency",
    "brand strategy",
    "web design",
    "content creation",
    "campaign execution",
    "performance optimization",
    "marketing agency Las Vegas",
    "branding studio",
  ],
  authors: [{ name: "TAAM" }],
  creator: "TAAM",
  publisher: "TAAM",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "TAAM",
    title: "TAAM | Content Marketing Agency for High-Performance Businesses",
    description: "Stop paying for excuses. Start seeing results. A unified content marketing agency delivering real results through strategy, creation, development, and optimization.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TAAM - Content Marketing Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TAAM | Content Marketing Agency",
    description: "Stop paying for excuses. Start seeing results.",
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TAAM",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "A unified content marketing agency specializing in strategy, creation, development, and campaign execution.",
    sameAs: [
      "https://www.instagram.com/taambetter",
      "https://www.tiktok.com/@taambetter",
      "https://www.linkedin.com/company/taambetter",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "hello@taambetter.com",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Your Address",
      addressLocality: "Las Vegas",
      addressRegion: "NV",
      postalCode: "89102",
      addressCountry: "US",
    },
  };

  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111111" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/brand-assets/app-icon/favicons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/brand-assets/app-icon/favicons/favicon-16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-taam-near-black text-white">
        <ContactFormProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </ContactFormProvider>
      </body>
    </html>
  );
}
