import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ContactFormProvider from "./components/ContactForm/ContactFormProvider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Content Marketing Agency | TAAM - Branding & Digital Strategy",
  description: "Award-winning content marketing agency. We create content strategies, visual storytelling, and campaigns that grow your business. Branding, web design, and digital development.",
  keywords: "content marketing agency, content marketing strategy, content creation, digital marketing, brand strategy",
  openGraph: {
    title: "Content Marketing Agency | TAAM",
    description: "Award-winning content marketing agency specializing in content strategy, creation, and digital growth.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "TAAM",
              url: "https://taammarketing.com",
              logo: "https://taammarketing.com/logo.png",
              description: "Award-winning content marketing agency specializing in content strategy, creation, and digital growth.",
              sameAs: [
                "https://instagram.com/taammarketing",
                "https://twitter.com/taam",
                "https://linkedin.com/company/taammarketing"
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "702-997-6813",
                contactType: "Customer Service",
                email: "contact@taammarketing.com"
              },
              areaServed: ["US"],
              serviceType: ["Content Marketing", "Branding", "Web Design", "Digital Development", "Creative Strategy", "Content Creation"]
            }),
          }}
        />
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
