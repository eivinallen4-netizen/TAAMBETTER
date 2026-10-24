import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ContactFormProvider from "./components/ContactForm/ContactFormProvider";
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";

// Static weight instances (not the variable font): their glyphs have no overlapping
// contours, so outlined display type (-webkit-text-stroke) renders cleanly.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taammarketing.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "TAAM | Better Marketing for the Best Businesses",
    template: "%s | TAAM",
  },
  description: "TAAM makes creative that makes your customers say WOW. A proven Las Vegas content marketing team for businesses that are already great at what they do.",
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
    title: "TAAM | Better Marketing for the Best Businesses",
    description: "You already got good at what you do. We show it to the people who need to see it.",
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
    title: "TAAM | Better Marketing for the Best Businesses",
    description: "Creative that makes your customers say WOW.",
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
    logo: `${baseUrl}/brand-assets/logos/TAAM_logo_orange_on_white.png`,
    description: "Better marketing for the best businesses. Creative that makes your customers say WOW.",
    sameAs: [
      "https://www.instagram.com/taambetter",
      "https://www.tiktok.com/@taambetter",
      "https://www.linkedin.com/company/taam-better-marketing/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "info@taammarketing.com",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Las Vegas",
      addressRegion: "NV",
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
        <meta name="theme-color" content="#F46325" />
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
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CBYFLMQZ0Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CBYFLMQZ0Z');
          `}
        </Script>
      </body>
    </html>
  );
}
