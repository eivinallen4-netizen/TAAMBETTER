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

export const metadata: Metadata = {
  title: "TAAM | Branding, Web & Digital Studio",
  description: "Branding, web design, and digital development for companies that need results, not just a deck.",
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
